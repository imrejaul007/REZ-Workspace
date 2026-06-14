/**
 * Tooth Routes
 *
 * Per-tooth record management
 */

const express = require('express');
const router = express.Router();
const { ToothRecord, Treatment } = require('../models/DentalRecord');

/**
 * Get specific tooth record
 * GET /api/tooth/:patientId/:toothNumber
 */
router.get('/:patientId/:toothNumber', async (req, res) => {
  try {
    const { patientId, toothNumber } = req.params;
    const tooth = await ToothRecord.findOne({ patientId, toothNumber });
    res.json({ success: true, tooth });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update tooth record
 * PUT /api/tooth/:patientId/:toothNumber
 */
router.put('/:patientId/:toothNumber', async (req, res) => {
  try {
    const { patientId, toothNumber } = req.params;
    const updates = req.body;
    updates.lastUpdated = new Date();

    const tooth = await ToothRecord.findOneAndUpdate(
      { patientId, toothNumber },
      updates,
      { new: true }
    );
    res.json({ success: true, tooth });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add treatment to tooth
 * POST /api/tooth/:patientId/:toothNumber/treatment
 */
router.post('/:patientId/:toothNumber/treatment', async (req, res) => {
  try {
    const { patientId, toothNumber } = req.params;
    const treatmentData = req.body;

    const tooth = await ToothRecord.findOne({ patientId, toothNumber });
    if (!tooth) {
      return res.status(404).json({ error: 'Tooth record not found' });
    }

    tooth.treatments.push(treatmentData);
    tooth.lastUpdated = new Date();
    await tooth.save();

    res.json({ success: true, tooth });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add condition to tooth
 * POST /api/tooth/:patientId/:toothNumber/condition
 */
router.post('/:patientId/:toothNumber/condition', async (req, res) => {
  try {
    const { patientId, toothNumber } = req.params;
    const conditionData = req.body;

    const tooth = await ToothRecord.findOne({ patientId, toothNumber });
    if (!tooth) {
      return res.status(404).json({ error: 'Tooth record not found' });
    }

    tooth.conditions.push(conditionData);
    tooth.lastUpdated = new Date();
    await tooth.save();

    res.json({ success: true, tooth });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mark tooth as extracted
 * POST /api/tooth/:patientId/:toothNumber/extract
 */
router.post('/:patientId/:toothNumber/extract', async (req, res) => {
  try {
    const { patientId, toothNumber } = req.params;
    const { reason, date } = req.body;

    const tooth = await ToothRecord.findOneAndUpdate(
      { patientId, toothNumber },
      {
        present: false,
        extractedDate: date || new Date(),
        extractedReason: reason
      },
      { new: true }
    );
    res.json({ success: true, tooth });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add artificial restoration
 * POST /api/tooth/:patientId/:toothNumber/artificial
 */
router.post('/:patientId/:toothNumber/artificial', async (req, res) => {
  try {
    const { patientId, toothNumber } = req.params;
    const { type } = req.body;

    const tooth = await ToothRecord.findOne({ patientId, toothNumber });
    if (!tooth) {
      return res.status(404).json({ error: 'Tooth record not found' });
    }

    tooth.artificial = true;
    tooth.artificialType = type;
    tooth.lastUpdated = new Date();
    await tooth.save();

    res.json({ success: true, tooth });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
