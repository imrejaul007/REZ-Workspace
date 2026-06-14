/**
 * X-Ray Routes
 *
 * X-Ray management for dental diagnosis
 */

const express = require('express');
const router = express.Router();
const { XRay, ToothRecord } = require('../models/DentalRecord');

/**
 * Get all X-rays for patient
 * GET /api/xray/:patientId
 */
router.get('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const xrays = await XRay.find({ patientId }).sort({ takenDate: -1 });
    res.json({ success: true, count: xrays.length, xrays });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get specific X-ray
 * GET /api/xray/:patientId/:xrayId
 */
router.get('/:patientId/:xrayId', async (req, res) => {
  try {
    const { patientId, xrayId } = req.params;
    const xray = await XRay.findOne({ _id: xrayId, patientId });
    res.json({ success: true, xray });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add X-ray record
 * POST /api/xray
 */
router.post('/', async (req, res) => {
  try {
    const xrayData = req.body;
    const xray = new XRay(xrayData);
    await xray.save();

    // Link to tooth records
    if (xrayData.toothNumbers && xrayData.toothNumbers.length > 0) {
      for (const toothNum of xrayData.toothNumbers) {
        await ToothRecord.findOneAndUpdate(
          { patientId: xrayData.patientId, toothNumber: toothNum },
          { $push: { xrays: xray._id } }
        );
      }
    }

    res.json({ success: true, xray });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update X-ray analysis (AI or dentist review)
 * PUT /api/xray/:xrayId/analyze
 */
router.put('/:xrayId/analyze', async (req, res) => {
  try {
    const { xrayId } = req.params;
    const analysis = req.body;

    const xray = await XRay.findByIdAndUpdate(
      xrayId,
      {
        aiAnalysis: analysis.aiAnalysis || undefined,
        dentistReview: analysis.dentistReview || undefined
      },
      { new: true }
    );

    res.json({ success: true, xray });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Compare X-rays
 * POST /api/xray/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { xrayIds } = req.body;
    const xrays = await XRay.find({ _id: { $in: xrayIds } }).sort({ takenDate: 1 });

    const comparison = {
      dates: xrays.map(x => x.takenDate),
      findings: xrays.map(x => x.findings),
      severity: xrays.map(x => x.severity),
      changes: []
    };

    // Detect changes between X-rays
    if (xrays.length >= 2) {
      const latest = xrays[xrays.length - 1];
      const previous = xrays[xrays.length - 2];

      if (latest.findings !== previous.findings) {
        comparison.changes.push({
          type: 'finding_change',
          from: previous.findings,
          to: latest.findings
        });
      }
      if (latest.severity !== previous.severity) {
        comparison.changes.push({
          type: 'severity_change',
          from: previous.severity,
          to: latest.severity
        });
      }
    }

    res.json({ success: true, comparison, xrays });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
