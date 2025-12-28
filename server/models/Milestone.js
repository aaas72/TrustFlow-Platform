const db = require("../config/database");

class Milestone {
  static create(milestoneData, callback) {
    const { project_id, title, description, amount, deadline } = milestoneData;
    const sql = `INSERT INTO milestones (project_id, title, description, amount, deadline) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [project_id, title, description, amount, deadline], callback);
  }

  static getByProject(project_id, callback) {
    const sql = `SELECT * FROM milestones WHERE project_id = ? ORDER BY created_at ASC, id ASC`;
    db.query(sql, [project_id], callback);
  }

  static getById(id, callback) {
    const sql = `SELECT * FROM milestones WHERE id = ?`;
    db.query(sql, [id], callback);
  }

  static updateStatus(id, status, review_notes, callback) {
    let sql, params;

    // If callback is passed as the 3rd argument (legacy support)
    if (typeof review_notes === "function") {
      callback = review_notes;
      review_notes = null;
    }

    // Ensure review_notes is null if undefined
    review_notes = review_notes || null;

    if (status === "submitted") {
      sql = `UPDATE milestones SET status = ?, submitted_at = CURRENT_TIMESTAMP, review_notes = ? WHERE id = ?`;
      params = [status, review_notes, id];
    } else if (status === "approved") {
      sql = `UPDATE milestones SET status = ?, approved_at = CURRENT_TIMESTAMP, review_notes = ? WHERE id = ?`;
      params = [status, review_notes, id];
    } else {
      sql = `UPDATE milestones SET status = ?, review_notes = ? WHERE id = ?`;
      params = [status, review_notes, id];
    }

    db.query(sql, params, callback);
  }

  static addAttachment(attachmentData, callback) {
    const { milestone_id, file_name, file_path, file_type, file_data } =
      attachmentData;
    const sql = `INSERT INTO milestone_attachments (milestone_id, file_name, file_path, file_type, file_data) VALUES (?, ?, ?, ?, ?)`;
    db.query(
      sql,
      [milestone_id, file_name, file_path, file_type, file_data],
      callback
    );
  }

  static getAttachments(milestone_id, callback) {
    const sql = `SELECT id, milestone_id, file_name, file_path, file_type FROM milestone_attachments WHERE milestone_id = ?`;
    db.query(sql, [milestone_id], callback);
  }

  static getAttachmentById(id, callback) {
    const sql = `SELECT * FROM milestone_attachments WHERE id = ?`;
    db.query(sql, [id], callback);
  }

  static findByProjectAndTitle(project_id, title, callback) {
    const sql = `SELECT * FROM milestones WHERE project_id = ? AND title = ?`;
    db.query(sql, [project_id, title], callback);
  }

  static hasUnapprovedMilestones(project_id, callback) {
    const sql = `SELECT COUNT(*) AS count FROM milestones WHERE project_id = ? AND status != 'approved'`;
    db.query(sql, [project_id], (err, result) => {
      if (err) return callback(err);
      callback(null, result[0].count > 0);
    });
  }

  static getTotalAmountByProject(project_id, callback) {
    const sql = `SELECT SUM(amount) as total FROM milestones WHERE project_id = ?`;
    db.query(sql, [project_id], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0].total || 0);
    });
  }
}

module.exports = Milestone;
