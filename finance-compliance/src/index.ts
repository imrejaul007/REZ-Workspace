/**
 * HOJAI Finance Compliance AI
 * GST, TDS, Payroll compliance
 */
import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

const ComplianceTask = mongoose.model('ComplianceTask', new mongoose.Schema({
  taskId: String,
  tenantId: String,
  type: String,
  dueDate: Date,
  status: String
}));

app.post('/gst/calculate', async (req, res) => {
  const { tenantId, invoices } = req.body;
  const gstPayable = invoices.reduce((s: number, i: any) => s + (i.gst || 0), 0);
  res.json({ gstPayable });
});

app.get('/tasks/:tenantId', async (req, res) => {
  const tasks = await ComplianceTask.find({ tenantId: req.params.tenantId });
  res.json({ tasks });
});

mongoose.connect('mongodb://localhost:27017/compliance');
app.listen(4902, () => console.log('Finance Compliance: 4902'));
