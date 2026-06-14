import { Router, Request, Response } from 'express';
import connectorService from '../services/connector.service';

const router = Router();

// Service Registration
router.post('/services', (req: Request, res: Response) => {
  try {
    const service = connectorService.registerService(req.body);
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: 'Failed to register service', details: (error as Error).message });
  }
});

router.get('/services', (req: Request, res: Response) => {
  const { status, type } = req.query;
  const services = connectorService.getAllServices({
    status: status as string,
    type: type as string
  });
  res.json({ services });
});

router.get('/services/:id', (req: Request, res: Response) => {
  const service = connectorService.getService(req.params.id);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  res.json(service);
});

router.get('/services/name/:name', (req: Request, res: Response) => {
  const service = connectorService.getServiceByName(req.params.name);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  res.json(service);
});

router.patch('/services/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const updated = connectorService.updateServiceStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Service not found' });
  res.json(updated);
});

router.post('/services/:id/heartbeat', (req: Request, res: Response) => {
  const success = connectorService.heartbeat(req.params.id);
  if (!success) return res.status(404).json({ error: 'Service not found' });
  res.json({ message: 'Heartbeat received' });
});

router.delete('/services/:id', (req: Request, res: Response) => {
  const deleted = connectorService.unregisterService(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Service not found' });
  res.json({ message: 'Service unregistered' });
});

// Messaging
router.post('/messages', (req: Request, res: Response) => {
  try {
    const message = connectorService.sendMessage(req.body);
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: 'Failed to send message', details: (error as Error).message });
  }
});

router.get('/messages/:id', (req: Request, res: Response) => {
  const message = connectorService.getMessage(req.params.id);
  if (!message) return res.status(404).json({ error: 'Message not found' });
  res.json(message);
});

router.get('/messages/correlation/:correlationId', (req: Request, res: Response) => {
  const messages = connectorService.getMessagesByCorrelation(req.params.correlationId);
  res.json({ messages });
});

router.get('/messages/service/:serviceName', (req: Request, res: Response) => {
  const messages = connectorService.getMessagesByService(req.params.serviceName);
  res.json({ messages });
});

// Event Subscriptions
router.post('/subscriptions', (req: Request, res: Response) => {
  try {
    const subscription = connectorService.subscribe(req.body);
    res.status(201).json(subscription);
  } catch (error) {
    res.status(400).json({ error: 'Failed to subscribe', details: (error as Error).message });
  }
});

router.get('/subscriptions', (req: Request, res: Response) => {
  const { subscriberId, eventType } = req.query;
  const subscriptions = connectorService.getSubscriptions(
    subscriberId as string,
    eventType as string
  );
  res.json({ subscriptions });
});

router.delete('/subscriptions/:id', (req: Request, res: Response) => {
  const success = connectorService.unsubscribe(req.params.id);
  if (!success) return res.status(404).json({ error: 'Subscription not found' });
  res.json({ message: 'Unsubscribed' });
});

// Health
router.get('/health/services', (req: Request, res: Response) => {
  const health = connectorService.getServiceHealth();
  res.json({ health });
});

// Transactions
router.post('/transactions', (req: Request, res: Response) => {
  const { services } = req.body;
  const transaction = connectorService.startTransaction(services);
  res.status(201).json(transaction);
});

router.patch('/transactions/:id/step', (req: Request, res: Response) => {
  const { completed } = req.body;
  const updated = connectorService.updateTransactionStep(req.params.id, completed);
  if (!updated) return res.status(404).json({ error: 'Transaction not found' });
  res.json(updated);
});

router.post('/transactions/:id/rollback', (req: Request, res: Response) => {
  const success = connectorService.rollbackTransaction(req.params.id);
  if (!success) return res.status(404).json({ error: 'Transaction not found' });
  res.json({ message: 'Transaction rolled back' });
});

// Stats
router.get('/stats', (req: Request, res: Response) => {
  res.json(connectorService.getStats());
});

export default router;
