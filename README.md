# MediQueue

MediQueue is a full-stack clinic booking, queue, and management platform MVP built with HTML, CSS, JavaScript, Node.js, and Express.js. The platform simulates a modern healthcare SaaS application with appointment scheduling, live queue tracking, role-based dashboards, analytics, notifications, and persistent booking workflows powered by a backend REST API.

## Features

- Online appointment booking with capacity-aware scheduling
- Slot availability checks by service, doctor, date, and time
- Local double-booking prevention for the same patient time slot
- Live queue joining with ticket generation
- Urgent patient priority sorting and estimated wait times
- Role-based demo dashboards for patients, doctors, admins, and accountants
- Patient history with previous visits, doctor notes, and follow-up recommendations
- Doctor workflow for viewing appointments, saving notes, and marking visits completed
- Admin analytics for appointments, queues, active doctors, revenue, wait time, and capacity
- Accountant dashboard with billing status, revenue reports, expenses, and simulated payroll approvals
- Notification simulation inside the UI
- Responsive SaaS-style layouts with cards, tables, and dashboard sidebars
- Interactive homepage queue preview with call-next, urgent patient, and served actions
- Admin platform customization for clinic name, hero tagline, accent color, homepage features, and promotional banners
- System activity log, revenue trend previews, queue activity, and richer role dashboards

## Technologies Used

- HTML
- CSS
- JavaScript
- localStorage
- Static mock data
- Node.js
- Express
- CORS
- Node.js
- Express.js
- REST API

No React, frontend framework, database, or authentication system is used yet.

## Dashboard Roles

- Patient: upcoming appointments, queue status, notifications, history, previous visits, and doctor notes.
- Doctor: today's appointments, next patient, appointment completion, patient history preview, and note entry.
- Admin: clinic overview, doctor and service management tables, queue control, capacity settings, and analytics.
- Admin customization: homepage feature cards, promotional banners, brand accent color, clinic name, and homepage tagline.
- Accountant: revenue overview, billing status, doctor revenue, service revenue, payroll approval, expense breakdowns, and monthly finance summaries.

## System Architecture Overview

- `assets/js/data.js` contains mock data for doctors, patients, services, appointments, queue entries, notifications, expenses, payroll, and time slots.
- `assets/js/app.js` contains shared frontend logic for rendering pages, calculating dashboard statistics, checking booking capacity, sorting queue entries, saving localStorage state, and simulating notifications.
- `assets/js/app.js` also manages local customization settings, interactive queue actions, expandable dashboard panels, activity logs, and simulated modal feedback.
- `assets/css/style.css` contains the shared responsive design system for public pages and dashboard pages.
- HTML files are static page shells that load the shared data and application scripts.
- `backend/server.js` starts the independent Express API on port 5000.
- `backend/data/mockData.json` stores backend mock data.
- `backend/routes/` contains REST route modules for services, doctors, appointments, queue, patients, and finance.

localStorage is used for:

- New bookings
- Queue entries
- Doctor notes
- Completed appointments
- Notifications
- Expenses
- Payroll status updates
- Platform customization settings
- Homepage queue preview state
- System activity logs

## File Structure

```text
MediQueue/
  index.html
  services.html
  booking.html
  queue.html
  login.html
  dashboards/
    dashboard-patient.html
    dashboard-doctor.html
    dashboard-admin.html
    dashboard-accountant.html
  assets/
    css/
      style.css
    js/
      app.js
      data.js
    images/
  backend/
    server.js
    package.json
    data/
      mockData.json
    routes/
      services.js
      doctors.js
      appointments.js
      queue.js
      patients.js
      finance.js
  README.md
  .gitignore
```

## Running Locally

Open `index.html` directly in a browser, or serve the folder with a simple static server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Running the Backend

The backend is independent for now. The frontend still uses localStorage and does not require the backend to run.

```bash
cd backend
npm install
npm start
```

The backend runs at:

```text
http://localhost:5000
```

Available API routes:

- `GET /api/services`
- `GET /api/doctors`
- `GET /api/appointments`
- `POST /api/appointments`
- `PATCH /api/appointments/:id/complete`
- `GET /api/queue`
- `POST /api/queue`
- `GET /api/patients`
- `GET /api/finance`
- `PATCH /api/finance/payroll/:id/status`

## Backend Features

- Express.js REST API
- Persistent appointment booking workflow
- API-based frontend data loading
- Booking validation and duplicate prevention
- JSON-based data persistence
- Backend fallback support for frontend resilience

## Future Improvements

- Add real authentication and session handling
- Connect the frontend screens to the Express API
- Add a real database
- Add calendar views for doctors and admins
- Add invoice export and printable receipts
- Add patient search and filtering
- Add role permissions and audit logs
- Add automated tests for booking, queue, and payroll calculations
