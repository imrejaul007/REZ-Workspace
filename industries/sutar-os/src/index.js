/**
 * RTMN SUTAR OS - Secure Universal Transaction & Accounting Record
 * 27 Services: Auth, Ledger, Payment, Invoice, Expense, Budget, Tax, Audit, Compliance, Reporting, etc.
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, Business Copilot, BOA, Genie, AgentOS
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(helmet());
app.use(express.json());

const authRouter = require('./routes/auth');
const ledgerRouter = require('./routes/ledger');
const paymentRouter = require('./routes/payment');
const invoiceRouter = require('./routes/invoice');
const expenseRouter = require('./routes/expense');
const budgetRouter = require('./routes/budget');
const taxRouter = require('./routes/tax');
const auditRouter = require('./routes/audit');
const complianceRouter = require('./routes/compliance');
const reportingRouter = require('./routes/reporting');
const twinsRouter = require('./routes/twins');
const agentsRouter = require('./routes/agents');

app.use('/api/auth', authRouter);
app.use('/api/ledger', ledgerRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/invoice', invoiceRouter);
app.use('/api/expense', expenseRouter);
app.use('/api/budget', budgetRouter);
app.use('/api/tax', taxRouter);
app.use('/api/audit', auditRouter);
app.use('/api/compliance', complianceRouter);
app.use('/api/reporting', reportingRouter);
app.use('/api/twins', twinsRouter);
app.use('/api/agents', agentsRouter);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'SUTAR OS', version: '1.0.0', port: PORT }));
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN SUTAR OS',
    description: 'Secure Universal Transaction & Accounting Record - 27 Services',
    version: '1.0.0',
    services: ['Auth', 'Ledger', 'Payment', 'Invoice', 'Expense', 'Budget', 'Tax', 'Audit', 'Compliance', 'Reporting'],
    digitalTwins: ['Transaction Twin', 'Ledger Twin', 'Compliance Twin', 'Audit Twin'],
    aiAgents: ['Accounting Agent', 'Compliance Agent', 'Audit Agent', 'Reporting Agent'],
    routes: ['/api/auth', '/api/ledger', '/api/payment', '/api/invoice', '/api/expense', '/api/budget', '/api/tax', '/api/audit', '/api/compliance', '/api/reporting', '/api/twins', '/api/agents']
  });
});

app.listen(PORT, () => {
  console.log(`📊 RTMN SUTAR OS running on port ${PORT}`);
  console.log(`   27 Services: Auth, Ledger, Payment, Invoice, Expense, Budget, Tax, Audit, Compliance, Reporting`);
});

module.exports = app;