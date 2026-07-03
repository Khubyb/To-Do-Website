# TODO — Organize Your Day

A clean, fast, single-page task manager built with React. Sign up, log in, and manage your daily tasks, projects, and reminders — all from a distraction-free interface with light and dark themes.

## Features

- **Account system** — Sign up with first name, last name, and email; log in/out with a saved session.
- **Task management** — Add tasks with due date, due time, and priority. Mark complete, edit, or delete tasks.
- **Views / navigation** — Browse tasks by **Today**, **Upcoming**, **Labels**, **Completed**, or **All Tasks**, with live counts for each.
- **Labeled reminders** — Mark a task as a label/reminder; it resurfaces in a popup reminder when the app is reopened.
- **Due date badges** — Tasks show a friendly due date/time badge (e.g. "fri, 31 jul, 12:59pm"), with visual states for **today** and **overdue** tasks.
- **Projects** — Create up to a set number of projects, each with multiple members, a designated leader, and per-member task assignments. Edit or delete projects anytime.
- **Account settings (drawer menu)**
  - Update username
  - Update email
  - Update password
  - Toggle light/dark theme
  - Log out
- **Light & dark themes** — Full theme support, saved across sessions.
- **Toast notifications** — Instant feedback when tasks are added, completed, or removed.
- **Responsive UI** — Smooth animations for adding, completing, and removing tasks.

## Tech Stack

- **React 18** (via CDN, no build step required)
- **Babel Standalone** — compiles JSX directly in the browser
- **Vanilla CSS** — custom styling with CSS variables for theming (`styles.css`)
- **Google Fonts** — Fraunces, Inter, and JetBrains Mono
- **Browser `localStorage`** — used for all data persistence (no backend/server)

## Project Structure

```
├── index.html      # Entry point — loads React, Babel, fonts, and app.jsx
├── app.jsx         # All application logic and UI (React components)
├── styles.css       # All styling, themes, and animations
├── logo.png         # App icon / favicon
└── README.md        # This file
```

## How Data Is Stored

This app has **no backend server or database**. All data — accounts, tasks, and projects — is stored locally in the browser using `localStorage`, under these keys:

| Key | Purpose |
|---|---|
| `field-notes-users` | All registered user accounts (name, email, password) |
| `field-notes-session` | The currently logged-in user |
| `field-notes-theme` | Saved light/dark theme preference |
| `field-notes-todos-<username>` | Tasks belonging to a specific user |
| `field-notes-project-<username>` | Projects belonging to a specific user |

**Important:** Because data lives in `localStorage`, it is specific to each browser/device. Accounts and tasks created on one browser will not appear on another, and clearing browser data will erase them permanently. There is currently no cloud sync or server-side storage.

## Running Locally

No installation or build tools required:

1. Download/clone all project files into one folder (`index.html`, `app.jsx`, `styles.css`, `logo.png`).
2. Open `index.html` directly in a browser, **or** serve the folder with any static file server (e.g. VS Code Live Server) for best results.
3. Sign up for a new account and start adding tasks.

## Deployment

This is a static site, so it can be deployed for free on services like:

- **Netlify** — drag-and-drop the project folder to get a live URL instantly.
- **GitHub Pages** — push the files to a repository and enable Pages.
- **Firebase Hosting** — deploy via the Firebase CLI.

Once deployed, the site can be submitted to **Google Search Console** for indexing, and **Google Analytics** can be added to track visitor traffic.

## Known Limitations

- No real backend — all accounts/data are local to each browser (not a real multi-device account system).
- No password recovery/reset via email (no email-sending backend).
- No cross-device sync.

## Future Improvements (Ideas)

- Move accounts/tasks to a real backend (e.g. Firebase, Supabase) for proper multi-device accounts.
- Add password reset via email.
- Add task search and filtering by category/priority.
- Add recurring tasks.
