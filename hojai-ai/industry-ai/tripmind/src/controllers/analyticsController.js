const { Booking, Destination, Itinerary, Review } = require('../models');
const logger = require('../utils/logger');

exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      totalDestinations,
      totalItineraries,
      totalReviews,
      recentBookings,
      topDestinations,
      bookingTrends,
      revenueByType
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Destination.countDocuments({ isActive: true }),
      Itinerary.countDocuments(),
      Review.countDocuments({ status: 'approved' }),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('type destination status total createdAt'),
      Destination.find({ isActive: true })
        .sort({ rating: -1, 'metadata.popularity': -1 })
        .limit(5)
        .select('name country rating reviewCount'),
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        },
        { $sort: { revenue: -1 } }
      ])
    ]);

    const totalRevenue = revenueByType.reduce((sum, item) => sum + item.revenue, 0);

    const averageRating = await Review.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalBookings,
          pendingBookings,
          confirmedBookings,
          cancelledBookings,
          totalDestinations,
          totalItineraries,
          totalReviews,
          averageRating: averageRating[0]?.average || 0,
          totalRevenue
        },
        recentBookings,
        topDestinations,
        bookingTrends,
        revenueByType,
        generatedAt: now.toISOString()
      }
    });
  } catch (error) {
    logger.error('Error generating dashboard analytics:', error);
    throw error;
  }
};

exports.getBookingStats = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    let startDate;
    const now = new Date();

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const stats = await Booking.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          byStatus: {
            $push: '$status'
          },
          byType: {
            $push: '$type'
          }
        }
      },
      {
        $project: {
          totalBookings: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          averageOrderValue: { $round: ['$averageOrderValue', 2] },
          pendingBookings: {
            $size: {
              $filter: {
                input: '$byStatus',
                cond: { $eq: ['$$this', 'pending'] }
              }
            }
          },
          confirmedBookings: {
            $size: {
              $filter: {
                input: '$byStatus',
                cond: { $eq: ['$$this', 'confirmed'] }
              }
            }
          },
          cancelledBookings: {
            $size: {
              $filter: {
                input: '$byStatus',
                cond: { $eq: ['$$this', 'cancelled'] }
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        stats: stats[0] || {
          totalBookings: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          cancelledBookings: 0
        }
      }
    });
  } catch (error) {
    logger.error('Error generating booking stats:', error);
    throw error;
  }
};

exports.getDestinationStats = async (req, res) => {
  try {
    const stats = await Destination.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalDestinations: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: '$reviewCount' },
          byPriceRange: {
            $push: '$priceRange'
          },
          byCountry: {
            $push: '$country'
          }
        }
      },
      {
        $project: {
          totalDestinations: 1,
          averageRating: { $round: ['$averageRating', 2] },
          totalReviews: 1,
          priceRangeDistribution: {
            budget: {
              $size: {
                $filter: {
                  input: '$byPriceRange',
                  cond: { $eq: ['$$this', 'budget'] }
                }
              }
            },
            moderate: {
              $size: {
                $filter: {
                  input: '$byPriceRange',
                  cond: { $eq: ['$$this', 'moderate'] }
                }
              }
            },
            luxury: {
              $size: {
                $filter: {
                  input: '$byPriceRange',
                  cond: { $eq: ['$$this', 'luxury'] }
                }
              }
            },
            'ultra-luxury': {
              $size: {
                $filter: {
                  input: '$byPriceRange',
                  cond: { $eq: ['$$this', 'ultra-luxury'] }
                }
              }
            }
          },
          countries: {
            $setSize: '$byCountry'
          }
        }
      }
    ]);

    const topRated = await Destination.find({ isActive: true })
      .sort({ rating: -1 })
      .limit(5)
      .select('name country rating reviewCount priceRange');

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          totalDestinations: 0,
          averageRating: 0,
          totalReviews: 0,
          priceRangeDistribution: {},
          countries: 0
        },
        topRated,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error generating destination stats:', error);
    throw error;
  }
};