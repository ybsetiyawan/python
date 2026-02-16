const express = require("express");
const cors = require("cors");
const app = express();

const ocrRoute = require("./routes/ocr");



app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000"
}));
app.use("/api/ocr", ocrRoute);
app.use("/uploads", express.static("uploads"));


app.get("/", (req, res) => {
  res.send("Express Server Running 🚀");
});

app.listen(8090, () => {
  console.log("Server running on http://localhost:8090");
});
