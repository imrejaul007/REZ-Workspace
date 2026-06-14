import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto/orders.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { items, deliveryAddress, creditUsed = 0, paymentMethod = 'online' } = createOrderDto;

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      // Verify product exists and get current price
      const product = await this.prisma.vendorOffering.findUnique({
        where: { id: item.vendorOfferingId },
        include: { vendor: true }
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.vendorOfferingId} not found`);
      }

      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.title} is not available`);
      }

      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.vendorOfferingId,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: itemTotal,
      });
    }

    const gstRate = 0.18; // 18% GST
    const gstAmount = subtotal * gstRate;
    const deliveryFee = subtotal > 1000 ? 0 : 50; // Free delivery above ₹1000
    const totalAmount = subtotal + gstAmount + deliveryFee - creditUsed;

    if (creditUsed > 0) {
      // Verify user has enough credit
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true } // Will need to add credit field to user model
      });
    }

    // Create order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.marketplaceOrder.create({
        data: {
          userId,
          subtotal,
          gstAmount,
          deliveryFee,
          creditUsed,
          totalAmount,
          status: 'pending',
          paymentMethod,
          deliveryAddress: JSON.stringify(deliveryAddress),
          items: {
            create: orderItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            }))
          }
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  vendor: true
                }
              }
            }
          }
        }
      });

      // If using credit, deduct from user balance
      if (creditUsed > 0) {
        await tx.creditTransaction.create({
          data: {
            userId,
            type: 'debit',
            amount: creditUsed,
            balance: 0, // Will be calculated by service
            description: `Used credit for order ${newOrder.id}`,
            orderId: newOrder.id,
          }
        });
      }

      return newOrder;
    });

    return order;
  }

  async getOrders(userId: string, role: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    let whereClause: any = {};
    
    if (role === 'restaurant') {
      whereClause = { userId };
    } else if (role === 'vendor') {
      whereClause = {
        items: {
          some: {
            product: {
              vendor: {
                userId
              }
            }
          }
        }
      };
    }

    const [orders, total] = await Promise.all([
      this.prisma.marketplaceOrder.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              product: {
                include: {
                  vendor: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              restaurant: {
                select: {
                  businessName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      this.prisma.marketplaceOrder.count({
        where: whereClause
      })
    ]);

    return {
      orders,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total
      }
    };
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            restaurant: {
              select: {
                businessName: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user has permission to view this order
    const hasPermission = order.userId === userId || 
                         order.items.some(item => item.product.vendor.userId === userId);

    if (!hasPermission) {
      throw new BadRequestException('You do not have permission to view this order');
    }

    return order;
  }

  async updateOrderStatus(orderId: string, updateDto: UpdateOrderStatusDto) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Skip vendor check for now (can be added with proper auth)
    // const isVendor = order.items.some(item => item.product.vendor.userId === userId);
    // if (!isVendor) {
    //   throw new BadRequestException('You do not have permission to update this order');
    // }

    const updatedOrder = await this.prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        status: updateDto.status,
        trackingNumber: updateDto.trackingNumber,
        estimatedDelivery: updateDto.estimatedDelivery,
        notes: updateDto.notes,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            restaurant: {
              select: {
                businessName: true
              }
            }
          }
        }
      }
    });

    // Create notification for customer
    await this.prisma.notification.create({
      data: {
        userId: order.userId,
        title: 'Order Status Updated',
        message: `Your order ${orderId.slice(-8)} status has been updated to ${updateDto.status}`,
        type: 'order_update',
        actionUrl: `/marketplace/orders/${orderId}`
      }
    });

    return updatedOrder;
  }

  async cancelOrder(orderId: string, userId: string, reason: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('You can only cancel your own orders');
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    const cancelledOrder = await this.prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.marketplaceOrder.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          notes: reason
        }
      });

      // Refund credit if used
      if (order.creditUsed > 0) {
        await tx.creditTransaction.create({
          data: {
            userId: order.userId,
            type: 'credit',
            amount: order.creditUsed,
            balance: 0,
            description: `Refund for cancelled order ${orderId}`,
            orderId: orderId,
          }
        });
      }

      return updated;
    });

    return cancelledOrder;
  }

  async generateGSTInvoice(orderId: string, userId: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: true
              }
            }
          }
        },
        user: {
          include: {
            restaurant: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('You can only generate invoices for your own orders');
    }

    // Generate invoice data
    const invoice = {
      invoiceNumber: `INV-${orderId.slice(-8)}`,
      orderNumber: orderId,
      orderDate: order.createdAt,
      invoiceDate: new Date(),
      
      // Buyer details
      buyerDetails: {
        name: order.user.restaurant?.businessName || 'N/A',
        email: order.user.email,
        gst: order.user.restaurant?.gstNumber || 'N/A',
        address: JSON.parse(order.deliveryAddress)
      },

      // Seller details (grouped by vendor)
      sellerDetails: [...new Map(
        order.items.map(item => [
          item.product.vendor.id,
          {
            name: item.product.vendor.businessName,
            gst: item.product.vendor.gstNumber || 'N/A',
          }
        ])
      ).values()],

      // Items
      items: order.items.map(item => ({
        description: item.product.title,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        gstRate: 18,
        gstAmount: item.totalPrice * 0.18
      })),

      // Totals
      subtotal: order.subtotal,
      gstAmount: order.gstAmount,
      deliveryFee: order.deliveryFee,
      creditUsed: order.creditUsed,
      totalAmount: order.totalAmount
    };

    return invoice;
  }
}