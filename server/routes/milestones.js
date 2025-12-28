const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Milestone = require("../models/Milestone");
const Project = require("../models/Project");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const db = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const ProjectPlan = require("../models/ProjectPlan");
const {
  emitPaymentCompletedNotifications,
  releaseMilestoneFunds,
} = require("../utils/paymentHelper");

// Optional: file upload support (fallbacks to JSON if multer unavailable)
let multer;
try {
  multer = require("multer");
} catch (e) {
  multer = null;
}
const fs = require("fs");
const path = require("path");

// Yardımcı: proje için müşteri ve kabul edilen freelancer’ı getir
async function getProjectParticipants(project_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT p.id as project_id, p.client_id, p.deadline as project_deadline, p.created_at as project_created_at,
             b.freelancer_id, b.amount as accepted_amount, b.delivery_time
      FROM projects p
      JOIN bids b ON b.project_id = p.id AND b.status = 'accepted'
      WHERE p.id = ?
      LIMIT 1
    `;
    db.query(sql, [project_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows && rows[0] ? rows[0] : null);
    });
  });
}

// Yeni aşama oluştur
router.post("/", requireAuth, async (req, res) => {
  console.log("Request Body:", req.body);
  const { project_id, title, description, amount, deadline } = req.body;

  if (
    project_id === undefined ||
    project_id === null ||
    title === undefined ||
    title === null ||
    amount === undefined ||
    amount === null
  ) {
    return res.json({
      success: false,
      message: "Proje kimliği, başlık ve tutar gereklidir",
    });
  }

  try {
    const participants = await getProjectParticipants(project_id);
    console.log("DEBUG: Participants data:", participants);
    if (!participants) {
      return res.status(400).json({
        success: false,
        message: "لا يمكن إضافة مرحلة لمشروع ليس له عرض مقبول.",
      });
    }

    const plan = await ProjectPlan.getByProject(Number(project_id));
    if (!plan || String(plan.status) !== "approved") {
      return res.status(400).json({
        success: false,
        message: "لا يمكن إضافة مرحلة قبل اعتماد الخطة الأولية للمشروع.",
      });
    }

    // 1. Date Validation (Bid Duration Priority)
    if (deadline) {
      let maxDeadlineDate = null;
      let maxDeadlineSource = "";
      let bidDays = 0;
      if (participants.delivery_time) {
        const match = String(participants.delivery_time).match(/\d+/);
        if (match) bidDays = parseInt(match[0], 10);
      }

      let earliestStart = null;
      const steps = plan.steps || [];
      if (Array.isArray(steps)) {
        steps.forEach((step) => {
          if (typeof step === "object" && (step.startDate || step.start_date)) {
            const d = new Date(step.startDate || step.start_date);
            if (!isNaN(d.getTime())) {
              if (!earliestStart || d < earliestStart) earliestStart = d;
            }
          }
        });
      }
      const basisDate =
        earliestStart ||
        (participants.project_created_at
          ? new Date(participants.project_created_at)
          : new Date());

      if (bidDays > 0) {
        const d = new Date(basisDate);
        d.setDate(d.getDate() + bidDays);
        d.setHours(23, 59, 59, 999);
        maxDeadlineDate = d;
        maxDeadlineSource = "مدة العرض المتفق عليها";
      } else if (participants.project_deadline) {
        maxDeadlineDate = new Date(participants.project_deadline);
        maxDeadlineDate.setHours(23, 59, 59, 999);
        maxDeadlineSource = "تاريخ انتهاء المشروع";
      }

      console.log("DEBUG: Validation Info:", {
        bidDays,
        basisDate,
        maxDeadlineDate,
        maxDeadlineSource,
        requestedDeadline: deadline,
      });

      if (maxDeadlineDate) {
        const d = new Date(deadline);
        d.setHours(0, 0, 0, 0);
        const maxCheck = new Date(maxDeadlineDate);
        maxCheck.setHours(0, 0, 0, 0);
        if (d > maxCheck) {
          return res.status(400).json({
            success: false,
            message: `تاريخ المرحلة (${d.toLocaleDateString(
              "tr-TR"
            )}) لا يمكن أن يتجاوز ${maxDeadlineSource} (${maxDeadlineDate.toLocaleDateString(
              "tr-TR"
            )}).`,
          });
        }
      }
    }

    // 2. Budget Validation
    const budgetLimit = Number(participants.accepted_amount);
    const totalExisting = await new Promise((resolve, reject) => {
      Milestone.getTotalAmountByProject(project_id, (err, total) =>
        err ? reject(err) : resolve(total)
      );
    });

    if (Number(totalExisting) + Number(amount) > budgetLimit) {
      return res.status(400).json({
        success: false,
        message: "مجموع مبالغ المراحلة يتجاوز الميزانية المتفق عليها للمشروع.",
      });
    }

    // 3. Title Uniqueness
    const existingMilestones = await new Promise((resolve, reject) => {
      Milestone.findByProjectAndTitle(project_id, title, (err, res) =>
        err ? reject(err) : resolve(res)
      );
    });
    if (existingMilestones && existingMilestones.length > 0) {
      return res.json({
        success: false,
        message: "Bu proje için aynı başlığa sahip bir aşama zaten mevcut.",
      });
    }

    // 4. Plan Compliance (Title)
    const allowed = ProjectPlan.allowedTitlesFromPlan(plan);
    if (!allowed.includes(String(title || "").trim())) {
      return res.status(400).json({
        success: false,
        message:
          "عنوان المرحلة غير موجود في الخطة المعتمدة. يرجى الالتزام بالخطة.",
      });
    }

    // 5. Sequential Order (No Unapproved Milestones)
    const hasUnapproved = await new Promise((resolve, reject) => {
      Milestone.hasUnapprovedMilestones(project_id, (err, res) =>
        err ? reject(err) : resolve(res)
      );
    });
    if (hasUnapproved) {
      return res.status(400).json({
        success: false,
        message: "لا يمكن إضافة مرحلة جديدة قبل الموافقة على المراحل السابقة.",
      });
    }

    // Create
    Milestone.create(
      { project_id, title, description, amount, deadline },
      (err, result) => {
        if (err) {
          return res.json({
            success: false,
            message: "Sunucu hatası: " + err.message,
          });
        }

        // Notify
        if (participants.client_id) {
          const client_id = participants.client_id;
          const notifMessage = `Yeni bir aşama oluşturuldu: ${title}. Lütfen inceleyin.`;
          Notification.create({
            user_id: client_id,
            actor_id: req.user.id,
            type: "milestone_created",
            title: "Yeni Aşama Oluşturuldu",
            message: notifMessage,
            priority: "medium",
            action_required: true,
            project_id: project_id,
            milestone_id: result.insertId,
          });
          const io = req.app.get("io");
          if (io) {
            io.to(`user:${client_id}`).emit("notification:new", {
              event: "notification:new",
              type: "milestone_created",
              title: "Yeni Aşama Oluşturuldu",
              message: notifMessage,
              milestone_id: result.insertId,
              project_id: project_id,
              created_at: new Date().toISOString(),
            });
          }
        }

        return res.json({
          success: true,
          message: "Aşama başarıyla oluşturuldu",
          milestone_id: result.insertId,
        });
      }
    );
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Sunucu hatası: " + err.message });
  }
});

// Belirli bir projenin aşamalarını göster (üst düzey)
router.get("/project/:project_id", (req, res) => {
  const { project_id } = req.params;

  Milestone.getByProject(project_id, (err, milestones) => {
    if (err) {
      return res.json({
        success: false,
        message: "Sunucu hatası",
      });
    }

    // Her aşama için ekleri ve ödeme durumunu getir
    const milestonesWithData = milestones.map((milestone) => {
      return new Promise(async (resolve) => {
        // 1. Ekleri getir
        const attachments = await new Promise((resAtt) => {
          Milestone.getAttachments(milestone.id, (err, att) => {
            if (err) {
              console.error(
                `Error getting attachments for milestone ${milestone.id}:`,
                err
              );
              resAtt([]);
            } else {
              resAtt(att || []);
            }
          });
        });
        // Map attachments to provide correct URL path for DB-stored files
        milestone.attachments = attachments.map((att) => {
          if (!att.file_path || att.file_path === "db:stored") {
            // Include token in the URL for authentication
            const token = req.headers.authorization
              ? req.headers.authorization.split(" ")[1]
              : "";
            const tokenParam = token ? `?token=${token}` : "";

            return {
              ...att,
              file_path: `api/milestones/attachments/${att.id}${tokenParam}`,
            };
          }
          return att;
        });

        // 2. Ödeme durumunu kontrol et (Veritabanı senkronizasyonu)
        // Eğer milestone status 'pending' ise ama ödeme varsa, statusu 'funded' yap
        // DEBUG LOGGING
        // console.log(`Checking milestone ${milestone.id} status: ${milestone.status}`);

        if (milestone.status === "pending") {
          const payment = await new Promise((resPay) => {
            const sql =
              "SELECT * FROM payments WHERE milestone_id = ? AND status IN ('held', 'released', 'completed') LIMIT 1";
            db.query(sql, [milestone.id], (err, rows) => {
              // console.log(`Payment check for ${milestone.id}:`, rows);
              resPay(rows && rows[0] ? rows[0] : null);
            });
          });

          if (payment) {
            console.log(
              `Overriding status for milestone ${milestone.id} to funded`
            );
            milestone.status = "funded";
            milestone.fundedAt = payment.created_at; // Veya uygun tarih

            // Opsiyonel: Veritabanını da güncelle (Data integrity için)
            Milestone.updateStatus(milestone.id, "funded", () => {});
          }
        } else if (milestone.status === "funded") {
          // Eğer zaten funded ise, ödeme tarihini de ekleyebiliriz
          const payment = await new Promise((resPay) => {
            const sql =
              "SELECT * FROM payments WHERE milestone_id = ? AND status IN ('held', 'released', 'completed') LIMIT 1";
            db.query(sql, [milestone.id], (err, rows) => {
              resPay(rows && rows[0] ? rows[0] : null);
            });
          });
          if (payment) {
            milestone.fundedAt = payment.created_at;
          }
        }

        resolve(milestone);
      });
    });

    Promise.all(milestonesWithData).then((completedMilestones) => {
      // DEBUG: Log attachments for each milestone
      completedMilestones.forEach((m) => {
        if (m.attachments && m.attachments.length > 0) {
          console.log(`Milestone ${m.id} sending attachments:`, m.attachments);
        }
      });

      res.json({
        success: true,
        milestones: completedMilestones,
      });
    });
  });
});

router.post(
  "/:id/attachments",
  requireAuth,
  multer
    ? (() => {
        // Configure memory storage for DB BLOBs
        const storage = multer.memoryStorage();
        const upload = multer({ storage }).array("attachments", 10);
        return upload;
      })()
    : (_req, _res, next) => next(),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "Aşama kimliği gereklidir" });
      }

      // Fetch milestone and participants for permission checks
      const milestone = await new Promise((resolve, reject) => {
        Milestone.getById(Number(id), (err, rows) => {
          if (err) return reject(err);
          resolve(rows && rows[0] ? rows[0] : null);
        });
      });
      if (!milestone) {
        return res
          .status(404)
          .json({ success: false, message: "Aşama mevcut değil" });
      }

      const participants = await getProjectParticipants(milestone.project_id);
      if (!participants) {
        return res.status(400).json({
          success: false,
          message: "Bu proje için kabul edilmiş teklif yok",
        });
      }
      const { client_id, freelancer_id } = participants;

      // Only the freelancer can attach deliverables for submission
      const isFreelancer = req.user && req.user.id === freelancer_id;
      if (!isFreelancer) {
        return res.status(403).json({
          success: false,
          message: "İzin yok: yalnızca serbest çalışan dosya ekleyebilir",
        });
      }

      // Check if milestone is funded (Payment required before submission)
      const payments = await Payment.getByMilestone(Number(id));
      const isFunded = payments.some((p) =>
        ["held", "released", "completed"].includes(p.status)
      );

      if (!isFunded) {
        return res.status(403).json({
          success: false,
          message:
            "Bu aşama henüz finanse edilmedi. İş teslimi yapmadan önce ödeme yapılmalıdır.",
        });
      }

      const inserted = [];
      if (multer && Array.isArray(req.files) && req.files.length > 0) {
        // Uploaded files from multipart/form-data
        for (const file of req.files) {
          const record = await new Promise((resolve, reject) => {
            Milestone.addAttachment(
              {
                milestone_id: Number(id),
                file_name: file.originalname,
                file_path: "db:stored",
                file_type: file.mimetype || "application/octet-stream",
                file_data: file.buffer,
              },
              (err, result) => {
                if (err) return reject(err);
                resolve({
                  id: result.insertId,
                  file_name: file.originalname,
                  file_path: `api/milestones/attachments/${result.insertId}`,
                  file_type: file.mimetype,
                });
              }
            );
          });
          inserted.push(record);
        }
      } else {
        // JSON-based attachments (links or pre-uploaded paths)
        const { attachments } = req.body || {};
        const items = Array.isArray(attachments) ? attachments : [];
        if (items.length === 0) {
          return res
            .status(400)
            .json({ success: false, message: "attachments boş olamaz" });
        }
        for (const att of items) {
          const file_name = String(att?.file_name || "file");
          const file_path = String(att?.file_path || "");
          const file_type = String(
            att?.file_type || "application/octet-stream"
          );
          if (!file_path) continue;
          const record = await new Promise((resolve, reject) => {
            Milestone.addAttachment(
              { milestone_id: Number(id), file_name, file_path, file_type },
              (err, result) => {
                if (err) return reject(err);
                resolve({
                  id: result.insertId,
                  file_name,
                  file_path,
                  file_type,
                });
              }
            );
          });
          inserted.push(record);
        }
      }

      // Optionally auto-mark milestone as submitted if not yet
      if (String(milestone.status || "") !== "submitted") {
        await new Promise((resolve, reject) => {
          Milestone.updateStatus(Number(id), "submitted", (err, _r) => {
            if (err) {
              // Ignore if status update fails, just log it
              console.error("Milestone update status error (ignored):", err);
              return resolve(true);
            }
            resolve(true);
          });
        });
      }

      // Notify client that files were attached and submission created
      const io = req.app.get("io");

      // Emit real-time status update to refresh client/freelancer UI
      const statusPayload = {
        type: "milestone_status",
        milestone_id: Number(id),
        project_id: milestone.project_id,
        status: "submitted",
        amount: milestone.amount,
        review_notes: null,
        at: new Date().toISOString(),
        attachments: inserted,
      };
      if (io) {
        if (client_id)
          io.to(`user:${client_id}`).emit("milestone:status", statusPayload);
        if (freelancer_id)
          io.to(`user:${freelancer_id}`).emit(
            "milestone:status",
            statusPayload
          );
      }

      const payload = {
        event: "notification:new",
        type: "milestone_submitted",
        title: "Aşama dosyaları gönderildi",
        message: `Aşama ${milestone.title} için dosyalar yüklendi ve gönderildi. Lütfen inceleyin.`,
        milestone_id: Number(id),
        project_id: milestone.project_id,
        created_at: new Date().toISOString(),
      };
      if (io && client_id)
        io.to(`user:${client_id}`).emit("notification:new", payload);
      await Notification.create({
        user_id: client_id,
        actor_id: isFreelancer ? req.user.id : null,
        type: "milestone_submitted",
        title: "Aşama dosyaları gönderildi",
        message: payload.message,
        priority: "medium",
        action_required: true,
        project_id: milestone.project_id,
        milestone_id: Number(id),
      });

      return res.json({
        success: true,
        message: "Dosyalar eklendi ve aşama gönderildi",
        attachments: inserted,
      });
    } catch (err) {
      console.error("POST /api/milestones/:id/attachments", err);
      return res.status(500).json({
        success: false,
        message: "Dosyalar eklenirken hata: " + (err.message || err),
      });
    }
  }
);

// Bir aşamayı müşteriye sun / statü güncelle (üst düzey)
router.put("/:id/status", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, review_notes } = req.body;

  if (!id || !status) {
    return res.status(400).json({
      success: false,
      message: "Aşama kimliği ve durum gereklidir",
    });
  }

  try {
    // Fetch milestone to get project id and amount
    const milestone = await new Promise((resolve, reject) => {
      Milestone.getById(id, (err, rows) => {
        if (err) return reject(err);
        resolve(rows && rows[0] ? rows[0] : null);
      });
    });
    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, message: "Aşama mevcut değil" });
    }

    // Prevent re-submitting an already submitted milestone
    if (status === "submitted" && milestone.status === "submitted") {
      return res.status(400).json({
        success: false,
        message: "Aşama zaten gönderilmiş durumda.",
      });
    }

    const participants = await getProjectParticipants(milestone.project_id);
    if (!participants) {
      return res.status(400).json({
        success: false,
        message: "Bu proje için kabul edilmiş teklif yok",
      });
    }
    const { client_id, freelancer_id } = participants;

    // Role-based permission checks
    const isClient = req.user && req.user.id === client_id;
    const isFreelancer = req.user && req.user.id === freelancer_id;
    if (status === "submitted") {
      if (!isFreelancer)
        return res.status(403).json({
          success: false,
          message: "İzin yok: yalnızca serbest çalışan aşamayı gönderebilir",
        });

      // Check if milestone is funded (Payment required before submission)
      const payments = await Payment.getByMilestone(Number(id));
      const isFunded = payments.some((p) =>
        ["held", "released", "completed"].includes(p.status)
      );

      if (!isFunded) {
        return res.status(403).json({
          success: false,
          message:
            "Bu aşama henüz finanse edilmedi. İş teslimi yapmadan önce ödeme yapılmalıdır.",
        });
      }
    } else if (["revision_requested", "approved"].includes(status)) {
      if (milestone.status !== "submitted") {
        return res.status(400).json({
          success: false,
          message:
            "المرحلة يجب أن تكون في حالة 'تم تقديمها' قبل الموافقة أو طلب المراجعة.",
        });
      }

      if (!isClient)
        return res.status(403).json({
          success: false,
          message:
            "İzin yok: yalnızca müşteri gözden geçirebilir/onaylayabilir",
        });
    }

    // Update status
    await new Promise((resolve, reject) => {
      Milestone.updateStatus(id, status, review_notes, (err, _result) => {
        if (err) return reject(err);
        resolve(true);
      });
    });

    // Helper function to get notification message based on status
    const getMilestoneStatusMessage = (status, milestoneTitle) => {
      switch (status) {
        case "submitted":
          return `Aşama ${milestoneTitle} freelancer tarafından gönderildi. Onayınızı bekliyor.`;
        case "revision_requested":
          return `Aşama ${milestoneTitle} için revizyon talep edildi. Not: ${
            review_notes || "Belirtilmedi"
          }`;
        case "approved":
          return `Aşama ${milestoneTitle} müşteri tarafından onaylandı. Ödeme süreci başlatıldı.`;
        default:
          return `Aşama durumu şu şekilde güncellendi: ${status}`; // Fallback
      }
    };

    // Emit realtime notifications
    const io = req.app.get("io");
    const payload = {
      type: "milestone_status",
      milestone_id: Number(id),
      project_id: milestone.project_id,
      status,
      amount: milestone.amount,
      review_notes: review_notes || null, // Add review_notes to payload
      at: new Date().toISOString(),
    };
    if (io) {
      io.to(`user:${client_id}`).emit("milestone:status", payload);
      io.to(`user:${freelancer_id}`).emit("milestone:status", payload);

      // Emit user-facing notification to the relevant party
      const notifTypeMap = {
        submitted: "milestone_submitted",
        revision_requested: "revision_requested",
        approved: "milestone_approved",
      };
      const notif = {
        event: "notification:new",
        type: notifTypeMap[status] || "milestone_status",
        title: "Aşama durumu",
        message: getMilestoneStatusMessage(status, milestone.title),
        milestone_id: Number(id),
        project_id: milestone.project_id,
        created_at: new Date().toISOString(),
        review_notes: review_notes, // Include notes in realtime payload
      };

      if (status === "submitted") {
        io.to(`user:${client_id}`).emit("notification:new", notif);
      } else if (status === "revision_requested" || status === "approved") {
        io.to(`user:${freelancer_id}`).emit("notification:new", notif);
      }
    }

    // Persist notifications for relevant participant
    const notifTypeMap = {
      submitted: "milestone_submitted",
      revision_requested: "revision_requested",
      approved: "milestone_approved",
    };
    const typeForDb = notifTypeMap[status] || "milestone_status";

    if (status === "submitted") {
      const notifMessageForClient = getMilestoneStatusMessage(
        status,
        milestone.title
      );
      await Notification.create({
        user_id: client_id,
        actor_id: isFreelancer ? req.user.id : null,
        type: typeForDb,
        title: "Aşama güncellemesi",
        message: notifMessageForClient,
        priority: "medium", // Submitted is medium priority for client
        action_required: true, // Client needs to review
        project_id: milestone.project_id,
        milestone_id: Number(id),
      });
    } else if (status === "revision_requested" || status === "approved") {
      const notifMessageForFreelancer = getMilestoneStatusMessage(
        status,
        milestone.title
      );
      await Notification.create({
        user_id: freelancer_id,
        actor_id: isClient ? req.user.id : null,
        type: typeForDb,
        title: "Aşama güncellemesi",
        message: notifMessageForFreelancer,
        priority: status === "approved" ? "medium" : "high", // Approved is medium, revision high for freelancer
        action_required: status === "revision_requested", // Freelancer needs to act on revision
        project_id: milestone.project_id,
        milestone_id: Number(id),
      });
    }

    // AUTOMATIC PAYMENT ON APPROVAL (Moved here)
    if (status === "approved") {
      try {
        // 1. Check if payment exists
        const existingPayment = await new Promise((resolve, reject) => {
          db.query(
            "SELECT * FROM payments WHERE milestone_id = ?",
            [id],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows[0]);
            }
          );
        });

        let paymentId = existingPayment ? existingPayment.id : null;

        if (existingPayment) {
          if (existingPayment.status === "held") {
            // ESCROW FLOW: Release held funds
            console.log(`[Milestone ${id}] Releasing held funds...`);
            const released = await releaseMilestoneFunds(id, req.app);
            if (released) {
              // Payment status is now 'released'
              console.log(`[Milestone ${id}] Funds released.`);
            } else {
              console.error(`[Milestone ${id}] Failed to release funds.`);
            }
          } else if (
            existingPayment.status !== "completed" &&
            existingPayment.status !== "released"
          ) {
            // Update to completed (Legacy/Direct flow)
            const transactionId =
              existingPayment.transaction_id || `auto_pay_${id}_${Date.now()}`;
            await Payment.updateStatus(paymentId, "completed", transactionId);
          }
        } else {
          // Create new completed payment
          const transactionId = `auto_pay_${id}_${Date.now()}`;
          paymentId = await Payment.create({
            milestone_id: Number(id),
            amount: milestone.amount,
            payment_method: "automatic_on_approval",
            transaction_id: transactionId,
            status: "completed",
          });
        }

        // Emit payment notifications
        if (paymentId) {
          // Note: releaseMilestoneFunds already emits notifications, but emitPaymentCompletedNotifications
          // is idempotent enough or we can check status.
          // If we just released funds, notifications were sent inside releaseMilestoneFunds.
          // But existing logic sends them here too.
          // Let's avoid double notification if possible, but emitPaymentCompletedNotifications
          // might be needed for the "completed" case.

          // If it was just released, we might skip this if releaseMilestoneFunds handles it.
          // releaseMilestoneFunds calls emitPaymentCompletedNotifications at the end.
          // So if we released, we can skip.

          if (existingPayment && existingPayment.status === "held") {
            // Already handled in releaseMilestoneFunds
          } else {
            await emitPaymentCompletedNotifications(paymentId, req.app);
          }

          // Update milestone status to 'completed' since payment is done
          try {
            await new Promise((resolve, reject) => {
              Milestone.updateStatus(id, "completed", (err, _result) => {
                if (err) return reject(err);
                resolve(true);
              });
            });

            // Emit 'completed' status event
            if (io) {
              const completedPayload = {
                type: "milestone_status",
                milestone_id: Number(id),
                project_id: milestone.project_id,
                status: "completed",
                amount: milestone.amount,
                at: new Date().toISOString(),
              };
              io.to(`user:${client_id}`).emit(
                "milestone:status",
                completedPayload
              );
              io.to(`user:${freelancer_id}`).emit(
                "milestone:status",
                completedPayload
              );
            }
          } catch (err) {
            console.error(
              `[Milestone ${id}] Failed to set status to completed:`,
              err
            );
            // Continue execution to ensure next milestone starts
          }

          // Bir sonraki aşamayı otomatik başlat
          try {
            const nextMilestones = await new Promise((resolve, reject) => {
              Milestone.getByProject(milestone.project_id, (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
              });
            });

            console.log(
              `[Milestone ${id}] Checking for next milestone. Found ${nextMilestones.length} total.`
            );

            const currentIndex = (nextMilestones || []).findIndex(
              (m) => Number(m.id) === Number(id)
            );
            const next =
              currentIndex >= 0 ? nextMilestones[currentIndex + 1] : null;

            if (next) {
              console.log(
                `[Milestone ${id}] Next milestone found: ${next.id}, current status: ${next.status}`
              );
            } else {
              console.log(
                `[Milestone ${id}] No next milestone found (currentIndex: ${currentIndex}).`
              );
            }

            if (
              next &&
              (String(next.status || "") === "funded" ||
                String(next.status || "") === "pending")
            ) {
              console.log(
                `[Milestone ${id}] Activating next milestone ${next.id} to in_progress`
              );
              await new Promise((resolve, reject) => {
                Milestone.updateStatus(
                  next.id,
                  "in_progress",
                  (err, _result) => {
                    if (err) return reject(err);
                    resolve(true);
                  }
                );
              });

              const nextPayload = {
                type: "milestone_status",
                milestone_id: Number(next.id),
                project_id: milestone.project_id,
                status: "in_progress",
                amount: next.amount,
                at: new Date().toISOString(),
              };
              if (io) {
                io.to(`user:${client_id}`).emit(
                  "milestone:status",
                  nextPayload
                );
                io.to(`user:${freelancer_id}`).emit(
                  "milestone:status",
                  nextPayload
                );
                io.to(`user:${freelancer_id}`).emit("notification:new", {
                  event: "notification:new",
                  type: "milestone_started",
                  title: "Yeni aşama başladı",
                  message: `Sonraki aşama (${next.title}) başlatıldı.`,
                  milestone_id: Number(next.id),
                  project_id: milestone.project_id,
                  created_at: new Date().toISOString(),
                });
              }
              await Notification.create({
                user_id: freelancer_id,
                actor_id: client_id,
                type: "milestone",
                title: "Yeni aşama başladı",
                message: `Sonraki aşama (${next.title}) başlatıldı.`,
                priority: "medium",
                action_required: false,
                project_id: milestone.project_id,
                milestone_id: Number(next.id),
              });
            } else if (next) {
              console.log(
                `[Milestone ${id}] Next milestone ${next.id} is already ${next.status}, skipping activation.`
              );
            }
          } catch (e) {
            console.warn(
              `[Milestone ${id}] Otomatik sonraki aşama başlatma atlandı:`,
              e?.message || e
            );
          }
        }
      } catch (paymentErr) {
        console.error("Auto-payment error:", paymentErr);
        // We don't fail the request since milestone is already approved,
        // but we log the error.
      }
    }

    return res.json({
      success: true,
      message: `Aşama durumu şu şekilde güncellendi: ${status}`,
    });
  } catch (err) {
    console.error("PUT /api/milestones/:id/status", err);
    return res.status(500).json({
      success: false,
      message: "Aşama durumu güncellenirken hata: " + (err.message || err),
    });
  }
});

// Plan onayı: ilk aşamayı başlat (client tarafından)
router.post(
  "/projects/:project_id/plan/approve",
  requireAuth,
  async (req, res) => {
    try {
      const { project_id } = req.params;
      if (!project_id) {
        return res
          .status(400)
          .json({ success: false, message: "Proje kimliği gereklidir" });
      }

      // Katılımcıları getir
      const participants = await getProjectParticipants(Number(project_id));
      const client_id = participants?.client_id;
      const freelancer_id = participants?.freelancer_id;

      // Yalnızca projenin müşterisi planı onaylayabilir
      if (!client_id) {
        return res.status(403).json({
          success: false,
          message: "Bu proje için müşteri bulunamadı",
        });
      }
      if (req.user.user_type !== "client" || req.user.id !== client_id) {
        return res.status(403).json({
          success: false,
          message: "İzin yok: yalnızca projenin müşterisi planı onaylayabilir",
        });
      }

      // Mark plan approved
      try {
        await ProjectPlan.updateStatus(Number(project_id), "approved");
      } catch (e) {
        console.warn("Plan status update failed (approve)", e?.message || e);
      }

      let milestones = await new Promise((resolve, reject) => {
        Milestone.getByProject(Number(project_id), (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

      const plan = await ProjectPlan.getByProject(Number(project_id));
      const planSteps = Array.isArray(plan?.plan_json?.steps)
        ? plan.plan_json.steps
        : [];

      if (!plan || planSteps.length === 0) {
        if (!milestones || milestones.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Bu proje için plan bulunamadı",
          });
        }
      } else {
        // Safe to reset? (All pending)
        const canReset = milestones.every((m) => m.status === "pending");

        if (canReset && milestones.length > 0) {
          // Delete existing to ensure clean state matching the plan
          await new Promise((resolve, reject) => {
            db.query(
              "DELETE FROM milestones WHERE project_id = ?",
              [project_id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          milestones = [];
        }

        // Create milestones if missing (or after reset)
        const existingTitles = new Set(milestones.map((m) => m.title));
        let createdNew = false;

        for (const s of planSteps) {
          const title =
            typeof s === "string" ? s : String(s.title || "").trim();
          if (!title || existingTitles.has(title)) continue;

          const amount = typeof s === "object" ? Number(s.amount || 0) : 0;
          const description =
            typeof s === "object" ? String(s.description || "") : "";
          const estimatedDays =
            typeof s === "object" ? Number(s.estimatedDays || 0) : 0;
          const deadline =
            estimatedDays > 0
              ? new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000)
              : null;

          await new Promise((resolve, reject) => {
            Milestone.create(
              {
                project_id: Number(project_id),
                title,
                description,
                amount,
                deadline: deadline
                  ? deadline.toISOString().slice(0, 19).replace("T", " ")
                  : null,
              },
              (err, _result) => {
                if (err) return reject(err);
                resolve(true);
              }
            );
          });
          createdNew = true;
        }

        if (createdNew) {
          milestones = await new Promise((resolve, reject) => {
            Milestone.getByProject(Number(project_id), (err, rows) => {
              if (err) return reject(err);
              resolve(rows || []);
            });
          });
        }
      }

      // Zaten bir aşama devam ediyor mu?
      const alreadyInProgress = milestones.some(
        (m) => String(m.status || "") === "in_progress"
      );
      if (alreadyInProgress) {
        return res.json({
          success: true,
          message: "Plan zaten başlatılmış",
          started: false,
        });
      }

      // İlk aşamayı seç
      const first = milestones[0];
      if (!first) {
        return res
          .status(404)
          .json({ success: false, message: "Başlatılacak aşama bulunamadı" });
      }
      /* 
      // ESCROW: Do not auto-start first milestone. Wait for funding.
      if (!["pending", "funded"].includes(String(first.status || ""))) {
        return res.json({
          success: true,
          message: "İlk aşama uygun durumda değil",
          started: false,
        });
      }

      await new Promise((resolve, reject) => {
        Milestone.updateStatus(first.id, "in_progress", (err, _result) => {
          if (err) return reject(err);
          resolve(true);
        });
      });

      const io = req.app.get("io");
      const payload = {
        type: "milestone_status",
        milestone_id: Number(first.id),
        project_id: Number(project_id),
        status: "in_progress",
        amount: first.amount,
        at: new Date().toISOString(),
      };
      if (io) {
        if (client_id)
          io.to(`user:${client_id}`).emit("milestone:status", payload);
        if (freelancer_id)
          io.to(`user:${freelancer_id}`).emit("milestone:status", payload);
        if (freelancer_id)
          io.to(`user:${freelancer_id}`).emit("notification:new", {
            event: "notification:new",
            type: "milestone_started",
            title: "İlk aşama başladı",
            message: `İlk aşama (${first.title}) başlatıldı.`,
            milestone_id: Number(first.id),
            project_id: Number(project_id),
            created_at: new Date().toISOString(),
          });
      }

      await Notification.create({
        user_id: freelancer_id,
        actor_id: client_id,
        type: "milestone",
        title: "İlk aşama başladı",
        message: `İlk aşama (${first.title}) başlatıldı.`,
        priority: "medium",
        action_required: false,
        project_id: Number(project_id),
        milestone_id: Number(first.id),
      });
      */

      return res.json({
        success: true,
        message: "Plan onaylandı. Lütfen ilk aşamayı finanse edin.",
        started: false,
      });
    } catch (err) {
      console.error(
        "POST /api/milestones/projects/:project_id/plan/approve",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Plan onaylanırken hata: " + (err.message || err),
      });
    }
  }
);

// Middleware for attachment download (supports Query Param Token)
const attachmentAuth = (req, res, next) => {
  let token = null;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.slice(7);
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) return res.status(401).send("Yetkilendirme gerekli");

  try {
    const secret = process.env.JWT_SECRET || "dev_secret";
    req.user = jwt.verify(token, secret);
    next();
  } catch (e) {
    return res.status(401).send("Geçersiz token");
  }
};

// Dosya indirme (DB veya Disk)
router.get("/attachments/:id", attachmentAuth, (req, res) => {
  const { id } = req.params;
  Milestone.getAttachmentById(id, (err, rows) => {
    if (err || !rows || rows.length === 0) {
      return res.status(404).send("Dosya bulunamadı");
    }
    const att = rows[0];

    if (att.file_data) {
      res.setHeader(
        "Content-Type",
        att.file_type || "application/octet-stream"
      );
      // Use inline to allow preview in browser/iframe instead of forced download
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(att.file_name)}"`
      );
      res.send(att.file_data);
    } else {
      // Legacy support
      if (!att.file_path || att.file_path === "db:stored") {
        return res.status(404).send("Dosya verisi yok");
      }
      const p = path.join(process.cwd(), att.file_path);
      if (fs.existsSync(p)) {
        res.download(p, att.file_name);
      } else {
        res.status(404).send("Dosya bulunamadı");
      }
    }
  });
});

module.exports = router;
