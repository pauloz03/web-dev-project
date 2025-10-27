import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // loads variables from .env file

// initialize express app and store it in app variable
const app = express();
app.use(cors());           // allows frontend (React) to talk to this backend
app.use(express.json());   // parses JSON body of requests

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Rest check endpoint
app.get("/", (req, res) => {
  res.send("Hello from backend!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));