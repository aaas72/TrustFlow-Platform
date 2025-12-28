const AppError = require("../utils/AppError");

function buildPayload(err, req) {
  const requestId = req?.requestId || req?.headers["x-request-id"] || undefined;
  const code = err.code || (err.isOperational ? "APP_ERROR" : "INTERNAL_ERROR");
  const context = {
    path: req?.originalUrl || req?.url,
    method: req?.method,
    module: (req?.originalUrl || req?.url || "").split("/").filter(Boolean)[1] || "root",
    params: req?.params || undefined,
    query: req?.query || undefined,
  };

  const hints = {
    AUTH_REQUIRED: "Lütfen giriş yapın ve tekrar deneyin.",
    INVALID_TOKEN: "Oturum süresi dolmuş olabilir; yeniden giriş yapmayı deneyin.",
    FORBIDDEN: "Bu işlem için yetkiniz yok.",
    NOT_FOUND: "İstediğiniz kaynak bulunamadı.",
    VALIDATION_ERROR: "Gönderdiğiniz verileri kontrol edin.",
    RATE_LIMITED: "Çok fazla istek; lütfen bir süre sonra tekrar deneyin.",
    INTERNAL_ERROR: "Beklenmeyen bir hata oluştu; lütfen daha sonra tekrar deneyin.",
    APP_ERROR: "İşlem gerçekleştirilirken bir sorun oluştu.",
  };
  const hint = hints[code] || hints.APP_ERROR;
  const payload = {
    success: false,
    status: err.status || "error",
    code,
    message: err.message || "Beklenmeyen bir hata oluştu",
    request_id: requestId,
    context,
    hint,
  };
  if (err.details) payload.details = err.details;
  return payload;
}

const sendErrorDev = (err, req, res) => {
  const payload = buildPayload(err, req);
  res.status(err.statusCode).json({
    ...payload,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    const payload = buildPayload(err, req);
    res.status(err.statusCode).json(payload);
  } else {
    console.error("ERROR 💥", err);
    res.status(500).json({
      success: false,
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Beklenmeyen bir hata oluştu",
      request_id: req?.requestId,
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else {
    sendErrorProd(err, req, res);
  }
};
