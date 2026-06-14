/**
 * Oral Health Routes
 *
 * Overall oral health assessment
 */

const express = require('express');
const router = express.Router();
const { OralHealth, DentalSummary } = require('../models/DentalRecord');

/**
 * Get oral health history
 * GET /api/oral-health/:patientId
 */
router.get('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const assessments = await OralHealth.find({ patientId }).sort({ assessmentDate: -1 });
    res.json({ success: true, count: assessments.length, assessments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get latest oral health assessment
 * GET /api/oral-health/:patientId/latest
 */
router.get('/:patientId/latest', async (req, res) => {
  try {
    const { patientId } = req.params;
    const assessment = await OralHealth.findOne({ patientId })
      .sort({ assessmentDate: -1 });
    res.json({ success: true, assessment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create oral health assessment
 * POST /api/oral-health
 */
router.post('/', async (req, res) => {
  try {
    const assessmentData = req.body;
    const assessment = new OralHealth(assessmentData);
    await assessment.save();

    // Update dental summary
    await DentalSummary.findOneAndUpdate(
      { patientId: assessmentData.patientId },
      { gumHealth: assessmentData.overallHealth }
    );

    res.json({ success: true, assessment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update oral health assessment
 * PUT /api/oral-health/:assessmentId
 */
router.put('/:assessmentId', async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await OralHealth.findByIdAndUpdate(
      assessmentId,
      req.body,
      { new: true }
    );
    res.json({ success: true, assessment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
