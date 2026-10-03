/* ============================================================
   dolist. — script.js
   All application logic: state, rendering, event handling,
   localStorage persistence, keyboard shortcuts.
   ============================================================ */

'use strict';

/* ===== CONSTANTS ===== */
var STORAGE_KEY = 'dolist_tasks';

var CATEGORIES = [
  { id: 'all',      label: 'All Tasks' },
  { id: 'work',     label: 'Work'      },
  { id: 'personal', label: 'Personal'  },
  { id: 'health',   label: 'Health'    },
  { id: 'learning', label: 'Learning'  },
];

var PRIORITY_DOT_CLASS   = { high: 'dot-high',   medium: 'dot-medium',   low: 'dot-low'   };
var PRIORITY_BADGE_CLASS = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };

/* ===== SEED DATA (used only when localStorage is empty) ===== */
var SEED_TASKS = [
  {
    id: 'seed-1',
    text: 'Review Q3 design system audit findings',
    completed: false,
    priority: 'high',
    category: 'work',
    dueDate: futureDateStr(3),
    createdAt: Date.now() - 5000,
  },
  {
    id: 'seed-2',
    text: '30-minute run before dinner',
    completed: false,
    priority: 'medium',
    category: 'health',
    dueDate: futureDateStr(1),
    createdAt: Date.now() - 4000,
  },
  {
    id: 'seed-3',
    text: 'Finish chapter 4 of "Thinking, Fast and Slow"',
    completed: true,
    priority: 'low',
    category: 'learning',
    dueDate: futureDateStr(-1),
    createdAt: Date.now() - 3000,
  },
  {
    id: 'seed-4',
    text: 'Buy groceries — olive oil, sourdough, lemons',
    completed: false,
    priority: 'medium',
    category: 'personal',
    dueDate: futureDateStr(1),
    createdAt: Date.now() - 2000,
  },
  {
    id: 'seed-5',
    text: 'Send invoice to Meridian Studio',
    completed: true,
    priority: 'high',
    category: 'work',
    dueDate: futureDateStr(-2),
    createdAt: Date.now() - 1000,
  },
  {
    id: 'seed-6',
    text: 'Schedule dentist appointment',
    completed: false,
    priority: 'low',
    category: 'health',
    dueDate: futureDateStr(8),
    createdAt: Date.now(),
  },
];

/* ===== STATE ===== */
var storageWarning = '';
var tasks          = loadTasks();
var activeCategory = 'all';
var currentFilter  = 'all';
var activeView     = 'all';
var editingId      = null;
var deletionHistory = [];
var formOpen       = false;
var sidebarOpen    = false;

/* ===== HELPERS ===== */

/** Returns an ISO date string offset by `days` from today */
function futureDateStr(days) {
  var d = new Date();
  d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function validDate(value) {
  if (value === '') return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  var date = new Date(value + 'T00:00:00Z');
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateTasks(value) {
  if (!Array.isArray(value)) throw new Error('Expected a task list.');
  var ids = new Set();
  return value.map(function (task) {
    if (!task || typeof task.id !== 'string' || !task.id || ids.has(task.id) ||
        typeof task.text !== 'string' || !task.text.trim() || typeof task.completed !== 'boolean' ||
        !['high', 'medium', 'low'].includes(task.priority) ||
        !CATEGORIES.some(function (cat) { return cat.id !== 'all' && cat.id === task.category; }) ||
        !validDate(task.dueDate == null ? '' : task.dueDate) ||
        typeof task.createdAt !== 'number' || !Number.isFinite(task.createdAt)) {
      throw new Error('Invalid task data.');
    }
    ids.add(task.id);
    return { id: task.id, text: task.text, completed: task.completed, priority: task.priority,
      category: task.category, dueDate: task.dueDate || '', createdAt: task.createdAt };
  });
}

/** Load tasks from localStorage, falling back to seed data */
function loadTasks() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) return validateTasks(JSON.parse(raw));
  } catch (e) {
    storageWarning = 'Saved tasks could not be loaded. Existing browser data has not been changed. Import a backup to recover your tasks.';
    return [];
  }
  return SEED_TASKS.slice(); // return a fresh copy of seed data
}

/** Persist tasks to localStorage */
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    storageWarning = '';
  } catch (e) {
    storageWarning = 'Your browser could not save changes. Keep this page open and export a backup to avoid losing your tasks.';
  }
  renderStorageWarning();
}

