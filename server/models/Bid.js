const db = require("../config/database");

class Bid {
  static create(bidData) {
    return new Promise((resolve, reject) => {
      const { project_id, freelancer_id, amount, proposal, delivery_time } = bidData;
      // Align with table schema: use proposal and delivery_time
      const sql = `INSERT INTO bids (project_id, freelancer_id, amount, proposal, delivery_time) VALUES (?, ?, ?, ?, ?)`;
      db.query(sql, [project_id, freelancer_id, amount, proposal, delivery_time || null], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  static findByProjectId(project_id, callback) {
    const sql = `
            SELECT b.*, u.full_name as freelancer_name
            FROM bids b
            JOIN users u ON b.freelancer_id = u.id
            WHERE b.project_id = ?
            ORDER BY b.created_at DESC
        `;
    db.query(sql, [project_id], callback);
  }

  static findById(id, callback) {
    const sql = `SELECT * FROM bids WHERE id = ?`;
    db.query(sql, [id], callback);
  }

  static updateStatus(id, status, callback) {
    const sql = `UPDATE bids SET status = ? WHERE id = ?`;
    db.query(sql, [status, id], callback);
  }

  static findByProjectAndFreelancer(project_id, freelancer_id, callback) {
    const sql = `SELECT * FROM bids WHERE project_id = ? AND freelancer_id = ?`;
    db.query(sql, [project_id, freelancer_id], callback);
  }

  // List bids for a specific freelancer
  static getByFreelancer(freelancer_id, callback) {
    const sql = `
      SELECT b.*, p.title AS project_title
      FROM bids b
      JOIN projects p ON b.project_id = p.id
      WHERE b.freelancer_id = ?
      ORDER BY b.created_at DESC
    `;
    db.query(sql, [freelancer_id], callback);
  }
}

module.exports = Bid;
