const db = require("../config/database");

class Project {
  static create(projectData, callback) {
    const {
      title,
      description,
      budget,
      deadline,
      client_id,
      status = "open_for_bids",
      bidding_deadline,
    } = projectData;
    const sql = `INSERT INTO projects (title, description, budget, deadline, client_id, status, bidding_deadline) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(
      sql,
      [
        title,
        description,
        budget,
        deadline,
        client_id,
        status,
        bidding_deadline,
      ],
      callback
    );
  }

  static getAll(callback) {
    const sql = `
            SELECT p.*, u.full_name as client_name 
            FROM projects p 
            JOIN users u ON p.client_id = u.id 
            WHERE p.status = 'open_for_bids'
        `;
    db.query(sql, callback);
  }

  static getById(id, callback) {
    const sql = `
            SELECT p.*, u.full_name as client_name 
            FROM projects p 
            JOIN users u ON p.client_id = u.id 
            WHERE p.id = ?
        `;
    db.query(sql, [id], callback);
  }

  static getByClient(client_id, callback) {
    const sql = `SELECT * FROM projects WHERE client_id = ?`;
    db.query(sql, [client_id], callback);
  }

  static update(id, projectData, callback) {
    const {
      title,
      description,
      budget,
      deadline,
      status,
      bidding_deadline,
      accepted_bid_id,
      freelancer_id,
    } = projectData;
    const sql = `UPDATE projects SET title = ?, description = ?, budget = ?, deadline = ?, status = ?, bidding_deadline = ?, accepted_bid_id = ?, freelancer_id = ? WHERE id = ?`;
    db.query(
      sql,
      [
        title,
        description,
        budget,
        deadline,
        status,
        bidding_deadline,
        accepted_bid_id,
        freelancer_id,
        id,
      ],
      callback
    );
  }

  // Perform a partial update: only update provided fields
  static updatePartial(id, fields, callback) {
    const allowed = [
      "title",
      "description",
      "budget",
      "deadline",
      "status",
      "bidding_deadline",
      "accepted_bid_id",
      "freelancer_id",
    ];
    const setClauses = [];
    const values = [];
    for (const key of allowed) {
      if (
        Object.prototype.hasOwnProperty.call(fields, key) &&
        typeof fields[key] !== "undefined" &&
        fields[key] !== null
      ) {
        setClauses.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (setClauses.length === 0) {
      // nothing to update
      return callback(null, { affectedRows: 0, message: "No fields provided" });
    }
    const sql = `UPDATE projects SET ${setClauses.join(", ")} WHERE id = ?`;
    values.push(id);
    db.query(sql, values, callback);
  }

  static delete(id, callback) {
    const sql = `DELETE FROM projects WHERE id = ?`;
    db.query(sql, [id], callback);
  }

  static translateStatus(status) {
    switch (status) {
      case 'open_for_bids':
        return 'Tekliflere Açık';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      case 'pending_acceptance':
        return 'Onay Bekliyor';
      default:
        return status; // Return original status if no translation is found
    }
  }
}

module.exports = Project;
