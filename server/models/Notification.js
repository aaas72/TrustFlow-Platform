const db = require("../config/database");

class Notification {
  static create(payload) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO notifications (
          user_id, actor_id, type, title, message, priority, action_required, is_read, read_at,
          project_id, milestone_id, bid_id, payment_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?, ?, ?)
      `;
      const params = [
        payload.user_id,
        payload.actor_id || null,
        payload.type,
        payload.title || "",
        payload.message || null,
        payload.priority || "medium",
        payload.action_required ? 1 : 0,
        payload.project_id || null,
        payload.milestone_id || null,
        payload.bid_id || null,
        payload.payment_id || null,
      ];
      db.query(sql, params, (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });
  }

  static countUnread(user_id) {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0";
      db.query(sql, [user_id], (err, rows) => {
        if (err) return reject(err);
        const cnt = rows && rows[0] ? Number(rows[0].cnt) : 0;
        resolve(cnt);
      });
    });
  }

  static listByUser(
    user_id,
    { unreadOnly = false, limit = 50, offset = 0 } = {}
  ) {
    return new Promise((resolve, reject) => {
      let sql = "SELECT * FROM notifications WHERE user_id = ?";
      const params = [user_id];
      if (unreadOnly) {
        sql += " AND is_read = 0";
      }
      sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
      params.push(Number(limit), Number(offset));
      db.query(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  static markRead(id, user_id) {
    return new Promise((resolve, reject) => {
      const sql =
        "UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?";
      db.query(sql, [id, user_id], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }

  static markAllRead(user_id) {
    return new Promise((resolve, reject) => {
      const sql =
        "UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = 0";
      db.query(sql, [user_id], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows);
      });
    });
  }

  static delete(id, user_id) {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM notifications WHERE id = ? AND user_id = ?";
      db.query(sql, [id, user_id], (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      });
    });
  }
}

module.exports = Notification;
