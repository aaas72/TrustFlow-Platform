const db = require('../config/database');

class Transaction {
    static create(transactionData) {
        return new Promise((resolve, reject) => {
            const { user_id, amount, type, description, reference_type, reference_id } = transactionData;
            const sql = `
                INSERT INTO transactions 
                (user_id, amount, type, description, reference_type, reference_id, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;
            
            db.query(sql, [user_id, amount, type, description, reference_type, reference_id], (err, result) => {
                if (err) reject(err);
                else resolve(result.insertId);
            });
        });
    }

    static getByUserId(user_id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC`;
            db.query(sql, [user_id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = Transaction;
