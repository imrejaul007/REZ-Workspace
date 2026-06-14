/**
 * BIZORA Multilingual AI Service
 * Supports: Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, English
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// ============================================================================
// Language Detection & Translations
// ============================================================================

interface Translation {
  hi: string;  // Hindi
  ta: string;  // Tamil
  te: string;  // Telugu
  kn: string;   // Kannada
  ml: string;  // Malayalam
  mr: string;   // Marathi
  bn: string;   // Bengali
  gu: string;   // Gujarati
  pa: string;   // Punjabi
  en: string;   // English
}

const TRANSLATIONS: Record<string, Translation> = {
  // Common words
  'hello': { hi: 'नमस्ते', ta: 'வணக்கம்', te: 'నమస్తే', kn: 'ಹಲೋ', ml: 'ഹലോ', mr: 'नमसते', bn: 'হ্যালো', gu: 'નમસ્તે', pa: 'ਸਤ ਸ੍ਰੀ ਗੁੜ੍ਹੁੰ', en: 'Hello' },
  'gst': { hi: 'जीएसटी', ta: 'ஜிஎஸ்டி', te: 'జీఎస్టీ', kn: 'ಜಿಎಸ್ಟಿ', ml: 'ജിഎസ്ടി', mr: 'जीएसटी', bn: 'জিএস্টি', gu: 'જીએસટી', pa: 'ਜੀਐਸਟੀ', en: 'GST' },
  'invoice': { hi: 'चालान', ta: 'ஸ்டேட்டர்', te: 'ఇన్வాయిస్', kn: 'ಬಿಲ್', ml: 'ഇന്വോയ്സ്', mr: 'बिल', bn: 'চালান', gu: 'ચાલણ', pa: 'ਬਿੱਲ', en: 'Invoice' },
  'payment': { hi: 'भुगतान', ta: 'கட்டணம்', te: 'చెల్లించవలసి', kn: 'ಪಾವನೆ', ml: 'പേയ്മെന്റ്', mr: 'पैठणी', bn: 'পেমেন্ট', gu: 'ચૂકવામણ', pa: 'ਪੇਮੈਂਟ', en: 'Payment' },
  'compliance': { hi: 'अनुपालन', ta: 'இணக்கம்', te: 'అనుగుణ్యత', kn: 'ಅನುಗುಣೆ', ml: 'അനുയോഗം', mr: 'अनुपालन', bn: 'কম্প্লায়েন্স', gu: 'અનુપાલન', pa: 'ਅਨੁਪਾਲਣ', en: 'Compliance' },
  'menu': { hi: 'मेन्यू', ta: 'மெனு', te: 'మెనూ', kn: 'ಮೆನು', ml: 'മെനു', mr: 'मेनू', bn: 'মেনু', gu: 'મેન્યૂ', pa: 'ਮੇਨੂ', en: 'Menu' },
  'orders': { hi: 'आर्डर', ta: 'ஆர்டர்கள்', te: 'ఆర్డర్లు', kn: 'ಆರ್ಡರ್', ml: 'ഓർഡറ്സ്', mr: 'ऑर्डर', bn: 'অর্ডার', gu: 'ઓર્ડર', pa: 'ਆਰਡਰ', en: 'Orders' },
  'dashboard': { hi: 'डैशबोर्ड', ta: 'டैஷ்போர்டு', te: 'డాష్​బోర్డ్', kn: 'ಡ್ಯಾಷ್ಬೋರ್ಡ್', ml: 'ഡാഷ്ബോർഡ്', mr: 'डैशबोर्ड', bn: 'ড্যাশবোর্ড', gu: 'ડેશબોર્ડ', pa: 'ਡੈਸ਼ਬੋਰਡ', en: 'Dashboard' },
  'submit': { hi: 'जमा करें', ta: 'சமர்ப்பிக்க', te: 'సబ్మిట్', kn: 'ಸಲ್ಮಿಟ್', ml: 'സബ്മിറ്റ്', mr: 'सबमिट', bn: 'সাবমিট', gu: 'સબમિટ', pa: 'ਸਬਮਿਟ', en: 'Submit' },
  'cancel': { hi: 'रद्द करें', ta: 'ரத்து', te: 'రద్వేస్', kn: 'ರದ್ದ', ml: 'റദ്ദ', mr: 'रद्द करा', bn: 'বাতিল', gu: 'રદ્દ', pa: 'ਰੱਦਲ', en: 'Cancel' },
  'save': { hi: 'सेव करें', ta: 'சேமி', te: 'సేవ్', kn: 'ಸೇವ್', ml: 'സേവ്', mr: 'सेव्ह', bn: 'সেভ', gu: 'સેવ', pa: 'ਸੇਵ', en: 'Save' },
  'search': { hi: 'खोजें', ta: 'தேடு', te: 'వెతుకు', kn: 'ಹುಡು', ml: 'തിരയായാം', mr: 'शोधा', bn: 'খুঁজুন', gu: 'શોધો', pa: 'ਖੋਜੋ', en: 'Search' },
  'profile': { hi: 'प्रोफाइल', ta: 'சுயவிவரம்', te: 'ప్రొఫైల్', kn: 'ಪ್ರೊಫೈಲ್', ml: 'പ്രൊഫൈൽ', mr: 'प्रोफाइल', bn: 'প্রোফাইল', gu: 'પ્રોફાઇલ', pa: 'ਪ੍ਰੋਫਾਈਲ', en: 'Profile' },
  'settings': { hi: 'सेटिंग्स', ta: 'அமைப்புகள்', te: 'సెట్టింగులు', kn: 'ಸೆಟ್ಟಿಂಗ್ಸ್', ml: 'സെറ്റിംഗ്സ്', mr: 'सेटिंग्ज', bn: 'সেটিংস', gu: 'સેટિંગ્સ', pa: 'ਸੈਟਿੰਗਜ਼', en: 'Settings' },
  'help': { hi: 'मदद', ta: 'உதவி', te: 'సహాయం', kn: 'ಸಹಾಯ', ml: 'സഹായം', mr: 'मदत', bn: 'সাহায্য', gu: 'મદદ', pa: 'ਮदਦ', en: 'Help' },
  'confirm': { hi: 'पुष्टि करें', ta: 'உறுதிப்படுத்த', te: 'నిర్ధారించు', kn: 'ಖಚಿಕರಿಸಿ', ml: 'ഉറച്ചപ്പെടുക്ക', mr: 'खुष्टि करा', bn: 'নিশ্চিত', gu: 'ખચિત', pa: 'ਪੁਸ਼ਟੀ', en: 'Confirm' },
};

// Hindi business phrases
const HINDI_RESPONSES: Record<string, Translation> = {
  'gst_filing': {
    hi: 'GST भरना आसान है। क्या आप GSTR-3B फाइल करना चाहते हैं?',
    ta: 'GST ஃபைல் செய்வது எளிது। GSTR-3B ஃபைல் செய்ய விரும்புகிறீர்களா?',
    en: 'GST filing is easy. Would you like to file GSTR-3B?',
    te: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: ''
  },
  'invoice_created': {
    hi: 'आपका चालान तैयार है। इसे भेजें?',
    ta: 'உங்கள் ச்டெட்டர் தயாராக உள்ளது। அனுப்பவா?',
    en: 'Your invoice is ready. Send it?',
    te: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: ''
  },
  'payment_received': {
    hi: '₹10,000 भुगतान प्राप्त हुआ। धन्यवाद!',
    ta: '₹10,000 கட்டணம் பெறப்பட்டது। நன்றி!',
    en: '₹10,000 payment received. Thank you!',
    te: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: ''
  },
};

// Detect language from text
function detectLanguage(text: string): string {
  const hindiChars = /[ऀ-ॿ]/;
  const tamilChars = /[஀-௿]/;
  const teluguChars = /[ఀ-౿]/;
  const kannadaChars = /[ಀ-೿]/;
  const malayalamChars = /[ഀ-ൿ]/;

  if (hindiChars.test(text)) return 'hi';
  if (tamilChars.test(text)) return 'ta';
  if (teluguChars.test(text)) return 'te';
  if (kannadaChars.test(text)) return 'kn';
  if (malayalamChars.test(text)) return 'ml';

  return 'en';
}

// Translate to target language
function translate(text: string, targetLang: string): string {
  const lower = text.toLowerCase();

  for (const [key, translations] of Object.entries(TRANSLATIONS)) {
    if (lower.includes(key)) {
      return translations[targetLang as keyof Translation] || translations.en;
    }
  }

  // Check Hindi responses
  for (const [key, translations] of Object.entries(HINDI_RESPONSES)) {
    if (lower.includes(key)) {
      return translations[targetLang as keyof Translation] || translations.en;
    }
  }

  return text;
}

// Voice command processing (Hindi phonetic)
const VOICE_COMMANDS: Record<string, string> = {
  'gst bharo': 'file_gst',
  'invoice banao': 'create_invoice',
  'payment bhejo': 'send_payment_reminder',
  'compliance check karo': 'check_compliance',
  'report dikhao': 'show_report',
  'help chahiye': 'show_help',
  'menu dikhao': 'show_menu',
  'profile kholo': 'open_profile',
  'settings badlo': 'open_settings',
};

// Process voice command
function processVoiceCommand(command: string): { action: string; confidence: number; response: Translation } {
  const normalized = command.toLowerCase().trim();

  // Check direct match
  for (const [phrase, action] of Object.entries(VOICE_COMMANDS)) {
    if (normalized.includes(phrase)) {
      return {
        action,
        confidence: 0.95,
        response: {
          hi: 'जी हाँ, मैं करता हूँ।',
          ta: 'ஆம், செய்கிறேன்।',
          en: 'Yes, I will do it.',
          te: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: ''
        }
      };
    }
  }

  // Fuzzy matching for common intents
  if (normalized.includes('gst') || normalized.includes('जीएसटी') || normalized.includes('filing')) {
    return {
      action: 'file_gst',
      confidence: 0.85,
      response: {
        hi: 'GST फाइलिंग के लिए तैयार हूँ।',
        ta: 'GST ஃபைலிங் உங்களுக்காக தயாராக உள்ளேன்।',
        en: 'Ready for GST filing.',
        te: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: ''
      }
    };
  }

  if (normalized.includes('invoice') || normalized.includes('चालान')) {
    return {
      action: 'create_invoice',
      confidence: 0.90,
      response: {
        hi: 'चालान बनाने के लिए तैयार हूँ।',
        ta: 'ச்டெட்டர் உருவாக்கத் தயாராக உள்ளேன்।',
        en: 'Ready to create invoice.',
        te: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: ''
      }
    };
  }

  return {
    action: 'unknown',
    confidence: 0.3,
    response: {
      hi: 'माफ़ कीजिए, मुझे समझ नहीं आया। कृपया फिर से कहें।',
      ta: 'மன்னிக்கவும், புரியவில்லை। மீண்டும் கூறவும்.',
      en: 'Sorry, I did not understand. Please repeat.',
      te: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: ''
    }
  };
}

// API Routes
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'multilingual-ai',
    languages: ['Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'English'],
    voiceCommands: Object.keys(VOICE_COMMANDS).length,
  });
});

app.post('/api/translate', (req: Request, res: Response) => {
  const { text, targetLang = 'hi' } = req.body;
  const translated = translate(text, targetLang);
  res.json({ original: text, translated, language: targetLang });
});

app.post('/api/detect', (req: Request, res: Response) => {
  const { text } = req.body;
  const language = detectLanguage(text);
  res.json({ text, detectedLanguage: language });
});

app.post('/api/voice', (req: Request, res: Response) => {
  const { command } = req.body;
  const result = processVoiceCommand(command);
  res.json(result);
});

app.post('/api/chat', (req: Request, res: Response) => {
  const { message, language = 'en' } = req.body;
  const detectedLang = detectLanguage(message);
  const response = translate('Processing your request...', language);
  res.json({
    userMessage: message,
    detectedLanguage: detectedLang,
    response: TRANSLATIONS[detectedLang]?.[language] || response,
    suggestions: ['GST Filing', 'Create Invoice', 'Payment Reminder', 'Check Compliance'],
  });
});

const PORT = process.env.PORT || 4057;
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════╗
║  🌏 Multilingual AI Service              ║
║  Hindi, Tamil, Telugu, Kannada, Malayalam ║
║  Marathi, Bengali, English             ║
║  Port: ${PORT}                               ║
╚═══════════════════════════════════════╝
  `);
});
