const AppError = require("./utils/AppError");
const globalErrorHandler = require("./middleware/errorHandler");

require("dotenv").config();
const express = require("express");
const path = require("path");
const { requestLogger, errorLogger } = require("./middleware/logger");
const db = require("./config/database");

// CORS desteği ekle
const cors = function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
};

// Uygulama oluştur
const app = express();

// Ortak ara katmanlar
// API cevaplarında 304 (Not Modified) oluşmasını önlemek için ETag'i kapat
app.set("etag", false);

// Basit istek kimliği oluşturucu (takip için)
app.use((req, res, next) => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  req.requestId = id;
  res.set("X-Request-Id", id);
  next();
});

app.use(cors);
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
// Serve uploaded files for download
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(requestLogger);

// API yanıtları için önbellekleme kapat (304 yerine her zaman içerik dönsün)
app.use((req, res, next) => {
  if (req.path && req.path.startsWith("/api/")) {
    res.set("Cache-Control", "no-store");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
  }
  next();
});

// Yönlendiricileri bağla
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/bids", require("./routes/bids"));
app.use("/api/milestones", require("./routes/milestones"));
app.use("/api/plans", require("./routes/plans"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/notifications", require("./routes/notifications"));

// Sağlık kontrolü
app.get("/api/health", (req, res) => {
  db.query("SELECT 1 AS ok", (err) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Veritabanına erişilemiyor" });
    res.json({ success: true, message: "TAMAM" });
  });
});

// Bulunamayan istekler için tekil 404 yakalayıcı
// Express 5 uses path-to-regexp v8 which no longer accepts bare "*" or "/*".
// Using a pathless middleware here ensures we catch only unmatched routes after the above handlers.
app.use((req, res, next) => {
  next(new AppError("İstek yolu bulunamadı", 404, "NOT_FOUND"));
});

// Hata işleyici (en sonda)
app.use(globalErrorHandler);

module.exports = app;
