const express = require("express");

const router = express.Router();

// Return doctors and basic operational details such as room and salary settings.
router.get("/", (req, res) => {
  res.json(req.app.locals.data.doctors);
});

module.exports = router;
