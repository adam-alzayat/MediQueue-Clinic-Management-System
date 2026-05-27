const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const DATA_FILE = path.join(__dirname, "..", "data", "mockData.json");

function createReference() {
  return `MQ-${Math.floor(10000 + Math.random() * 89999)}`;
}

function saveMockData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function sameText(left, right) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

// List all appointments currently stored in memory.
router.get("/", (req, res) => {
  res.json(req.app.locals.data.appointments);
});

// Create a new mock appointment and persist it to the JSON mock data file.
router.post("/", (req, res) => {
  const { patientName, email, serviceId, doctorId, date, time } = req.body;
  const data = req.app.locals.data;
  const cleanName = String(patientName || "").trim();
  const cleanEmail = String(email || "").trim();

  if (!cleanName) {
    return res.status(400).json({ success: false, error: "Patient name is required" });
  }

  if (!cleanEmail) {
    return res.status(400).json({ success: false, error: "Patient email is required" });
  }

  const serviceExists = data.services.some((service) => service.id === serviceId);
  if (!serviceExists) {
    return res.status(400).json({ success: false, error: "Selected service does not exist" });
  }

  const doctorExists = data.doctors.some((doctor) => doctor.id === doctorId);
  if (!doctorExists) {
    return res.status(400).json({ success: false, error: "Selected doctor does not exist" });
  }

  if (!date || !time) {
    return res.status(400).json({ success: false, error: "Appointment date and time are required" });
  }

  const duplicate = data.appointments.some((appointment) =>
    sameText(appointment.patientName, cleanName) &&
    appointment.date === date &&
    appointment.time === time
  );

  if (duplicate) {
    return res.status(409).json({
      success: false,
      error: "This patient already has an appointment at the selected date and time",
    });
  }

  const appointment = {
    id: `a-${Date.now()}`,
    reference: createReference(),
    patientName: cleanName,
    email: cleanEmail,
    serviceId,
    doctorId,
    date,
    time,
    status: "confirmed",
    paid: false,
  };

  data.appointments.push(appointment);
  saveMockData(data);
  console.log(`Created appointment ${appointment.reference} for ${appointment.patientName}`);

  res.status(201).json({
    success: true,
    message: "Appointment created successfully",
    appointment,
  });
});

// Mark an appointment as completed, similar to the doctor dashboard workflow.
router.patch("/:id/complete", (req, res) => {
  const appointment = req.app.locals.data.appointments.find((item) => item.id === req.params.id);

  if (!appointment) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  appointment.status = "completed";
  res.json(appointment);
});

module.exports = router;
