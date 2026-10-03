# dolist. — Your Personal Task Manager

> A focused, minimalist task manager designed with editorial elegance, warm tactile aesthetics, and zero bloat.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)
![Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=flat-square)

---

## 📖 Overview

**dolist.** is a clean, distraction-free productivity app crafted to make daily planning intentional and satisfying. Built with pure vanilla web technologies and an editorial design philosophy, it delivers a fast, responsive, and persistent task management experience right in your browser.

---

## ✨ Features

- **Categorized Workflow**: Organize tasks into dedicated categories—*Work*, *Personal*, *Health*, and *Learning*—with live unread counters.
- **Priority System**: Visual indicator badges and color-coded dots for **High**, **Medium**, and **Low** priorities.
- **Dynamic Progress Tracker**: Real-time progress bar computing task completion percentage and completed-to-total ratios scoped to the active category.
- **Smart Due Dates & Overdue Alerts**: Set due dates with visual alerts highlighting tasks that need immediate attention.
- **Status Filters**: Instantly switch between **All**, **Active**, and **Completed** tasks.
- **Quick Actions**: One-click "Clear completed" to clean up finished items.
- **Local Persistence**: Automatically synchronizes state with `localStorage`, retaining tasks across browser reloads, complete with thoughtful starter tasks for initial load.
- **Keyboard Shortcuts**:
  - `Enter` inside the task input to immediately add a task.
  - `Escape` to close modal/drawer overlays and collapse open forms.
- **Responsive & Accessible**:
  - Full mobile support with a collapsible slide-out drawer navigation and backdrop blur overlay.
  - Accessible semantics with `aria-*` tags, focus states, and screen-reader considerations.

---

## 🎨 Design System & Aesthetics

**dolist.** rejects generic stark interfaces in favor of a warm, paper-inspired editorial look:

| Design Token | Value / Spec | Role |
| :--- | :--- | :--- |
| **Background** | `#F2F0EB` | Warm, muted newsprint tone |
| **Card / Surface** | `#FAFAF7` | Elevated, high-contrast task container |
| **Typography (Display)**| `Libre Baskerville` | Editorial serif for brand & headers |
| **Typography (Body)** | `DM Sans` | Highly legible sans-serif for task lists & controls |
| **Accent Color** | `#D94F1E` | Terracotta warm red for key CTAs and high priority |
| **Border & Dividers** | Subtle alpha borders | Elegant micro-separators without visual noise |

---

## 📁 Project Structure

```text
Todo List Website/
├── index.html       # Semantic HTML5 markup, accessibility attributes & layout
├── style.css        # CSS variables, typography, layout, animations & media queries
├── script.js        # State management, DOM rendering, localStorage sync & event listeners
└── README.md        # Project documentation and guide
```

---

## 🚀 Getting Started

No build tools, bundlers, or package installations required!

### Option 1: Open Directly
Simply double-click [`index.html`](file:///c:/Users/imtia/OneDrive/Desktop/Todo%20List%20Website/index.html) or open it with any modern web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Run with a Local Dev Server
For the best experience (or if using live reloading):

```bash
# Using VS Code Live Server extension (Right click index.html -> 'Open with Live Server')

# OR using Node.js / npx
npx serve .

# OR using Python 3
python -m http.server 8000
```
Then visit `http://localhost:8000` or the port shown in your terminal.

---

## 🛠️ Usage Guide

1. **Add a Task**: Click the **"+ New Task"** button on the top right, enter task text, pick priority, category, and an optional due date, then hit **Add Task** (or press `Enter`).
2. **Complete a Task**: Click the checkbox next to any task to toggle its completed state.
3. **Delete a Task**: Hover over a task card and click the trash can icon on the far right.
4. **Filter by Category**: Click any category in the sidebar to scope your view and track progress for that area.
5. **Filter by Status**: Use the tabs (`All`, `Active`, `Completed`) above the task list.
6. **Edit a Task**: Click **Edit**, change its text, priority, category, or due date, and select **Save changes**. Clear the date field to remove the due date. Cancel leaves the task unchanged.
7. **Undo Deletion**: Click **Undo deletion** after deleting a task or clearing completed tasks. Repeated undo restores earlier deletions during the current page session; reloading clears undo history.
8. **Plan by Date**: **Today** shows unfinished overdue tasks and tasks due today. **Upcoming** shows later due dates in date order. Both work with category and status filters. Undated tasks remain in **All dates**.
9. **Back Up Tasks**: **Export JSON** downloads all tasks. **Import JSON** merges a backup into the list, skips identical tasks, and preserves both versions when an ID conflicts. Invalid backups leave tasks unchanged.

An empty saved list stays empty on reload. If browser storage fails, a warning stays visible until a later save succeeds; export a backup before leaving the page to keep unsaved changes.

Run the dependency-free regression checks with `node --test tests/tasks.test.cjs`.

---

## 💡 Customization

- **Add New Categories**: Open [`script.js`](file:///c:/Users/imtia/OneDrive/Desktop/Todo%20List%20Website/script.js) and add items to the `CATEGORIES` array.
- **Change Color Theme**: Modify `:root` variables at the top of [`style.css`](file:///c:/Users/imtia/OneDrive/Desktop/Todo%20List%20Website/style.css) to tweak background, accent, or priority hues.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
