/**
 * REZ Currency Service
 * Port: 4035
 * Multi-Currency Support - Exchange Rates & Conversion
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import axios from 'axios';
import mongoose2 from 'mongoose';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const config = {
  port: parseInt(process.env.PORT || '4035'),
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/rez_currency',
};

// Supported currencies
const CURRENCIES: Record<string, { name: string; symbol: string; decimals: number }> = {
  INR: { name: 'Indian Rupee', symbol: '₹', decimals: 2 },
  USD: { name: 'US Dollar', symbol: '$', decimals: 2 },
  EUR: { name: 'Euro', symbol: '€', decimals: 2 },
  GBP: { name: 'British Pound', symbol: '£', decimals: 2 },
  AED: { name: 'UAE Dirham', symbol: 'د.إ', decimals: 2 },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  THB: { name: 'Thai Baht', symbol: '฿', decimals: 2 },
  AUD: { name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  JPY: { name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  CNY: { name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
};

// Default exchange rates (fallback)
const DEFAULT_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AED: 0.044,
  SGD: 0.016,
  THB: 0.42,
  AUD: 0.018,
  JPY: 1.78,
  CNY: 0.086,
};

const ExchangeRate = mongoose2.model('ExchangeRate', new mongoose2.Schema({
  baseCurrency: String,
  targetCurrency: String,
  rate: Number,
  inverseRate: Number,
  source: { type: String, default: 'fallback' },
  fetchedAt: Date,
  expiresAt: Date,
}, { timestamps: true }));

const CurrencyConfig = mongoose2.model('CurrencyConfig', new mongoose2.Schema({
  hotelId: { type: String, index: true },
  baseCurrency: { type: String, default: 'INR' },
  supportedCurrencies: [String],
  displayCurrency: String,
  autoUpdate: { type: Boolean, default: true },
  markupPercent: { type: Number, default: 0 },
  marginPercent: { type: Number, default: 2 },
}, { timestamps: true }));

const ConversionLog = mongoose2.model('ConversionLog', new mongoose2.Schema({
  hotelId: String,
  fromCurrency: String,
  toCurrency: String,
  amount: Number,
  convertedAmount: Number,
  rate: Number,
  createdAt: { type: Date, default: Date.now },
}));

async function fetchExchangeRates(): Promise<void> {
  try {
    // Try multiple free APIs
    const apis = [
      'https://api.exchangerate-api.com/v4/latest/INR',
      'https://open.er-api.com/v6/latest/INR',
    ];

    for (const apiUrl of apis) {
      try {
        const response = await axios.get(apiUrl, { timeout: 5000 });
        if (response.data && response.data.rates) {
          const rates = response.data.rates;
          const fetchedAt = new Date();
          const expiresAt = new Date(fetchedAt.getTime() + 60 * 60 * 1000); // 1 hour

          for (const [currency, rate] of Object.entries(rates)) {
            if (CURRENCIES[currency]) {
              await ExchangeRate.findOneAndUpdate(
                { baseCurrency: 'INR', targetCurrency: currency },
                {
                  baseCurrency: 'INR',
                  targetCurrency: currency,
                  rate: rate,
                  inverseRate: 1 / rate,
                  source: 'api',
                  fetchedAt,
                  expiresAt,
                },
                { upsert: true }
              );
            }
          }
          console.log('[Currency] Rates updated from API');
          return;
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.error('[Currency] Failed to fetch rates:', error);
  }
}

async function getRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const doc = await ExchangeRate.findOne({
    baseCurrency: from,
    targetCurrency: to,
    expiresAt: { $gt: new Date() },
  });

  if (doc) return doc.rate;

  // Try inverse
  const inverse = await ExchangeRate.findOne({
    baseCurrency: to,
    targetCurrency: from,
    expiresAt: { $gt: new Date() },
  });

  if (inverse) return inverse.inverseRate;

  // Fallback to default rates
  const fromToInr = DEFAULT_RATES[from] || 1;
  const toToInr = DEFAULT_RATES[to] || 1;
  return toToInr / fromToInr;
}

app.get('/health', (_req, res) => res.json({ status: 'healthy', service: 'currency-service', port: config.port }));

app.get('/api/currencies', (_req, res) => {
  const currencies = Object.entries(CURRENCIES).map(([code, info]) => ({ code, ...info }));
  res.json({ success: true, data: { currencies } });
});

app.get('/api/rates', async (_req, res) => {
  const { base = 'INR' } = _req.query;
  const rates: Record<string, number> = {};

  for (const currency of Object.keys(CURRENCIES)) {
    rates[currency] = await getRate(base as string, currency);
  }

  res.json({ success: true, data: { base: base, rates } });
});

app.post('/api/convert', async (req: res, next: NextFunction) => {
  try {
    const { from, to, amount, hotelId } = req.body;

    if (!CURRENCIES[from] || !CURRENCIES[to]) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_CURRENCY' } });
    }

    const rate = await getRate(from, to);
    const converted = amount * rate;

    // Apply hotel margin if configured
    let finalRate = rate;
    let finalAmount = converted;

    if (hotelId) {
      const config = await CurrencyConfig.findOne({ hotelId });
      if (config?.marginPercent) {
        finalRate = rate * (1 + config.marginPercent / 100);
        finalAmount = amount * finalRate;
      }
    }

    await ConversionLog.create({ hotelId, fromCurrency: from, toCurrency: to, amount, convertedAmount: finalAmount, rate: finalRate });

    res.json({
      success: true,
      data: {
        from: { currency: from, amount },
        to: { currency: to, amount: Math.round(finalAmount * 100) / 100 },
        rate: Math.round(finalRate * 1000000) / 1000000,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/config/:hotelId', async (req, res, next) => {
  try {
    let config = await CurrencyConfig.findOne({ hotelId: req.params.hotelId });
    if (!config) {
      config = await CurrencyConfig.create({ hotelId: req.params.hotelId });
    }
    res.json({ success: true, data: { config } });
  } catch (error) {
    next(error);
  }
});

app.put('/api/config/:hotelId', async (req, res, next) => {
  try {
    const config = await CurrencyConfig.findOneAndUpdate(
      { hotelId: req.params.hotelId },
      req.body,
      { upsert: true, new: true }
    );
    res.json({ success: true, data: { config } });
  } catch (error) {
    next(error);
  }
});

// Cron: Update rates every hour
cron.schedule('0 * * * *', fetchExchangeRates);

async function start() {
  try {
    await mongoose2.connect(config.mongoUrl);
    await fetchExchangeRates();
    console.log(`\n💱 REZ Currency Service - Port ${config.port}\n`);
    app.listen(config.port, () => console.log(`✅ Currency Service running on port ${config.port}`));
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start().catch(console.error);
