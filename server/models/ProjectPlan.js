const db = require("../config/database");

class ProjectPlan {
  static upsert(project_id, plan_json, submitted_by, status = "submitted") {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO project_plans (project_id, plan_json, status, submitted_by)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE plan_json = VALUES(plan_json), status = VALUES(status), submitted_by = VALUES(submitted_by), updated_at = NOW()
      `;
      db.query(
        sql,
        [project_id, JSON.stringify(plan_json || {}), status, submitted_by],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });
  }

  static getByProject(project_id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM project_plans WHERE project_id = ? LIMIT 1`;
      db.query(sql, [project_id], (err, rows) => {
        if (err) return reject(err);
        const plan = rows && rows[0] ? rows[0] : null;
        if (plan && typeof plan.plan_json === "string") {
          try {
            plan.plan_json = JSON.parse(plan.plan_json);
          } catch (_) {
            // leave as string if parsing fails
          }
        }
        resolve(plan);
      });
    });
  }

  static updateStatus(project_id, status, review_note = null) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE project_plans SET status = ?, review_note = ?, updated_at = NOW() WHERE project_id = ?`;
      db.query(sql, [status, review_note, project_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  static allowedTitlesFromPlan(plan) {
    const steps = plan?.plan_json?.steps || [];
    if (!Array.isArray(steps)) return [];
    return steps.map((s) => (typeof s === "string" ? s : String(s.title || "").trim())).filter(Boolean);
  }
}

module.exports = ProjectPlan;

