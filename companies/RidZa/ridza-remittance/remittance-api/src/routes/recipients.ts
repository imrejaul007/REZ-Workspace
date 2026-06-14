/**
 * Recipients Routes
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface Recipient {
  id: string;
  userId: string;
  name: string;
  country: string;
  bankName?: string;
  accountNumber: string;
  accountType?: string;
  swiftCode?: string;
  createdAt: Date;
}

const recipients = new Map<string, Recipient>();

// Add recipient
router.post('/', async (req, res) => {
  const { userId, name, country, bankName, accountNumber, accountType, swiftCode } = req.body;

  const recipient: Recipient = {
    id: `REC-${uuidv4().split('-')[0].toUpperCase()}`,
    userId,
    name,
    country,
    bankName,
    accountNumber,
    accountType,
    swiftCode,
    createdAt: new Date(),
  };

  recipients.set(recipient.id, recipient);
  res.status(201).json({ success: true, data: recipient });
});

// Get user's recipients
router.get('/user/:userId', async (req, res) => {
  const userRecipients = Array.from(recipients.values()).filter(r => r.userId === req.params.userId);
  res.json({ success: true, data: userRecipients });
});

// Get recipient
router.get('/:id', async (req, res) => {
  const recipient = recipients.get(req.params.id);
  if (!recipient) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: recipient });
});

// Delete recipient
router.delete('/:id', async (req, res) => {
  if (!recipients.has(req.params.id)) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  }
  recipients.delete(req.params.id);
  res.json({ success: true, message: 'Recipient deleted' });
});

export { router as recipientsRoutes };