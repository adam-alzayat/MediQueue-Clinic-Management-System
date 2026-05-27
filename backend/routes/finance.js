const express = require("express");

const router = express.Router();

function serviceById(data, serviceId) {
  return data.services.find((service) => service.id === serviceId);
}

function doctorById(data, doctorId) {
  return data.doctors.find((doctor) => doctor.id === doctorId);
}

function appointmentRevenue(data, appointment) {
  return serviceById(data, appointment.serviceId)?.price || 0;
}

function buildFinanceSummary(data) {
  const paidAppointments = data.appointments.filter((appointment) => appointment.paid);
  const unpaidAppointments = data.appointments.filter((appointment) => !appointment.paid);
  const revenue = paidAppointments.reduce((sum, appointment) => sum + appointmentRevenue(data, appointment), 0);
  const expenses = data.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  const revenueByDoctor = data.doctors.map((doctor) => {
    const doctorRevenue = paidAppointments
      .filter((appointment) => appointment.doctorId === doctor.id)
      .reduce((sum, appointment) => sum + appointmentRevenue(data, appointment), 0);

    return {
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      revenue: doctorRevenue,
    };
  });

  const revenueByService = data.services.map((service) => {
    const serviceRevenue = paidAppointments
      .filter((appointment) => appointment.serviceId === service.id)
      .reduce((sum, appointment) => sum + appointmentRevenue(data, appointment), 0);

    return {
      serviceId: service.id,
      serviceName: service.name,
      revenue: serviceRevenue,
    };
  });

  const payroll = data.payroll.map((row) => {
    const doctor = doctorById(data, row.doctorId);
    const completedAppointments = data.appointments.filter((appointment) => appointment.doctorId === row.doctorId && appointment.status === "completed");
    const generatedRevenue = completedAppointments.reduce((sum, appointment) => sum + appointmentRevenue(data, appointment), 0);
    const bonus = Math.round(generatedRevenue * (doctor?.commissionRate || 0));

    return {
      ...row,
      doctorName: doctor?.name || "Unknown doctor",
      completedAppointments: completedAppointments.length,
      revenueGenerated: generatedRevenue,
      baseSalary: doctor?.baseSalary || 0,
      bonus,
      totalSalary: (doctor?.baseSalary || 0) + bonus,
    };
  });

  return {
    revenue,
    expenses,
    netProfit: revenue - expenses,
    paidAppointments: paidAppointments.length,
    unpaidAppointments: unpaidAppointments.length,
    revenueByDoctor,
    revenueByService,
    expensesList: data.expenses,
    payroll,
  };
}

// Return a finance summary that can later power the accountant dashboard.
router.get("/", (req, res) => {
  res.json(buildFinanceSummary(req.app.locals.data));
});

// Update payroll status for a doctor. The :id parameter is the doctorId.
router.patch("/payroll/:id/status", (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["Pending", "Approved", "Paid"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Status must be Pending, Approved, or Paid" });
  }

  const payrollRow = req.app.locals.data.payroll.find((row) => row.doctorId === req.params.id);

  if (!payrollRow) {
    return res.status(404).json({ error: "Payroll record not found" });
  }

  payrollRow.status = status;
  res.json(payrollRow);
});

module.exports = router;
