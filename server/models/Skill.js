const db = require('../config/database');

class Skill {
  static create(name, callback) {
    const sql = `INSERT INTO skills (name) VALUES (?)`;
    db.query(sql, [name], callback);
  }

  static findByName(name, callback) {
    const sql = `SELECT * FROM skills WHERE name = ? LIMIT 1`;
    db.query(sql, [name], callback);
  }
  
  // Beceri mevcut değilse oluştur ve kimliğini döndür; UNIQUE(name) ile MySQL upsert yaklaşımı
  static ensureByName(name) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO skills (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`;
      db.query(sql, [name], (err, result) => {
        if (err) return reject(err);
        const id = result && result.insertId ? result.insertId : null;
        if (id) return resolve(id);
        // Yedek: kimliği getir
        Skill.findByName(name, (fErr, rows) => {
          if (fErr) return reject(fErr);
          resolve(rows && rows[0] ? rows[0].id : null);
        });
      });
    });
  }

  static linkToProject(project_id, skill_id) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT IGNORE INTO project_skills (project_id, skill_id) VALUES (?, ?)`;
      db.query(sql, [project_id, skill_id], (err, result) => {
        if (err) return reject(err);
        // Etkilenen satır sayısına göre açık bir başarı değeri döndür
        const ok = !!(result && result.affectedRows && result.affectedRows > 0);
        resolve({ ok, result });
      });
    });
  }

  static getByProject(project_id, callback) {
    const sql = `
      SELECT s.id, s.name
      FROM project_skills ps
      INNER JOIN skills s ON s.id = ps.skill_id
      WHERE ps.project_id = ?
      ORDER BY s.name ASC
    `;
    db.query(sql, [project_id], callback);
  }

  static async updateProjectSkills(project_id, newSkills) {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. حذف جميع المهارات القديمة للمشروع
        const deleteSql = `DELETE FROM project_skills WHERE project_id = ?`;
        await new Promise((res, rej) => db.query(deleteSql, [project_id], (err) => err ? rej(err) : res()));

        // 2. إضافة المهارات الجديدة
        if (newSkills && newSkills.length > 0) {
          for (const skillName of newSkills) {
            const skillId = await Skill.ensureByName(skillName);
            if (skillId) {
              await Skill.linkToProject(project_id, skillId);
            }
          }
        }
        resolve({ success: true });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = Skill;