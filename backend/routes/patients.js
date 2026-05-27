const express = require("express");

const router = express.Router();

// Return mock patient records, including visit history and follow-up notes.
router.get("/", (req, res) => {
  res.json(req.app.locals.data.patients);
});

module.exports = router;
