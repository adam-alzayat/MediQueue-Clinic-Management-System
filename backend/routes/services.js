const express = require("express");

const router = express.Router();

// Return every service shown by the frontend service cards.
router.get("/", (req, res) => {
  res.json(req.app.locals.data.services);
});

module.exports = router;
