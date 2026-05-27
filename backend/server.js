const express = require("express");
const cors = require("cors");

const mockData = require("./data/mockData.json");
const servicesRoutes = require("./routes/services");
const doctorsRoutes = require("./routes/doctors");
const appointmentsRoutes = require("./routes/appointments");
const queueRoutes = require("./routes/queue");
const patientsRoutes = require("./routes/patients");
const financeRoutes = require("./routes/finance");

const app = express();
const PORT = 5000;

// The backend is intentionally simple for now: data is kept in memory and
// loaded from JSON when the server starts. A database can replace this later.
app.locals.data = mockData;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "MediQueue backend is running",
    docs: "Use /api/services, /api/doctors, /api/appointments, /api/queue, /api/patients, and /api/finance",
  });
});

app.use("/api/services", servicesRoutes);
app.use("/api/doctors", doctorsRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/finance", financeRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`MediQueue backend running at http://localhost:${PORT}`);
});
