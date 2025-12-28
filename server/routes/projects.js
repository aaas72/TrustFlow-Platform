const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Bid = require("../models/Bid");
const Skill = require("../models/Skill");
const Payment = require("../models/Payment");
const Milestone = require("../models/Milestone");
const Notification = require("../models/Notification");
const db = require("../config/database");
const { requireAuth } = require("../middleware/auth");

// Yeni proje oluştur
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, budget, deadline, bidding_deadline } = req.body;
    let { skills } = req.body; // Beceri adları dizi veya virgülle ayrılmış metin
    const client_id = req.user.id;

    if (req.user.user_type !== "client") {
      return res
        .status(403)
        .json({ success: false, message: "فقط العملاء يمكنهم إنشاء مشاريع" });
    }

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "العنوان والوصف مطلوبة",
      });
    }

    const project_id = await new Promise((resolve, reject) => {
      Project.create(
        { title, description, budget, deadline, client_id, bidding_deadline },
        (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    });

    let attachedSkills = [];
    let skillErrors = [];
    if (skills) {
      // Normalize to array of tokens/objects
      let items = skills;
      if (typeof items === "string") {
        items = items
          .split(/[,،;|]/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (Array.isArray(items)) {
        const names = [];
        const ids = [];
        for (const it of items) {
          if (typeof it === "number") {
            ids.push(it);
          } else if (typeof it === "string") {
            const nm = it.trim();
            if (nm) names.push(nm);
          } else if (it && typeof it === "object") {
            if (typeof it.id === "number") ids.push(it.id);
            const nm = typeof it.name === "string" ? it.name.trim() : "";
            if (nm) names.push(nm);
          }
        }

        // Yinelenenleri kaldır
        const uniqueNames = Array.from(new Set(names));
        const uniqueIds = Array.from(new Set(ids));

        // Kimliklerle doğrudan ilişkilendir
        for (const sid of uniqueIds) {
          try {
            const link = await Skill.linkToProject(project_id, sid);
            if (link && link.ok) {
              attachedSkills.push({ id: sid });
            } else {
              const reason = "link ignored (duplicate or FK constraint)";
              console.log(
                "Skill id attach warning:",
                reason,
                "skill_id=",
                sid,
                "project_id=",
                project_id
              );
              skillErrors.push({ id: sid, error: reason });
            }
          } catch (e) {
            const msg = e && e.message ? e.message : String(e);
            console.log("Skill id attach error:", msg);
            skillErrors.push({ id: sid, error: msg });
          }
        }

        // Önce adları doğrula sonra ilişkilendir
        for (const name of uniqueNames) {
          try {
            const skillId = await Skill.ensureByName(name);
            if (skillId) {
              const link = await Skill.linkToProject(project_id, skillId);
              if (link && link.ok) {
                attachedSkills.push({ id: skillId, name });
              } else {
                const reason = "link ignored (duplicate or FK constraint)";
                console.log(
                  "Skill name attach warning:",
                  reason,
                  "skill_id=",
                  skillId,
                  "project_id=",
                  project_id
                );
                skillErrors.push({ name, error: reason, skill_id: skillId });
              }
            }
          } catch (e) {
            const msg = e && e.message ? e.message : String(e);
            console.log("Skill name attach error:", msg);
            skillErrors.push({ name, error: msg });
          }
        }
      }
    }

    return res.json({
      success: true,
      message: "Proje başarıyla oluşturuldu!",
      project_id,
      skills: attachedSkills,
      skill_errors: skillErrors,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Sunucu hatası: " + err.message });
  }
});

// Tüm mevcut projeleri göster
router.get("/", (req, res) => {
  Project.getAll((err, results) => {
    if (err) {
      return res.json({
        success: false,
        message: "Sunucu hatası",
      });
    }

    const translatedProjects = results.map((project) => ({
      ...project,
      status: Project.translateStatus(project.status),
    }));
    res.json({
      success: true,
      projects: translatedProjects,
    });
  });
});

// Belirli bir projenin becerileri
router.get("/:id/skills", (req, res) => {
  const { id } = req.params;
  Skill.getByProject(id, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
    res.json({ success: true, skills: rows || [] });
  });
});

// Belirli bir müşterinin projelerini göster
router.get("/client/:client_id", (req, res) => {
  const { client_id } = req.params;
  Project.getByClient(client_id, (err, results) => {
    if (err) {
      return res.json({
        success: false,
        message: "Sunucu hatası",
      });
    }

    // Return raw projects without status translation
    // Frontend expects raw status codes (open_for_bids, in_progress, etc.)
    res.json({
      success: true,
      projects: results,
    });
  });
});

// Freelancer'ın aktif projelerini getir
router.get("/freelancer/active", requireAuth, (req, res) => {
  if (req.user.user_type !== "freelancer") {
    return res
      .status(403)
      .json({ success: false, message: "Sadece freelancerlar erişebilir" });
  }

  const sql = `
    SELECT p.*, u.full_name as client_name, b.amount as bid_amount, 
           (SELECT deadline FROM milestones WHERE project_id = p.id AND status = 'pending' ORDER BY deadline ASC LIMIT 1) as next_milestone_date
    FROM projects p
    JOIN bids b ON b.project_id = p.id
    JOIN users u ON p.client_id = u.id
    WHERE b.freelancer_id = ? 
      AND b.status = 'accepted' 
      AND p.status NOT IN ('completed', 'cancelled')
    ORDER BY p.deadline ASC
  `;

  db.query(sql, [req.user.id], (err, rows) => {
    if (err) {
      console.error("Active projects error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Projeler getirilemedi" });
    }
    res.json({ success: true, projects: rows });
  });
});

// Client'ın aktif projelerini getir
router.get("/client/active", requireAuth, (req, res) => {
  if (req.user.user_type !== "client") {
    return res
      .status(403)
      .json({ success: false, message: "Sadece müşteriler erişebilir" });
  }

  const sql = `
    SELECT p.*, 
           (SELECT COUNT(*) FROM bids WHERE project_id = p.id AND status = 'pending') as pending_bids_count,
           (SELECT deadline FROM milestones WHERE project_id = p.id AND status = 'pending' ORDER BY deadline ASC LIMIT 1) as next_milestone_date
    FROM projects p
    WHERE p.client_id = ? 
      AND p.status IN ('in_progress', 'plan_submitted', 'open')
    ORDER BY p.created_at DESC
  `;

  db.query(sql, [req.user.id], (err, rows) => {
    if (err) {
      console.error("Client active projects error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Projeler getirilemedi" });
    }
    res.json({ success: true, projects: rows });
  });
});

