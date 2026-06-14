/**
 * REZ Language Service
 * i18n and localization for all merchant services
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console()] });
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());

// Supported languages
const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', dir: 'ltr', status: 'active' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', dir: 'ltr', status: 'active' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', dir: 'ltr', status: 'active' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', dir: 'ltr', status: 'active' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', dir: 'ltr', status: 'active' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', dir: 'ltr', status: 'active' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', dir: 'ltr', status: 'active' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', dir: 'ltr', status: 'active' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', dir: 'ltr', status: 'active' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', dir: 'ltr', status: 'active' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', dir: 'ltr', status: 'active' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', dir: 'ltr', status: 'active' },
  { code: 'ur', name: 'Urdu', native: 'اردو', dir: 'rtl', status: 'active' },
  { code: 'ar', name: 'Arabic', native: 'العربية', dir: 'rtl', status: 'active' }
];

// Translation store (in production, use Redis or DB)
const translations = new Map([
  ['en', new Map([
    ['welcome', 'Welcome'], ['menu', 'Menu'], ['cart', 'Cart'], ['checkout', 'Checkout'],
    ['order', 'Order'], ['profile', 'Profile'], ['login', 'Login'], ['logout', 'Logout'],
    ['search', 'Search'], ['filter', 'Filter'], ['sort', 'Sort'], ['apply', 'Apply'],
    ['cancel', 'Cancel'], ['save', 'Save'], ['delete', 'Delete'], ['edit', 'Edit'],
    ['add', 'Add'], ['view', 'View'], ['close', 'Close'], ['back', 'Back'],
    ['next', 'Next'], ['previous', 'Previous'], ['submit', 'Submit'], ['confirm', 'Confirm'],
    ['success', 'Success'], ['error', 'Error'], ['loading', 'Loading...'], ['no_data', 'No data found']
  ])],
  ['hi', new Map([
    ['welcome', 'स्वागत है'], ['menu', 'मेन्यू'], ['cart', 'कार्ट'], ['checkout', 'चेकआउट'],
    ['order', 'ऑर्डर'], ['profile', 'प्रोफाइल'], ['login', 'लॉगिन'], ['logout', 'लॉगआउट'],
    ['search', 'खोजें'], ['filter', 'फ़िल्टर'], ['sort', 'क्रमबद्ध'], ['apply', 'लागू करें'],
    ['cancel', 'रद्द करें'], ['save', 'सेव करें'], ['delete', 'हटाएं'], ['edit', 'संपादित करें'],
    ['add', 'जोड़ें'], ['view', 'देखें'], ['close', 'बंद करें'], ['back', 'वापस'],
    ['next', 'अगला'], ['previous', 'पिछला'], ['submit', 'जमा करें'], ['confirm', 'पुष्टि करें'],
    ['success', 'सफल'], ['error', 'त्रुटि'], ['loading', 'लोड हो रहा है...'], ['no_data', 'कोई डेटा नहीं मिला']
  ])],
  ['ta', new Map([
    ['welcome', 'வரவேற்பு'], ['menu', 'மெனு'], ['cart', 'கார்ட்'], ['checkout', 'செக்கவுட்'],
    ['order', 'ஆர்டர்'], ['profile', 'சுயவிவரம்'], ['login', 'உள்நுழைய'], ['logout', 'வெளியேறு']
  ])]
]);

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', service: 'rez-language-service' }));

app.get('/api/languages', (req: Request, res: Response) => {
  res.json({ success: true, data: LANGUAGES.filter(l => l.status === 'active') });
});

app.get('/api/languages/:code', (req: Request, res: Response) => {
  const lang = LANGUAGES.find(l => l.code === req.params.code);
  if (!lang) return res.status(404).json({ success: false, error: 'Language not found' });
  res.json({ success: true, data: lang });
});

app.get('/api/translations/:lang', (req: Request, res: Response) => {
  const langTranslations = translations.get(req.params.lang);
  if (!langTranslations) return res.status(404).json({ success: false, error: 'Language not found' });
  res.json({ success: true, data: Object.fromEntries(langTranslations) });
});

app.get('/api/translations/:lang/:key', (req: Request, res: Response) => {
  const langTranslations = translations.get(req.params.lang);
  if (!langTranslations) return res.status(404).json({ success: false, error: 'Language not found' });
  const value = langTranslations.get(req.params.key);
  if (!value) return res.status(404).json({ success: false, error: 'Translation key not found' });
  res.json({ success: true, data: { key: req.params.key, value, lang: req.params.lang } });
});

app.post('/api/translations/:lang/:key', (req: Request, res: Response) => {
  const { value } = req.body;
  if (!translations.has(req.params.lang)) translations.set(req.params.lang, new Map());
  translations.get(req.params.lang)!.set(req.params.key, value);
  res.json({ success: true, data: { key: req.params.key, value, lang: req.params.lang } });
});

app.post('/api/translations/bulk/:lang', (req: Request, res: Response) => {
  const { translations: trans } = req.body;
  if (!translations.has(req.params.lang)) translations.set(req.params.lang, new Map());
  const langTrans = translations.get(req.params.lang)!;
  Object.entries(trans).forEach(([k, v]) => langTrans.set(k, v as string));
  res.json({ success: true, data: { count: Object.keys(trans).length } });
});

app.get('/api/translate', (req: Request, res: Response) => {
  const { text, from, to } = req.query;
  if (!text || !to) return res.status(400).json({ success: false, error: 'text and to are required' });
  // Mock translation - in production use Google Translate API or similar
  res.json({ success: true, data: { original: text, translated: text, from, to } });
});

const PORT = process.env.PORT || 4028;
app.listen(PORT, () => logger.info(`rez-language-service on port ${PORT}`));
export default app;
