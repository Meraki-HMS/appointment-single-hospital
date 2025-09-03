//receptionist module
const express = require("express");
const Patient = require("../models/Patient");
const auth = require("../middleware/auth");
const router = express.Router();

// 🔍 Search patient (by first_name / last_name / contact_number)
router.get("/", auth, async (req, res) => {
  try {
    const { first_name, last_name, contact_number } = req.query;
    let query = {};

    if (first_name) query.first_name = new RegExp(first_name.trim(), "i");
    if (last_name) query.last_name = new RegExp(last_name.trim(), "i");
    if (contact_number) query.contact_number = contact_number.trim();

    const patients = await Patient.find(query);

    if (patients.length === 0) {
      return res.status(404).json({ message: "No patient found, please register first" });
    }
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ Register new patient
router.post("/", auth, async (req, res) => {
  try {
    // check if already exists (by contact_number or email)
    const existing = await Patient.findOne({
      $or: [
        { contact_number: req.body.contact_number },
        { email: req.body.email }
      ]
    });

    if (existing) {
      return res.status(400).json({ message: "Patient already registered with this contact/email" });
    }
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json({ message: "Patient registered successfully", patient });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📂 Open patient profile (by patient_id, not Mongo _id)
router.get("/:patient_id", auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ patient_id: req.params.patient_id });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
