const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const auth = require("../middleware/auth"); // ✅ import your auth middleware

// Book appointment
router.post("/book", auth, appointmentController.bookAppointment);

// Get available slots
router.get("/slots", auth, appointmentController.getAvailableSlots);


module.exports = router;
