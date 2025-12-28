const fs = require("fs");
const path = require("path");
const winston = require("winston");

// Günlük dosyasını yapılandır
const logsDir = path.join(__dirname, "../logs");
try {
  fs.mkdirSync(logsDir, { recursive: true });
} catch (e) {}
const logFile = path.join(logsDir, "app.log");

// Winston logger yapılandırması
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length
        ? ` ${JSON.stringify(meta)}`
        : "";
      return `${timestamp} ${level.toUpperCase()} ${message}${metaStr}`;
    })
  ),
  transports: [
    new winston.transports.Console({ level: process.env.LOG_LEVEL || "info" }),
    new winston.transports.File({ filename: logFile }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "exceptions.log"),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "rejections.log"),
    }),
  ],
});

function formatDate(date = new Date()) {
  return date.toISOString();
}

function maskSensitive(obj) {
  try {
    if (!obj || typeof obj !== "object") return obj;
    const clone = JSON.parse(JSON.stringify(obj));
    for (const key of Object.keys(clone)) {
      if (/pass(word)?|token|secret/i.test(key)) {
        clone[key] = "***";
      }
    }
    return clone;
  } catch (_) {
    return obj;
  }
}

// Not: Manuel writeLog yerine Winston kullanılıyor

// Tüm istekleri ve yanıtları izleyen ara katman
function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const { method } = req;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection?.remoteAddress;
  const reqBody = maskSensitive(req.body);
  // İstek gövdesini güvenli şekilde stringe çevir (undefined durumunda çökmesin)
  const safeReqBodyStr = (() => {
    try {
      const str = JSON.stringify(reqBody);
      return typeof str === "string" ? str.slice(0, 500) : "";
    } catch (_) {
      return "[unserializable]";
    }
  })();

  // Yanıtı yakalamak için res.json’u engelle
  const originalJson = res.json.bind(res);
  let responseBodySnippet;
  res.json = function (body) {
    try {
      responseBodySnippet =
        typeof body === "object"
          ? JSON.stringify(body).slice(0, 500)
          : String(body).slice(0, 500);
    } catch (_) {
      responseBodySnippet = "[unserializable]";
    }
    return originalJson(body);
  };

  logger.info(`İstek ${method} ${url}`, { ip, body: safeReqBodyStr });

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    const status = res.statusCode;
    const isError = status >= 400;
    const level = isError ? "error" : "info";
    logger.log({
      level,
      message: `Yanıt ${method} ${url} durum=${status} süre_ms=${durationMs.toFixed(
        2
      )}`,
      response: responseBodySnippet || "",
    });
  });

  next();
}

// Merkezi hata işleme ara katmanı
function errorLogger(err, req, res, next) {
  const { method } = req;
  const url = req.originalUrl || req.url;
  const status = err.status || 500;
  logger.error(
    `Hata: ${method} ${url} durum=${status} mesaj=${err.message || err}`,
    { stack: err.stack }
  );
  res.status(status).json({
    success: false,
    message: "Sunucu hatası",
    error:
      process.env.NODE_ENV === "development"
        ? err.message || String(err)
        : undefined,
  });
}

// Genel hataları izleme
process.on("unhandledRejection", (reason) => {
  logger.error(
    `yakalanmamış reddetme: ${
      reason && reason.message ? reason.message : String(reason)
    }`
  );
});

process.on("uncaughtException", (error) => {
  logger.error(
    `yakalanmamış istisna: ${
      error && error.message ? error.message : String(error)
    }`
  );
});

module.exports = { requestLogger, errorLogger, logger };
