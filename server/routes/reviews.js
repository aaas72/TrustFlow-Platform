const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Review = require('../models/Review');
const db = require('../config/database');
const Notification = require('../models/Notification');

// Proje tamamlandıktan sonra değerlendirme oluştur
router.post('/', requireAuth, (req, res) => {
  const { project_id, rating, comment } = req.body;
  const reviewer_id = req.user && req.user.id;

  const r = Number(rating);
  if (!project_id || !reviewer_id || !Number.isFinite(r) || r < 1 || r > 5) {
    return res.status(400).json({ success: false, message: 'project_id ve 1 ile 5 arasında bir değerlendirme gereklidir' });
  }

  // Projenin tamamlandığını ve değerlendiricinin proje taraflarından biri olduğunu doğrula
  const projectSql = 'SELECT * FROM projects WHERE id = ? LIMIT 1';
  db.query(projectSql, [project_id], (pErr, pRows) => {
    if (pErr) return res.status(500).json({ success: false, message: 'Proje alma hatası' });
    if (!pRows || pRows.length === 0) return res.status(404).json({ success: false, message: 'Proje mevcut değil' });
    const project = pRows[0];

    if (String(project.status || '').toLowerCase() !== 'completed') {
      return res.status(400).json({ success: false, message: 'Proje tamamlanmadan değerlendirme yapılamaz' });
    }

    // Kabul edilen teklifi getirerek serbest çalışanı belirle
    const acceptedSql = 'SELECT * FROM bids WHERE project_id = ? AND status = "accepted" LIMIT 1';
    db.query(acceptedSql, [project_id], (bErr, bRows) => {
      if (bErr) return res.status(500).json({ success: false, message: 'Kabul edilmiş teklif doğrulama hatası' });
      if (!bRows || bRows.length === 0) return res.status(400).json({ success: false, message: 'Proje için serbest çalışan belirlenmemiş' });
      const acceptedBid = bRows[0];

      // Değerlendiricinin proje müşterisi veya kabul edilen serbest çalışan olduğundan emin ol
      const isClient = reviewer_id === project.client_id;
      const isFreelancer = reviewer_id === acceptedBid.freelancer_id;
      if (!isClient && !isFreelancer) {
        return res.status(403).json({ success: false, message: 'İzin yok: yalnızca müşteri veya serbest çalışan değerlendirebilir' });
      }

      const reviewee_id = isClient ? acceptedBid.freelancer_id : project.client_id;

      // Aynı kullanıcının aynı proje için tekrarlı değerlendirmesini engelle
      Review.existsForUserAndProject(project_id, reviewer_id, (eErr, eRows) => {
        if (eErr) return res.status(500).json({ success: false, message: 'Önceki değerlendirme doğrulama hatası' });
        if (eRows && eRows.length > 0) return res.status(409).json({ success: false, message: 'Bu projeyi daha önce değerlendirdiniz' });

        Review.create({ project_id, reviewer_id, reviewee_id, rating: r, comment }, async (cErr, result) => {
          if (cErr) return res.status(500).json({ success: false, message: 'Değerlendirme oluşturma hatası: ' + cErr.message });
          // Alıcı (reviewee) için bildirim
          try {
            await Notification.create({
              user_id: reviewee_id,
              actor_id: reviewer_id,
              type: 'review_received',
              title: 'Yeni bir değerlendirme alındı',
              message: 'Proje için yeni bir inceleme aldınız',
              priority: 'low',
              action_required: false,
              project_id,
              review_id: result.insertId
            });
            const io = req.app.get && req.app.get('io');
            if (io) {
              io.to(`user:${reviewee_id}`).emit('notification:new', { type: 'review_received', title: 'Yeni bir değerlendirme alındı', message: 'Proje için yeni bir inceleme aldınız' });
            }
          } catch (e) {}
          return res.status(201).json({ success: true, message: 'Değerlendirme oluşturuldu', review_id: result.insertId });
        });
      });
    });
  });
});

// Bir projenin değerlendirmelerini göster
router.get('/project/:project_id', (req, res) => {
  const { project_id } = req.params;
  Review.getByProject(project_id, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Sunucu hatası' });
    res.json({ success: true, reviews: rows });
  });
});

// Bir kullanıcının değerlendirmelerini göster
router.get('/user/:user_id', (req, res) => {
  const { user_id } = req.params;
  Review.getByUser(user_id, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Sunucu hatası' });
    res.json({ success: true, reviews: rows });
  });
});

module.exports = router;