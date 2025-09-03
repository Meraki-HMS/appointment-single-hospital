const express = require("express");
const Doctor = require("../models/Doctor");
const auth = require("../middleware/auth");
const router = express.Router();

// 🔍 Search doctors by name OR specialization (supports partial, case-insensitive search)
router.get("/", auth, async (req, res) => {
  const { name, specialization } = req.query;
  let query = {};

  if (name) query.name = new RegExp(name.trim(), "i");  // partial + case-insensitive
  if (specialization) query.specialization = new RegExp(specialization.trim(), "i");

  try {
    const doctors = await Doctor.find(query).select("-__v"); // hide __v
    if (doctors.length === 0) {
      return res.status(404).json({ message: "No doctors found matching criteria" });
    }
    res.json(doctors);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📂 Get doctor profile by doctor_id, name, or specialization
router.get("/profile", auth, async (req, res) => {
  const { doctor_id, name, specialization } = req.query;

  try {
    let query = {};
    if (doctor_id) query.doctor_id = Number(doctor_id); // ✅ ensure numeric
    if (name) query.name = new RegExp(name.trim(), "i");
    if (specialization) query.specialization = new RegExp(specialization.trim(), "i");

    if (Object.keys(query).length === 0) {
      return res.status(400).json({ message: "Please provide doctor_id, name, or specialization" });
    }

    const doctor = await Doctor.findOne(query);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(doctor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//extra can be removed during the time of admin
// ➕ Register new doctor
router.post("/", auth, async (req, res) => {
  try {
    // Trim inputs
    const name = req.body.name?.trim();
    const specialization = req.body.specialization?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const contact = req.body.contact?.trim();

    // ✅ Validate working hours
    if (!req.body.workingHours || !req.body.workingHours.start || !req.body.workingHours.end) {
      return res.status(400).json({ message: "Working hours (start & end) are required" });
    }

    // Check for existing doctor by email
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ message: "Doctor with this email already registered" });
    }

    // Optional: check duplicate doctor by name + specialization
    const duplicateDoctor = await Doctor.findOne({ 
      name: new RegExp("^" + name + "$", "i"), 
      specialization: new RegExp("^" + specialization + "$", "i")
    });
    if (duplicateDoctor) {
      return res.status(400).json({ message: "Doctor already exists with same name and specialization" });
    }

    const doctor = new Doctor({
      ...req.body,
      name,
      specialization,
      email,
      contact
    });

    await doctor.save();
    res.status(201).json({ message: "Doctor registered successfully", doctor });

  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

module.exports = router;