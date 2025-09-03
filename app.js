const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./src/config/ConnectToMongoDb');
const dotenv = require('dotenv');
const patientRoutes = require("./src/routes/patients");
const doctorRoutes = require("./src/routes/doctors");   // NEW
const appointmentRoutes = require("./src/routes/appointmentRoutes"); // NEW
dotenv.config(); 

const app = express();

// Connect to MongoDBnode
connectDB();

app.use(bodyParser.json());
app.use(express.json());

// Routes
const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);
app.use("/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);         // NEW
app.use("/api/appointments", appointmentRoutes); // NEW
// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Hospital Management System API");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
module.exports = app;