function renderStorageWarning() {
  var warning = document.getElementById('storage-warning');
  warning.textContent = storageWarning;
  warning.hidden = !storageWarning;
}

function matchesView(task) {
  if (activeView === 'all') return true;
  if (!task.dueDate) return false;
  var today = futureDateStr(0);
  return activeView === 'today' ? task.dueDate === today || (!task.completed && task.dueDate < today) : task.dueDate > today;
}

/** Generate a unique id */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Format a date string as "Jun 12" */
function formatDate(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr + 'T00:00:00'); // avoid timezone offset
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Returns true if task is past due and not completed */
function isOverdue(dateStr, completed) {
  if (!dateStr || completed) return false;
  var due   = new Date(dateStr + 'T00:00:00');
  var today = new Date(new Date().toDateString()); // midnight today
  return due < today;
}

/** Get tasks filtered by active category and current tab filter */
function getFiltered() {
  return tasks.filter(function (t) {
    var catMatch    = activeCategory === 'all' || t.category === activeCategory;
    var filterMatch = currentFilter === 'all'
                    ? true
                    : currentFilter === 'active'
                    ? !t.completed
                    : t.completed;
    return catMatch && filterMatch && matchesView(t);
  }).sort(function (a, b) {
    return activeView === 'all' ? 0 : a.dueDate.localeCompare(b.dueDate);
  });
}

/* ===== RENDER ===== */

function render() {
  renderStorageWarning();
  document.querySelectorAll('.view-btn').forEach(function (button) {
    button.setAttribute('aria-pressed', button.dataset.view === activeView ? 'true' : 'false');
  });
  renderDate();
  renderProgress();
  renderCategoryNav();
  renderHeader();
  renderFilterTabs();
  renderTaskList();
}

