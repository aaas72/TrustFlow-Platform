const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const ProjectPlan = require("../models/ProjectPlan");
const Project = require("../models/Project");

// Helper: get accepted freelancer and client for project
function getParticipants(project_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT p.id as project_id, p.client_id, b.freelancer_id, b.delivery_time
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

// Helper: get project details
function getProject(project_id) {
  return new Promise((resolve, reject) => {
    Project.getById(project_id, (err, rows) => {
      if (err) return reject(err);
      resolve(rows && rows[0] ? rows[0] : null);
    });
  });
}

// Submit or replace plan (freelancer only)
router.post("/projects/:project_id/plan", requireAuth, async (req, res) => {
  try {
    const { project_id } = req.params;
    const { plan } = req.body; // expected: { summary?, steps: [ { title, description?, amount, estimatedDays?, deliverables? } or string ] }
    if (!project_id || !plan) {
      return res
        .status(400)
        .json({ success: false, message: "Proje kimliği ve plan gereklidir" });
    }
    const participants = await getParticipants(Number(project_id));
    if (!participants || !participants.freelancer_id) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Bu proje için kabul edilmiş freelancer bulunamadı",
        });
    }
    if (
      req.user.user_type !== "freelancer" ||
      req.user.id !== participants.freelancer_id
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Yalnızca kabul edilen freelancer plan gönderebilir",
        });
    }

    // Validate plan dates
    // Logic update: prioritize bid duration (delivery_time) over project deadline
    const project = await getProject(Number(project_id));
    let maxDeadlineDate = null;
    let maxDeadlineSource = "";

    // Parse bid delivery time if available
    let bidDays = 0;
    if (participants.delivery_time) {
      const match = String(participants.delivery_time).match(/\d+/);
      if (match) bidDays = parseInt(match[0], 10);
    }

    const steps = plan.steps || [];

    if (bidDays > 0) {
      // Calculate deadline based on Plan Start Date + Bid Days
      // Find earliest start date in plan
      let earliestStart = null;
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

      // Fallback to project creation/start if no plan start date yet (though unlikely for a plan)
      // or use project.created_at as a very safe base if absolutely nothing else
      const basisDate =
        earliestStart ||
        (project.created_at ? new Date(project.created_at) : new Date());

      // Calculate max date
      const d = new Date(basisDate);
      d.setDate(d.getDate() + bidDays);
      d.setHours(23, 59, 59, 999); // End of that day

      maxDeadlineDate = d;
      maxDeadlineSource = "مدة العرض المتفق عليها";
    } else if (project && project.deadline) {
      // Fallback to project hard deadline
      maxDeadlineDate = new Date(project.deadline);
      maxDeadlineDate.setHours(23, 59, 59, 999);
      maxDeadlineSource = "تاريخ انتهاء المشروع";
    }

    if (maxDeadlineDate && Array.isArray(steps)) {
      for (const step of steps) {
        if (typeof step === "object") {
          const dateFields = ["deadline", "date", "endDate", "end_date"];
          for (const field of dateFields) {
            if (step[field]) {
              const d = new Date(step[field]);
              // Reset hours for fair comparison (ignore time part of input)
              const dCheck = new Date(d);
              dCheck.setHours(0, 0, 0, 0);
              const maxCheck = new Date(maxDeadlineDate);
              maxCheck.setHours(0, 0, 0, 0);

              if (!isNaN(dCheck.getTime()) && dCheck > maxCheck) {
                // Allow a small buffer? No, let's stick to the logic.
                // But wait, if dCheck is same day as maxCheck, it's fine.
                // dCheck > maxCheck handles that correctly (31st > 31st is false).

                return res.status(400).json({
                  success: false,
                  message: `تاريخ خطة المشروع (${d.toLocaleDateString(
                    "tr-TR"
                  )}) لا يمكن أن يتجاوز ${maxDeadlineSource} (${maxDeadlineDate.toLocaleDateString(
                    "tr-TR"
                  )}).`,
                });
              }
            }
          }
        }
      }
    }

    await ProjectPlan.upsert(
      Number(project_id),
      plan,
      req.user.id,
      "submitted"
    );
    return res.json({ success: true, message: "Plan gönderildi" });
  } catch (err) {
    console.error("POST /api/plans/projects/:project_id/plan", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Plan gönderilirken hata: " + (err.message || err),
      });
  }
});

// Get plan for project
router.get("/projects/:project_id/plan", requireAuth, async (req, res) => {
  try {
    const { project_id } = req.params;
    const plan = await ProjectPlan.getByProject(Number(project_id));
    return res.json({ success: true, plan });
  } catch (err) {
    console.error("GET /api/plans/projects/:project_id/plan", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Plan alınırken hata: " + (err.message || err),
      });
  }
});

// Client approves plan
router.post(
  "/projects/:project_id/plan/approve",
  requireAuth,
  async (req, res) => {
    try {
      const { project_id } = req.params;
      const participants = await getParticipants(Number(project_id));
      if (!participants || !participants.client_id) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Bu proje için müşteri bulunamadı",
          });
      }
      if (
        req.user.user_type !== "client" ||
        req.user.id !== participants.client_id
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Yalnızca projenin müşterisi planı onaylayabilir",
          });
      }
      await ProjectPlan.updateStatus(Number(project_id), "approved");
      return res.json({ success: true, message: "Plan onaylandı" });
    } catch (err) {
      console.error("POST /api/plans/projects/:project_id/plan/approve", err);
      return res
        .status(500)
        .json({
          success: false,
          message: "Plan onaylanırken hata: " + (err.message || err),
        });
    }
  }
);

// Client requests revision with reason
router.post(
  "/projects/:project_id/plan/request_revision",
  requireAuth,
  async (req, res) => {
    try {
      const { project_id } = req.params;
      const { note } = req.body;
      const participants = await getParticipants(Number(project_id));
      if (!participants || !participants.client_id) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Bu proje için müşteri bulunamadı",
          });
      }
      if (
        req.user.user_type !== "client" ||
        req.user.id !== participants.client_id
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Yalnızca projenin müşterisi revizyon isteyebilir",
          });
      }
      await ProjectPlan.updateStatus(
        Number(project_id),
        "revision_requested",
        String(note || "")
      );
      return res.json({ success: true, message: "Revizyon istendi" });
    } catch (err) {
      console.error(
        "POST /api/plans/projects/:project_id/plan/request_revision",
        err
      );
      return res
        .status(500)
        .json({
          success: false,
          message: "Revizyon istenirken hata: " + (err.message || err),
        });
    }
  }
);

module.exports = router;
