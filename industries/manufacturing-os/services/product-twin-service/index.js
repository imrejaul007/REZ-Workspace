const express = require('express');
const mongoose = require('mongoose');
const { ProductTwin, ProductionTwin } = require('./models');
const logger = require('../../../utils/logger');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const product = new ProductTwin(req.body);
    await product.save();
    logger.info(`Manufacturing product created: ${product._id}`);
    res.status(201).json(product);
  } catch (error) {
    logger.error('Error creating product:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { category, limit = 50, offset = 0 } = req.query;
    const query = {};
    if (category) query.category = category;
    const products = await ProductTwin.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    res.json({ products, total: await ProductTwin.countDocuments(query) });
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await ProductTwin.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await ProductTwin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    logger.info(`Manufacturing product updated: ${product._id}`);
    res.json(product);
  } catch (error) {
    logger.error('Error updating product:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
