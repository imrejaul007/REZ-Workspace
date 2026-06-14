/**
 * Dental Routes
 *
 * Main dental patient routes
 */

const express = require('express');
const router = express.Router();
const { ToothRecord, DentalSummary, XRay, OralHealth, Treatment, TOOTH_POSITIONS } = require('../models/DentalRecord');

/**
 * Create or update dental summary for patient
 * POST /api/dental/summary
 */
router.post('/summary', async (req, res) => {
  try {
    const { patientId } = req.body;

    let summary = await DentalSummary.findOne({ patientId });

    if (!summary) {
      summary = new DentalSummary({ patientId });
    }

    // Calculate stats from tooth records
    const toothRecords = await ToothRecord.find({ patientId });

    summary.totalTreatments = toothRecords.reduce((sum, t) => sum + t.treatments.length, 0);
    summary.totalXrays = toothRecords.reduce((sum, t) => sum + t.xrays.length, 0);
    summary.activeConditions = toothRecords.reduce((sum, t) =>
      sum + t.conditions.filter(c => c.status === 'active').length, 0);
    summary.missingTeeth = toothRecords.filter(t => !t.present).length;
    summary.filledTeeth = toothRecords.filter(t =>
      t.treatments.some(tr => tr.treatmentType === 'filling')).length;
    summary.crownedTeeth = toothRecords.filter(t =>
      t.treatments.some(tr => tr.treatmentType === 'crown')).length;
    summary.implantedTeeth = toothRecords.filter(t =>
      t.treatments.some(tr => tr.treatmentType === 'implant')).length;
    summary.rootCanals = toothRecords.filter(t =>
      t.treatments.some(tr => tr.treatmentType === 'root_canal')).length;

    // Risk calculations (simplified)
    summary.cavityRisk = summary.totalTreatments > 10 ? 'high' :
                       summary.totalTreatments > 5 ? 'medium' : 'low';

    // Most recent oral health assessment
    const latestOral = await OralHealth.findOne({ patientId })
      .sort({ assessmentDate: -1 });
    if (latestOral) {
      summary.gumHealth = latestOral.overallHealth;
    }

    summary.lastUpdated = new Date();
    await summary.save();

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get dental summary for patient
 * GET /api/dental/summary/:patientId
 */
router.get('/summary/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    let summary = await DentalSummary.findOne({ patientId })
      .populate('patientId', 'name email phone');

    if (!summary) {
      // Auto-create
      const newSummary = new DentalSummary({ patientId });
      await newSummary.save();
      summary = newSummary;
    }

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Initialize all 32 teeth for patient
 * POST /api/dental/init
 */
router.post('/init', async (req, res) => {
  try {
    const { patientId } = req.body;

    // Create tooth records for all 32 teeth
    const toothRecords = TOOTH_POSITIONS.map((num, index) => {
      let position, quadrant, quadrantName;

      if (index < 8) {
        position = 'upper_right';
        quadrant = 1;
        quadrantName = 'Upper Right';
      } else if (index < 16) {
        position = 'upper_left';
        quadrant = 2;
        quadrantName = 'Upper Left';
      } else if (index < 24) {
        position = 'lower_left';
        quadrant = 3;
        quadrantName = 'Lower Left';
      } else {
        position = 'lower_right';
        quadrant = 4;
        quadrantName = 'Lower Right';
      }

      return {
        patientId,
        toothNumber: num,
        position,
        quadrant,
        quadrantName,
        present: true,
        artificial: false,
        conditions: [],
        treatments: [],
        xrays: [],
        sensitivity: 'none',
        mobility: 0,
        prognosis: 'good'
      };
    });

    // Upsert all teeth
    for (const record of toothRecords) {
      await ToothRecord.findOneAndUpdate(
        { patientId, toothNumber: record.toothNumber },
        record,
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: `Initialized ${TOOTH_POSITIONS.length} teeth for patient`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all teeth for patient
 * GET /api/dental/teeth/:patientId
 */
router.get('/teeth/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    const teeth = await ToothRecord.find({ patientId })
      .sort({ toothNumber: 1 });

    res.json({ success: true, count: teeth.length, teeth });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get dental predictions
 * POST /api/dental/predict
 */
router.post('/predict', async (req, res) => {
  try {
    const { patientId } = req.body;

    const summary = await DentalSummary.findOne({ patientId });
    const latestOral = await OralHealth.findOne({ patientId })
      .sort({ assessmentDate: -1 });

    const predictions = {
      cavityRisk: summary?.cavityRisk || 'low',
      gumDiseaseRisk: latestOral?.gumHealth || 'healthy',
      nextCleaning: null,
      followUps: [],
      recommendations: []
    };

    // Calculate next cleaning (6 months from last)
    if (latestOral?.lastCleaning) {
      const nextDate = new Date(latestOral.lastCleaning);
      nextDate.setMonth(nextDate.getMonth() + 6);
      predictions.nextCleaning = nextDate;
    }

    // Generate recommendations based on risks
    if (predictions.cavityRisk === 'high') {
      predictions.recommendations.push('Schedule a cavity risk consultation');
      predictions.recommendations.push('Consider fluoride treatment');
    }

    if (latestOral?.gumHealth === 'moderate' || latestOral?.gumHealth === 'poor') {
      predictions.recommendations.push('Deep cleaning recommended');
      predictions.recommendations.push('Gum disease consultation needed');
    }

    // Find overdue follow-ups
    const overdueTreatments = await ToothRecord.find({
      patientId,
      'treatments.followUpRequired': true,
      'treatments.followUpDate': { $lt: new Date() }
    });

    predictions.followUps = overdueTreatments.map(t => ({
      toothNumber: t.toothNumber,
      treatment: t.treatments.find(tr => tr.followUpRequired && tr.followUpDate < new Date())
    }));

    res.json({ success: true, predictions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
