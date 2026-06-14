const express = require('express');
const router = express.Router();

// GET analytics overview
router.get('/', (req, res) => {
  res.json({
    totalMembers: 1250,
    activeMemberships: 1100,
    classAttendance: {
      yoga: 85,
      hiit: 92,
      cycling: 78
    },
    revenue: {
      monthly: 98500,
      yearly: 1182000
    },
    popularClasses: ['HIIT Blast', 'Spin Class', 'Yoga Flow'],
    peakHours: ['6AM-8AM', '5PM-8PM'],
    trainerUtilization: 0.78,
    facilityUtilization: 0.65
  });
});

// GET member analytics
router.get('/members', (req, res) => {
  res.json({
    totalMembers: 1250,
    newMembersThisMonth: 45,
    churnRate: 0.05,
    averageMembershipDuration: 8.5,
    membershipTypeBreakdown: {
      basic: 500,
      premium: 600,
      vip: 150
    }
  });
});

// GET class analytics
router.get('/classes', (req, res) => {
  res.json({
    totalClasses: 25,
    averageEnrollment: 14.5,
    waitlistCount: 32,
    cancellationRate: 0.08,
    topPerformingClasses: ['HIIT Blast', 'Spin Class', 'Yoga Flow']
  });
});

module.exports = router;
