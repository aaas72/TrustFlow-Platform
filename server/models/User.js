const db = require('../config/database');

class User {
    static create(userData, callback) {
        const { full_name, email, password, user_type } = userData;
        const sql = `INSERT INTO users (full_name, email, password, user_type) VALUES (?, ?, ?, ?)`;
        db.query(sql, [full_name, email, password, user_type], callback);
    }

    static findByEmail(email, callback) {
        const sql = `SELECT * FROM users WHERE email = ?`;
        db.query(sql, [email], callback);
    }

    static getAll(callback) {
        const sql = `SELECT id, full_name, email, user_type, created_at FROM users`;
        db.query(sql, callback);
    }
}

module.exports = User;