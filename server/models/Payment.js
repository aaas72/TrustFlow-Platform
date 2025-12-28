const db = require("../config/database");

class Payment {
  static create(paymentData) {
    return new Promise((resolve, reject) => {
      const { milestone_id, amount, payment_method, transaction_id, status } =
        paymentData;
      const sql = `INSERT INTO payments (milestone_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?)`;
      // Default status to 'pending' if not provided
      const paymentStatus = status || "pending";

      db.query(
        sql,
        [milestone_id, amount, payment_method, transaction_id, paymentStatus],
        (err, result) => {
          if (err) reject(err);
          else resolve(result.insertId);
        }
      );
    });
  }

  static updateStatus(id, status, transaction_id) {
    return new Promise((resolve, reject) => {
      let sql;

      if (status === "completed") {
        sql = `UPDATE payments SET status = ?, transaction_id = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?`;
      } else if (status === "released") {
        sql = `UPDATE payments SET status = ?, released_at = CURRENT_TIMESTAMP WHERE id = ?`;
      } else {
        sql = `UPDATE payments SET status = ?, transaction_id = ? WHERE id = ?`;
      }

      // For 'released' status, transaction_id might not be updated here if it was set during funding
      // But if we want to support passing transaction_id (e.g. null or new one), we can keep the structure
      // If status is 'released', we might not be passing a new transaction_id, but let's handle arguments flexibly.

      const params =
        status === "released" ? [status, id] : [status, transaction_id, id];

      if (status === "released") {
        // If we are just releasing, we don't necessarily change the transaction_id unless needed.
        // But let's check if the original code expects 3 params.
        // The original code:
        // sql = `UPDATE payments SET status = ?, transaction_id = ? WHERE id = ?`;
        // db.query(sql, [status, transaction_id, id]...

        // Let's stick to the pattern but make transaction_id optional for 'released' if we want.
        // Actually, for simplicity, let's just use a dynamic query construction.
        sql = `UPDATE payments SET status = ?, released_at = CURRENT_TIMESTAMP WHERE id = ?`;
        db.query(sql, [status, id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
        return;
      }

      db.query(sql, [status, transaction_id, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  static getByMilestone(milestone_id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM payments WHERE milestone_id = ?`;
      db.query(sql, [milestone_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = Payment;
