const express = require('express');
const router = express.Router();

// GET analytics overview
router.get('/', (req, res) => {
  res.json({
    totalDonations: 1500000,
    totalBeneficiaries: 10000,
    activeCampaigns: 5,
    activeVolunteers: 150,
    programs: 8,
    impactScore: 0.85,
    donorRetentionRate: 0.72
  });
});

// GET donation analytics
router.get('/donations', (req, res) => {
  res.json({
    totalDonations: 1500000,
    averageDonation: 250,
    donationsByType: { corporate: 0.75, individual: 0.25 },
    donationsByCampaign: {
      'Education for All': 75000,
      'Clean Water Initiative': 180000,
      'Healthcare Support': 50000
    },
    donorRetentionRate: 0.72,
    recurringDonors: 45
  });
});

// GET impact analytics
router.get('/impact', (req, res) => {
  res.json({
    totalBeneficiaries: 10000,
    beneficiariesByProgram: {
      education: 500,
      healthcare: 1000,
      sanitation: 5000,
      elderly: 200
    },
    volunteerHours: 15000,
    livesImpacted: 8500,
    programsSuccessRate: 0.88
  });
});

module.exports = router;