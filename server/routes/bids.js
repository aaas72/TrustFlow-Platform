const express = require("express");
const router = express.Router();
const Bid = require("../models/Bid");
const db = require("../config/database");
const util = require("util");
const query = util.promisify(db.query).bind(db);
const { requireAuth } = require("../middleware/auth");
const AppError = require("../utils/AppError");
const Notification = require("../models/Notification");
const { logger } = require("../middleware/logger");

// Bir projeye teklif gönder
router.post("/", requireAuth, async (req, res, next) => {
  try {
    console.log("1. Bid submission process started.");
    if (req.user.user_type !== "freelancer") {
      return next(new AppError("فقط المستقلون يمكنهم تقديم عروض", 403));
    }
    const { project_id, amount, proposal, delivery_time } = req.body;
    const freelancer_id = req.user.id; // freelancer_id'yi tokendan al

    if (!project_id || !freelancer_id || !amount || !proposal) {
      return next(new AppError("Tüm alanlar gereklidir", 400));
    }

    // المستخدم قدم عرضًا لهذا المشروع من قبل؟
    const checkSql =
      "SELECT id FROM bids WHERE project_id = ? AND freelancer_id = ?";
    console.log("2. Checking for existing bids.");
    const existingBids = await query(checkSql, [project_id, freelancer_id]);

    if (existingBids.length > 0) {
      console.log("3. User has already submitted a bid for this project.");
      // تعارض منطقي: المستقل قدّم عرضًا سابقًا لنفس المشروع
      return next(new AppError("لقد قدمت عرضًا لهذا المشروع من قبل", 409));
    }

    console.log("4. Bypassing Bid.create and inserting directly.");
    // Match table columns: proposal (TEXT) and delivery_time (VARCHAR)
    const insertSql = `INSERT INTO bids (project_id, freelancer_id, amount, proposal, delivery_time) VALUES (?, ?, ?, ?, ?)`;
    const bidResult = await query(insertSql, [
      project_id,
      freelancer_id,
      amount,
      proposal,
      delivery_time || null,
    ]);

    console.log("5. Bid created successfully. Preparing notification.");
    // Müşteriye yeni teklif bildirimi gönder
    const getProjectSql =
      "SELECT id, client_id FROM projects WHERE id = ? LIMIT 1";
    // util.promisify(db.query) returns only 'rows', not [rows, fields]
    const projectRows = await query(getProjectSql, [project_id]);
    const project =
      Array.isArray(projectRows) && projectRows.length > 0
        ? projectRows[0]
        : null;

    if (project) {
      try {
        const notifId = await Notification.create({
          user_id: project.client_id,
          actor_id: freelancer_id,
          type: "bid_submitted",
          title: "Projenize yeni teklif",
          message: "Bir serbest çalışan projenize yeni bir teklif verdi",
          priority: "medium",
          action_required: true,
          project_id: project_id,
          bid_id: bidResult.insertId,
        });
        const io = req.app.get && req.app.get("io");
        if (io) {
          io.to(`user:${project.client_id}`).emit("notification:new", {
            id: notifId,
            type: "bid_submitted",
            title: "Projenize yeni teklif",
            message: "Bir serbest çalışan projenize yeni bir teklif verdi",
            priority: "medium",
            action_required: true,
            project_id,
            bid_id: bidResult.insertId,
            created_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error("Bildirim oluşturulurken hata oluştu:", e);
      }
    }
    console.log("6. Sending response.");
    res.json({
      success: true,
      message: "Teklif başarıyla gönderildi!",
      bid_id: bidResult.insertId,
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return next(new AppError("لقد قدمت عرضًا لهذا المشروع من قبل", 409));
    }
    return next(new AppError("Sunucu hatası: " + err.message, 500));
  }
});

// Belirli bir teklifi kabul et
router.put("/:id/accept", requireAuth, async (req, res, next) => {
  const client_id = req.user.id;

  // التحقق من أن المستخدم المصادق عليه هو عميل
  if (req.user.user_type !== "client") {
    return next(new AppError("فقط العملاء يمكنهم قبول العروض", 403));
  }

  // Bid ID handling: prefer URL, but allow body.bid_id for robustness
  const idFromUrl = parseInt(req.params.id, 10);
  const idFromBody =
    req.body && req.body.bid_id ? parseInt(req.body.bid_id, 10) : NaN;
  if (!isNaN(idFromBody) && !isNaN(idFromUrl) && idFromBody !== idFromUrl) {
    return next(
      new AppError(
        "معرف العرض في الرابط لا يطابق المعرف في الجسم (bid_id)",
        400
      )
    );
  }
  const id = !isNaN(idFromBody) ? idFromBody : idFromUrl;
  if (isNaN(id)) {
    return next(new AppError("معرف العرض غير صالح", 400));
  }
  logger.info("بدء عملية قبول العرض", { bid_id: id, client_id });
  console.log(
    `ACCEPT[1] بدء عملية قبول العرض: bid_id=${id}, client_id=${client_id}`
  );

  // 1. Teklif verilerini al + proje sahibini doğrula
  const getBidSql =
    "SELECT b.*, p.accepted_bid_id, p.client_id AS project_client_id FROM bids b JOIN projects p ON b.project_id = p.id WHERE b.id = ?";
  db.query(getBidSql, [id], async (err, bids) => {
    if (err) {
      logger.error("فشل جلب بيانات العرض", { bid_id: id, error: err.message });
      console.error("ACCEPT[E1] فشل جلب بيانات العرض:", err.message);
      return next(new AppError("Sunucu hatası: " + err.message, 500));
    }
    if (bids.length === 0) {
      logger.warn("العرض غير موجود", { bid_id: id });
      console.warn(`ACCEPT[2] العرض غير موجود: bid_id=${id}`);
      return next(new AppError("Teklif mevcut değil", 404));
    }

    const bid = bids[0];
    logger.info("تم جلب العرض", {
      bid_id: bid.id,
      project_id: bid.project_id,
      freelancer_id: bid.freelancer_id,
      status: bid.status,
      accepted_bid_id: bid.accepted_bid_id,
      project_client_id: bid.project_client_id,
    });
    console.log(
      `ACCEPT[3] تم جلب العرض: bid_id=${bid.id}, project_id=${bid.project_id}, freelancer_id=${bid.freelancer_id}, status=${bid.status}, accepted_bid_id=${bid.accepted_bid_id}, project_client_id=${bid.project_client_id}`
    );

    // Proje sahibinin doğrulanması
    if (bid.project_client_id !== client_id) {
      logger.warn("رفض القبول: محاولة عميل غير مالك للمشروع", {
        bid_id: bid.id,
        project_id: bid.project_id,
        request_client_id: client_id,
        project_client_id: bid.project_client_id,
      });
      console.warn(
        `ACCEPT[4] رفض القبول: العميل(${client_id}) ليس مالك المشروع(${bid.project_client_id}).`
      );
      return next(new AppError("لا يمكنك قبول عرض لمشروع لا تملكه", 403));
    }

    // Eğer teklif zaten kabul edilmişse
    if (bid.status === "accepted") {
      logger.warn("رفض القبول: العرض مقبول مسبقًا", { bid_id: bid.id });
      console.warn(`ACCEPT[5] العرض مقبول مسبقًا: bid_id=${bid.id}`);
      return next(new AppError("هذا العرض تم قبوله بالفعل.", 400));
    }

    // Eğer projenin zaten kabul edilmiş bir teklifi varsa
    if (bid.accepted_bid_id !== null) {
      logger.warn("رفض القبول: للمشروع عرض مقبول مسبقًا", {
        project_id: bid.project_id,
        accepted_bid_id: bid.accepted_bid_id,
      });
      console.warn(
        `ACCEPT[6] للمشروع عرض مقبول مسبقًا: project_id=${bid.project_id}, accepted_bid_id=${bid.accepted_bid_id}`
      );
      return next(new AppError("هذا المشروع لديه عرض مقبول بالفعل.", 400));
    }

    // 2. Teklif kabul edilince projeyi güncelle (sadece proje sahibi güncelleyebilir)
    const updateProjectSql =
      "UPDATE projects SET accepted_bid_id = ?, freelancer_id = ?, status = 'in_progress' WHERE id = ? AND client_id = ?";
    logger.info("تحديث المشروع لتعيين العرض المقبول", {
      project_id: bid.project_id,
      accepted_bid_id: id,
      freelancer_id: bid.freelancer_id,
      client_id,
    });
    console.log(
      `ACCEPT[7] تحديث المشروع: project_id=${bid.project_id}, accepted_bid_id=${id}, freelancer_id=${bid.freelancer_id}, client_id=${client_id}`
    );
    db.query(
      updateProjectSql,
      [id, bid.freelancer_id, bid.project_id, client_id],
      (err, result) => {
        if (err) {
          logger.error("خطأ أثناء تحديث المشروع", {
            project_id: bid.project_id,
            error: err.message,
          });
          console.error("ACCEPT[E2] خطأ أثناء تحديث المشروع:", err.message);
          return next(
            new AppError("Teklifin kabulünde hata: " + err.message, 500)
          );
        }
        if (!result || !result.affectedRows) {
          logger.warn("فشل تحديث المشروع: لم تتأثر أي صفوف", {
            project_id: bid.project_id,
            client_id,
          });
          console.warn(
            `ACCEPT[8] فشل تحديث المشروع: لم تتأثر أي صفوف، project_id=${bid.project_id}, client_id=${client_id}`
          );
          return next(
            new AppError("Proje güncellenemedi: yetki veya geçersiz durum", 400)
          );
        }

        // 3. Kabul edilen teklifin durumunu güncelle
        const acceptBidSql = `UPDATE bids SET status = 'accepted' WHERE id = ?`;
        db.query(acceptBidSql, [id], (err) => {
          if (err) {
            logger.error("خطأ أثناء تحديث حالة العرض إلى accepted", {
              bid_id: id,
              error: err.message,
            });
            console.error(
              "ACCEPT[E3] خطأ أثناء تحديث حالة العرض:",
              err.message
            );
            return next(
              new AppError(
                "Teklif durumunu güncellerken hata: " + err.message,
                500
              )
            );
          }
          logger.info("تم تعيين حالة العرض إلى accepted", { bid_id: id });
          console.log(
            `ACCEPT[9] تم تعيين حالة العرض إلى accepted: bid_id=${id}`
          );

          // 4. Diğer tüm teklifleri reddet
          const rejectOtherBidsSql =
            "UPDATE bids SET status = 'rejected' WHERE project_id = ? AND id != ?";
          db.query(rejectOtherBidsSql, [bid.project_id, id], (err) => {
            if (err) {
              logger.error("خطأ أثناء رفض العروض الأخرى", {
                project_id: bid.project_id,
                error: err.message,
              });
              console.error(
                "ACCEPT[E4] خطأ أثناء رفض العروض الأخرى:",
                err.message
              );
              return next(
                new AppError(
                  "Diğer teklifleri reddederken hata: " + err.message,
                  500
                )
              );
            }
            logger.info("تم رفض العروض الأخرى لنفس المشروع", {
              project_id: bid.project_id,
              accepted_bid_id: id,
            });
            console.log(
              `ACCEPT[10] تم رفض العروض الأخرى: project_id=${bid.project_id}, accepted_bid_id=${id}`
            );

            // Serbest çalışana teklifinin kabul edildiğini bildir
            const io = req.app.get && req.app.get("io");
            const notifyAccepted = async () => {
              try {
                const notifId = await Notification.create({
                  user_id: bid.freelancer_id,
                  actor_id: null,
                  type: "bid_accepted",
                  title: "Teklifiniz kabul edildi",
                  message: "Teklifiniz kabul edildi ve proje başladı",
                  priority: "high",
                  action_required: false,
                  project_id: bid.project_id,
                  bid_id: bid.id,
                });
                if (io)
                  io.to(`user:${bid.freelancer_id}`).emit("notification:new", {
                    id: notifId,
                    type: "bid_accepted",
                    title: "Teklifiniz kabul edildi",
                    message: "Teklifiniz kabul edildi ve proje başladı",
                    priority: "high",
                    action_required: false,
                    project_id: bid.project_id,
                    bid_id: bid.id,
                    created_at: new Date().toISOString(),
                  });
                console.log(
                  `ACCEPT[11] تم إنشاء إشعار وقُم بإرساله: freelancer_id=${bid.freelancer_id}`
                );
              } catch (e) {}
            };
            notifyAccepted().finally(() => {
              logger.info("انتهت عملية القبول بنجاح", {
                bid_id: id,
                project_id: bid.project_id,
              });
              console.log(
                `ACCEPT[12] انتهت عملية القبول بنجاح: bid_id=${id}, project_id=${bid.project_id}`
              );
              res.json({
                success: true,
                message: "Teklif başarıyla kabul edildi ve proje başladı",
              });
            });
          });
        });
      }
    );
  });
});

// Belirli bir projedeki teklifleri göster
router.get("/project/:project_id", requireAuth, async (req, res, next) => {
  if (req.user.user_type !== "client") {
    return next(new AppError("فقط العملاء يمكنهم عرض عروض المشاريع", 403));
  }
  const { project_id } = req.params;

  // Verify that the project belongs to the authenticated client
  const getProjectClientSql = "SELECT client_id FROM projects WHERE id = ?";
  db.query(getProjectClientSql, [project_id], (err, rows) => {
    if (err) {
      return next(new AppError("Sunucu hatası: " + err.message, 500));
    }
    if (rows.length === 0) {
      return next(new AppError("Proje bulunamadı", 404));
    }
    if (rows[0].client_id !== req.user.id) {
      return next(
        new AppError("Bu projeye ait teklifleri görüntüleme yetkiniz yok", 403)
      );
    }

    Bid.findByProjectId(project_id, (err, results) => {
      if (err) {
        return next(new AppError("Sunucu hatası: " + err.message, 500));
      }

      res.json({
        success: true,
        bids: results,
      });
    });
  });
});

// Belirli bir serbest çalışanın tekliflerini göster
router.get(
  "/freelancer/:freelancer_id",
  requireAuth,
  async (req, res, next) => {
    if (req.user.user_type !== "freelancer") {
      return next(new AppError("فقط المستقلون يمكنهم عرض عروضهم", 403));
    }
    const { freelancer_id } = req.params;

    if (req.user.id !== parseInt(freelancer_id)) {
      return next(
        new AppError(
          "Bu serbest çalışana ait teklifleri görüntüleme yetkiniz yok",
          403
        )
      );
    }

    Bid.getByFreelancer(freelancer_id, (err, results) => {
      if (err) {
        return next(new AppError("Sunucu hatası: " + err.message, 500));
      }

      res.json({
        success: true,
        bids: results,
      });
    });
  }
);

// Accepted projects count for a freelancer (distinct projects with accepted bids)
router.get(
  "/freelancer/:freelancer_id/accepted_count",
  requireAuth,
  async (req, res, next) => {
    if (req.user.user_type !== "freelancer") {
      return next(new AppError("فقط المستقلون يمكنهم عرض الإحصاءات", 403));
    }
    const { freelancer_id } = req.params;

    if (req.user.id !== parseInt(freelancer_id)) {
      return next(
        new AppError(
          "Bu serbest çalışana ait istatistikleri görüntüleme yetkiniz yok",
          403
        )
      );
    }

    const sql = `SELECT COUNT(DISTINCT project_id) AS count FROM bids WHERE freelancer_id = ? AND status = 'accepted'`;
    db.query(sql, [freelancer_id], (err, rows) => {
      if (err) {
        return res.json({ success: false, message: "Sunucu hatası" });
      }
      const count = rows && rows[0] ? Number(rows[0].count || 0) : 0;
      res.json({ success: true, count });
    });
  }
);

// Tüm teklifleri göster
router.get("/", requireAuth, async (req, res, next) => {
  const user_id = req.user.id;
  const user_type = req.user.user_type;

  let sql = `
SELECT b.*, u.full_name as freelancer_name, p.title as project_title 
FROM bids b 
JOIN users u ON b.freelancer_id = u.id 
JOIN projects p ON b.project_id = p.id
`;
  let params = [];

  if (user_type === "client") {
    sql += ` WHERE p.client_id = ?`;
    params.push(user_id);
  } else if (user_type === "freelancer") {
    sql += ` WHERE b.freelancer_id = ?`;
    params.push(user_id);
  } else {
    return next(new AppError("Bu işlemi yapmaya yetkiniz yok", 403));
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.json({
        success: false,
        message: "Sunucu hatası",
      });
    }

    res.json({
      success: true,
      bids: results,
    });
  });
});

module.exports = router;
