/**
 * AI HR Manager
 * Recruitment, onboarding, performance
 */
import express from 'express';
import mongoose from 'mongoose';
const app = express();
app.use(express.json());

const Candidate = mongoose.model('Candidate', new mongoose.Schema({
  candidateId: String,
  tenantId: String,
  name: String,
  role: String,
  status: String
}));

app.post('/recruit', async (req, res) => {
  const c = new Candidate({ candidateId: `CAND-${Date.now()}`, ...req.body, status: 'new' });
  await c.save();
  res.json({ candidateId: c.candidateId });
});

mongoose.connect('mongodb://localhost:27017/hr-manager');
app.listen(4910, () => console.log('AI HR Manager: 4910'));
