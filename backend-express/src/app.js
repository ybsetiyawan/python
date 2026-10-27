require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

// Buat HTTP Server dari aplikasi Express
const server = http.createServer(app);

// Inisialisasi Socket.io dengan CORS yang disamakan dengan Express
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*"
  }
});

const formRoutes = require('./routes/formRoutes');
const ocrRoute = require("./routes/ocr");
const authRoute = require("./routes/auth");
const userRoutes = require('./routes/userRoutes');
const menuRoutes = require('./routes/menuRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const stockpointRoutes = require('./routes/stockpointRoutes');
const spreadsheetRoutes = require('./routes/spreadsheetRoutes.js');
const monitorRouter = require('./routes/monitorRoutes.js');

app.set("trust proxy", true);

app.use(express.json());

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*"
}));

// =========================================================================
// STATIC FILES (Dua lokasi terpisah agar OCR & Form tidak saling ganggu)
// =========================================================================
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// =========================================================================
app.use("/api/ocr", ocrRoute);
app.use("/api/auth", authRoute);
app.use("/api/forms", formRoutes);
app.use('/api/users', userRoutes);
app.use("/api/menus", menuRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/stock-points', stockpointRoutes);
app.use('/api/spreadsheets', spreadsheetRoutes);
app.use('/api/monitor', monitorRouter);

app.get("/", (req, res) => {
  res.send("Express Server Running 🚀");
});

// =========================================================================
// LOGIKA SOCKET.IO UNTUK KOLABORASI REAL-TIME SPREADSHEET
// =========================================================================
// =========================================================================
// LOGIKA SOCKET.IO UNTUK KOLABORASI REAL-TIME SPREADSHEET
// =========================================================================
const activeRowLocks = {};

io.on("connection", (socket) => {
  console.log("Client terhubung via WebSocket:", socket.id);

  // Klien masuk ke room spreadsheet tertentu
  socket.on("join_spreadsheet", (spreadsheetId) => {
    socket.join(spreadsheetId);
    // Kirim status kunci baris yang sedang aktif ke klien baru
    socket.emit("sync_locks", activeRowLocks[spreadsheetId] || {});
  });

  // Saat klien fokus/mengedit baris tertentu
  socket.on("lock_row", ({ spreadsheetId, rowIndex, user }) => {
    if (!activeRowLocks[spreadsheetId]) {
      activeRowLocks[spreadsheetId] = {};
    }

    // 🛡️ PEMBERSIHAN OTOMATIS: Hapus semua baris lain yang pernah dikunci oleh socket.id ini
    for (const rIndex in activeRowLocks[spreadsheetId]) {
      if (activeRowLocks[spreadsheetId][rIndex].socketId === socket.id) {
        delete activeRowLocks[spreadsheetId][rIndex];
      }
    }

    // Catat baris baru yang sedang dikunci
    activeRowLocks[spreadsheetId][rowIndex] = {
      userId: user.id,
      userName: user.name,
      socketId: socket.id
    };

    // Broadcast update ke semua user di room ini
    io.to(spreadsheetId).emit("sync_locks", activeRowLocks[spreadsheetId]);
  });

  // Saat klien keluar dari baris / selesai edit
  socket.on("unlock_row", ({ spreadsheetId, rowIndex }) => {
    if (activeRowLocks[spreadsheetId] && activeRowLocks[spreadsheetId][rowIndex]) {
      if (activeRowLocks[spreadsheetId][rowIndex].socketId === socket.id) {
        delete activeRowLocks[spreadsheetId][rowIndex];
        io.to(spreadsheetId).emit("sync_locks", activeRowLocks[spreadsheetId]);
      }
    }
  });

  // Jika klien terputus (disconnect / tutup tab / pindah halaman)
  socket.on("disconnect", () => {
    for (const spreadsheetId in activeRowLocks) {
      let updated = false;
      for (const rowIndex in activeRowLocks[spreadsheetId]) {
        if (activeRowLocks[spreadsheetId][rowIndex].socketId === socket.id) {
          delete activeRowLocks[spreadsheetId][rowIndex];
          updated = true;
        }
      }
      if (Object.keys(activeRowLocks[spreadsheetId]).length === 0) {
        delete activeRowLocks[spreadsheetId];
      }
      if (updated) {
        io.to(spreadsheetId).emit("sync_locks", activeRowLocks[spreadsheetId] || {});
      }
    }
    console.log("Client terputus:", socket.id);
  });

  // Saat ada klien yang menekan tombol Simpan Perubahan
  socket.on("spreadsheet_saved", ({ spreadsheetId }) => {
    if (activeRowLocks[spreadsheetId]) {
      delete activeRowLocks[spreadsheetId];
      io.to(spreadsheetId).emit("sync_locks", {});
    }
    socket.to(spreadsheetId).emit("refresh_spreadsheet");
  });
});

// =========================================================================

const PORT = process.env.PORT || 8090;
server.listen(PORT, () => {
  console.log(`Server & WebSocket running on port ${PORT}`);
});