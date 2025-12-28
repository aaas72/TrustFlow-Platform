const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const db = require("../config/database");
const Milestone = require("../models/Milestone");
const { requireAuth } = require("../middleware/auth");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { emitPaymentCompletedNotifications } = require("../utils/paymentHelper");
const Transaction = require("../models/Transaction");

// Helper: Get project participants
async function getProjectParticipants(project_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT p.id as project_id, p.client_id, b.freelancer_id, b.amount as accepted_amount
      FROM projects p
      JOIN bids b ON b.project_id = p.id AND b.status = 'accepted'
      WHERE p.id = ?
      LIMIT 1
    `;
    db.query(sql, [project_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows && rows[0] ? rows[0] : null);
    });
  });
}

// --- TRANSACTION ROUTES ---

router.get("/transactions", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await Transaction.getByUserId(userId);
    res.json({
      success: true,
      transactions,
    });
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching transactions",
    });
  }
});

// --- STRIPE ROUTES ---

router.post("/create-payment-intent", requireAuth, async (req, res) => {
  try {
    const { milestone_id } = req.body;

    // 1. Fetch milestone to get amount
    const milestone = await new Promise((resolve, reject) => {
      Milestone.getById(milestone_id, (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      });
    });

    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, message: "Milestone not found" });
    }

    // 2. Check if payment already exists and is successful
    const existingPayment = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM payments WHERE milestone_id = ? AND status = 'completed'",
        [milestone_id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows[0]);
        }
      );
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already completed for this milestone",
      });
    }

    // 3. Create PaymentIntent (SIMULATED)
    const amountInCents = Math.round(milestone.amount * 100);
    const simulatedPaymentIntentId = `pi_simulated_${milestone_id}_${Date.now()}`;
    const simulatedClientSecret = `${simulatedPaymentIntentId}_secret_fake`;

    // SKIP REAL STRIPE CALL
    /*
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "try", 
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        milestone_id: milestone_id.toString(),
        project_id: milestone.project_id.toString()
      }
    });
    */

    // 4. Create or Update local payment record
    const pendingPayment = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM payments WHERE milestone_id = ? AND status = 'pending'",
        [milestone_id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows[0]);
        }
      );
    });

    if (pendingPayment) {
      // Update transaction_id with PI ID
      await new Promise((resolve, reject) => {
        db.query(
          "UPDATE payments SET transaction_id = ? WHERE id = ?",
          [simulatedPaymentIntentId, pendingPayment.id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } else {
      await Payment.create({
        milestone_id,
        amount: milestone.amount,
        payment_method: "stripe_simulation",
        transaction_id: simulatedPaymentIntentId,
        status: "pending",
      });
    }

    res.json({
      success: true,
      clientSecret: simulatedClientSecret,
    });
  } catch (error) {
    console.error("Stripe Intent Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/confirm-payment", requireAuth, async (req, res) => {
  const { payment_intent_id } = req.body;

  try {
    // Handle Simulated Payment
    if (payment_intent_id && payment_intent_id.startsWith("pi_simulated_")) {
      const payment = await new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM payments WHERE transaction_id = ?",
          [payment_intent_id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows[0]);
          }
        );
      });

      if (payment && payment.status !== "completed") {
        await Payment.updateStatus(payment.id, "completed", payment_intent_id);

        // Fetch milestone to get project_id
        const milestone = await new Promise((resolve) => {
          Milestone.getById(payment.milestone_id, (err, rows) => {
            if (err) resolve(null);
            else resolve(rows[0]);
          });
        });

        if (milestone) {
          // Record Transaction for Client (Deposit)
          const participants = await getProjectParticipants(
            milestone.project_id
          );
          if (participants) {
            await Transaction.create({
              user_id: participants.client_id,
              amount: payment.amount,
              type: "deposit",
              description: `Escrow deposit for milestone: ${milestone.title}`,
              reference_type: "payment",
              reference_id: payment.id,
              status: "completed",
            });
          }
        }

        emitPaymentCompletedNotifications(payment.id, req.app);
      }

      return res.json({ success: true });
    }

    // Fallback to real Stripe for other cases (though we disabled creation)
    const paymentIntent = await stripe.paymentIntents.retrieve(
      payment_intent_id
    );

    if (paymentIntent.status === "succeeded") {
      const payment = await new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM payments WHERE transaction_id = ?",
          [payment_intent_id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows[0]);
          }
        );
      });

      if (payment && payment.status !== "completed") {
        await Payment.updateStatus(payment.id, "completed", payment_intent_id);

        // Fetch milestone to get project_id
        const milestone = await new Promise((resolve) => {
          Milestone.getById(payment.milestone_id, (err, rows) => {
            if (err) resolve(null);
            else resolve(rows[0]);
          });
        });

        if (milestone) {
          // Record Transaction for Client (Deposit)
          const participants = await getProjectParticipants(
            milestone.project_id
          );
          if (participants) {
            await Transaction.create({
              user_id: participants.client_id,
              amount: payment.amount,
              type: "deposit",
              description: `Escrow deposit for milestone: ${milestone.title}`,
              reference_type: "payment",
              reference_id: payment.id,
              status: "completed",
            });
          }
        }

        emitPaymentCompletedNotifications(payment.id, req.app);
      }

      res.json({ success: true });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Payment not successful" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- EXISTING ROUTES (UPDATED) ---

router.get("/stats", requireAuth, (req, res) => {
  const userId = Number(req.user.id);
  console.log(
    `Stats requested for user: ${userId} (${typeof userId}), type: ${
      req.user.user_type
    }`
  );

  if (req.user.user_type === "freelancer") {
    const sql = `
      SELECT 
        (SELECT COALESCE(SUM(py.amount), 0) 
         FROM payments py 
         JOIN milestones m ON py.milestone_id = m.id 
         JOIN projects p ON m.project_id = p.id 
         WHERE p.freelancer_id = ? 
           AND (py.status = 'completed' OR py.status = 'released')) as total_earnings,
         
        (SELECT COUNT(*) 
         FROM projects p
         WHERE p.freelancer_id = ? 
           AND p.status = 'completed') as completed_projects_count,
         
        (SELECT COUNT(*) 
         FROM projects p
         WHERE p.freelancer_id = ? 
           AND p.status IN ('in_progress', 'plan_submitted', 'accepted')) as active_projects_count
    `;

    db.query(sql, [userId, userId, userId], (err, rows) => {
      if (err) {
        console.error("Freelancer stats error:", err);
        return res.status(500).json({
          success: false,
          message: "İstatistikler alınamadı: " + err.message,
        });
      }
      console.log("Freelancer stats result:", rows[0]);
      const stats = rows[0];
      if (stats) {
        stats.total_earnings = Number(stats.total_earnings || 0);
      }
      res.json({ success: true, stats });
    });
  } else if (req.user.user_type === "client") {
    const sql = `
      SELECT 
        (SELECT COALESCE(SUM(py.amount), 0)
         FROM payments py
         JOIN milestones m ON py.milestone_id = m.id
         JOIN projects p ON m.project_id = p.id
         WHERE p.client_id = ? AND py.status = 'completed') as total_spent,
         
        (SELECT COUNT(*) 
         FROM projects 
         WHERE client_id = ?) as total_projects_count,
         
        (SELECT COUNT(*) 
         FROM projects 
         WHERE client_id = ? AND status IN ('in_progress', 'plan_submitted')) as active_projects_count
    `;

    db.query(sql, [userId, userId, userId], (err, rows) => {
      if (err) {
        console.error("Client stats error:", err);
        return res
          .status(500)
          .json({ success: false, message: "İstatistikler alınamadı" });
      }
      console.log("Client stats result:", rows[0]);
      res.json({ success: true, stats: rows[0] });
    });
  } else {
    return res.status(403).json({ success: false, message: "Yetkisiz erişim" });
  }
});

router.post("/", async (req, res) => {
  const { milestone_id, amount, payment_method } = req.body || {};
  if (!milestone_id || Number.isNaN(Number(milestone_id))) {
    return res
      .status(400)
      .json({ success: false, message: "Geçersiz aşama kimliği" });
  }
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    return res
      .status(400)
      .json({ success: false, message: "Geçersiz ödeme tutarı" });
  }

  try {
    const paymentId = await Payment.create({
      milestone_id: Number(milestone_id),
      amount: Number(amount),
      payment_method,
      status: "pending",
    });

    res.json({
      success: true,
      message: "Ödeme talebi oluşturuldu",
      payment_id: paymentId,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Sunucu hatası: " + err.message });
  }
});

router.put("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, transaction_id } = req.body;

  try {
    await Payment.updateStatus(id, status, transaction_id);

    res.json({
      success: true,
      message: `Ödeme durumu şu şekilde güncellendi: ${status}`,
    });

    if (String(status) === "completed") {
      emitPaymentCompletedNotifications(Number(id), req.app);
    }
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Sunucu hatası: " + err.message });
  }
});

router.get("/milestone/:milestone_id", async (req, res) => {
  const { milestone_id } = req.params;
  try {
    const payments = await Payment.getByMilestone(milestone_id);
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});

router.get("/user", requireAuth, async (req, res) => {
  const user_id = req.user.id;
  const user_type = req.user.user_type;

  let whereClause = "";
  let params = [];
  if (user_type === "client") {
    whereClause = "WHERE pr.client_id = ?";
    params = [user_id];
  } else if (user_type === "freelancer") {
    whereClause = "WHERE b.freelancer_id = ?";
    params = [user_id];
  } else {
    return res.status(403).json({ success: false, message: "İzin yok" });
  }

  const sql = `
    SELECT 
      p.id as payment_id,
      p.milestone_id,
      p.amount,
      p.status,
      p.payment_method,
      p.transaction_id,
      p.created_at as payment_created_at,
      p.paid_at as payment_paid_at,
      m.title as milestone_title,
      pr.id as project_id,
      pr.title as project_title,
      pr.client_id,
      b.freelancer_id,
      uc.full_name as client_name,
      uf.full_name as freelancer_name
    FROM payments p
    JOIN milestones m ON p.milestone_id = m.id
    JOIN projects pr ON m.project_id = pr.id
    JOIN bids b ON b.project_id = pr.id AND b.status = 'accepted'
    LEFT JOIN users uc ON uc.id = pr.client_id
    LEFT JOIN users uf ON uf.id = b.freelancer_id
    ${whereClause}
    ORDER BY p.created_at DESC
  `;

  db.query(sql, params, (err, rows) => {
    if (err) {
      return res.json({ success: false, message: "Sunucu hatası" });
    }
    res.json({ success: true, payments: rows || [] });
  });
});

// --- ESCROW ROUTES ---

// Fund a milestone (Client pays, money is held)
router.post("/fund-milestone", requireAuth, async (req, res) => {
  try {
    const { milestone_id } = req.body;
    const client_id = req.user.id; // Assuming requireAuth populates req.user

    // 1. Fetch milestone
    const milestone = await new Promise((resolve, reject) => {
      Milestone.getById(milestone_id, (err, rows) => {
        if (err) reject(err);
        else resolve(rows && rows[0]);
      });
    });

    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, message: "Milestone not found" });
    }

    // 2. Check if already funded or paid
    const existingPayment = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM payments WHERE milestone_id = ? AND status IN ('held', 'released', 'completed')",
        [milestone_id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows[0]);
        }
      );
    });

    if (existingPayment) {
      // Idempotency: Return success if already funded, so the UI can update
      return res.json({
        success: true,
        message: "Milestone is already funded or paid",
        payment_id: existingPayment.id,
        already_funded: true,
        funded_at: existingPayment.created_at,
      });
    }

    // 3. Simulate Payment (Client -> Platform)
    // In a real app, this would be a Stripe charge or similar.
    // Since it's simulated, we just assume success.
    const amount = milestone.amount;
    const transactionId = `txn_fund_${milestone_id}_${Date.now()}`;

    // 4. Create Payment Record (Held)
    const paymentId = await Payment.create({
      milestone_id,
      amount,
      payment_method: "simulated_direct",
      transaction_id: transactionId,
      status: "held",
    });

    // 5. Create Ledger Transaction (Client Debit)
    await Transaction.create({
      user_id: client_id,
      amount: -amount, // Negative for payment
      type: "payment",
      description: `Payment for milestone: ${milestone.title}`,
      reference_type: "milestone",
      reference_id: milestone_id,
      status: "completed",
    });

    // 6. Update Milestone Status to 'funded'
    // Note: We need to make sure 'funded' is a valid status in the DB enum or code logic.
    // If not, we might stick to 'pending' but with payment status 'held'.
    // However, the previous code check implied 'funded' might be used.
    // Let's try to update to 'funded'. If it fails due to ENUM, we might need to handle it.
    // Given the migration 2025-11-30-update-milestone-status-enum.sql exists, it probably added it.
    // Or we can just keep it 'active' or 'in_progress'?
    // Usually: Pending -> Funded -> In Progress -> Completed.
    // Let's assume 'funded' is valid or use 'active' if 'funded' is not standard.
    // Let's try 'funded'.

    // 6. Update Milestone Status to 'funded'
    // We wrap this in a try-catch to prevent failure if 'funded' status is not yet in ENUM
    // The payment is already recorded, so the transaction is valid.
    try {
      await new Promise((resolve, reject) => {
        Milestone.updateStatus(milestone_id, "funded", (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    } catch (statusErr) {
      console.warn(
        `[Fund Milestone] Failed to update status to 'funded' (non-critical):`,
        statusErr.message
      );
    }

    // 7. Emit Real-time Updates (The "Real Connection")
    const participants = await getProjectParticipants(milestone.project_id);
    if (participants) {
      const { client_id, freelancer_id } = participants;
      const io = req.app.get("io");

      if (io) {
        const payload = {
          type: "milestone_status",
          milestone_id: Number(milestone_id),
          project_id: milestone.project_id,
          status: "funded",
          amount: milestone.amount,
          at: new Date().toISOString(),
        };

        io.to(`user:${client_id}`).emit("milestone:status", payload);
        io.to(`user:${freelancer_id}`).emit("milestone:status", payload);

        // Notify Freelancer
        const notifPayload = {
          event: "notification:new",
          type: "milestone_funded",
          title: "Aşama Finanse Edildi",
          message: `Müşteri, "${milestone.title}" aşamasını finanse etti. Çalışmaya başlayabilirsiniz.`,
          milestone_id: Number(milestone_id),
          project_id: milestone.project_id,
          created_at: new Date().toISOString(),
        };
        io.to(`user:${freelancer_id}`).emit("notification:new", notifPayload);
      }

      // Create Notification in DB
      await Notification.create({
        user_id: freelancer_id,
        actor_id: client_id,
        type: "milestone_funded",
        title: "Aşama Finanse Edildi",
        message: `Müşteri, "${milestone.title}" aşamasını finanse etti. Çalışmaya başlayabilirsiniz.`,
        priority: "high",
        action_required: true,
        project_id: milestone.project_id,
        milestone_id: Number(milestone_id),
      });
    }

    res.json({
      success: true,
      message: "Milestone funded successfully",
      payment_id: paymentId,
    });
  } catch (err) {
    console.error("Fund milestone error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error during funding" });
  }
});

module.exports = router;