function renderDate() {
  var el = document.getElementById('today-date');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function renderProgress() {
  var catTasks = tasks.filter(function (t) {
    return activeCategory === 'all' || t.category === activeCategory;
  });
  var total = catTasks.length;
  var done  = catTasks.filter(function (t) { return t.completed; }).length;
  var pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById('progress-pct').textContent    = pct + '%';
  document.getElementById('progress-fill').style.width   = pct + '%';
  document.getElementById('progress-sub').textContent    = done + ' of ' + total + ' done';

  var track = document.getElementById('progress-track');
  if (track) track.setAttribute('aria-valuenow', pct);
}

function renderCategoryNav() {
  var nav = document.getElementById('cat-nav');
  nav.innerHTML = '';

  CATEGORIES.forEach(function (cat) {
    var count = tasks.filter(function (t) {
      return (cat.id === 'all' || t.category === cat.id) && !t.completed;
    }).length;

    var btn = document.createElement('button');
    btn.className  = 'cat-btn' + (activeCategory === cat.id ? ' active' : '');
    btn.setAttribute('role', 'listitem');
    btn.setAttribute('aria-current', activeCategory === cat.id ? 'true' : 'false');

    var nameSpan = document.createElement('span');
    nameSpan.textContent = cat.label;
    btn.appendChild(nameSpan);

    if (count > 0) {
      var badge = document.createElement('span');
      badge.className   = 'cat-badge';
      badge.textContent = count;
      btn.appendChild(badge);
    }

    btn.addEventListener('click', (function (catId) {
      return function () {
        activeCategory = catId;
        currentFilter  = 'all'; // reset filter when switching category
        if (sidebarOpen) closeSidebar();
        render();
      };
    })(cat.id));

    nav.appendChild(btn);
  });
}

function renderHeader() {
  var catObj    = CATEGORIES.find(function (c) { return c.id === activeCategory; });
  var catLabel  = catObj ? catObj.label : 'All Tasks';
  document.getElementById('main-title').textContent = activeView === 'all' ? catLabel :
    (activeView === 'today' ? 'Today' : 'Upcoming') + (activeCategory === 'all' ? '' : ' · ' + catLabel);

  var filtered  = getFiltered();
  var remaining = filtered.filter(function (t) { return !t.completed; }).length;
  document.getElementById('main-subtitle').textContent =
    remaining + ' task' + (remaining !== 1 ? 's' : '') + ' remaining' +
    (activeView === 'today' ? ' · Due today and overdue' : activeView === 'upcoming' ? ' · Due after today' : '');
}

function renderFilterTabs() {
  document.querySelectorAll('.filter-tab').forEach(function (tab) {
    var isActive = tab.dataset.filter === currentFilter;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  var doneCount = tasks.filter(function (t) {
    return t.completed && matchesView(t) && (activeCategory === 'all' || t.category === activeCategory);
  }).length;

  document.getElementById('btn-clear').style.display = doneCount > 0 ? '' : 'none';
}

function renderTaskList() {
  var list     = document.getElementById('task-list');
  var footer   = document.getElementById('task-footer');
  var filtered = getFiltered();
  list.innerHTML = '';

  if (filtered.length === 0) {
    footer.style.display = 'none';
    list.appendChild(buildEmptyState());
    return;
  }

  footer.style.display = '';
  footer.textContent   =
    'Showing ' + filtered.length + ' task' + (filtered.length !== 1 ? 's' : '');

  filtered.forEach(function (task) {
    list.appendChild(buildTaskItem(task));
  });
}

/* ===== DOM BUILDERS ===== */

function buildEmptyState() {
  var li = document.createElement('li');
  li.className = 'empty-state';

  var emptyMessages = {
    all:       { title: 'All clear here',       sub: 'Add your first task to get started.' },
    active:    { title: 'Nothing active',        sub: 'All tasks in this view are completed.' },
    completed: { title: 'Nothing completed yet', sub: 'Complete a task to see it here.'     },
  };

  var msg = emptyMessages[currentFilter] || emptyMessages.all;
  if (activeView !== 'all') msg = { title: 'No matching tasks', sub: activeView === 'today' ?
    'No overdue or today tasks match these filters.' : 'No tasks due after today match these filters.' };

  li.innerHTML =
    '<svg class="empty-state-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M9 11l3 3L22 4"/>' +
    '<path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>' +
    '</svg>' +
    '<p class="empty-state-title">' + msg.title + '</p>' +
    '<p class="empty-state-sub">' + msg.sub + '</p>';

  return li;
}

function buildTaskItem(task) {
  var overdue = isOverdue(task.dueDate, task.completed);
  var li      = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' completed' : '');

  /* Checkbox */
  var checkbox = document.createElement('button');
  checkbox.className = 'task-checkbox' + (task.completed ? ' checked' : '');
  checkbox.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
  checkbox.setAttribute('aria-pressed', task.completed ? 'true' : 'false');
  checkbox.innerHTML =
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="20 6 9 17 4 12"/></svg>';
  checkbox.addEventListener('click', (function (id) {
    return function () { toggleTask(id); };
  })(task.id));
  li.appendChild(checkbox);

  /* Content */
  var content = document.createElement('div');
  content.className = 'task-content';

  var textEl = document.createElement('p');
  textEl.className   = 'task-text' + (task.completed ? ' done' : '');
  textEl.textContent = task.text;
  content.appendChild(textEl);

  /* Meta row */
  var meta = document.createElement('div');
  meta.className = 'task-meta';

  // Priority dot
  var priItem = document.createElement('span');
  priItem.className = 'task-meta-item';
  priItem.innerHTML =
    '<span class="dot-sm ' + PRIORITY_DOT_CLASS[task.priority] + '" aria-hidden="true"></span>' +
    task.priority;
  meta.appendChild(priItem);

  // Category
  var catItem = document.createElement('span');
  catItem.className   = 'task-meta-item';
  catItem.textContent = task.category;
  meta.appendChild(catItem);

  // Due date
  if (task.dueDate) {
    var dateItem = document.createElement('span');
    dateItem.className = 'task-meta-item' + (overdue ? ' overdue' : '');
    dateItem.innerHTML =
      '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>' +
      '<line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>' +
      '<line x1="3" y1="10" x2="21" y2="10"/>' +
      '</svg>' +
      (overdue ? 'Overdue · ' : task.dueDate === futureDateStr(0) ? 'Today · ' : '') + formatDate(task.dueDate);
    meta.appendChild(dateItem);
  }

  content.appendChild(meta);
  li.appendChild(content);

  /* Priority badge (right side) */
  var badge = document.createElement('span');
  badge.className   = 'priority-badge ' + PRIORITY_BADGE_CLASS[task.priority];
  badge.textContent = task.priority;
  badge.setAttribute('aria-label', task.priority + ' priority');
  li.appendChild(badge);

  var editBtn = document.createElement('button');
  editBtn.className = 'btn-edit';
  editBtn.textContent = 'Edit';
  editBtn.setAttribute('aria-label', 'Edit task: ' + task.text);
  editBtn.addEventListener('click', function () { editTask(task.id); });
  li.appendChild(editBtn);

  /* Delete button */
  var delBtn = document.createElement('button');
  delBtn.className = 'btn-delete';
  delBtn.setAttribute('aria-label', 'Delete task: ' + task.text);
  delBtn.innerHTML =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="3 6 5 6 21 6"/>' +
    '<path d="M19 6l-1 14H6L5 6"/>' +
    '<path d="M10 11v6"/><path d="M14 11v6"/>' +
    '<path d="M9 6V4h6v2"/>' +
    '</svg>';
  delBtn.addEventListener('click', (function (id) {
    return function () { removeTask(id); };
  })(task.id));
  li.appendChild(delBtn);

  return li;
}

/* ===== ACTIONS ===== */

function openForm() {
  formOpen = true;
  var form = document.getElementById('add-form');
  form.classList.add('visible');
  form.setAttribute('aria-hidden', 'false');
  document.getElementById('btn-new-task').setAttribute('aria-expanded', 'true');
  document.getElementById('new-task-text').focus();
}

function closeForm() {
  editingId = null;
  document.getElementById('form-title').textContent = 'New task';
  document.getElementById('btn-add-task').textContent = 'Add Task';
  formOpen = false;
  var form = document.getElementById('add-form');
  form.classList.remove('visible');
  form.setAttribute('aria-hidden', 'true');
  document.getElementById('btn-new-task').setAttribute('aria-expanded', 'false');
  // Reset form fields
  document.getElementById('new-task-text').value = '';
  document.getElementById('new-due').value        = '';
  document.getElementById('new-priority').value   = 'medium';
  document.getElementById('new-category').value   = 'personal';
  document.getElementById('btn-add-task').disabled = true;
  document.getElementById('btn-new-task').focus();
}

function editTask(id) {
  var task = tasks.find(function (t) { return t.id === id; });
  if (!task) return;
  editingId = id;
  document.getElementById('form-title').textContent = 'Edit task';
  document.getElementById('btn-add-task').textContent = 'Save changes';
  document.getElementById('new-task-text').value = task.text;
  document.getElementById('new-priority').value = task.priority;
  document.getElementById('new-category').value = task.category;
  document.getElementById('new-due').value = task.dueDate || '';
  document.getElementById('btn-add-task').disabled = false;
  openForm();
}

function toggleForm() {
  if (editingId) { closeForm(); openForm(); }
  else if (formOpen) closeForm(); else openForm();
}

function addTask() {
  var textEl = document.getElementById('new-task-text');
  var text   = textEl.value.trim();
  if (!text) return;

  var dueInput = document.getElementById('new-due');
  if (!dueInput.reportValidity() || !validDate(dueInput.value)) return;
  var changes = {
    text: text,
    priority: document.getElementById('new-priority').value,
    category: document.getElementById('new-category').value,
    dueDate: dueInput.value,
  };
  if (editingId) {
    tasks = tasks.map(function (task) {
      return task.id === editingId ? Object.assign({}, task, changes) : task;
    });
  } else tasks.unshift(Object.assign({
    id:        uid(),
    completed: false,
    createdAt: Date.now(),
  }, changes));

  saveTasks();
  closeForm();
  render();
}

function toggleTask(id) {
  tasks = tasks.map(function (t) {
    return t.id === id ? Object.assign({}, t, { completed: !t.completed }) : t;
  });
  saveTasks();
  render();
}

function removeTask(id) {
  deleteTasks(function (t) { return t.id === id; });
}

function clearCompleted() {
  deleteTasks(function (t) {
    return t.completed && matchesView(t) && (activeCategory === 'all' || t.category === activeCategory);
  });
}

function deleteTasks(predicate) {
  var removed = [];
  tasks.forEach(function (task, index) {
    if (predicate(task)) removed.push({ task: task, index: index });
  });
  if (!removed.length) return;
  deletionHistory.push(removed);
  tasks = tasks.filter(function (task) { return !predicate(task); });
  if (removed.some(function (item) { return item.task.id === editingId; })) closeForm();
  renderUndo();
  saveTasks();
  render();
}

function renderUndo() {
  var latest = deletionHistory[deletionHistory.length - 1];
  document.getElementById('undo-bar').hidden = !latest;
  document.getElementById('undo-message').textContent = latest ?
    latest.length + ' task' + (latest.length === 1 ? '' : 's') + ' deleted.' : '';
}

function undoDelete() {
  var removed = deletionHistory.pop();
  if (!removed) return;
  removed.forEach(function (item) { tasks.splice(Math.min(item.index, tasks.length), 0, item.task); });
  renderUndo();
  saveTasks();
  render();
}

function exportTasks() {
  var blob = new Blob([JSON.stringify({ version: 1, tasks: tasks }, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'dolist-backup-' + futureDateStr(0) + '.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

async function importTasks(file) {
  if (!file) return;
  var status = document.getElementById('backup-status');
  try {
    var data = JSON.parse(await file.text());
    if (!Array.isArray(data) && (!data || data.version !== 1)) throw new Error('Unsupported backup.');
    var imported = validateTasks(Array.isArray(data) ? data : data.tasks);
    var added = 0;
    imported.forEach(function (task) {
      var existing = tasks.find(function (t) { return t.id === task.id; });
      if (existing && Object.keys(task).every(function (key) { return existing[key] === task[key]; })) return;
      // Preserve both versions if a backup conflicts with an existing or undoable task.
      if (existing || deletionHistory.some(function (batch) {
        return batch.some(function (item) { return item.task.id === task.id; });
      })) task.id = uid();
      tasks.push(task);
      added++;
    });
    saveTasks();
    render();
    status.textContent = added + ' task' + (added === 1 ? '' : 's') + ' imported. Existing tasks were kept.';
  } catch (e) {
    status.textContent = 'Could not import this backup. Choose a valid dolist JSON backup. Your tasks have not changed.';
  }
}

/* ===== SIDEBAR (MOBILE) ===== */

function openSidebar() {
  sidebarOpen = true;
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.add('open');
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  document.getElementById('btn-menu').setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden'; // prevent background scroll
}

function closeSidebar() {
  sidebarOpen = false;
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  document.getElementById('btn-menu').setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

/* ===== EVENT WIRING ===== */

// New Task button
document.getElementById('btn-undo').addEventListener('click', undoDelete);
document.getElementById('btn-export').addEventListener('click', exportTasks);
document.getElementById('btn-import').addEventListener('click', function () {
  document.getElementById('backup-file').click();
});
document.getElementById('backup-file').addEventListener('change', async function () {
  await importTasks(this.files[0]);
  this.value = '';
});
document.querySelectorAll('.view-btn').forEach(function (button) {
  button.addEventListener('click', function () { activeView = this.dataset.view; render(); });
});
window.addEventListener('focus', render);
setInterval(function () { if (!document.hidden) render(); }, 60000);

document.getElementById('btn-new-task').addEventListener('click', toggleForm);

// Cancel button
document.getElementById('btn-cancel').addEventListener('click', closeForm);

// Add Task button
document.getElementById('btn-add-task').addEventListener('click', addTask);

// Clear completed
document.getElementById('btn-clear').addEventListener('click', clearCompleted);

// Enable/disable Add button based on input
document.getElementById('new-task-text').addEventListener('input', function () {
  document.getElementById('btn-add-task').disabled = !this.value.trim();
});

// Enter key in task input
document.getElementById('new-task-text').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') addTask();
});

// Filter tabs
document.querySelectorAll('.filter-tab').forEach(function (tab) {
  tab.addEventListener('click', function () {
    currentFilter = this.dataset.filter;
    render();
  });
});

// Mobile menu button
document.getElementById('btn-menu').addEventListener('click', openSidebar);

// Sidebar close button (mobile)
document.getElementById('btn-sidebar-close').addEventListener('click', closeSidebar);

// Overlay click closes sidebar
document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);

// Global keyboard shortcuts
document.addEventListener('keydown', function (e) {
  // Escape: close form or sidebar
  if (e.key === 'Escape') {
    if (formOpen)   closeForm();
    if (sidebarOpen) closeSidebar();
  }
});

/* ===== INITIAL RENDER ===== */
render();
