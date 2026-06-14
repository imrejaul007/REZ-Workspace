import { Router, Request, Response } from 'express';
import { VoiceAssistantService } from '../services/voice-assistant.service';

const router = Router();
const voiceAssistant = new VoiceAssistantService();

// ===========================================
// VOICE COMMANDS
// ===========================================

router.post('/command', async (req: Request, res: Response) => {
  try {
    const { userId, text, language } = req.body;
    const response = await voiceAssistant.processCommand(userId, text, language);
    res.json({ success: true, ...response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/confirm', async (req: Request, res: Response) => {
  try {
    const { userId, response } = req.body;
    const result = await voiceAssistant.handleConfirmation(userId, response);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/languages', (req, res) => {
  res.json({
    success: true,
    languages: ['en', 'hi', 'kn', 'ta', 'te', 'ml'],
    names: {
      en: 'English',
      hi: 'हिन्दी',
      kn: 'ಕನ್ನಡ',
      ta: 'தமிழ்',
      te: 'తెలుగు',
      ml: 'മലയാളം',
    },
  });
});

router.post('/detect-language', (req: Request, res: Response) => {
  const { text } = req.body;
  const lang = voiceAssistant.detectLanguage(text);
  res.json({ success: true, language: lang });
});

export default router;
