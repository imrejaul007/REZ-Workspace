import { Router, Request, Response } from 'express';
import { GreenRidesService } from '../services/green-rides.service';

const router = Router();
const greenService = new GreenRidesService();

// ===========================================
// GREEN SCORE
// ===========================================

router.get('/score/:userId', async (req: Request, res: Response) => {
  const score = await greenService.calculateGreenScore(req.params.userId);
  res.json({ success: true, score });
});

router.post('/record', async (req: Request, res: Response) => {
  const { userId, vehicleType, distanceKm } = req.body;
  const result = await greenService.recordGreenRide(userId, vehicleType, distanceKm);
  res.json({ success: true, ...result });
});

// ===========================================
// CHARGING STATIONS
// ===========================================

router.get('/stations', async (req: Request, res: Response) => {
  const { lat, lng, radius = 5 } = req.query;
  const stations = await greenService.findChargingStations(
    parseFloat(lat as string),
    parseFloat(lng as string),
    parseFloat(radius as string)
  );
  res.json({ success: true, stations });
});

router.get('/stations/:id', async (req: Request, res: Response) => {
  const station = await greenService.getStationDetails(req.params.id);
  res.json({ success: true, station });
});

router.post('/stations/reserve', async (req: Request, res: Response) => {
  const { stationId, driverId, durationMinutes } = req.body;
  const reservation = await greenService.reserveChargingSlot(stationId, driverId, durationMinutes);
  res.json({ success: true, ...reservation });
});

// ===========================================
// EV BATTERY
// ===========================================

router.get('/battery/:driverId', async (req: Request, res: Response) => {
  const battery = await greenService.getBatteryStatus(req.params.driverId);
  res.json({ success: true, battery });
});

router.get('/charging-stop/:driverId', async (req: Request, res: Response) => {
  const { lat, lng } = req.query;
  const stop = await greenService.findOptimalChargingStop(
    req.params.driverId,
    { lat: parseFloat(lat as string), lng: parseFloat(lng as string) }
  );
  res.json({ success: true, stop });
});

// ===========================================
// LEADERBOARD & REWARDS
// ===========================================

router.get('/rewards/:userId', async (req: Request, res: Response) => {
  const rewards = await greenService.getGreenRewards(req.params.userId);
  res.json({ success: true, rewards });
});

router.post('/claim/:userId', async (req: Request, res: Response) => {
  const claimed = await greenService.claimGreenBonus(req.params.userId);
  res.json({ success: true, ...claimed });
});

router.get('/leaderboard', async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;
  const board = await greenService.getGreenLeaderboard(parseInt(limit as string));
  res.json({ success: true, leaderboard: board });
});

export default router;
