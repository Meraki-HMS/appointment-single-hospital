const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

// Helper to check overlapping slot
function isOverlapping(newStart, newEnd, bookedStart, bookedEnd) {
  const [nsH, nsM] = newStart.split(":").map(Number);
  const [neH, neM] = newEnd.split(":").map(Number);
  const [bsH, bsM] = bookedStart.split(":").map(Number);
  const [beH, beM] = bookedEnd.split(":").map(Number);

  const newStartMinutes = nsH * 60 + nsM;
  const newEndMinutes = neH * 60 + neM;
  const bookedStartMinutes = bsH * 60 + bsM;
  const bookedEndMinutes = beH * 60 + beM;

  return (newStartMinutes < bookedEndMinutes) && (newEndMinutes > bookedStartMinutes);
}
// 📌 Book Appointment
exports.bookAppointment = async (req, res) => {
  try {
    // ✅ Destructure patientId from body (important!)
    const { patientId: bodyPatientId, doctorId, doctorName, specialization, receptionistId, appointment_type, appointment_date, startTime, reason } = req.body;

    // 🔐 Determine finalPatientId
    let finalPatientId;
    if (req.user.role === "patient") {
      finalPatientId = req.user.manualId; // patient booking for self
    } else {
      if (!bodyPatientId) {
        return res.status(400).json({ message: "Please provide patientId in request body." });
      }
      finalPatientId = bodyPatientId; // manual ID for receptionist/admin
    }

    // Validate patient exists
    const patientExists = await Patient.findOne({ patient_id: finalPatientId });
    if (!patientExists) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Find doctor using ID, name, or specialization
    let doctor;
    if (doctorId) doctor = await Doctor.findOne({ doctor_id: doctorId });
    else if (doctorName) doctor = await Doctor.findOne({ name: doctorName });
    else if (specialization) doctor = await Doctor.findOne({ specialization });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Calculate endTime (+30 mins)
    const [hours, minutes] = startTime.split(":").map(Number);
    let endHour = hours, endMin = minutes + 30;
    if (endMin >= 60) {
      endHour += Math.floor(endMin / 60);
      endMin = endMin % 60;
    }
    const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
    
    // 🔴 Check if doctor has a holiday on this date
    const appointmentDay = new Date(appointment_date).toDateString();
    const isHoliday = doctor.holidays.some(h => new Date(h).toDateString() === appointmentDay);
    if (isHoliday) {
    return res.status(400).json({ message: "Doctor is not available on this holiday." });
    }

    // 🔴 Check if appointment overlaps with doctor's break
    for (let br of doctor.breaks) {
    if (isOverlapping(startTime, endTime, br.start, br.end)) {
    return res.status(400).json({ message: `This slot falls within doctor's break (${br.start}-${br.end}). Please choose another time.` });
    }
   }


    // Fetch booked appointments for doctor on that day
    const bookedAppointments = await Appointment.find({ doctorId: doctor.doctor_id, appointment_date });

    // Check overlapping slots (30-min window)
    for (let ba of bookedAppointments) {
      if (isOverlapping(startTime, endTime, ba.startTime, ba.endTime)) {
        return res.status(400).json({
          message: `This slot overlaps with another appointment (${ba.startTime}-${ba.endTime}). Please choose another time.`
        });
      }
    }

    // ✅ Create new appointment
    const newAppointment = new Appointment({
      patientId: finalPatientId,
      doctorId: doctor.doctor_id,
      receptionistId,
      appointment_type,
      appointment_date,
      startTime,
      reason
    });

    await newAppointment.save();
    res.status(201).json({ message: "Appointment booked successfully", appointment: newAppointment });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "This slot is already booked." });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ✅ Check if slot is already booked
    const existing = await Appointment.findOne({ doctorId, appointment_date, startTime });
    if (existing) {
      return res.status(400).json({ message: "This slot is already booked. Please choose another time." });
    }*/
// 📌 Get Available Slots for Doctor
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, doctorName, specialization, appointment_date } = req.query;

    // Find doctor using ID, name, or specialization
    let doctor;
    if (doctorId) doctor = await Doctor.findOne({ doctor_id: doctorId });
    else if (doctorName) doctor = await Doctor.findOne({ name: doctorName });
    else if (specialization) doctor = await Doctor.findOne({ specialization });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // 🔴 Check if requested date is a holiday
    const requestedDay = new Date(appointment_date).toDateString();
    const isHoliday = doctor.holidays.some(h => new Date(h).toDateString() === requestedDay);
    if (isHoliday) {
      return res.json({ availableSlots: [], message: "No slots available: Doctor is on holiday." });
    }

    const [startHour, startMin] = doctor.workingHours.start.split(":").map(Number);
    const [endHour, endMin] = doctor.workingHours.end.split(":").map(Number);
    const slotDuration = doctor.slotSize || 30;

    // Generate all slots
    const slots = [];
    let currentHour = startHour;
    let currentMin = startMin;
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      slots.push(`${String(currentHour).padStart(2,"0")}:${String(currentMin).padStart(2,"0")}`);
      currentMin += slotDuration;
      if (currentMin >= 60) {
        currentHour++;
        currentMin -= 60;
      }
    }

    // Remove booked slots and exclude breaks
    const bookedAppointments = await Appointment.find({ doctorId: doctor.doctor_id, appointment_date });
    const available = slots.filter(slot => {
      const [sH, sM] = slot.split(":").map(Number);
      const slotStart = sH*60 + sM;
      const slotEnd = slotStart + 30;

      // Check against booked appointments
      for (let ba of bookedAppointments) {
        const [bH, bM] = ba.startTime.split(":").map(Number);
        const baStart = bH*60 + bM;
        const baEnd = baStart + 30;
        if ((slotStart < baEnd) && (slotEnd > baStart)) return false;
      }

      // Check against doctor's breaks
      for (let br of doctor.breaks) {
        const [brH, brM] = br.start.split(":").map(Number);
        const breakStart = brH*60 + brM;
        const [brEndH, brEndM] = br.end.split(":").map(Number);
        const breakEnd = brEndH*60 + brEndM;
        if ((slotStart < breakEnd) && (slotEnd > breakStart)) return false;
      }

      return true;
    });

    // 🔹 Return available slots
    if (available.length === 0) {
      return res.json({ availableSlots: [], message: "No slots available on this day." });
    }

    res.json({ availableSlots: available });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
