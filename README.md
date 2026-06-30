# To-Do-Website
# To-Do Dashboard

A premium, professional React dashboard application for managing tasks and projects, built to replicate a polished violet-lavender mockup design. It's a fully working product — not just a static visual clone — with real-time metrics, charts, and a complete task/project management workflow.

## Tech Stack

- **React + Vite** with **TypeScript**
- **Vanilla CSS** (CSS custom properties / variables for theming)
- **lucide-react** for icons
- Google Fonts — **Plus Jakarta Sans**

## Features

- Add, edit, and complete tasks with live updates across the dashboard
- Project list with per-project goals and completion tracking
- Animated SVG circular progress ring, sparkline charts, and a custom donut chart for project distribution
- Interactive calendar view for scheduling tasks
- Notes section with tags
- Light/Dark mode toggle via CSS variables
- Fully responsive layout with a mobile menu drawer

## Project Structure
todo-dashboard/
├── index.html                     # Meta tags, viewport, SEO, Google Fonts, document title
├── src/
│   ├── index.css                  # Global design system: CSS variables, color scheme, dark mode, typography
│   ├── App.tsx                    # App shell: global state (tasks, projects, views, theme, search), layout
│   └── components/
│       ├── Sidebar.tsx            # Navigation: Overview, Project, Task, Calendar, Notes, Settings
│       ├── Header.tsx             # Top nav: workspace title, search, notifications, profile
│       ├── Overview.tsx           # Dashboard: weekly focus, progress ring, sparklines, donut chart, activity log
│       ├── TaskManager.tsx        # Full CRUD for tasks: create, status changes, filter, search
│       ├── ProjectManager.tsx     # Add/manage projects, goals, task completion counts
│       ├── CalendarView.tsx       # Calendar grid with scheduled tasks
│       └── NotesManager.tsx       # Notes with tags / rich text
└── package.json
## Architecture Overview

### App Shell (`App.tsx`)
Holds all global state — tasks, projects, the active view, theme (light/dark), and search query — and renders the overall layout: `Sidebar` + `Header` + main content area, swapping views based on navigation.

### Sidebar (`Sidebar.tsx`)
Primary navigation between Overview, Project, Task, Calendar, Notes, and Settings, plus a decorative "Focus on progress..." banner at the bottom.

### Header (`Header.tsx`)
Global top bar with workspace title, a search input that filters tasks live, a notifications widget, and the profile selector.

### Overview (`Overview.tsx`)
The main dashboard, including:
- **Weekly Focus** — tasks completed, ongoing projects, animated circular progress ring
- **Info cards** — Focus Hours, Completed Goals, Notes Created, each with a sparkline chart
- **Task Progress** — dynamic progress bars derived from real task statuses
- **Project Distribution** — donut chart by category (Design, Planning, Research, Review)
- **Today's Activity** — recent task activity log with avatars

### Task Manager (`TaskManager.tsx`)
Full task CRUD: create tasks with description, project, due date, and priority; update status (Todo / In Progress / Completed); filter by project or search.

### Project Manager (`ProjectManager.tsx`)
Create projects, set goals, and track completion counts per project.

### Calendar View (`CalendarView.tsx`)
Calendar grid showing scheduled tasks with quick-scheduling support.

### Notes Manager (`NotesManager.tsx`)
Quick notes with optional tag categories.

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build
```

## Verification Checklist

- [ ] `npm run build` completes successfully
- [ ] Visual accuracy vs. mockup (colors, typography, spacing, border radius, icons, avatars)
- [ ] Completing a task in Task Manager updates Overview metrics in real time (progress ring, sparklines, progress bars)
- [ ] Dark mode toggle works correctly
- [ ] Responsive layout works on mobile (drawer menu, adaptive grids)

## License

Add your preferred license here (e.g., MIT).
