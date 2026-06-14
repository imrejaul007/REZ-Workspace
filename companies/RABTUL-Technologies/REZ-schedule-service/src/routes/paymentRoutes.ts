// @ts-ignore
// ReZ Schedule - Payment Routes (Stripe)
import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-12-18.acacia',
});

// Validation schemas
const createCheckoutSchema = z.object({
  bookingId: z.string(),
});

const createRefundSchema = z.object({
  bookingId: z.string(),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional(),
});

/**
 * Create Stripe checkout session
 * POST /api/payments/checkout
 */
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { bookingId } = createCheckoutSchema.parse(req.body);

    // Get booking with event type
    const booking = await prisma.booking.findUnique({
      where: { uid: bookingId },
      include: {
        eventType: true,
        user: true,
        attendee: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    if (!booking.eventType.paidBooking || !booking.price) {
      return res.status(400).json({
        success: false,
        error: 'Booking is not a paid booking',
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: booking.currency?.toLowerCase() || 'inr',
            product_data: {
              name: booking.eventType.title,
              description: `${booking.eventType.duration} minute appointment`,
            },
            unit_amount: Math.round((booking.price || 0) * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      customer_email: booking.attendee?.email,
      metadata: {
        bookingId: booking.uid,
        eventTypeId: booking.eventTypeId,
        userId: booking.userId,
        attendeeId: booking.attendeeId || '',
      },
      success_url: `${process.env.NEXT_PUBLIC_SCHEDULE_URL}/bookings/${booking.uid}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SCHEDULE_URL}/bookings/${booking.uid}/cancel`,
    });

    logger.info(`[Payment] Created checkout session for booking ${bookingId}`);

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('[Payment] Checkout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
    });
  }
});

/**
 * Stripe webhook handler
 * POST /api/payments/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('[Payment] Webhook secret not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('[Payment] Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;

        if (bookingId) {
          await prisma.booking.update({
            where: { uid: bookingId },
            data: {
              paymentStatus: 'PAID',
              paymentId: session.payment_intent as string,
              paymentMethod: 'card',
              status: session.metadata?.requiresConfirmation === 'true' ? 'PENDING' : 'CONFIRMED',
              confirmedAt: session.metadata?.requiresConfirmation === 'true' ? undefined : new Date(),
            },
          });

          logger.info(`[Payment] Booking ${bookingId} payment completed`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.bookingId;

        if (bookingId) {
          await prisma.booking.update({
            where: { uid: bookingId },
            data: {
              paymentStatus: 'FAILED',
            },
          });

          logger.info(`[Payment] Booking ${bookingId} payment failed`);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          const booking = await prisma.booking.findFirst({
            where: { paymentId: paymentIntentId },
          });

          if (booking) {
            await prisma.booking.update({
              where: { uid: booking.uid },
              data: {
                paymentStatus: 'REFUNDED',
              },
            });

            logger.info(`[Payment] Booking ${booking.uid} refunded`);
          }
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('[Payment] Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * Get payment status
 * GET /api/payments/:bookingId
 */
router.get('/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { uid: bookingId },
      select: {
        uid: true,
        paymentStatus: true,
        paymentId: true,
        price: true,
        currency: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    let stripePaymentStatus = null;
    if (booking.paymentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(booking.paymentId);
        stripePaymentStatus = paymentIntent.status;
      } catch {
        // Payment might not exist in Stripe yet
      }
    }

    res.json({
      success: true,
      data: {
        bookingUid: booking.uid,
        paymentStatus: booking.paymentStatus,
        stripePaymentStatus,
        amount: booking.price,
        currency: booking.currency,
      },
    });
  } catch (error) {
    logger.error('[Payment] Get status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment status',
    });
  }
});

/**
 * Create refund
 * POST /api/payments/refund
 */
router.post('/refund', async (req: Request, res: Response) => {
  try {
    const { bookingId, reason } = createRefundSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { uid: bookingId },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    if (!booking.paymentId || booking.paymentStatus !== 'PAID') {
      return res.status(400).json({
        success: false,
        error: 'No payment to refund',
      });
    }

    const refund = await stripe.refunds.create({
      payment_intent: booking.paymentId,
      reason: reason || 'requested_by_customer',
    });

    await prisma.booking.update({
      where: { uid: bookingId },
      data: {
        paymentStatus: 'REFUNDED',
      },
    });

    logger.info(`[Payment] Refund created for booking ${bookingId}: ${refund.id}`);

    res.json({
      success: true,
      data: {
        refundId: refund.id,
        status: refund.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('[Payment] Refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create refund',
    });
  }
});

/**
 * Create customer portal session
 * POST /api/payments/portal
 */
router.post('/portal', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.email, // In production, store Stripe customer ID
      return_url: `${process.env.NEXT_PUBLIC_SCHEDULE_URL}/settings/billing`,
    });

    res.json({
      success: true,
      data: {
        url: session.url,
      },
    });
  } catch (error) {
    logger.error('[Payment] Portal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create portal session',
    });
  }
});

export default router;
