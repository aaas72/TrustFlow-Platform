const db = require("../config/database");
const Milestone = require("../models/Milestone");
const Notification = require("../models/Notification");
const Payment = require("../models/Payment");
const Transaction = require("../models/Transaction");

// Helper: fire-and-forget notifications when a payment is completed
async function emitPaymentCompletedNotifications(paymentId, app) {
  try {
    const io = app && app.get ? app.get("io") : null;
    // Fetch payment
    const [pRows] = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM payments WHERE id = ? LIMIT 1",
        [paymentId],
        (err, rows) => {
          if (err) return reject(err);
          resolve([rows]);
        }
      );
    });
    const payment = pRows && pRows[0] ? pRows[0] : null;
    if (!payment) return;

    // Fetch milestone
    const milestone = await new Promise((resolve) => {
      Milestone.getById(payment.milestone_id, (err, rows) => {
        if (err) return resolve(null);
        resolve(rows && rows[0] ? rows[0] : null);
      });
    });
    if (!milestone) return;

    // Fetch participants (client and accepted freelancer)
    const participants = await new Promise((resolve) => {
      const sql = `
        SELECT p.client_id, b.freelancer_id
        FROM projects p
        JOIN bids b ON b.project_id = p.id AND b.status = 'accepted'
        WHERE p.id = ?
        LIMIT 1
      `;
      db.query(sql, [milestone.project_id], (err, rows) => {
        if (err) return resolve(null);
        resolve(rows && rows[0] ? rows[0] : null);
      });
    });
    if (!participants) return;

    const { client_id, freelancer_id } = participants;

    // Create notifications (ignore errors)
    try {
      const notifIdFreelancer = await Notification.create({
        user_id: freelancer_id,
        actor_id: client_id,
        type: "payment_released",
        title: "Ödeme serbest bırakıldı",
        message: "Aşama ödemesi hesabınıza aktarıldı",
        priority: "medium",
        action_required: false,
        project_id: milestone.project_id,
        milestone_id: milestone.id,
        payment_id: payment.id,
      });
      const notifIdClient = await Notification.create({
        user_id: client_id,
        actor_id: freelancer_id,
        type: "payment_released",
        title: "Ödeme tamamlandı",
        message: "Bu aşamanın ödemesi tamamlandı",
        priority: "low",
        action_required: false,
        project_id: milestone.project_id,
        milestone_id: milestone.id,
        payment_id: payment.id,
      });
      if (io) {
        io.to(`user:${freelancer_id}`).emit("notification:new", {
          id: notifIdFreelancer,
          type: "payment_released",
          title: "Ödeme serbest bırakıldı",
          message: "Aşama ödemesi hesabınıza aktarıldı",
          priority: "medium",
          action_required: false,
          project_id: milestone.project_id,
          milestone_id: milestone.id,
          payment_id: payment.id,
          created_at: new Date().toISOString(),
        });
        io.to(`user:${client_id}`).emit("notification:new", {
          id: notifIdClient,
          type: "payment_released",
          title: "Ödeme tamamlandı",
          message: "Bu aşamanın ödemesi tamamlandı",
          priority: "low",
          action_required: false,
          project_id: milestone.project_id,
          milestone_id: milestone.id,
          payment_id: payment.id,
          created_at: new Date().toISOString(),
        });
      }
    } catch (_) {
      // swallow notification errors
    }
  } catch (e) {
    // swallow outer errors to avoid blocking HTTP response
  }
}

// Helper: Release funds for a milestone
async function releaseMilestoneFunds(milestoneId, app) {
  try {
    // 1. Find 'held' payment for this milestone
    const payment = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM payments WHERE milestone_id = ? AND status = 'held' LIMIT 1",
        [milestoneId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows[0]);
        }
      );
    });

    if (!payment) {
      console.log(`No held payment found for milestone ${milestoneId}`);
      return false;
    }

    const amount = parseFloat(payment.amount);
    const commissionRate = 0.05;
    const platformFee = amount * commissionRate;
    const freelancerAmount = amount - platformFee;

    // 2. Get participants
     const milestone = await new Promise((resolve) => {
      Milestone.getById(milestoneId, (err, rows) => {
        if (err) return resolve(null);
        resolve(rows && rows[0] ? rows[0] : null);
      });
    });
    if (!milestone) return false;

    const participants = await new Promise((resolve) => {
      const sql = `
        SELECT p.client_id, b.freelancer_id
        FROM projects p
        JOIN bids b ON b.project_id = p.id AND b.status = 'accepted'
        WHERE p.id = ?
        LIMIT 1
      `;
      db.query(sql, [milestone.project_id], (err, rows) => {
        if (err) return resolve(null);
        resolve(rows && rows[0] ? rows[0] : null);
      });
    });

    if (!participants) return false;
    const { freelancer_id } = participants;

    // 3. Update Payment to 'released'
    await Payment.updateStatus(payment.id, 'released');

    // 4. Create Transactions
    // Credit Freelancer
    await Transaction.create({
      user_id: freelancer_id,
      amount: freelancerAmount,
      type: 'payment',
      description: `Payment released for milestone: ${milestone.title}`,
      reference_type: 'milestone',
      reference_id: milestoneId,
      status: 'completed'
    });

    // Credit Platform (Fee) - We assign this to a system user or just log it. 
    // Since we don't have a system user ID, we might skip 'user_id' or use 0/1 if exists.
    // For now, we only track user balances. 
    // Maybe we record the fee as a separate transaction type or just implicit.
    // Let's create a record for the fee but with user_id = 0 (System) if possible, or skip if foreign key constraints exist.
    // Assuming we only care about user balances for now.

    console.log(`Funds released for milestone ${milestoneId}: ${freelancerAmount} to freelancer ${freelancer_id}`);
    
    // Emit notifications
    // We can reuse emitPaymentCompletedNotifications or create new ones.
    await emitPaymentCompletedNotifications(payment.id, app);

    return true;

  } catch (err) {
    console.error(`Error releasing funds for milestone ${milestoneId}:`, err);
    return false;
  }
}

module.exports = {
  emitPaymentCompletedNotifications,
  releaseMilestoneFunds
};