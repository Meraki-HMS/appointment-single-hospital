const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./src/config/ConnectToMongoDb');
const dotenv = require('dotenv');

dotenv.config(); 

const app = express();

// Connect to MongoDB
connectDB();

app.use(bodyParser.json());
app.use(express.json());

// Routes
const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Hospital Management System API");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
