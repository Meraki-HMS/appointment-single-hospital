const mongoose = require("mongoose");

const receptionistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  branch: String,
});

module.exports = mongoose.model("Receptionist", receptionistSchema);
