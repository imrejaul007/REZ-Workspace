import { Router } from 'express';
import axios from 'axios';
import { Hotel } from '../db';

const router = Router();

// Search hotels
router.get('/search', async (req, res) => {
  try {
    const { city, checkIn, checkOut, rooms } = req.query;

    // Call Makcorps API
    const response = await axios.get(`${process.env.MAKKORPS_API_URL}/hotels`, {
      params: { city, checkIn, checkOut, rooms },
      headers: { 'Authorization': `Bearer ${process.env.MAKKORPS_API_KEY}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Hotel search failed' });
  }
});

// Get hotel details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    let hotel = await Hotel.findOne({ externalId: id });

    if (!hotel) {
      // Fetch from API and cache
      const response = await axios.get(`${process.env.MAKKORPS_API_URL}/hotels/${id}`, {
        headers: { 'Authorization': `Bearer ${process.env.MAKKORPS_API_KEY}` }
      });

      hotel = await Hotel.create({
        externalId: id,
        ...response.data,
        syncedAt: new Date()
      });
    }

    res.json(hotel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get hotel' });
  }
});

export { router as hotelRoutes };
