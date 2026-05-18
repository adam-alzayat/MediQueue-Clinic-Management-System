(function () {
  const STORAGE = {
    bookings: "mq_bookings",
    queue: "mq_queue",
    notes: "mq_doctor_notes",
    completed: "mq_completed_appointments",
    notifications: "mq_notifications",
    expenses: "mq_expenses",
    payroll: "mq_payroll",
    customization: "mq_customization",
    indexQueue: "mq_index_queue",
    activity: "mq_activity_log",
    uiState: "mq_ui_state",
  };

  const money = (value) => `$${Number(value || 0).toLocaleString()}`;
  const today = () => new Date().toISOString().slice(0, 10);
  const timeLabel = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateLabel = (value) => {
    const date = value ? new Date(`${value}T00:00:00`) : new Date();
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };
  const timestamp = () => `${dateLabel()} at ${timeLabel()}`;
  const byId = (id) => document.getElementById(id);
  const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
  const read = (key, fallback) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (error) {
      return fallback;
    }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const data = () => window.MQData;
  const doctors = () => data().doctors;
  const services = () => data().services;
  const patients = () => data().patients;
  const baseAppointments = () => data().appointments;
  const storedBookings = () => read(STORAGE.bookings, []);
  const completedIds = () => read(STORAGE.completed, []);
  const queueEntries = () => read(STORAGE.queue, data().queue);
  const notes = () => read(STORAGE.notes, []);
  const expenses = () => read(STORAGE.expenses, data().expenses);
  const payrollStatuses = () => read(STORAGE.payroll, data().payroll);
  const notifications = () => read(STORAGE.notifications, data().notifications);
  const uiState = () => read(STORAGE.uiState, {});
  const activityLog = () => read(STORAGE.activity, [
    { id: "act-1", type: "Queue", message: "Urgent queue prioritization reviewed", createdAt: "08:45" },
    { id: "act-2", type: "Booking", message: "Cardiology slot capacity reached at 11:00", createdAt: "09:20" },
    { id: "act-3", type: "Finance", message: "Payroll review opened by accounting", createdAt: "10:05" },
  ]);
  const defaultCustomization = () => ({
    clinicName: "Cedar Care Clinic",
    tagline: "Smart clinic booking, queue, and management platform.",
    accentColor: "#0f9f9a",
    bannersEnabled: true,
    banners: [
      { id: "bn-1", title: "Free consultation for first-time patients", description: "New patients can request a short triage consultation this week.", active: true },
      { id: "bn-2", title: "20% discount on dental cleaning", description: "Seasonal preventive-care promotion available at reception.", active: true },
      { id: "bn-3", title: "Extended clinic hours during Ramadan", description: "Evening appointments are available for selected services.", active: true },
    ],
    featureCards: [
      { id: "fc-1", title: "Online Booking", description: "Patients reserve care using capacity-aware appointment slots.", link: "booking.html" },
      { id: "fc-2", title: "Live Queue Tracking", description: "Urgent cases move first while patients see realistic wait estimates.", link: "queue.html" },
      { id: "fc-3", title: "Patient History", description: "Doctors review past visits, notes, and follow-up recommendations.", link: "dashboards/dashboard-patient.html" },
      { id: "fc-4", title: "Payroll & Finance", description: "Accountants track revenue, expenses, and salary approval status.", link: "dashboards/dashboard-accountant.html" },
      { id: "fc-5", title: "Doctor Dashboard", description: "Doctors manage daily appointments and save clinical notes.", link: "dashboards/dashboard-doctor.html" },
      { id: "fc-6", title: "Appointment Reminders", description: "Notifications simulate confirmations, reminders, and queue updates.", link: "login.html" },
    ],
  });
  const customization = () => ({ ...defaultCustomization(), ...read(STORAGE.customization, {}) });

  function saveCustomization(next) {
    write(STORAGE.customization, { ...customization(), ...next });
    applyCustomization();
  }

  function logActivity(type, message) {
    write(STORAGE.activity, [{ id: uid("act"), type, message, createdAt: timeLabel() }, ...activityLog()].slice(0, 12));
  }

  function setUiState(key, value) {
    write(STORAGE.uiState, { ...uiState(), [key]: value });
  }

  function allAppointments() {
    return [...baseAppointments(), ...storedBookings()].map((appointment) => ({
      ...appointment,
      status: completedIds().includes(appointment.id) ? "completed" : appointment.status,
    }));
  }

  function serviceById(id) {
    return services().find((service) => service.id === id) || services()[0];
  }

  function doctorById(id) {
    return doctors().find((doctor) => doctor.id === id) || doctors()[0];
  }

  function appointmentRevenue(appointment) {
    return serviceById(appointment.serviceId).price;
  }

  function activeAppointments() {
    return allAppointments().filter((appointment) => appointment.status !== "cancelled");
  }

  function sortedQueue() {
    return [...queueEntries()].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "urgent" ? -1 : 1;
      return a.joinedAt - b.joinedAt;
    });
  }

  function addNotification(role, message, type = "info") {
    const next = [
      { id: uid("n"), role, message, type, createdAt: timestamp() },
      ...notifications(),
    ];
    write(STORAGE.notifications, next);
  }

  function formatNotificationTime(value) {
    if (!value) return timestamp();
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return dateLabel(value);
    return value;
  }

  function emptyRow(columns, message) {
    return `<tr class="empty-row"><td colspan="${columns}"><div class="empty-state compact">${message}</div></td></tr>`;
  }

  function applyCustomization() {
    const settings = customization();
    document.documentElement.style.setProperty("--teal", settings.accentColor);
    document.querySelectorAll("[data-clinic-name]").forEach((element) => {
      element.textContent = settings.clinicName;
    });
    document.querySelectorAll("[data-hero-tagline]").forEach((element) => {
      element.textContent = settings.tagline;
    });
    renderPromotionBanners();
    renderHomeFeatureCards();
  }

  function renderPromotionBanners() {
    const target = byId("promo-banners");
    if (!target) return;
    const settings = customization();
    if (!settings.bannersEnabled) {
      target.innerHTML = "";
      target.hidden = true;
      return;
    }
    const active = settings.banners.filter((banner) => banner.active !== false);
    target.hidden = active.length === 0;
    target.innerHTML = active.map((banner) => `
      <article class="promo-banner">
        <span class="badge live">Live</span>
        <div><strong>${esc(banner.title)}</strong><small>${esc(banner.description)}</small></div>
      </article>
    `).join("");
  }

  function renderHomeFeatureCards() {
    const target = byId("home-feature-grid");
    if (!target) return;
    target.innerHTML = customization().featureCards.map((card) => `
      <a class="card interactive-card" href="${esc(normalizeProjectLink(card.link || "services.html"))}">
        <span class="eyebrow">Platform feature</span>
        <h3>${esc(card.title)}</h3>
        <p>${esc(card.description)}</p>
      </a>
    `).join("");
  }

  function normalizeProjectLink(link) {
    return link.startsWith("dashboard-") ? `dashboards/${link}` : link;
  }

  function renderServiceOptions(select, doctorSelect) {
    if (!select) return;
    select.innerHTML = services()
      .map((service) => `<option value="${service.id}">${service.name}</option>`)
      .join("");
    renderDoctorOptions(select.value, doctorSelect);
  }

  function renderDoctorOptions(serviceId, select) {
    if (!select) return;
    const service = serviceById(serviceId);
    select.innerHTML = service.doctorIds
      .map((id) => {
        const doctor = doctorById(id);
        return `<option value="${doctor.id}">${doctor.name} - ${doctor.specialty}</option>`;
      })
      .join("");
  }

  function availability(serviceId, doctorId, date, time, email) {
    const service = serviceById(serviceId);
    const matching = activeAppointments().filter((appointment) =>
      appointment.serviceId === serviceId &&
      appointment.doctorId === doctorId &&
      appointment.date === date &&
      appointment.time === time
    );
    const samePatientTime = email && activeAppointments().some((appointment) =>
      appointment.email.toLowerCase() === email.toLowerCase() &&
      appointment.date === date &&
      appointment.time === time
    );
    return {
      used: matching.length,
      capacity: service.capacity,
      available: matching.length < service.capacity && !samePatientTime,
      samePatientTime,
    };
  }

  function renderSlots() {
    const serviceId = byId("booking-service")?.value;
    const doctorId = byId("booking-doctor")?.value;
    const date = byId("booking-date")?.value || today();
    const email = byId("booking-email")?.value || "";
    const timeSelect = byId("booking-time");
    if (!serviceId || !doctorId || !timeSelect) return;

    timeSelect.innerHTML = data().timeSlots
      .map((time) => {
        const slot = availability(serviceId, doctorId, date, time, email);
        const label = slot.available
          ? `${time} - ${slot.capacity - slot.used} open`
          : `${time} - unavailable`;
        return `<option value="${time}" ${slot.available ? "" : "disabled"}>${label}</option>`;
      })
      .join("");

    const firstOpen = [...timeSelect.options].find((option) => !option.disabled);
    if (firstOpen) timeSelect.value = firstOpen.value;
    const hint = byId("slot-hint");
    if (hint) {
      hint.textContent = firstOpen
        ? "Slots update instantly based on doctor, service, date, and current bookings."
        : "No capacity is available for this combination. Please choose another doctor or date.";
    }
  }

  function initBooking() {
    const serviceSelect = byId("booking-service");
    const doctorSelect = byId("booking-doctor");
    const dateInput = byId("booking-date");
    if (!serviceSelect) return;

    dateInput.value = today();
    dateInput.min = today();
    renderServiceOptions(serviceSelect, doctorSelect);
    renderSlots();

    serviceSelect.addEventListener("change", () => {
      renderDoctorOptions(serviceSelect.value, doctorSelect);
      renderSlots();
    });
    [doctorSelect, dateInput, byId("booking-email")].forEach((element) => {
      element?.addEventListener("change", renderSlots);
      element?.addEventListener("input", renderSlots);
    });

    byId("booking-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const booking = {
        id: uid("a"),
        reference: `MQ-${Math.floor(10000 + Math.random() * 89999)}`,
        patientName: byId("booking-name").value.trim(),
        email: byId("booking-email").value.trim(),
        serviceId: serviceSelect.value,
        doctorId: doctorSelect.value,
        date: dateInput.value,
        time: byId("booking-time").value,
        status: "confirmed",
        paid: false,
      };

      const slot = availability(booking.serviceId, booking.doctorId, booking.date, booking.time, booking.email);
      if (!slot.available) {
        showMessage("booking-result", "This slot is no longer available. Please choose another time.", "danger");
        renderSlots();
        return;
      }

      const nextBookings = [...storedBookings(), booking];
      write(STORAGE.bookings, nextBookings);
      addNotification("patient", `Booking confirmed: ${booking.reference} for ${serviceById(booking.serviceId).name}.`, "success");
      showMessage("booking-result", `Booking confirmed. Reference ${booking.reference}. Please arrive 10 minutes early.`, "success");
      event.target.reset();
      dateInput.value = today();
      renderDoctorOptions(serviceSelect.value, doctorSelect);
      renderSlots();
    });
  }

  function showMessage(id, text, type) {
    const target = byId(id);
    if (!target) return;
    target.className = `message ${type}`;
    target.textContent = text;
    target.hidden = false;
  }

  function initQueue() {
    const serviceSelect = byId("queue-service");
    if (!serviceSelect) return;
    serviceSelect.innerHTML = services().map((service) => `<option value="${service.id}">${service.name}</option>`).join("");
    renderQueueList();

    byId("queue-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const nextTicketNumber = queueEntries().length + 24;
      const entry = {
        id: uid("q"),
        ticket: `Q-${String(nextTicketNumber).padStart(3, "0")}`,
        name: byId("queue-name").value.trim(),
        serviceId: serviceSelect.value,
        priority: byId("queue-priority").value,
        joinedAt: Date.now(),
      };
      write(STORAGE.queue, [...queueEntries(), entry]);
      addNotification("patient", `Queue ticket ${entry.ticket} created. Your turn is near once you reach position 2.`, "info");
      const position = sortedQueue().findIndex((item) => item.id === entry.id) + 1;
      showMessage("queue-result", `Ticket ${entry.ticket} joined successfully. Current position: ${position}. Estimated wait: ${estimateWait(entry)} minutes.`, "success");
      event.target.reset();
      renderQueueList();
    });
  }

  function estimateWait(entry) {
    const ordered = sortedQueue();
    const index = ordered.findIndex((item) => item.id === entry.id);
    const service = serviceById(entry.serviceId);
    return Math.max(5, Math.round((index + 1) * service.avgWait * (entry.priority === "urgent" ? 0.65 : 1)));
  }

  function renderQueueList() {
    const target = byId("queue-list");
    if (!target) return;
    const rows = sortedQueue()
      .map((entry, index) => `
        <tr>
          <td><strong>${entry.ticket}</strong></td>
          <td>${entry.name}</td>
          <td>${serviceById(entry.serviceId).name}</td>
          <td><span class="badge ${entry.priority === "urgent" ? "danger" : "neutral"}">${entry.priority}</span></td>
          <td>${index + 1}</td>
          <td>${estimateWait(entry)} min</td>
        </tr>
      `)
      .join("");
    target.innerHTML = rows || emptyRow(6, "No patients are waiting right now.");
  }

  function renderServicesPage() {
    const grid = byId("services-grid");
    if (!grid) return;
    grid.innerHTML = services()
      .map((service) => `
        <article class="card service-card">
          <div class="card-topline">
            <span class="eyebrow">${service.duration} min</span>
            <span class="price">${money(service.price)}</span>
          </div>
          <h3>${service.name}</h3>
          <p>${service.description}</p>
          <dl class="meta-grid">
            <div><dt>Average wait</dt><dd>${service.avgWait} min</dd></div>
            <div><dt>Doctors</dt><dd>${service.doctorIds.map((id) => doctorById(id).name.split(" ").slice(1).join(" ")).join(", ")}</dd></div>
          </dl>
          <div class="button-row">
            <a class="btn primary" href="booking.html?service=${service.id}">Book Appointment</a>
            <a class="btn secondary" href="queue.html?service=${service.id}">Join Queue</a>
          </div>
        </article>
      `)
      .join("");
  }

  function indexQueue() {
    return read(STORAGE.indexQueue, sortedQueue().slice(0, 3));
  }

  function writeIndexQueue(entries) {
    write(STORAGE.indexQueue, entries);
  }

  function renderIndexPage() {
    if (!byId("home-live-stats")) return;
    const appointments = allAppointments();
    const averageWait = Math.round(services().reduce((sum, service) => sum + service.avgWait, 0) / services().length);
    byId("home-live-stats").innerHTML = [
      statCard("Patients served today", appointments.filter((item) => item.date === today() && item.status === "completed").length + 18, "appointments and walk-ins"),
      statCard("Active doctors", doctors().filter((doctor) => doctor.active).length, "available now"),
      statCard("Avg wait time", `${averageWait} min`, "across services"),
      statCard("Services available", services().length, "bookable clinic services"),
    ].join("");

    const preview = byId("featured-services");
    if (preview) {
      preview.innerHTML = services().slice(0, 3).map((service) => `
        <a class="card service-card interactive-card" href="booking.html?service=${service.id}">
          <div class="card-topline"><span class="eyebrow">${service.duration} min</span><span class="price">${money(service.price)}</span></div>
          <h3>${service.name}</h3>
          <p>${service.description}</p>
          <span class="badge info">${service.avgWait} min avg wait</span>
        </a>
      `).join("");
    }

    const notices = byId("notification-preview");
    if (notices) {
      notices.innerHTML = [
        ["success", "Appointment confirmed"],
        ["info", "Queue update: position changed"],
        ["success", "Salary approved"],
        ["warning", "Your turn is next"],
      ].map(([type, message]) => `<div class="notice ${type}"><span>${message}</span><small>Demo notification</small></div>`).join("");
    }
    renderIndexQueuePreview();
  }

  function renderIndexQueuePreview() {
    const target = byId("live-queue-preview");
    if (!target) return;
    const entries = indexQueue();
    target.innerHTML = entries.length ? entries.map((entry, index) => `
      <div class="board-row compact-row">
        <span class="queue-number">${String(index + 1).padStart(2, "0")}</span>
        <div><strong>${esc(entry.name)}</strong><p>${serviceById(entry.serviceId).name}</p></div>
        <span class="badge ${entry.priority === "urgent" ? "danger" : index === 0 ? "live" : "neutral"}">${entry.priority === "urgent" ? "Urgent" : index === 0 ? "Live" : "Waiting"}</span>
      </div>
    `).join("") : `<div class="empty-state">Queue cleared. Add an urgent patient to simulate activity.</div>`;
  }

  function initIndexInteractions() {
    if (!byId("home-live-stats")) return;
    const urgentNames = ["Mona Fares", "Joseph Raad", "Dana Khoury", "Elias Tannous"];
    byId("home-call-next")?.addEventListener("click", () => {
      const entries = indexQueue();
      const next = entries[0];
      if (!next) return showModal("Queue preview", "No waiting patients in the preview queue.");
      showModal("Calling next patient", `${next.ticket || "Preview ticket"} - ${next.name} is being called to reception.`);
      logActivity("Queue", `${next.name} called from homepage queue preview`);
    });
    byId("home-add-urgent")?.addEventListener("click", () => {
      const entry = {
        id: uid("preview"),
        ticket: `Q-${Math.floor(120 + Math.random() * 80)}`,
        name: urgentNames[Math.floor(Math.random() * urgentNames.length)],
        serviceId: services()[Math.floor(Math.random() * services().length)].id,
        priority: "urgent",
        joinedAt: Date.now(),
      };
      writeIndexQueue([entry, ...indexQueue()].slice(0, 5));
      renderIndexQueuePreview();
      showModal("Urgent patient added", `${entry.name} was added to the top of the queue preview.`);
      logActivity("Queue", `Urgent preview patient ${entry.name} added`);
    });
    byId("home-mark-served")?.addEventListener("click", () => {
      const entries = indexQueue();
      const served = entries.shift();
      writeIndexQueue(entries);
      renderIndexQueuePreview();
      showModal("Patient served", served ? `${served.name} was marked as served in the preview.` : "No patient was waiting.");
      logActivity("Queue", served ? `${served.name} marked served from homepage` : "Homepage served action used on empty queue");
    });
  }

  function renderNotifications(role, targetId = "notifications-panel") {
    const target = byId(targetId);
    if (!target) return;
    const items = notifications().filter((item) => item.role === role || item.role === "all").slice(0, 6);
    target.innerHTML = items
      .map((item) => `
        <div class="notice ${item.type}">
          <span>${item.message}</span>
          <small>${formatNotificationTime(item.createdAt)}</small>
        </div>
      `)
      .join("") || `<div class="empty-state compact">No notifications to show.</div>`;
  }

  function showModal(title, message) {
    let modal = byId("app-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "app-modal";
      modal.className = "modal-backdrop";
      modal.innerHTML = `
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="split-line"><h2 id="modal-title"></h2><button class="btn small ghost" data-modal-close type="button">Close</button></div>
          <p id="modal-message"></p>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener("click", (event) => {
        if (event.target === modal || event.target.matches("[data-modal-close]")) modal.classList.remove("open");
      });
    }
    byId("modal-title").textContent = title;
    byId("modal-message").textContent = message;
    modal.classList.add("open");
  }

  function statCard(label, value, detail = "") {
    return `<article class="stat-card"><span>${label}</span><strong>${value}</strong><small>${detail}</small></article>`;
  }

  function appointmentRows(appointments, actions = false, emptyText = "No appointments to show.") {
    if (!appointments.length) return emptyRow(actions ? 6 : 5, emptyText);
    return appointments.map((appointment) => `
      <tr>
        <td>${appointment.time || appointment.date}</td>
        <td>${appointment.patientName}</td>
        <td>${serviceById(appointment.serviceId).name}</td>
        <td>${doctorById(appointment.doctorId).name}</td>
        <td><span class="badge ${appointment.status === "completed" ? "success" : "info"}">${appointment.status}</span></td>
        ${actions ? `<td><button class="btn small" data-complete="${appointment.id}">Complete</button></td>` : ""}
      </tr>
    `).join("");
  }

  function renderPatientDashboard() {
    if (!byId("patient-dashboard")) return;
    const email = "adam.khalil@example.com";
    const patient = patients().find((item) => item.email === email);
    const upcoming = allAppointments().filter((item) => item.email === email && item.status !== "completed");
    const queueItem = sortedQueue().find((item) => item.name.includes("Adam")) || sortedQueue()[0];

    byId("patient-stats").innerHTML = [
      statCard("Upcoming", upcoming.length, "confirmed appointments"),
      statCard("Queue position", queueItem ? sortedQueue().findIndex((item) => item.id === queueItem.id) + 1 : "-", queueItem ? queueItem.ticket : "not waiting"),
      statCard("Care history", patient.history.length, "previous visits"),
    ].join("");

    byId("patient-appointments").innerHTML = appointmentRows(upcoming, false, "No upcoming appointments. Book a visit to see it here.");
    byId("queue-status-card").innerHTML = queueItem
      ? `<h3>${queueItem.ticket}</h3><p>${serviceById(queueItem.serviceId).name}</p><strong>${estimateWait(queueItem)} min estimated wait</strong>`
      : `<div class="empty-state compact">No active queue ticket.</div>`;
    byId("patient-history").innerHTML = [...patient.history, ...notes().filter((note) => note.email === email)]
      .map((item) => `
        <div class="timeline-item">
          <strong>${dateLabel(item.date)} - ${serviceById(item.serviceId || "general").name}</strong>
          <p>${item.notes}</p>
          <small>${item.followUp || "Follow-up will be shared by the doctor."}</small>
        </div>
      `)
      .join("");
    renderNotifications("patient");
    const profile = byId("patient-profile");
    if (profile) {
      profile.innerHTML = `
        <div class="profile-card">
          <div class="avatar">AK</div>
          <div><h3>${patient.name}</h3><p>${patient.email}</p><small>${patient.phone}</small></div>
        </div>
        <dl class="meta-grid"><div><dt>Member status</dt><dd>Active</dd></div><div><dt>Last visit</dt><dd>${dateLabel(patient.history[0].date)}</dd></div></dl>
      `;
    }
    const upcomingCard = byId("upcoming-card");
    if (upcomingCard) {
      const appointment = upcoming[0];
      upcomingCard.innerHTML = appointment
        ? `<span class="badge live">Live</span><h3>${serviceById(appointment.serviceId).name}</h3><p>${doctorById(appointment.doctorId).name}</p><strong>${dateLabel(appointment.date)} at ${appointment.time}</strong>`
        : `<div class="empty-state compact">No upcoming appointment. Book a visit when you need care.</div>`;
    }
    const queueWidget = byId("patient-queue-widget");
    if (queueWidget && queueItem) {
      const position = sortedQueue().findIndex((item) => item.id === queueItem.id) + 1;
      queueWidget.innerHTML = `<div class="progress-line"><span style="width:${Math.max(15, 100 - position * 18)}%"></span></div><p>${queueItem.ticket} is position ${position}. Estimated wait is ${estimateWait(queueItem)} minutes.</p>`;
    }
  }

  function renderDoctorDashboard() {
    if (!byId("doctor-dashboard")) return;
    const doctorId = "d1";
    const todays = allAppointments().filter((item) => item.doctorId === doctorId && item.date === today());
    const completed = todays.filter((item) => item.status === "completed");
    const remaining = todays.filter((item) => item.status !== "completed");

    byId("doctor-stats").innerHTML = [
      statCard("Today", todays.length, "scheduled visits"),
      statCard("Completed", completed.length, "appointments closed"),
      statCard("Remaining", remaining.length, "patients left"),
    ].join("");
    const nextPatient = remaining[0];
    byId("next-patient").innerHTML = nextPatient
      ? `<div class="next-highlight"><span class="badge live">Next</span><h3>${nextPatient.patientName}</h3><p>${serviceById(nextPatient.serviceId).name} at ${nextPatient.time}</p><small>${nextPatient.email}</small></div>`
      : "<p>All appointments are completed.</p>";
    byId("doctor-appointments").innerHTML = appointmentRows(todays, true, "No appointments scheduled for today.");
    byId("doctor-history").innerHTML = patients().slice(0, 3).map((patient) => `
      <div class="patient-line">
        <strong>${patient.name}</strong><span class="badge info">${patient.history.length} visits</span>
        <span>${patient.history[0]?.notes || "No recent notes"}</span>
      </div>
    `).join("");
    const timeline = byId("appointment-timeline");
    if (timeline) {
      timeline.innerHTML = todays.map((appointment) => `
        <div class="timeline-item">
          <strong>${appointment.time} - ${appointment.patientName}</strong>
          <p>${serviceById(appointment.serviceId).name}</p>
          <span class="badge ${appointment.status === "completed" ? "success" : "info"}">${appointment.status}</span>
        </div>
      `).join("") || `<div class="empty-state">No appointments scheduled today.</div>`;
    }
    const notesPreview = byId("doctor-notes-preview");
    if (notesPreview) {
      notesPreview.innerHTML = notes().slice(0, 4).map((note) => `
        <div class="notice info"><span>${esc(note.notes)}</span><small>${esc(note.email)} · ${dateLabel(note.date)}</small></div>
      `).join("") || `<div class="empty-state">Saved notes will appear here.</div>`;
    }

    document.querySelectorAll("[data-complete]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.complete;
        write(STORAGE.completed, [...new Set([...completedIds(), id])]);
        addNotification("patient", "Appointment completed. Doctor notes will appear in your history.", "success");
        renderDoctorDashboard();
      });
    });

    byId("doctor-note-form").onsubmit = (event) => {
      event.preventDefault();
      const note = {
        id: uid("note"),
        email: byId("note-email").value.trim(),
        date: today(),
        serviceId: byId("note-service").value,
        notes: byId("note-text").value.trim(),
        followUp: byId("note-followup").value.trim(),
      };
      write(STORAGE.notes, [note, ...notes()]);
      addNotification("patient", "New doctor note added to your patient history.", "info");
      showMessage("note-result", "Doctor note saved to localStorage.", "success");
      event.target.reset();
    };
    renderServiceOptions(byId("note-service"));
  }

  function countBy(items, getter) {
    return items.reduce((acc, item) => {
      const key = getter(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function topKey(counts) {
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  function renderAdminDashboard() {
    if (!byId("admin-dashboard")) return;
    const todays = allAppointments().filter((item) => item.date === today());
    const revenueToday = todays.filter((item) => item.paid).reduce((sum, item) => sum + appointmentRevenue(item), 0);
    const averageWait = Math.round(services().reduce((sum, service) => sum + service.avgWait, 0) / services().length);
    const completionRate = todays.length ? Math.round((todays.filter((item) => item.status === "completed").length / todays.length) * 100) : 0;
    const paidRate = allAppointments().length ? Math.round((allAppointments().filter((item) => item.paid).length / allAppointments().length) * 100) : 0;

    byId("admin-stats").innerHTML = [
      statCard("Appointments today", todays.length, "across all doctors"),
      statCard("Waiting queue", sortedQueue().length, "active tickets"),
      statCard("Active doctors", doctors().filter((doctor) => doctor.active).length, "available staff"),
      statCard("Revenue today", money(revenueToday), "paid appointments"),
      statCard("Avg wait", `${averageWait} min`, "service average"),
    ].join("");
    byId("manage-doctors").innerHTML = doctors().map((doctor) => `
      <tr><td>${doctor.name}</td><td>${doctor.specialty}</td><td>${doctor.room}</td><td><span class="badge success">Active</span></td></tr>
    `).join("");
    byId("manage-services").innerHTML = services().map((service) => `
      <tr><td>${service.name}</td><td>${service.duration} min</td><td>${money(service.price)}</td><td>${service.capacity} per slot</td></tr>
    `).join("");
    byId("admin-queue").innerHTML = sortedQueue().map((entry, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${entry.ticket}</strong></td>
        <td>${entry.name}</td>
        <td>${serviceById(entry.serviceId).name}</td>
        <td><span class="badge ${entry.priority === "urgent" ? "danger" : "neutral"}">${entry.priority}</span></td>
      </tr>
    `).join("") || emptyRow(5, "No patients are currently waiting.");

    const busiestService = serviceById(topKey(countBy(allAppointments(), (item) => item.serviceId)) || "general").name;
    const busiestTime = topKey(countBy(allAppointments(), (item) => item.time)) || "09:00";
    byId("analytics-grid").innerHTML = [
      statCard("Busiest service", busiestService, "by bookings"),
      statCard("Busiest time", busiestTime, "most requested slot"),
      statCard("Completion rate", `${completionRate}%`, "today"),
      statCard("Payment capture", `${paidRate}%`, "paid appointment ratio"),
    ].join("");
    renderAdminEnhancements(revenueToday, averageWait, completionRate);
    renderAdminCustomization();
    bindAdminQueueControls();
  }

  function renderAdminEnhancements(revenueToday, averageWait, completionRate) {
    const queueActivity = byId("queue-activity");
    if (queueActivity) {
      queueActivity.innerHTML = sortedQueue().slice(0, 5).map((entry, index) => `
        <div class="activity-item">
          <span class="queue-number">${index + 1}</span>
          <div><strong>${esc(entry.ticket)} - ${esc(entry.name)}</strong><small>${serviceById(entry.serviceId).name} · ${estimateWait(entry)} min estimate</small></div>
          <span class="badge ${entry.priority === "urgent" ? "danger" : "neutral"}">${entry.priority}</span>
        </div>
      `).join("") || `<div class="empty-state">No queue activity.</div>`;
    }
    const adminNotifications = byId("admin-notifications");
    if (adminNotifications) renderNotifications("admin", "admin-notifications");
    const doctorActivity = byId("doctor-activity");
    if (doctorActivity) {
      doctorActivity.innerHTML = doctors().map((doctor) => {
        const count = allAppointments().filter((item) => item.doctorId === doctor.id).length;
        const completed = allAppointments().filter((item) => item.doctorId === doctor.id && item.status === "completed").length;
        return `<tr><td>${doctor.name}</td><td>${doctor.specialty}</td><td>${doctor.room}</td><td>${count}</td><td><span class="badge ${completed ? "success" : "warning"}">${completed} completed</span></td></tr>`;
      }).join("");
    }
    const trend = byId("revenue-trend");
    if (trend) {
      const values = [410, 520, 460, 620, 580, 740, Math.max(280, revenueToday)];
      const max = Math.max(...values);
      trend.innerHTML = values.map((value, index) => `
        <div class="trend-bar" style="height:${Math.round((value / max) * 100)}%">
          <span>${money(value)}</span><small>D${index + 1}</small>
        </div>
      `).join("");
    }
    const activity = byId("system-activity");
    if (activity) {
      activity.innerHTML = [
        { type: "Analytics", message: `Completion rate is ${completionRate}% and average wait is ${averageWait} min`, createdAt: timeLabel() },
        ...activityLog(),
      ].slice(0, 7).map((item) => `
        <div class="activity-item">
          <span class="badge info">${esc(item.type)}</span>
          <div><strong>${esc(item.message)}</strong><small>${esc(formatNotificationTime(item.createdAt))}</small></div>
        </div>
      `).join("");
    }
  }

  function bindAdminQueueControls() {
    if (byId("admin-call-next")) byId("admin-call-next").onclick = () => {
      const next = sortedQueue()[0];
      showModal("Calling next patient", next ? `${next.ticket} - ${next.name} should proceed to reception.` : "No patients are waiting.");
      if (next) logActivity("Queue", `${next.name} called by admin`);
      renderAdminDashboard();
    };
    if (byId("admin-add-urgent")) byId("admin-add-urgent").onclick = () => {
      const entry = {
        id: uid("q"),
        ticket: `Q-${String(queueEntries().length + 30).padStart(3, "0")}`,
        name: "Urgent Walk-in",
        serviceId: "general",
        priority: "urgent",
        joinedAt: Date.now(),
      };
      write(STORAGE.queue, [...queueEntries(), entry]);
      addNotification("admin", "Urgent walk-in added to queue control.", "warning");
      logActivity("Queue", "Urgent walk-in added by admin");
      renderAdminDashboard();
    };
    if (byId("admin-mark-served")) byId("admin-mark-served").onclick = () => {
      const next = sortedQueue()[0];
      if (!next) return showModal("Queue control", "No waiting patient to mark served.");
      write(STORAGE.queue, queueEntries().filter((entry) => entry.id !== next.id));
      addNotification("admin", `${next.ticket} marked served.`, "success");
      logActivity("Queue", `${next.name} marked served by admin`);
      renderAdminDashboard();
    };
  }

  function renderAdminCustomization() {
    if (!byId("customization-form")) return;
    const settings = customization();
    byId("clinic-name").value = settings.clinicName;
    byId("hero-tagline").value = settings.tagline;
    byId("accent-color").value = settings.accentColor;
    byId("banners-enabled").checked = settings.bannersEnabled;
    byId("feature-list").innerHTML = settings.featureCards.map((card) => `
      <div class="management-row">
        <div><strong>${esc(card.title)}</strong><small>${esc(card.description)}</small></div>
        <div class="button-row"><button class="btn small" data-edit-feature="${card.id}" type="button">Edit</button><button class="btn small ghost" data-delete-feature="${card.id}" type="button">Delete</button></div>
      </div>
    `).join("");
    byId("banner-list").innerHTML = settings.banners.map((banner) => `
      <div class="management-row">
        <div><strong>${esc(banner.title)}</strong><small>${esc(banner.description)}</small></div>
        <span class="badge ${banner.active === false ? "neutral" : "live"}">${banner.active === false ? "Off" : "Live"}</span>
        <div class="button-row"><button class="btn small" data-edit-banner="${banner.id}" type="button">Edit</button><button class="btn small ghost" data-delete-banner="${banner.id}" type="button">Delete</button></div>
      </div>
    `).join("");
    bindCustomizationControls();
  }

  function bindCustomizationControls() {
    byId("customization-form").onsubmit = (event) => {
      event.preventDefault();
      saveCustomization({
        clinicName: byId("clinic-name").value.trim() || "Cedar Care Clinic",
        tagline: byId("hero-tagline").value.trim() || defaultCustomization().tagline,
        accentColor: byId("accent-color").value,
        bannersEnabled: byId("banners-enabled").checked,
      });
      addNotification("admin", "Platform branding settings saved.", "success");
      logActivity("Customization", "Branding settings updated");
      showMessage("customization-result", "Customization settings saved and applied.", "success");
      renderAdminCustomization();
    };
    byId("feature-form").onsubmit = (event) => {
      event.preventDefault();
      const settings = customization();
      const id = byId("feature-id").value || uid("fc");
      const nextCard = {
        id,
        title: byId("feature-title").value.trim(),
        description: byId("feature-description").value.trim(),
        link: byId("feature-link").value.trim() || "services.html",
      };
      saveCustomization({
        featureCards: settings.featureCards.some((card) => card.id === id)
          ? settings.featureCards.map((card) => card.id === id ? nextCard : card)
          : [nextCard, ...settings.featureCards],
      });
      event.target.reset();
      byId("feature-id").value = "";
      logActivity("Customization", `${nextCard.title} feature card saved`);
      renderAdminCustomization();
    };
    byId("banner-form").onsubmit = (event) => {
      event.preventDefault();
      const settings = customization();
      const id = byId("banner-id").value || uid("bn");
      const nextBanner = {
        id,
        title: byId("banner-title").value.trim(),
        description: byId("banner-description").value.trim(),
        active: byId("banner-active").checked,
      };
      saveCustomization({
        banners: settings.banners.some((banner) => banner.id === id)
          ? settings.banners.map((banner) => banner.id === id ? nextBanner : banner)
          : [nextBanner, ...settings.banners],
      });
      event.target.reset();
      byId("banner-id").value = "";
      byId("banner-active").checked = true;
      logActivity("Customization", `${nextBanner.title} banner saved`);
      renderAdminCustomization();
    };
    document.querySelectorAll("[data-edit-feature]").forEach((button) => {
      button.onclick = () => {
        const card = customization().featureCards.find((item) => item.id === button.dataset.editFeature);
        if (!card) return;
        byId("feature-id").value = card.id;
        byId("feature-title").value = card.title;
        byId("feature-description").value = card.description;
        byId("feature-link").value = card.link;
      };
    });
    document.querySelectorAll("[data-delete-feature]").forEach((button) => {
      button.onclick = () => {
        saveCustomization({ featureCards: customization().featureCards.filter((card) => card.id !== button.dataset.deleteFeature) });
        renderAdminCustomization();
      };
    });
    document.querySelectorAll("[data-edit-banner]").forEach((button) => {
      button.onclick = () => {
        const banner = customization().banners.find((item) => item.id === button.dataset.editBanner);
        if (!banner) return;
        byId("banner-id").value = banner.id;
        byId("banner-title").value = banner.title;
        byId("banner-description").value = banner.description;
        byId("banner-active").checked = banner.active !== false;
      };
    });
    document.querySelectorAll("[data-delete-banner]").forEach((button) => {
      button.onclick = () => {
        saveCustomization({ banners: customization().banners.filter((banner) => banner.id !== button.dataset.deleteBanner) });
        renderAdminCustomization();
      };
    });
  }

  function payrollRows() {
    const appointments = allAppointments().filter((item) => item.status === "completed");
    return doctors().map((doctor) => {
      const doctorAppointments = appointments.filter((item) => item.doctorId === doctor.id);
      const revenue = doctorAppointments.reduce((sum, item) => sum + appointmentRevenue(item), 0);
      const bonus = Math.round(revenue * doctor.commissionRate);
      const status = payrollStatuses().find((item) => item.doctorId === doctor.id) || { status: "Pending", availableDate: today() };
      return { doctor, count: doctorAppointments.length, revenue, bonus, total: doctor.baseSalary + bonus, status };
    });
  }

  function payrollActionButton(row) {
    if (row.status.status === "Paid") {
      return `<button class="btn small complete" type="button" disabled>Payment Completed</button>`;
    }
    const label = row.status.status === "Approved" ? "Mark as Paid" : "Approve Salary";
    return `<button class="btn small" data-approve="${row.doctor.id}" type="button">${label}</button>`;
  }

  function expenseCategoryDetails() {
    return {
      "Medical supplies": [
        { label: "Gloves", amount: 120 },
        { label: "Masks", amount: 90 },
        { label: "Lab materials", amount: 410 },
      ],
      Rent: [
        { label: "Clinic rent", amount: 1500 },
        { label: "Utilities", amount: 300 },
      ],
      Software: [
        { label: "Booking tools", amount: 80 },
        { label: "Accounting software", amount: 70 },
      ],
      Utilities: [
        { label: "Electricity", amount: 180 },
        { label: "Water", amount: 55 },
        { label: "Internet", amount: 45 },
      ],
      Maintenance: [
        { label: "Equipment service", amount: 260 },
        { label: "Facility repairs", amount: 140 },
      ],
    };
  }

  function renderAccountantDashboard() {
    if (!byId("accountant-dashboard")) return;
    const appointments = allAppointments();
    const revenueToday = appointments.filter((item) => item.date === today() && item.paid).reduce((sum, item) => sum + appointmentRevenue(item), 0);
    const monthlyRevenue = appointments.filter((item) => item.paid).reduce((sum, item) => sum + appointmentRevenue(item), 0) * 8;
    const expenseTotal = expenses().reduce((sum, item) => sum + Number(item.amount), 0);
    const paidAppointments = appointments.filter((item) => item.paid);
    const unpaidAppointments = appointments.filter((item) => !item.paid);
    const unpaid = unpaidAppointments.length;

    byId("accountant-stats").innerHTML = [
      statCard("Revenue today", money(revenueToday), "paid visits"),
      statCard("Monthly revenue", money(monthlyRevenue), "simulated projection"),
      statCard("Expenses", money(expenseTotal), "this month"),
      statCard("Net profit", money(monthlyRevenue - expenseTotal), "after expenses"),
      statCard("Unpaid", unpaid, "open invoices"),
    ].join("");

    byId("billing-status").innerHTML = appointments.slice(0, 8).map((item) => `
      <tr><td>${item.reference}</td><td>${item.patientName}</td><td>${serviceById(item.serviceId).name}</td><td>${money(appointmentRevenue(item))}</td><td><span class="badge ${item.paid ? "success" : "warning"}">${item.paid ? "Paid" : "Unpaid"}</span></td></tr>
    `).join("");
    byId("revenue-doctor").innerHTML = doctors().map((doctor) => {
      const revenue = appointments.filter((item) => item.doctorId === doctor.id && item.paid).reduce((sum, item) => sum + appointmentRevenue(item), 0);
      return `<tr><td>${doctor.name}</td><td>${doctor.specialty}</td><td>${money(revenue)}</td></tr>`;
    }).join("");
    byId("revenue-service").innerHTML = services().map((service) => {
      const revenue = appointments.filter((item) => item.serviceId === service.id && item.paid).reduce((sum, item) => sum + appointmentRevenue(item), 0);
      return `<tr><td>${service.name}</td><td>${money(revenue)}</td><td>${service.avgWait} min avg wait</td></tr>`;
    }).join("");
    const paymentSummary = byId("payment-summary");
    if (paymentSummary) {
      const paidAmount = paidAppointments.reduce((sum, item) => sum + appointmentRevenue(item), 0);
      const unpaidAmount = unpaidAppointments.reduce((sum, item) => sum + appointmentRevenue(item), 0);
      paymentSummary.innerHTML = [
        statCard("Paid appointments", paidAppointments.length, money(paidAmount)),
        statCard("Unpaid appointments", unpaidAppointments.length, money(unpaidAmount)),
      ].join("");
      byId("payment-status-table").innerHTML = `
        <tr><td><span class="badge success">Paid</span></td><td>${paidAppointments.length}</td><td>${money(paidAmount)}</td></tr>
        <tr><td><span class="badge warning">Pending</span></td><td>${unpaidAppointments.length}</td><td>${money(unpaidAmount)}</td></tr>
      `;
    }
    byId("payroll-table").innerHTML = payrollRows().map((row) => `
      <tr>
        <td>${row.doctor.name}</td>
        <td>${row.count}</td>
        <td>${money(row.revenue)}</td>
        <td>${money(row.doctor.baseSalary)}</td>
        <td>${money(row.bonus)}</td>
        <td><strong>${money(row.total)}</strong></td>
        <td>${row.status.availableDate}</td>
        <td><span class="badge ${row.status.status === "Paid" ? "success" : row.status.status === "Approved" ? "info" : "warning"}">${row.status.status}</span></td>
        <td>${payrollActionButton(row)}</td>
      </tr>
    `).join("");
    byId("expenses-table").innerHTML = expenses().map((expense) => `
      <tr><td>${expense.date}</td><td>${expense.category}</td><td>${expense.description}</td><td>${money(expense.amount)}</td></tr>
    `).join("");
    const payrollCards = byId("payroll-cards");
    if (payrollCards) {
      const rows = payrollRows();
      const pending = rows.filter((row) => row.status.status === "Pending").length;
      const approved = rows.filter((row) => row.status.status === "Approved").length;
      const totalPayroll = rows.reduce((sum, row) => sum + row.total, 0);
      payrollCards.innerHTML = [
        statCard("Payroll total", money(totalPayroll), "base salary plus commission"),
        statCard("Pending salaries", pending, "waiting for approval"),
        statCard("Approved salaries", approved, "ready for payment"),
        statCard("Commission pool", money(rows.reduce((sum, row) => sum + row.bonus, 0)), "earned bonuses"),
      ].join("");
    }
    const expenseBreakdown = byId("expense-breakdown");
    if (expenseBreakdown) {
      const totals = expenses().reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
        return acc;
      }, {});
      const max = Math.max(...Object.values(totals), 1);
      expenseBreakdown.innerHTML = Object.entries(totals).map(([category, amount]) => `
        <div class="breakdown-row"><div><strong>${esc(category)}</strong><small>${money(amount)}</small></div><div class="progress-line"><span style="width:${Math.round((amount / max) * 100)}%"></span></div></div>
      `).join("");
    }
    const expenseDetails = byId("expense-details");
    if (expenseDetails) {
      const totals = expenses().reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
        return acc;
      }, {});
      const details = expenseCategoryDetails();
      expenseDetails.innerHTML = Object.keys(totals).map((category) => {
        const rows = details[category] || [{ label: "Recorded expense", amount: totals[category] }];
        return `
          <div class="detail-group">
            <div class="split-line"><strong>${esc(category)}</strong><span class="badge neutral">${money(totals[category])}</span></div>
            ${rows.map((row) => `<div class="detail-row"><span>${esc(row.label)}</span><strong>${money(row.amount)}</strong></div>`).join("")}
          </div>
        `;
      }).join("");
      applyExpenseDetailsState();
    }
    const financeSummary = byId("finance-summary");
    if (financeSummary) {
      const paid = appointments.filter((item) => item.paid).length;
      const unpaidCount = appointments.filter((item) => !item.paid).length;
      financeSummary.innerHTML = `
        <div class="summary-panel"><strong>${money(monthlyRevenue - expenseTotal)}</strong><span>Projected net profit</span></div>
        <div class="summary-panel"><strong>${paid}</strong><span>Paid appointments</span></div>
        <div class="summary-panel"><strong>${unpaidCount}</strong><span>Pending payments</span></div>
      `;
    }

    document.querySelectorAll("[data-approve]").forEach((button) => {
      button.addEventListener("click", () => {
        const current = payrollStatuses().find((item) => item.doctorId === button.dataset.approve);
        const nextStatus = current?.status === "Approved" ? "Paid" : "Approved";
        const updated = payrollStatuses().map((item) => item.doctorId === button.dataset.approve ? { ...item, status: nextStatus } : item);
        write(STORAGE.payroll, updated);
        const message = nextStatus === "Paid" ? "Payment marked as completed." : "Salary approved successfully.";
        addNotification("accountant", message, "success");
        showMessage("payroll-result", message, "success");
        logActivity("Payroll", message);
        renderAccountantDashboard();
      });
    });

    byId("expense-form").onsubmit = (event) => {
      event.preventDefault();
      const expense = {
        id: uid("e"),
        date: byId("expense-date").value || today(),
        category: byId("expense-category").value,
        description: byId("expense-description").value.trim(),
        amount: Number(byId("expense-amount").value),
      };
      write(STORAGE.expenses, [expense, ...expenses()]);
      showMessage("expense-result", "Expense added to the monthly table.", "success");
      event.target.reset();
      renderAccountantDashboard();
    };
    byId("expense-date").value = today();
  }

  function applyExpenseDetailsState() {
    const details = byId("expense-details");
    const button = document.querySelector('[data-expense-toggle="details"]');
    if (!details || !button) return;
    const isOpen = uiState().expenseDetailsOpen === true;
    details.hidden = false;
    details.classList.toggle("is-open", isOpen);
    details.setAttribute("aria-hidden", String(!isOpen));
    button.textContent = isOpen ? "Hide Details" : "Show Details";
    button.setAttribute("aria-expanded", String(isOpen));
  }

  function initExpenseDetailsToggle() {
    const button = document.querySelector('[data-expense-toggle="details"]');
    if (!button) return;
    button.onclick = () => {
      const nextOpen = uiState().expenseDetailsOpen !== true;
      setUiState("expenseDetailsOpen", nextOpen);
      applyExpenseDetailsState();
    };
    applyExpenseDetailsState();
  }

  function initLogin() {
    const form = byId("login-form");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const role = byId("login-role").value;
      const routes = {
        patient: "dashboards/dashboard-patient.html",
        doctor: "dashboards/dashboard-doctor.html",
        admin: "dashboards/dashboard-admin.html",
        accountant: "dashboards/dashboard-accountant.html",
      };
      window.location.href = routes[role];
    });
  }

  function applyQueryPrefill() {
    const params = new URLSearchParams(window.location.search);
    const service = params.get("service");
    if (!service) return;
    const bookingService = byId("booking-service");
    const queueService = byId("queue-service");
    if (bookingService) {
      bookingService.value = service;
      renderDoctorOptions(service, byId("booking-doctor"));
      renderSlots();
    }
    if (queueService) queueService.value = service;
  }

  function initShell() {
    document.querySelectorAll("[data-year]").forEach((element) => {
      element.textContent = new Date().getFullYear();
    });
    document.querySelectorAll("[data-active]").forEach((link) => {
      if (link.getAttribute("href") === location.pathname.split("/").pop()) link.classList.add("active");
    });
  }

  function initExpandableSections() {
    document.querySelectorAll("[data-expand-target]").forEach((button) => {
      button.onclick = () => {
        const target = byId(button.dataset.expandTarget);
        if (!target) return;
        target.hidden = !target.hidden;
        button.textContent = target.hidden ? "Show Details" : "Hide Details";
      };
    });
    initExpenseDetailsToggle();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initShell();
    applyCustomization();
    renderIndexPage();
    initIndexInteractions();
    renderServicesPage();
    initBooking();
    initQueue();
    initLogin();
    renderPatientDashboard();
    renderDoctorDashboard();
    renderAdminDashboard();
    renderAccountantDashboard();
    applyQueryPrefill();
    initExpandableSections();
  });
})();
