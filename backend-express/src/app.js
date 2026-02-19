require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
app.set("trust proxy", true);


const ocrRoute = require("./routes/ocr");
const authRoute = require("./routes/auth");

app.use(express.json());

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*"
}));

app.use("/api/ocr", ocrRoute);
app.use("/api/auth", authRoute);
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Express Server Running 🚀");
});

app.listen(process.env.PORT || 8090, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
