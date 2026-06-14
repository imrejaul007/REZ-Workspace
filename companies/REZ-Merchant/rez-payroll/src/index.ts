import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console()] });
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());

// Pay schedules
const payScheduleSchema = new mongoose.Schema({
  merchantId: String, name: String, frequency: { type: String, enum: ['weekly', 'biweekly', 'monthly'] },
  dayOfWeek: Number, dayOfMonth: Number, createdAt: Date
});
const PaySchedule = mongoose.models.PaySchedule || mongoose.model('PaySchedule', payScheduleSchema);

// Payroll runs
const payrollRunSchema = new mongoose.Schema({
  merchantId: String, scheduleId: String, periodStart: Date, periodEnd: Date,
  totalGross: Number, totalDeductions: Number, totalNet: Number,
  status: { type: String, enum: ['draft', 'processing', 'completed', 'paid'] },
  createdAt: Date, paidAt: Date
});
const PayrollRun = mongoose.models.PayrollRun || mongoose.model('PayrollRun', payrollRunSchema);

// Payslips
const payslipSchema = new mongoose.Schema({
  employeeId: String, runId: String, merchantId: String, periodStart: Date, periodEnd: Date,
  grossPay: Number, deductions: Number, netPay: Number, status: String, createdAt: Date
});
const Payslip = mongoose.models.Payslip || mongoose.model('Payslip', payslipSchema);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'rez-payroll' }));

// Schedules
app.post('/api/schedules', async (req, res) => { const s = new PaySchedule(req.body); await s.save(); res.json({ success: true, data: s }); });
app.get('/api/schedules/:merchantId', async (req, res) => { const s = await PaySchedule.find({ merchantId: req.params.merchantId }); res.json({ success: true, data: s }); });
app.put('/api/schedules/:id', async (req, res) => { const s = await PaySchedule.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ success: true, data: s }); });
app.delete('/api/schedules/:id', async (req, res) => { await PaySchedule.findByIdAndDelete(req.params.id); res.json({ success: true }); });

// Payroll runs
app.post('/api/runs', async (req, res) => { const r = new PayrollRun(req.body); await r.save(); res.json({ success: true, data: r }); });
app.get('/api/runs/:merchantId', async (req, res) => { const r = await PayrollRun.find({ merchantId: req.params.merchantId }); res.json({ success: true, data: r }); });
app.get('/api/runs/:id', async (req, res) => { const r = await PayrollRun.findById(req.params.id); res.json({ success: true, data: r }); });
app.put('/api/runs/:id/process', async (req, res) => { const r = await PayrollRun.findByIdAndUpdate(req.params.id, { status: 'processing' }, { new: true }); res.json({ success: true, data: r }); });
app.put('/api/runs/:id/complete', async (req, res) => { const r = await PayrollRun.findByIdAndUpdate(req.params.id, { status: 'completed' }, { new: true }); res.json({ success: true, data: r }); });
app.put('/api/runs/:id/paid', async (req, res) => { const r = await PayrollRun.findByIdAndUpdate(req.params.id, { status: 'paid', paidAt: new Date() }, { new: true }); res.json({ success: true, data: r }); });

// Payslips
app.get('/api/payslips/:employeeId', async (req, res) => { const p = await Payslip.find({ employeeId: req.params.employeeId }).sort({ createdAt: -1 }); res.json({ success: true, data: p }); });
app.get('/api/payslips/run/:runId', async (req, res) => { const p = await Payslip.find({ runId: req.params.runId }); res.json({ success: true, data: p }); });

const PORT = process.env.PORT || 4610;
app.listen(PORT, () => logger.info(`rez-payroll running on port ${PORT}`));
export default app;
