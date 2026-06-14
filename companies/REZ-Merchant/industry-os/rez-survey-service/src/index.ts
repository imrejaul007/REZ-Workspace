/**
 * REZ Survey Service
 * NPS, CSAT, and feedback surveys
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transitions.Console()] });
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());

const surveySchema = new mongoose.Schema({
  merchantId: String, name: String, type: { type: String, enum: ['NPS', 'CSAT', 'CES', 'custom'] },
  questions: [{ text: String, type: String, required: Boolean, options: [String] }],
  triggers: [{ event: String, delay: Number }], status: String, target: String
});
const Survey = mongoose.models.Survey || mongoose.model('Survey', surveySchema);

const responseSchema = new mongoose.Schema({
  surveyId: mongoose.Schema.Types.ObjectId, merchantId: String, customerId: String, orderId: String,
  responses: [{ questionId: String, answer: mongoose.Schema.Types.Mixed }],
  score: Number, comment: String, metadata: Object, completedAt: Date
});
const Response = mongoose.models.Response || mongoose.model('Response', responseSchema);

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', service: 'rez-survey-service' }));

app.post('/api/surveys', async (req: Request, res: Response) => {
  const survey = new Survey(req.body);
  await survey.save();
  res.json({ success: true, data: survey });
});

app.get('/api/surveys/:merchantId', async (req: Request, res: Response) => {
  const surveys = await Survey.find({ merchantId: req.params.merchantId });
  res.json({ success: true, data: surveys });
});

app.post('/api/surveys/:id/respond', async (req: Request, res: Response) => {
  const { customerId, orderId, responses, score, comment } = req.body;
  const response = new Response({ surveyId: req.params.id, customerId, orderId, responses, score, comment, completedAt: new Date() });
  await response.save();
  res.json({ success: true, data: response });
});

app.get('/api/surveys/:id/responses', async (req: Request, res: Response) => {
  const responses = await Response.find({ surveyId: req.params.id });
  res.json({ success: true, data: responses });
});

app.get('/api/surveys/:id/analytics', async (req: Request, res: Response) => {
  const responses = await Response.find({ surveyId: req.params.id });
  const total = responses.length;
  const avgScore = total ? responses.reduce((sum, r) => sum + r.score, 0) / total : 0;
  const promoters = responses.filter(r => r.score >= 9).length;
  const passives = responses.filter(r => r.score >= 7 && r.score < 9).length;
  const detractors = responses.filter(r => r.score < 7).length;
  const nps = total ? Math.round(((promoters - detractors) / total) * 100) : 0;
  res.json({ success: true, data: { total, avgScore: Math.round(avgScore * 10) / 10, nps, promoters, passives, detractors } });
});

const PORT = process.env.PORT || 4030;
app.listen(PORT, () => logger.info(`rez-survey-service on port ${PORT}`));
export default app;
