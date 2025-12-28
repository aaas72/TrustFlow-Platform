require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const { logger } = require("./middleware/logger");
const db = require("./config/database");
const app = require("./app");

// Global Process Error Handlers
process.on("uncaughtException", (err) => {
  logger.error("YAKALANAMAYAN İSTİSNA! 💥 Sunucu kapatılıyor...");
  logger.error(err.name, err.message, err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("YAKALANAMAYAN REJECTION! 💥 Sunucu kapatılıyor...");
  logger.error(err.name, err.message, err.stack);
  // Graceful shutdown could be implemented here
  process.exit(1);
});

// Uygulama yapılandırması app.js içinde taşındı

// Rotalar ve ara katmanlar app.js tarafından sağlanır

// Başlangıç tanılama bilgilerini yazdırma
function printStartupDiagnostics(portToLog) {
  const node = process.version;
  const pid = process.pid;
  const env = process.env.NODE_ENV || "development";
  const platform = process.platform;
  const staticDir = path.join(__dirname, "../frontend");
  const port = portToLog || process.env.PORT || 3000;

  logger.info("=================================");
  logger.info(`Sunucu şu adreste çalışıyor: http://localhost:${port}`);
  logger.info("=================================");
  logger.info(
    `Ortam: NODE_ENV=${env} | node=${node} | pid=${pid} | platform=${platform}`
  );
  logger.info(`Statik dosyalar: ${staticDir}`);

  // Veritabanı bilgileri
  try {
    const cfg = db && db.config ? db.config.connectionConfig || db.config : {};
    logger.info(
      `Veritabanı: host=${cfg.host || "localhost"} database=${
        cfg.database || "unknown"
      } user=${cfg.user || "root"}`
    );
    db.query("SELECT 1 AS ping", (err, rows) => {
      if (err) {
        logger.error(`Veritabanı sağlık kontrolü başarısız: ${err.message}`);
      } else {
        logger.info(
          `Veritabanı sağlık kontrolü TAMAM: ping=${
            rows && rows[0] ? rows[0].ping : 1
          }`
        );
      }
    });
  } catch (e) {
    logger.warn(`Veritabanı ayarları okunamıyor: ${e.message}`);
  }

  // Kayıtlı rotaların listesi
  const routes = [];
  const stack = app._router && app._router.stack ? app._router.stack : [];
  for (const layer of stack) {
    if (layer.route && layer.route.path) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods || {})
        .map((m) => m.toUpperCase())
        .join(",");
      routes.push({ path, methods });
    }
  }
  logger.info(`Kayıtlı rotalar (${routes.length}):`);
  for (const r of routes) {
    logger.info(`   • [${r.methods}] ${r.path}`);
  }
  logger.info("---------------------------------");
  logger.info(
    "Günlükleme etkin; tüm istekler server/logs/app.log dosyasına yazılacak"
  );
  logger.info("=================================");
}

// HTTP sunucusunu ve Socket.IO’yu başlat
const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
});

// io nesnesini rotalarda erişilebilir yap
app.set("io", io);

io.on("connection", (socket) => {
  logger.info("Soket bağlandı:", { socket_id: socket.id });

  // İstemci, doğrudan bildirim almak için kullanıcı kimliğiyle bir kez kayıt olur
  socket.on("register", (userId) => {
    if (!userId) return;
    const room = `user:${userId}`;
    socket.join(room);
    logger.info(`Soket ${socket.id} şu odaya katıldı: ${room}`);
  });

  // İsteğe bağlı: proje genelinde yayınlar için proje odasına katıl
  socket.on("joinProject", (projectId) => {
    if (!projectId) return;
    const room = `project:${projectId}`;
    socket.join(room);
    logger.info(`Soket ${socket.id} şu odaya katıldı: ${room}`);
  });

  socket.on("disconnect", () => {
    logger.info("Soket bağlantısı kesildi:", { socket_id: socket.id });
  });
});

httpServer.listen(PORT, () => {
  printStartupDiagnostics(PORT);
});

// Hata ara katmanı app.js içinde etkinleştirildi
