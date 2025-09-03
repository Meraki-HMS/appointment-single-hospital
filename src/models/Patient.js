const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  patient_id: { type: Number, unique: true }, // manually increment or use a counter
  first_name: { type: String, required: true, maxlength: 50 },
  last_name: { type: String, required: true, maxlength: 50 },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  contact_number: { type: String, required: true, maxlength: 15 },
  address: { type: String },
  email: { type: String, maxlength: 100, unique: true },
  registration_date: { type: Date, default: Date.now }
});

// 🔢 Auto-increment patient_id (since MongoDB doesn’t auto increment integers like SQL)
patientSchema.pre("save", async function (next) {
  if (!this.patient_id) {
    const lastPatient = await mongoose.model("Patient").findOne().sort("-patient_id");
    this.patient_id = lastPatient ? lastPatient.patient_id + 1 : 1;
  }
  next();
});

// 🚀 Hide _id and __v in API responses
patientSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model("Patient", patientSchema);
