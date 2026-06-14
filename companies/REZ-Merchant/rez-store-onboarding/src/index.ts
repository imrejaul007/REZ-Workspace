import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console()] });
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());

const onboardingSchema = new mongoose.Schema({
  businessName: String, ownerName: String, email: String, phone: String,
  businessType: String, address: String, city: String, state: String, pincode: String,
  gstNumber: String, status: { type: String, enum: ['pending', 'review', 'approved', 'rejected'] },
  documents: Array, completedSteps: Array, createdAt: Date, updatedAt: Date
});
const Onboarding = mongoose.models.Onboarding || mongoose.model('Onboarding', onboardingSchema);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'rez-store-onboarding' }));

app.post('/api/onboarding', async (req, res) => {
  const onboarding = new Onboarding({ ...req.body, status: 'pending', completedSteps: [], createdAt: new Date() });
  await onboarding.save();
  res.json({ success: true, data: onboarding });
});

app.get('/api/onboarding/:id', async (req, res) => {
  const o = await Onboarding.findById(req.params.id);
  res.json({ success: true, data: o });
});

app.get('/api/onboarding/list/:status', async (req, res) => {
  const list = await Onboarding.find({ status: req.params.status });
  res.json({ success: true, data: list });
});

app.put('/api/onboarding/:id/step', async (req, res) => {
  const { step } = req.body;
  const o = await Onboarding.findByIdAndUpdate(req.params.id, { $push: { completedSteps: step }, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: o });
});

app.put('/api/onboarding/:id/approve', async (req, res) => {
  const o = await Onboarding.findByIdAndUpdate(req.params.id, { status: 'approved', updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: o });
});

app.put('/api/onboarding/:id/reject', async (req, res) => {
  const { reason } = req.body;
  const o = await Onboarding.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason: reason, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: o });
});

const PORT = process.env.PORT || 4032;
app.listen(PORT, () => logger.info(`rez-store-onboarding running on port ${PORT}`));
export default app;
