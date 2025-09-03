const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  receptionistId: { type: mongoose.Schema.Types.ObjectId, ref: "Receptionist", required: true },
  action: { type: String, enum: ["create", "reschedule", "cancel"], required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
  before: Object,
  after: Object,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
