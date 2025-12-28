const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../middleware/auth');

// Yalnızca izinli alanlar için güvenli UPDATE sorgusu oluşturma yardımcıları
function buildUpdate(table, allowedFields, id, body) {
  const fields = [];
  const params = [];
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      fields.push(`${key} = ?`);
      params.push(body[key]);
    }
  }
  if (fields.length === 0) return null;
  const sql = `UPDATE ${table} SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);
  return { sql, params };
}

// Kullanıcı güncelle
router.patch('/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const allowed = ['full_name', 'email', 'user_type', 'password'];
  const payload = { ...(req.body || {}) };
  if (payload.password) {
    try {
      const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
      const salt = bcrypt.genSaltSync(rounds);
      payload.password = bcrypt.hashSync(payload.password, salt);
    } catch (_) {}
  }
  const update = buildUpdate('users', allowed, id, payload);
  if (!update) return res.status(400).json({ success: false, message: 'Güncelleme için geçerli alan yok' });
  db.query(update.sql, update.params, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Güncelleme hatası: ' + err.message });
    res.json({ success: true, message: 'Kullanıcı güncellendi', affected: result.affectedRows });
  });
});

// Proje güncelle
router.patch('/projects/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const allowed = ['title', 'description', 'budget', 'deadline', 'status', 'client_id'];
  const update = buildUpdate('projects', allowed, id, req.body || {});
  if (!update) return res.status(400).json({ success: false, message: 'Güncelleme için geçerli alan yok' });
  db.query(update.sql, update.params, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Güncelleme hatası: ' + err.message });
    res.json({ success: true, message: 'Proje güncellendi', affected: result.affectedRows });
  });
});

// Teklif güncelle
router.patch('/bids/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const allowed = ['amount', 'proposal', 'delivery_time', 'status', 'freelancer_id', 'project_id'];
  const update = buildUpdate('bids', allowed, id, req.body || {});
  if (!update) return res.status(400).json({ success: false, message: 'Güncelleme için geçerli alan yok' });
  db.query(update.sql, update.params, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Güncelleme hatası: ' + err.message });
    res.json({ success: true, message: 'Teklif güncellendi', affected: result.affectedRows });
  });
});

// Aşama güncelle
router.patch('/milestones/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const allowed = ['title', 'description', 'amount', 'deadline', 'status', 'project_id'];
  const update = buildUpdate('milestones', allowed, id, req.body || {});
  if (!update) return res.status(400).json({ success: false, message: 'Güncelleme için geçerli alan yok' });
  db.query(update.sql, update.params, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Güncelleme hatası: ' + err.message });
    res.json({ success: true, message: 'Aşama güncellendi', affected: result.affectedRows });
  });
});

// Ödeme güncelle
router.patch('/payments/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const allowed = ['amount', 'payment_method', 'status', 'transaction_id', 'milestone_id'];
  const update = buildUpdate('payments', allowed, id, req.body || {});
  if (!update) return res.status(400).json({ success: false, message: 'Güncelleme için geçerli alan yok' });
  db.query(update.sql, update.params, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Güncelleme hatası: ' + err.message });
    res.json({ success: true, message: 'Ödeme güncellendi', affected: result.affectedRows });
  });
});

module.exports = router;