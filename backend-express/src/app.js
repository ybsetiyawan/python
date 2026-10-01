require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path"); // <-- Tambahkan import ini agar tidak ReferenceError

const app = express();

const formRoutes = require('./routes/formRoutes');
const ocrRoute = require("./routes/ocr");
const authRoute = require("./routes/auth");

app.set("trust proxy", true);

app.use(express.json());

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*"
}));

// =========================================================================
// STATIC FILES (Dua lokasi terpisah agar OCR & Form tidak saling ganggu)
// =========================================================================

// 1. Static untuk Form Submissions (ke root/public/uploads)
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

// 2. Static untuk OCR KTP Lama (ke root/uploads)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// =========================================================================

app.use("/api/ocr", ocrRoute);
app.use("/api/auth", authRoute);
app.use("/api/forms", formRoutes);

app.get("/", (req, res) => {
  res.send("Express Server Running 🚀");
});

app.listen(process.env.PORT || 8090, () => {
  console.log(`Server running on port ${process.env.PORT || 8090}`);
});