const express = require('express');
const mongoose = require('mongoose');
const { PatientTwin } = require('./models');
const logger = require('../../../utils/logger');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const patient = new PatientTwin(req.body);
    await patient.save();
    logger.info(`Patient created: ${patient._id}`);
    res.status(201).json(patient);
  } catch (error) {
    logger.error('Error creating patient:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const query = {};
    if (status) query.status = status;

    const patients = await PatientTwin.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });

    res.json({ patients, total: await PatientTwin.countDocuments(query) });
  } catch (error) {
    logger.error('Error fetching patients:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const patient = await PatientTwin.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    logger.error('Error fetching patient:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const patient = await PatientTwin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    logger.info(`Patient updated: ${patient._id}`);
    res.json(patient);
  } catch (error) {
    logger.error('Error updating patient:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/appointments', async (req, res) => {
  try {
    const patient = await PatientTwin.findById(req.params.id).populate('appointments');
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient.appointments);
  } catch (error) {
    logger.error('Error fetching patient appointments:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
