const express = require("express");
const mongoose = require("mongoose");
const { VehicleTwin } = require("./models");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const v = new VehicleTwin(req.body);
    await v.save();
    res.status(201).json(v);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get("/", async (req, res) => {
  try {
    const vs = await VehicleTwin.find().limit(50).sort({ createdAt: -1 });
    res.json(vs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const v = await VehicleTwin.findById(req.params.id);
    if (!v) return res.status(404).json({ error: "Not found" });
    res.json(v);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
