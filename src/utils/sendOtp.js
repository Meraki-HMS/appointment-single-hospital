// src/utils/sendOtp.js
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOtpToMobile = async (mobile) => {
  const otp = generateOtp();

  console.log(`Sending OTP ${otp} to mobile: ${mobile}`);
  
  // Integrate real SMS gateway here later
  
  return otp;
};

module.exports = { sendOtpToMobile };
