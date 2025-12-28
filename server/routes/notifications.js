const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Notification = require('../models/Notification');

// Mevcut kullanıcı için bildirimleri listele
router.get('/', requireAuth, async (req, res) => {
  try {
    const unreadOnly = String(req.query.unread || '').trim() === '1';
    const limit = Number(req.query.limit || 50);
    const offset = Number(req.query.offset || 0);
    const rows = await Notification.listByUser(req.user.id, { unreadOnly, limit, offset });
    res.json({ success: true, notifications: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Bildirimler getirilemedi', error: String(err && err.message || err) });
  }
});

// Okunmamış bildirim sayısı
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const count = await Notification.countUnread(req.user.id);
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Okunmamış bildirim sayısı getirilemedi', error: String(err && err.message || err) });
  }
});

// Tek bir bildirimi okundu olarak işaretle
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ok = await Notification.markRead(id, req.user.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Bildirim mevcut değil' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Bildirim güncelleme hatası', error: String(err && err.message || err) });
  }
});

// Tüm bildirimleri okundu olarak işaretle
router.put('/read-all', requireAuth, async (req, res) => {
  try {
    const count = await Notification.markAllRead(req.user.id);
    res.json({ success: true, updated: count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Bildirimleri okunmuş olarak işaretlerken hata', error: String(err && err.message || err) });
  }
});

// Bildirimi sil
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ok = await Notification.delete(id, req.user.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Bildirim bulunamadı veya silinemedi' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Bildirim silme hatası', error: String(err && err.message || err) });
  }
});

module.exports = router;

