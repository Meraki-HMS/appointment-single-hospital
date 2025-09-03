const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  doctor_id: { type: Number, unique: true, index: true }, // auto increment
  name: { type: String, required: true, maxlength: 100 },
  specialization: { type: String, required: true, maxlength: 100 },
  contact: { type: String, maxlength: 15 },
  email: { type: String, maxlength: 100, unique: true },

  workingHours: {
    start: { type: String, required: true }, // "09:00"
    end: { type: String, required: true }    // "17:00"
  },
  slotSize: { type: Number, default: 30 }, // in minutes
  breaks: [
    {
      start: { type: String, required: true }, // "13:00"
      end: { type: String, required: true }    // "14:00"
    }
  ],
  holidays: [{ type: Date }], // e.g. 2025-08-31

  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Auto-increment doctor_id
doctorSchema.pre("save", async function (next) {
  if (!this.doctor_id) {
    const last = await mongoose.model("Doctor").findOne().sort("-doctor_id");
    this.doctor_id = last ? last.doctor_id + 1 : 1;
  }
  next();
});

module.exports = mongoose.model("Doctor", doctorSchema);
