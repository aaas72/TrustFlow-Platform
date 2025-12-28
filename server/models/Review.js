const db = require('../config/database');

class Review {
    static create(data, callback) {
        const { project_id, reviewer_id, reviewee_id, rating, comment } = data;
        const sql = `INSERT INTO reviews (project_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)`;
        db.query(sql, [project_id, reviewer_id, reviewee_id, rating, comment || null], callback);
    }

    static getByProject(project_id, callback) {
        const sql = `
            SELECT r.*, ru.full_name AS reviewer_name, uu.full_name AS reviewee_name
            FROM reviews r
            JOIN users ru ON r.reviewer_id = ru.id
            JOIN users uu ON r.reviewee_id = uu.id
            WHERE r.project_id = ?
            ORDER BY r.created_at DESC
        `;
        db.query(sql, [project_id], callback);
    }

    static getByUser(user_id, callback) {
        const sql = `
            SELECT r.*, p.title AS project_title, ru.full_name AS reviewer_name
            FROM reviews r
            JOIN projects p ON r.project_id = p.id
            JOIN users ru ON r.reviewer_id = ru.id
            WHERE r.reviewee_id = ?
            ORDER BY r.created_at DESC
        `;
        db.query(sql, [user_id], callback);
    }

    static existsForUserAndProject(project_id, reviewer_id, callback) {
        const sql = `SELECT id FROM reviews WHERE project_id = ? AND reviewer_id = ? LIMIT 1`;
        db.query(sql, [project_id, reviewer_id], callback);
    }
}

module.exports = Review;