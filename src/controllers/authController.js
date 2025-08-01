// src/controllers/authController.js
const Otp = require("../models/Otp");
const { sendOtpToMobile } = require("../utils/sendOtp");

// POST /api/auth/send-otp
exports.sendOtp = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) return res.status(400).json({ message: "Mobile is required" });

  const otp = await sendOtpToMobile(mobile);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 min

  await Otp.findOneAndUpdate(
    { mobile },
    { otp, expiresAt },
    { upsert: true, new: true }
  );

  return res.status(200).json({ message: "OTP sent successfully" });
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) return res.status(400).json({ message: "Missing fields" });

  const record = await Otp.findOne({ mobile });

  if (!record)
    return res.status(400).json({ message: "OTP not found or expired" });

  if (record.otp !== otp)
    return res.status(400).json({ message: "Invalid OTP" });

  if (record.expiresAt < Date.now())
    return res.status(400).json({ message: "OTP expired" });

  // Mark mobile verified (you can flag this or proceed to register)
  await Otp.deleteOne({ mobile });

  return res.status(200).json({ message: "OTP verified successfully" });
};
