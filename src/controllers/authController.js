const Otp = require("../models/Otp");
const User = require("../models/User");
const { sendOtpToMobile } = require("../utils/sendOtp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const sendOtp = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) return res.status(400).json({ message: "Mobile is required" });

  const otp = await sendOtpToMobile(mobile);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await Otp.findOneAndUpdate(
    { mobile },
    { otp, expiresAt },
    { upsert: true, new: true }
  );  

  return res.status(200).json({ message: "OTP sent successfully" });
};

const verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) return res.status(400).json({ message: "Missing fields" });

  const record = await Otp.findOne({ mobile });

  if (!record) return res.status(400).json({ message: "OTP not found or expired" });
  if (record.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
  if (record.expiresAt < Date.now()) return res.status(400).json({ message: "OTP expired" });

  await Otp.findOneAndUpdate({ mobile }, { verified: true });

  return res.status(200).json({ message: "OTP verified successfully" });
};

const register = async (req, res) => {
  const { name, email, mobile, password, role } = req.body;

  if (!name || !email || !mobile || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const otpRecord = await Otp.findOne({ mobile });

  if (!otpRecord || !otpRecord.verified) {
    return res.status(400).json({ message: "Mobile not verified. Please verify OTP first." });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User with this email already exists" });
  }

  //const salt = await bcrypt.genSalt(10);
  //const hashedPassword = await bcrypt.hash(password, salt);

  //console.log("Original password:", password);
  //console.log("Hashed password:", hashedPassword);


  const newUser = new User({
    name,
    email,
    mobile,
    password,
    role,
    isMobileVerified: true,
    createdAt: new Date()
  });

  await newUser.save();
  await Otp.deleteOne({ mobile });

  return res.status(201).json({ message: "User registered successfully" });
};

//login-jwt-authentication

const loginUser = async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isMobileVerified) {
      return res.status(403).json({ message: "Mobile number not verified" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    //console.log("Entered password:", password);
    //console.log("Stored hashed password:", user.password);

    
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  sendOtp,
  verifyOtp,
  register,
  loginUser
};