// Belirli bir projeyi ID ile göster
router.get("/:id", (req, res) => {
  const { id } = req.params;
  Project.getById(id, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
    if (!results || results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Proje bulunamadı" });
    }
    res.json({ success: true, project: results[0] });
  });
});

// Not: önceki tam-güncelleme endpointi kaldırıldı.
// Artık kısmi güncelleme desteklenir ve yalnızca gönderilen alanlar güncellenir.

// Projeyi güncelle
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, budget, deadline, status } = req.body;
    let { skills } = req.body;
    const client_id = req.user.id; // استخراج client_id من التوكن

    // التحقق من أن المستخدم المصادق عليه هو عميل
    if (req.user.user_type !== "client") {
      return res
        .status(403)
        .json({ success: false, message: "فقط العملاء يمكنهم تحديث المشاريع" });
    }

    // التحقق من أن العميل هو مالك المشروع
    const project = await new Promise((resolve, reject) => {
      Project.getById(id, (err, results) => {
        if (err) return reject(err);
        resolve(results[0]); // تمرير أول عنصر من المصفوفة (المشروع) أو undefined إذا كانت فارغة
      });
    });

    if (!project || project.client_id !== client_id) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية لتحديث هذا المشروع",
      });
    }

    // تحديث بيانات المشروع: أدرج فقط الحقول المُعرّفة لتجنب الكتابة بـ NULL
    const updateFields = {};
    if (typeof title !== "undefined" && title !== null)
      updateFields.title = title;
    if (typeof description !== "undefined" && description !== null)
      updateFields.description = description;
    if (typeof budget !== "undefined" && budget !== null)
      updateFields.budget = budget;
    if (typeof deadline !== "undefined" && deadline !== null)
      updateFields.deadline = deadline;
    if (typeof status !== "undefined") {
      // Fetch current project status to validate transition
      const currentProject = await new Promise((resolve, reject) => {
        Project.getById(id, (err, results) => {
          if (err) return reject(err);
          resolve(results[0]);
        });
      });

      if (!currentProject) {
        return res
          .status(404)
          .json({ success: false, message: "Proje bulunamadı" });
      }

      const currentStatus = currentProject.status;
      const validStatuses = [
        "open_for_bids",
        "in_progress",
        "completed",
        "cancelled",
      ];

      if (!validStatuses.includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: "Geçersiz proje durumu" });
      }

      // Add logic for valid status transitions if needed
      // For example: cannot go from 'completed' to 'open_for_bids'
      if (currentStatus === "completed" && status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Tamamlanmış bir projenin durumu değiştirilemez",
        });
      }
      // More complex transitions can be added here

      if (status !== null) updateFields.status = status;
    }

    await new Promise((resolve, reject) => {
      Project.updatePartial(id, updateFields, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // تحديث المهارات المرتبطة بالمشروع
    if (skills) {
      await Skill.updateProjectSkills(id, skills);
    }

    // Yanıtı hemen gönder
    res.json({ success: true, message: "Proje başarıyla güncellendi!" });

    // Eğer durum 'completed' olarak güncellendiyse, aşamaları tamamlayıp ödemeleri serbest bırak
    if (typeof status !== "undefined" && status === "completed") {
      (async () => {
        try {
          // Projeye ait tüm aşamaları getir
          const milestones = await new Promise((resolve, reject) => {
            Milestone.getByProject(id, (err, rows) => {
              if (err) return reject(err);
              resolve(rows || []);
            });
          });

          const io = req.app && req.app.get ? req.app.get("io") : null;

          // Ödeme tamamlandı bildirimlerini gönderen yardımcı fonksiyon
          const emitPaymentCompletedNotificationsLocal = async (paymentRow) => {
            try {
              const payment = paymentRow;
              if (!payment) return;

              // Aşamayı getir
              const milestone = await new Promise((resolve) => {
                Milestone.getById(payment.milestone_id, (err, rows) => {
                  if (err) return resolve(null);
                  resolve(rows && rows[0] ? rows[0] : null);
                });
              });
              if (!milestone) return;

              // Katılımcıları (müşteri ve kabul edilen serbest çalışanı) getir
              const participants = await new Promise((resolve) => {
                const sql = `
                  SELECT p.client_id, b.freelancer_id
                  FROM projects p
                  JOIN bids b ON b.project_id = p.id AND b.status = 'accepted'
                  WHERE p.id = ?
                  LIMIT 1
                `;
                db.query(sql, [milestone.project_id], (err, rows) => {
                  if (err) return resolve(null);
                  resolve(rows && rows[0] ? rows[0] : null);
                });
              });
              if (!participants) return;
              const { client_id, freelancer_id } = participants;

              // Bildirimleri oluştur (hataları yut)
              try {
                const notifIdFreelancer = await Notification.create({
                  user_id: freelancer_id,
                  actor_id: client_id,
                  type: "payment_released",
                  title: "Ödeme serbest bırakıldı",
                  message: "Aşama ödemesi hesabınıza aktarıldı",
                  priority: "medium",
                  action_required: false,
                  project_id: milestone.project_id,
                  milestone_id: milestone.id,
                  payment_id: payment.id,
                });
                const notifIdClient = await Notification.create({
                  user_id: client_id,
                  actor_id: freelancer_id,
                  type: "payment_released",
                  title: "Ödeme tamamlandı",
                  message: "Bu aşamanın ödemesi tamamlandı",
                  priority: "low",
                  action_required: false,
                  project_id: milestone.project_id,
                  milestone_id: milestone.id,
                  payment_id: payment.id,
                });
                if (io) {
                  io.to(`user:${freelancer_id}`).emit("notification:new", {
                    id: notifIdFreelancer,
                    type: "payment_released",
                    title: "Ödeme serbest bırakıldı",
                    message: "Aşama ödemesi hesabınıza aktarıldı",
                    priority: "medium",
                    action_required: false,
                    project_id: milestone.project_id,
                    milestone_id: milestone.id,
                    payment_id: payment.id,
                    created_at: new Date().toISOString(),
                  });
                  io.to(`user:${client_id}`).emit("notification:new", {
                    id: notifIdClient,
                    type: "payment_released",
                    title: "Ödeme tamamlandı",
                    message: "Bu aşamanın ödemesi tamamlandı",
                    priority: "low",
                    action_required: false,
                    project_id: milestone.project_id,
                    milestone_id: milestone.id,
                    payment_id: payment.id,
                    created_at: new Date().toISOString(),
                  });
                }
              } catch (_) {}
            } catch (e) {}
          };

          for (const m of milestones) {
            const mId = Number(m.id);

            // Aşama durumunu tamamlandı olarak işaretle
            if (String(m.status || "") !== "completed") {
              await new Promise((resolve, reject) => {
                Milestone.updateStatus(mId, "completed", (err, _r) => {
                  if (err) return reject(err);
                  resolve(true);
                });
              });
            }

            // Ödeme kaydını tamamlanmış hale getir
            const payments = await new Promise((resolve) => {
              Payment.getByMilestone(mId, (err, rows) => {
                if (err) return resolve([]);
                resolve(rows || []);
              });
            });

            let targetPayment = payments && payments[0] ? payments[0] : null;
            if (!targetPayment) {
              await new Promise((resolve, reject) => {
                Payment.create(
                  {
                    milestone_id: mId,
                    amount: m.amount,
                    payment_method: "manual",
                  },
                  (err, result) => {
                    if (err) return reject(err);
                    targetPayment = {
                      id: result.insertId,
                      milestone_id: mId,
                      amount: m.amount,
                    };
                    resolve(true);
                  }
                );
              });
            }

            await new Promise((resolve, reject) => {
              Payment.updateStatus(
                targetPayment.id,
                "completed",
                `auto_release_project_completed:${Date.now()}`,
                (err, _r) => {
                  if (err) return reject(err);
                  resolve(true);
                }
              );
            });

            // Bildirimleri yayınla
            emitPaymentCompletedNotificationsLocal(targetPayment);
          }
        } catch (e) {
          console.error("[Project Completion Cascade] Error:", e && e.message);
        }
      })();
    }

    return; // yanıt gönderildi
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Sunucu hatası: " + err.message });
  }
});

// Projeyi sil
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const client_id = req.user.id; // استخراج client_id من التوكن

    // التحقق من أن المستخدم المصادق عليه هو عميل
    if (req.user.user_type !== "client") {
      return res
        .status(403)
        .json({ success: false, message: "فقط العملاء يمكنهم حذف المشاريع" });
    }

    // التحقق من أن العميل هو مالك المشروع
    const project = await new Promise((resolve, reject) => {
      Project.getById(id, (err, results) => {
        if (err) return reject(err);
        resolve(results[0]); // تمرير أول عنصر من المصفوفة (المشروع) أو undefined إذا كانت فارغة
      });
    });

    if (!project || project.client_id !== client_id) {
      return res
        .status(403)
        .json({ success: false, message: "ليس لديك صلاحية لحذف هذا المشروع" });
    }

    // حذف المشروع
    await new Promise((resolve, reject) => {
      Project.delete(id, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    return res.json({ success: true, message: "Proje başarıyla silindi!" });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        success: false,
        message:
          "Bu projeye bağlı teklifler veya aşamalar olduğu için silinemez.",
      });
    }
    return res
      .status(500)
      .json({ success: false, message: "Sunucu hatası: " + err.message });
  }
});

module.exports = router;
