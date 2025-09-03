const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  appointment_id: { type: Number, unique: true }, // SQL-style auto-increment ID

  // Relations using manual IDs
  patientId: { type: Number, required: true }, // manual patient ID
  doctorId: { type: Number, required: true }, // manual doctor ID
  receptionistId: { type: mongoose.Schema.Types.ObjectId, ref: "Receptionist" },

  // Appointment details
  appointment_type: { type: String, enum: ["Manual", "Online"], required: true },
  appointment_date: { type: Date, required: true },
  startTime: { type: String, required: true }, // "HH:mm"
  endTime: { type: String },                   // always set to startTime + 30 mins
  reason: { type: String },
  status: { 
    type: String, 
    enum: ["Scheduled", "Completed", "Cancelled", "Rescheduled"], 
    default: "Scheduled" 
  },

  createdAt: { type: Date, default: Date.now }
});

// 🔢 Auto-increment appointment_id
appointmentSchema.pre("save", async function (next) {
  // Auto-increment appointment_id
  if (!this.appointment_id) {
    const last = await mongoose.model("Appointment").findOne().sort("-appointment_id");
    this.appointment_id = last ? last.appointment_id + 1 : 1;
  }

  // ⏱ Always set endTime = startTime + 30 minutes
  if (this.startTime) {
    const [hours, minutes] = this.startTime.split(":").map(Number);
    let endHour = hours;
    let endMin = minutes + 30;

    if (endMin >= 60) {
      endHour += Math.floor(endMin / 60);
      endMin = endMin % 60;
    }

    this.endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
  }

  next();
});
appointmentSchema.index(
  { doctorId: 1, appointment_date: 1, startTime: 1 },
  { unique: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
