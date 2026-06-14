import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    return this.prisma.vendorOffering.findMany({
      include: {
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              }
            }
          }
        }
      }
    });
  }

  async findOne(id: string) {
    return this.prisma.vendorOffering.findUnique({
      where: { id },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              }
            }
          }
        }
      }
    });
  }

  async create(createProductDto: any) {
    return this.prisma.vendorOffering.create({
      data: createProductDto
    });
  }

  async update(id: string, updateProductDto: any) {
    return this.prisma.vendorOffering.update({
      where: { id },
      data: updateProductDto
    });
  }

  async remove(id: string) {
    return this.prisma.vendorOffering.delete({
      where: { id }
    });
  }
}