const express = require("express");
const mongoose = require("mongoose");
const { CustomerTwin } = require("./models");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const c = new CustomerTwin(req.body);
    await c.save();
    res.status(201).json(c);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get("/", async (req, res) => {
  try {
    const cs = await CustomerTwin.find().limit(50).sort({ createdAt: -1 });
    res.json(cs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const c = await CustomerTwin.findById(req.params.id);
    if (!c) return res.status(404).json({ error: "Not found" });
    res.json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
