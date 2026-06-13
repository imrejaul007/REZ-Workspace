const { Agent } = require('../../../core/agent-base');
const { MatterTwin } = require('../../services/case-twin-service/models');
const logger = require('../../../utils/logger');

class BillingAgent extends Agent {
  constructor(options) {
    super(options);
    this.pendingInvoices = [];
  }

  async onMessage(message, reply) {
    try {
      const { action, caseId, data } = message;

      switch (action) {
        case 'generate_invoice':
          return await this.generateInvoice(caseId, reply);
        case 'get_time_entries':
          return await this.getTimeEntries(caseId, reply);
        case 'calculate_fees':
          return await this.calculateFees(caseId, data, reply);
        case 'send_invoice':
          return await this.sendInvoice(message.invoiceId, reply);
        case 'get_billing_report':
          return await this.getBillingReport(data, reply);
        default:
          return reply({ error: 'Unknown action' });
      }
    } catch (error) {
      logger.error('BillingAgent error:', error);
      return reply({ error: error.message });
    }
  }

  async generateInvoice(caseId, reply) {
    const matter = await MatterTwin.findById(caseId)
      .populate('client', 'name email billingInfo');

    if (!matter) {
      return reply({ error: 'Case not found' });
    }

    const unbilledTime = matter.timeEntries.filter(t => !t.billed);
    const unbilledExpenses = matter.expenses.filter(e => !e.billed);

    const timeTotal = unbilledTime.reduce((sum, t) => sum + (t.hours * t.billingRate), 0);
    const expenseTotal = unbilledExpenses.reduce((sum, e) => sum + e.amount, 0);

    const invoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: `INV-${matter.caseNumber}-${Date.now()}`,
      caseId: matter._id,
      client: matter.client,
      items: [
        ...unbilledTime.map(t => ({
          type: 'time',
          date: t.date,
          hours: t.hours,
          rate: t.billingRate,
          description: t.description,
          amount: t.hours * t.billingRate
        })),
        ...unbilledExpenses.map(e => ({
          type: 'expense',
          date: e.date,
          description: e.description,
          amount: e.amount
        }))
      ],
      subtotal: timeTotal + expenseTotal,
      tax: 0,
      total: timeTotal + expenseTotal,
      status: 'draft',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };

    this.pendingInvoices.push(invoice);
    logger.info(`Invoice generated: ${invoice.id}`);
    return reply(invoice);
  }

  async getTimeEntries(caseId, reply) {
    const matter = await MatterTwin.findById(caseId);

    if (!matter) {
      return reply({ error: 'Case not found' });
    }

    const summary = {
      totalHours: matter.timeEntries.reduce((sum, t) => sum + t.hours, 0),
      billedHours: matter.timeEntries.filter(t => t.billed).reduce((sum, t) => sum + t.hours, 0),
      unbilledHours: matter.timeEntries.filter(t => !t.billed).reduce((sum, t) => sum + t.hours, 0),
      totalAmount: matter.timeEntries.reduce((sum, t) => sum + (t.hours * t.billingRate), 0),
      entries: matter.timeEntries.sort((a, b) => b.date - a.date)
    };

    return reply(summary);
  }

  async calculateFees(caseId, data, reply) {
    const matter = await MatterTwin.findById(caseId);

    if (!matter) {
      return reply({ error: 'Case not found' });
    }

    let fee = 0;
    let breakdown = {};

    switch (matter.billingType) {
      case 'hourly':
        const hours = data.hours || 0;
        const rate = data.rate || matter.billingRate;
        fee = hours * rate;
        breakdown = { hours, rate, total: fee };
        break;
      case 'flat':
        fee = matter.flatFee;
        breakdown = { flatFee: fee };
        break;
      case 'contingency':
        const settlement = data.settlementAmount || 0;
        const percentage = data.percentage || 0.33;
        fee = settlement * percentage;
        breakdown = { settlementAmount: settlement, percentage, total: fee };
        break;
      case 'pro_bono':
        fee = 0;
        breakdown = { reason: 'Pro bono representation' };
        break;
    }

    return reply({
      caseId,
      billingType: matter.billingType,
      fee,
      breakdown,
      effectiveDate: new Date()
    });
  }

  async sendInvoice(invoiceId, reply) {
    const invoice = this.pendingInvoices.find(i => i.id === invoiceId);

    if (!invoice) {
      return reply({ error: 'Invoice not found' });
    }

    invoice.status = 'sent';
    invoice.sentAt = new Date();

    logger.info(`Invoice sent: ${invoiceId}`);
    return reply({
      success: true,
      invoiceId,
      sentAt: invoice.sentAt,
      recipient: invoice.client.billingInfo?.billingEmail || invoice.client.email
    });
  }

  async getBillingReport(data, reply) {
    const { startDate, endDate, attorneyId, groupBy } = data;

    const query = {};
    if (startDate || endDate) {
      query['timeEntries.date'] = {};
      if (startDate) query['timeEntries.date'].$gte = new Date(startDate);
      if (endDate) query['timeEntries.date'].$lte = new Date(endDate);
    }

    const matters = await MatterTwin.find(query)
      .populate('client', 'name')
      .populate('assignedTo', 'name');

    const report = {
      period: { start: startDate, end: endDate },
      summary: {
        totalMatters: matters.length,
        totalHours: 0,
        totalFees: 0,
        unbilledFees: 0
      },
      byAttorney: {},
      byClient: {},
      topMatters: []
    };

    matters.forEach(matter => {
      const matterTotal = matter.timeEntries.reduce((sum, t) => sum + (t.hours * t.billingRate), 0);
      const matterUnbilled = matter.timeEntries.filter(t => !t.billed)
        .reduce((sum, t) => sum + (t.hours * t.billingRate), 0);

      report.summary.totalHours += matter.timeEntries.reduce((sum, t) => sum + t.hours, 0);
      report.summary.totalFees += matterTotal;
      report.summary.unbilledFees += matterUnbilled;

      if (matter.assignedTo) {
        const attorneyName = matter.assignedTo.name;
        if (!report.byAttorney[attorneyName]) {
          report.byAttorney[attorneyName] = { hours: 0, fees: 0 };
        }
        report.byAttorney[attorneyName].hours += matter.timeEntries.reduce((sum, t) => sum + t.hours, 0);
        report.byAttorney[attorneyName].fees += matterTotal;
      }
    });

    report.topMatters = matters
      .map(m => ({
        caseId: m._id,
        title: m.title,
        client: m.client?.name,
        fees: m.timeEntries.reduce((sum, t) => sum + (t.hours * t.billingRate), 0)
      }))
      .sort((a, b) => b.fees - a.fees)
      .slice(0, 10);

    return reply(report);
  }
}

module.exports = BillingAgent;
