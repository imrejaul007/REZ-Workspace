import { Router } from 'express';
import axios from 'axios';

const router = Router();
const SERVICE_URL = process.env.RISNA_VIRTUAL_TOUR_URL || 'http://localhost:4125';

router.all('*', async (req, res, next) => {
  try {
    const response = await axios({
      method: req.method,
      url: SERVICE_URL + '/api/v1' + req.path,
      data: req.body,
      params: req.query,
      headers: {
        ...req.headers,
        host: undefined,
        'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN,
        'x-user-id': req.userId,
      },
      timeout: 30000,
    });
    res.status(response.status).json(response.data);
  } catch (err: any) {
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(502).json({ success: false, error: { code: 'BAD_GATEWAY', message: 'Virtual Tour service unavailable' } });
    }
  }
});

export default router;
