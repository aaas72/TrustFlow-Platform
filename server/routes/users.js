const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/", (req, res) => {
  User.getAll((err, results) => {
    if (err) {
      return res.json({
        success: false,
        message: "Sunucu hatası",
      });
    }

    res.json({
      success: true,
      users: results,
    });
  });
});

module.exports = router;
