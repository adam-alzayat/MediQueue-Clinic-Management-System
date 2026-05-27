const express = require("express");

const router = express.Router();

function sortedQueue(queue) {
  return [...queue].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === "urgent" ? -1 : 1;
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });
}

// Return queue entries with urgent patients first.
router.get("/", (req, res) => {
  res.json(sortedQueue(req.app.locals.data.queue));
});

// Add a patient to the in-memory queue.
router.post("/", (req, res) => {
  const { name, serviceId, priority = "normal" } = req.body;

  if (!name || !serviceId) {
    return res.status(400).json({ error: "Name and serviceId are required" });
  }

  const entry = {
    id: `q-${Date.now()}`,
    ticket: `Q-${String(req.app.locals.data.queue.length + 24).padStart(3, "0")}`,
    name,
    serviceId,
    priority: priority === "urgent" ? "urgent" : "normal",
    joinedAt: new Date().toISOString(),
  };

  req.app.locals.data.queue.push(entry);
  res.status(201).json(entry);
});

module.exports = router;
