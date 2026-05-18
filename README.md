# MediQueue

MediQueue is a frontend-only MVP for a smart clinic booking, queue, and management platform. It is built as a realistic healthcare SaaS interface for a Computer Science portfolio project, using only HTML, CSS, JavaScript, mock data, and localStorage.

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

No React, backend, database, API, or frontend framework is used.

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

## Future Improvements

- Add real authentication and session handling
- Connect to a backend API and database
- Add calendar views for doctors and admins
- Add invoice export and printable receipts
- Add patient search and filtering
- Add role permissions and audit logs
- Add automated tests for booking, queue, and payroll calculations
