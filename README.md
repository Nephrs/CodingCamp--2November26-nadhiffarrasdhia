# 🌸 To-Do List Life Dashboard

A clean, aesthetic, and mobile-friendly **Life Dashboard** built with pure Vanilla HTML, CSS, and JavaScript — no frameworks, no dependencies, no build step required. Designed to help users stay organised, focused, and productive throughout the day with a real-time clock & greeting, Pomodoro focus timer, interactive to-do list, and customisable quick links.

---

## ✨ Features

### 🎯 Core Features (MVP)

| Feature | Description |
|---|---|
| **Live Clock & Dynamic Greeting** | Displays current time in `HH:MM:SS`, full date, and context-aware greeting ("Good Morning / Afternoon / Evening"). |
| **Focus Timer (Pomodoro)** | Interactive countdown timer with Start, Stop, and Reset. Shows a visual banner + browser notification when complete. |
| **To-Do List (Full CRUD)** | Add, inline-edit, mark as completed (strikethrough), and delete daily tasks. Scrollable container. |
| **Quick Links Manager** | Save favourite website shortcuts with custom labels; opens in new tab. Delete badges individually. |
| **Client-Side Persistence** | All data (tasks, links, name, theme, timer duration) stored via the browser `LocalStorage` API — survives page refreshes. |

---

### 🌟 Optional Challenges — All 5 Implemented

1. 🌓 **Light / Dark Pink Mode Toggle** — Switch between Soft Pastel Light Pink and Deep Magenta/Rose Dark theme. Preference saved to LocalStorage.
2. 👤 **Custom Name Greeting** — Click the ✏️ pencil icon to personalise your greeting name (e.g. *"Good Morning, Nadhif!"*). Saved to LocalStorage.
3. ⏱️ **Adjustable Pomodoro Duration** — Choose from preset buttons (15m, 25m, 45m) or enter a custom duration (1–120 min).
4. 🚫 **Duplicate Task Prevention** — Built-in case-insensitive validation blocks adding a task that already exists, with a toast alert.
5. 🔀 **Task Sorting System** — Sort tasks by: *Date Added (default)*, *Alphabetical (A–Z)*, or *Completion Status*.

---

## 🎨 Color Palette

Designed with a modern soft-pastel pink aesthetic using CSS Custom Properties:

| Token | Value | Role |
|---|---|---|
| `--bg-main` | `#FDE8F4` | Page background (light mode) |
| `--card-bg` | `#FFFFFF` | Card container background |
| `--card-sub` | `#F9D0E7` | Sub-card / badge background |
| `--accent-secondary` | `#F4B2D8` | Subtle buttons / borders |
| `--accent-primary` | `#EE94C9` | Main CTA buttons |
| `--accent-dark` | `#E476BA` | Text highlights / active states |
| `--text-main` | `#2D232E` | High-contrast body text |
| `--text-muted` | `#6B5B6E` | Labels / subtitles |
| `--danger-color` | `#FF5A5A` | Delete actions |

**Dark Mode** shifts to deep magenta (`#2B1625`) background and dark plum (`#3D2036`) cards.

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| **HTML5** | Semantic structure, ARIA accessibility attributes |
| **CSS3** | Responsive Grid/Flexbox layout, CSS Variables, animations |
| **Vanilla JavaScript ES6+** | DOM manipulation, LocalStorage API, intervals, closures |

> **Zero dependencies** — no React, Vue, Angular, jQuery, or any external library required.

---

## 📁 Repository Structure

```
├── index.html          # Main HTML entry point
├── css/
│   └── style.css       # Single stylesheet (Design System + Responsive)
├── js/
│   └── script.js       # Single JS file (all application logic)
├── .kiro/              # Kiro IDE configuration & AWS Builder ID metadata
└── README.md           # Project documentation (this file)
```

---

## 🚀 Running Locally

1. **Clone** or download this repository:
   ```bash
   git clone https://github.com/<your-username>/<your-repo>.git
   ```
2. Open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari).
3. *(Optional)* Use the **VS Code Live Server** extension for hot-reload at `http://localhost:5500`.

No `npm install`, no build tools — just open and go.

---

## 🌐 GitHub Pages Deployment

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set source branch to `main` (or `master`) and folder to `/ (root)`.
4. Your dashboard will be live at `https://<username>.github.io/<repo-name>/`.

All asset paths are relative, ensuring full compatibility with GitHub Pages root and subpath hosting.

---

## 🔧 First-Load Seed Data

When the app is opened for the first time (empty LocalStorage), it auto-populates with:

**Tasks:**
- `belanja` — uncompleted
- `belajar` — completed

**Quick Links:**
- Google → `https://google.com`
- Gmail → `https://mail.google.com`
- Calendar → `https://calendar.google.com`

---

## ♿ Accessibility

- Semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<ul>`, `<li>`)
- ARIA labels on interactive controls and live regions (`aria-live`, `aria-label`, `role`)
- Keyboard navigation support (Enter/Escape in inputs)
- Visible `:focus-visible` ring for keyboard users
- Colour contrast ratios designed for WCAG AA compliance

> Full WCAG validation requires manual testing with assistive technologies and expert accessibility review.

---

## 📝 License

Built as part of a Software Engineering Course Assignment.  
AWS Builder ID validation metadata preserved in `.kiro/` directory.
