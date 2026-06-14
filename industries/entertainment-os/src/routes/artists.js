const express = require('express');
const router = express.Router();

let artists = [
  { id: '1', name: 'Taylor Swift', genre: 'pop', popularity: 0.98 },
  { id: '2', name: 'Kevin Hart', genre: 'comedy', popularity: 0.92 },
  { id: '3', name: 'Metallica', genre: 'rock', popularity: 0.95 },
  { id: '4', name: 'Herbie Hancock', genre: 'jazz', popularity: 0.88 }
];

// GET all artists
router.get('/', (req, res) => {
  res.json(artists);
});

// GET single artist
router.get('/:id', (req, res) => {
  const artist = artists.find(a => a.id === req.params.id);
  if (!artist) return res.status(404).json({ error: 'Artist not found' });
  res.json(artist);
});

// POST new artist
router.post('/', (req, res) => {
  const newArtist = {
    id: String(artists.length + 1),
    name: req.body.name,
    genre: req.body.genre,
    popularity: req.body.popularity || 0
  };
  artists.push(newArtist);
  res.status(201).json(newArtist);
});

// PUT update artist
router.put('/:id', (req, res) => {
  const index = artists.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Artist not found' });
  artists[index] = { ...artists[index], ...req.body };
  res.json(artists[index]);
});

// DELETE artist
router.delete('/:id', (req, res) => {
  const index = artists.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Artist not found' });
  artists.splice(index, 1);
  res.json({ message: 'Artist deleted successfully' });
});

module.exports = router;