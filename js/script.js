/**
 * Life Dashboard — script.js
 * AWS Builder ID Validation: Single JS file, Vanilla ES6+, LocalStorage persistence
 *
 * Modules:
 *  1. Storage helpers
 *  2. Toast notifications
 *  3. Clock & Greeting
 *  4. Custom Name
 *  5. Focus Timer (Pomodoro)
 *  6. To-Do List (CRUD + Sort + Duplicate Prevention)
 *  7. Quick Links Manager
 *  8. Theme Toggle (Light/Dark)
 *  9. Seed Data
 * 10. Initialisation
 */

'use strict';

/* ================================================================
   1. STORAGE HELPERS
================================================================ */

/**
 * Safely get a parsed JSON value from localStorage.
 * Returns `defaultValue` if the key is missing or JSON is malformed.
 */
function storageGet(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

/** Safely save a value (serialised as JSON) to localStorage. */
function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('[Dashboard] localStorage write failed:', err);
  }
}

/* ================================================================
   2. TOAST NOTIFICATIONS
================================================================ */

let _toastTimer = null;

/**
 * Show a transient toast message.
 * @param {string} message  - Text to display.
 * @param {'info'|'success'|'warning'|'error'} [type='info']
 * @param {number} [duration=3000] - Milliseconds before auto-dismiss.
 */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  // Remove previous type classes
  toast.classList.remove('toast-success', 'toast-warning', 'toast-error');
  if (type !== 'info') toast.classList.add(`toast-${type}`);

  toast.textContent = message;
  toast.classList.add('visible');

  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.classList.remove('visible', 'toast-success', 'toast-warning', 'toast-error');
  }, duration);
}

/* ================================================================
   3. CLOCK & GREETING
================================================================ */

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/** Pad a number to 2 digits. */
const pad2 = n => String(n).padStart(2, '0');

/** Returns time-of-day greeting string. */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning,';
  if (h < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

/** Update the clock and greeting text every second. */
function tickClock() {
  const now = new Date();

  // Clock
  const clockEl = document.getElementById('digitalClock');
  if (clockEl) {
    clockEl.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  }

  // Date
  const dateEl = document.getElementById('dateDisplay');
  if (dateEl) {
    const dayName   = DAYS[now.getDay()];
    const monthName = MONTHS[now.getMonth()];
    const date      = now.getDate();
    const year      = now.getFullYear();
    dateEl.textContent = `${dayName}, ${monthName} ${date}, ${year}`;
  }

  // Greeting (only update text, not whole node — avoids re-read by screen readers every second)
  const greetingEl = document.getElementById('greetingText');
  if (greetingEl) {
    const g = getGreeting();
    if (greetingEl.textContent !== g) greetingEl.textContent = g;
  }
}

function initClock() {
  tickClock();
  setInterval(tickClock, 1000);
}

/* ================================================================
   4. CUSTOM NAME
================================================================ */

const STORAGE_KEY_NAME = 'dashboard_name';

let _editingName = false;

function getStoredName() {
  return storageGet(STORAGE_KEY_NAME, 'User');
}

function renderName() {
  const name = getStoredName();
  const nameEl = document.getElementById('greetingName');
  if (nameEl) nameEl.textContent = name;
}

function showNameForm() {
  const form     = document.getElementById('nameEditForm');
  const nameEl   = document.getElementById('greetingName');
  const editBtn  = document.getElementById('editNameBtn');
  const inputEl  = document.getElementById('nameInput');

  if (!form || !nameEl || !editBtn || !inputEl) return;

  _editingName = true;
  form.classList.remove('hidden');
  nameEl.parentElement.style.display = 'none'; // hide the name + pencil row
  inputEl.value = getStoredName();
  inputEl.focus();
  inputEl.select();
}

function hideNameForm() {
  const form    = document.getElementById('nameEditForm');
  const nameRow = document.getElementById('greetingName')?.parentElement;

  if (form) form.classList.add('hidden');
  if (nameRow) nameRow.style.display = '';
  _editingName = false;
}

function saveName() {
  const inputEl = document.getElementById('nameInput');
  if (!inputEl) return;

  const value = inputEl.value.trim();
  if (!value) {
    showToast('Name cannot be empty.', 'warning');
    return;
  }

  storageSet(STORAGE_KEY_NAME, value);
  renderName();
  hideNameForm();
  showToast(`Hello, ${value}! 👋`, 'success');
}

function initCustomName() {
  renderName();

  const editBtn    = document.getElementById('editNameBtn');
  const saveBtn    = document.getElementById('saveNameBtn');
  const cancelBtn  = document.getElementById('cancelNameBtn');
  const nameInput  = document.getElementById('nameInput');

  editBtn?.addEventListener('click', showNameForm);
  saveBtn?.addEventListener('click', saveName);
  cancelBtn?.addEventListener('click', hideNameForm);

  nameInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') hideNameForm();
  });
}

/* ================================================================
   5. FOCUS TIMER (POMODORO)
================================================================ */

const STORAGE_KEY_TIMER_DURATION = 'dashboard_timer_duration';

const TIMER = {
  totalSeconds:   25 * 60,
  remainingSeconds: 25 * 60,
  intervalId:     null,
  isRunning:      false,
};

/** Formats seconds as MM:SS */
function formatTime(totalSecs) {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

function renderTimerDisplay() {
  const displayEl  = document.getElementById('timerDisplay');
  const statusEl   = document.getElementById('timerStatus');

  if (displayEl) displayEl.textContent = formatTime(TIMER.remainingSeconds);

  if (statusEl) {
    if (TIMER.isRunning) {
      statusEl.textContent = 'Running…';
    } else if (TIMER.remainingSeconds === 0) {
      statusEl.textContent = 'Completed!';
    } else if (TIMER.remainingSeconds < TIMER.totalSeconds) {
      statusEl.textContent = 'Paused';
    } else {
      statusEl.textContent = 'Ready';
    }
  }
}

function setTimerButtons(running) {
  const startBtn = document.getElementById('timerStartBtn');
  const stopBtn  = document.getElementById('timerStopBtn');

  if (startBtn) startBtn.disabled = running;
  if (stopBtn)  stopBtn.disabled  = !running;
}

function showTimerDoneBanner(show) {
  const banner = document.getElementById('timerDoneBanner');
  if (banner) banner.classList.toggle('hidden', !show);
}

function timerTick() {
  if (TIMER.remainingSeconds <= 0) {
    clearInterval(TIMER.intervalId);
    TIMER.intervalId = null;
    TIMER.isRunning  = false;
    TIMER.remainingSeconds = 0;
    renderTimerDisplay();
    setTimerButtons(false);
    showTimerDoneBanner(true);
    showToast('⏰ Timer finished! Time for a break!', 'success', 5000);

    // Browser notification (if permission granted)
    if (Notification?.permission === 'granted') {
      new Notification('🌸 Focus Session Done!', {
        body: 'Great work! Take a well-deserved break.',
        icon: '' // no icon asset required
      });
    }
    return;
  }

  TIMER.remainingSeconds--;
  renderTimerDisplay();
}

function startTimer() {
  if (TIMER.isRunning) return;
  if (TIMER.remainingSeconds <= 0) resetTimer(); // auto-reset if finished

  // Guard: clear any stale interval before starting (prevents double-speed)
  if (TIMER.intervalId !== null) {
    clearInterval(TIMER.intervalId);
    TIMER.intervalId = null;
  }

  TIMER.isRunning  = true;
  showTimerDoneBanner(false);
  TIMER.intervalId = setInterval(timerTick, 1000);
  setTimerButtons(true);
  renderTimerDisplay();

  // Request notification permission on first start (non-blocking)
  if (Notification && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

function stopTimer() {
  if (!TIMER.isRunning) return;
  clearInterval(TIMER.intervalId);
  TIMER.intervalId = null;
  TIMER.isRunning  = false;
  setTimerButtons(false);
  renderTimerDisplay();
}

function resetTimer() {
  stopTimer();
  TIMER.remainingSeconds = TIMER.totalSeconds;
  showTimerDoneBanner(false);
  renderTimerDisplay();
}

/** Set a new total duration in minutes and reset the timer. */
function setTimerDuration(minutes) {
  const mins = parseInt(minutes, 10);
  if (isNaN(mins) || mins < 1 || mins > 120) {
    showToast('Please enter a duration between 1–120 minutes.', 'warning');
    return;
  }
  stopTimer();
  TIMER.totalSeconds     = mins * 60;
  TIMER.remainingSeconds = TIMER.totalSeconds;
  storageSet(STORAGE_KEY_TIMER_DURATION, mins);
  showTimerDoneBanner(false);
  renderTimerDisplay();

  // Update active preset button highlight
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.minutes, 10) === mins);
  });

  showToast(`Timer set to ${mins} minutes.`, 'info');
}

function initTimer() {
  // Restore saved duration
  const savedMins = storageGet(STORAGE_KEY_TIMER_DURATION, 25);
  TIMER.totalSeconds     = savedMins * 60;
  TIMER.remainingSeconds = TIMER.totalSeconds;

  // Highlight matching preset
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.minutes, 10) === savedMins);
  });

  renderTimerDisplay();
  setTimerButtons(false);

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => setTimerDuration(btn.dataset.minutes));
  });

  // Custom duration input
  const customInput = document.getElementById('customDurationInput');
  if (customInput) {
    customInput.addEventListener('change', () => {
      const val = customInput.value.trim();
      if (val) {
        setTimerDuration(val);
        customInput.value = '';
      }
    });
    customInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const val = customInput.value.trim();
        if (val) {
          setTimerDuration(val);
          customInput.value = '';
        }
      }
    });
  }

  // Control buttons
  document.getElementById('timerStartBtn')?.addEventListener('click', startTimer);
  document.getElementById('timerStopBtn')?.addEventListener('click', stopTimer);
  document.getElementById('timerResetBtn')?.addEventListener('click', resetTimer);
}

/* ================================================================
   6. TO-DO LIST
================================================================ */

const STORAGE_KEY_TASKS  = 'dashboard_tasks';
const STORAGE_KEY_SORT   = 'dashboard_sort';

/** @type {Array<{id: string, text: string, completed: boolean, createdAt: number}>} */
let tasks = [];

function loadTasks() {
  tasks = storageGet(STORAGE_KEY_TASKS, []);
}

function saveTasks() {
  storageSet(STORAGE_KEY_TASKS, tasks);
}

function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Returns tasks sorted according to current sort selection. */
function getSortedTasks() {
  const sortValue = document.getElementById('sortSelect')?.value || 'date';
  storageSet(STORAGE_KEY_SORT, sortValue);

  const copy = [...tasks];
  if (sortValue === 'alpha') {
    copy.sort((a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: 'base' }));
  } else if (sortValue === 'status') {
    copy.sort((a, b) => Number(a.completed) - Number(b.completed));
  }
  // 'date': natural insertion order (tasks are appended to array)
  return copy;
}

/** Check for duplicate task text (case-insensitive). */
function isDuplicateTask(text) {
  const normalised = text.trim().toLowerCase();
  return tasks.some(t => t.text.trim().toLowerCase() === normalised);
}

/** Render the full task list into the DOM. */
function renderTasks() {
  const listEl      = document.getElementById('taskList');
  const emptyEl     = document.getElementById('todoEmptyState');
  if (!listEl || !emptyEl) return;

  listEl.innerHTML = '';

  const sorted = getSortedTasks();

  if (sorted.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  sorted.forEach(task => {
    const li = createTaskElement(task);
    listEl.appendChild(li);
  });
}

/** Create a single task list item element. */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item${task.completed ? ' completed' : ''}`;
  li.dataset.id = task.id;
  li.setAttribute('role', 'listitem');

  // --- Checkbox ---
  const checkbox = document.createElement('input');
  checkbox.type      = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked   = task.completed;
  checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
  checkbox.addEventListener('change', () => toggleTask(task.id));

  // --- Text span ---
  const textSpan = document.createElement('span');
  textSpan.className = 'task-text';
  textSpan.textContent = task.text;
  textSpan.setAttribute('title', task.text);

  // --- Action buttons ---
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'task-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn-icon';
  editBtn.textContent = '✏️';
  editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
  editBtn.setAttribute('title', 'Edit task');
  editBtn.addEventListener('click', () => startEditTask(task.id, li));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-danger';
  deleteBtn.textContent = '✕';
  deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
  deleteBtn.setAttribute('title', 'Delete task');
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  actionsDiv.appendChild(editBtn);
  actionsDiv.appendChild(deleteBtn);

  li.appendChild(checkbox);
  li.appendChild(textSpan);
  li.appendChild(actionsDiv);

  return li;
}

/** Switch a task item into inline-edit mode. */
function startEditTask(taskId, liEl) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const textSpan   = liEl.querySelector('.task-text');
  const actionsDiv = liEl.querySelector('.task-actions');

  // Create inline input
  const editInput = document.createElement('input');
  editInput.type       = 'text';
  editInput.className  = 'task-edit-input';
  editInput.value      = task.text;
  editInput.maxLength  = 120;
  editInput.setAttribute('aria-label', 'Edit task text');

  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.className   = 'btn btn-primary btn-sm';
  saveBtn.textContent = '✓';
  saveBtn.setAttribute('aria-label', 'Save edit');

  const doSave = () => {
    const newText = editInput.value.trim();
    if (!newText) {
      showToast('Task text cannot be empty.', 'warning');
      editInput.focus();
      return;
    }
    // Check duplicate only if text changed
    if (newText.toLowerCase() !== task.text.toLowerCase() && isDuplicateTask(newText)) {
      showToast(`"${newText}" already exists in your list.`, 'warning');
      editInput.focus();
      return;
    }
    task.text = newText;
    saveTasks();
    renderTasks();
  };

  saveBtn.addEventListener('click', doSave);
  editInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  doSave();
    if (e.key === 'Escape') renderTasks(); // cancel edit
  });

  // Replace text span with input + save btn
  textSpan.replaceWith(editInput);
  actionsDiv.replaceWith(saveBtn);
  editInput.focus();
  editInput.select();
}

function addTask() {
  const inputEl = document.getElementById('todoInput');
  if (!inputEl) return;

  const text = inputEl.value.trim();
  if (!text) {
    showToast('Please enter a task.', 'warning');
    inputEl.focus();
    return;
  }

  // Duplicate prevention (Optional Challenge #4)
  if (isDuplicateTask(text)) {
    showToast(`"${text}" already exists in your list! 🚫`, 'warning');
    inputEl.focus();
    return;
  }

  const newTask = {
    id:        generateId(),
    text:      text,
    completed: false,
    createdAt: Date.now(),
  };

  tasks.push(newTask);
  saveTasks();
  inputEl.value = '';
  renderTasks();
  showToast('Task added! ✅', 'success');
}

function toggleTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  tasks = tasks.filter(t => t.id !== taskId);
  saveTasks();
  renderTasks();
  showToast('Task deleted.', 'info');
}

function initTodoList() {
  loadTasks();

  // Restore sort preference
  const savedSort = storageGet(STORAGE_KEY_SORT, 'date');
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = savedSort;

  renderTasks();

  // Add task on button click
  document.getElementById('addTaskBtn')?.addEventListener('click', addTask);

  // Add task on Enter key in input
  document.getElementById('todoInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });

  // Re-render when sort changes
  document.getElementById('sortSelect')?.addEventListener('change', renderTasks);
}

/* ================================================================
   7. QUICK LINKS MANAGER
================================================================ */

const STORAGE_KEY_LINKS = 'dashboard_links';

/** @type {Array<{id: string, name: string, url: string}>} */
let quickLinks = [];

function loadLinks() {
  quickLinks = storageGet(STORAGE_KEY_LINKS, []);
}

function saveLinks() {
  storageSet(STORAGE_KEY_LINKS, quickLinks);
}

function renderLinks() {
  const container = document.getElementById('linksContainer');
  const emptyEl   = document.getElementById('linksEmptyState');
  if (!container || !emptyEl) return;

  container.innerHTML = '';

  if (quickLinks.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  quickLinks.forEach(link => {
    const badge = createLinkBadge(link);
    container.appendChild(badge);
  });
}

function createLinkBadge(link) {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('role', 'listitem');
  wrapper.style.display = 'inline-flex';

  const anchor = document.createElement('a');
  anchor.href    = link.url;
  anchor.target  = '_blank';
  anchor.rel     = 'noopener noreferrer';
  anchor.className = 'link-badge';
  anchor.setAttribute('aria-label', `Open ${link.name} in new tab`);
  anchor.setAttribute('title', link.url);

  const labelSpan = document.createElement('span');
  labelSpan.className   = 'link-badge-label';
  labelSpan.textContent = link.name;

  const deleteBtn = document.createElement('button');
  deleteBtn.className   = 'link-badge-delete';
  deleteBtn.textContent = '✕';
  deleteBtn.setAttribute('aria-label', `Remove link: ${link.name}`);
  deleteBtn.setAttribute('title', 'Remove link');
  // Prevent anchor click when clicking delete
  deleteBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    deleteLink(link.id);
  });

  anchor.appendChild(labelSpan);
  anchor.appendChild(deleteBtn);
  wrapper.appendChild(anchor);
  return wrapper;
}

/** Normalise a URL — add https:// if no protocol present. */
function normaliseUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Basic URL validation. */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function addLink() {
  const nameInput = document.getElementById('linkNameInput');
  const urlInput  = document.getElementById('linkUrlInput');
  if (!nameInput || !urlInput) return;

  const name = nameInput.value.trim();
  const url  = normaliseUrl(urlInput.value);

  if (!name) {
    showToast('Please enter a link name.', 'warning');
    nameInput.focus();
    return;
  }
  if (!url || !isValidUrl(url)) {
    showToast('Please enter a valid URL (e.g. https://example.com).', 'warning');
    urlInput.focus();
    return;
  }

  quickLinks.push({ id: generateId(), name, url });
  saveLinks();
  nameInput.value = '';
  urlInput.value  = '';
  renderLinks();
  showToast(`"${name}" link added! 🔗`, 'success');
}

function deleteLink(linkId) {
  quickLinks = quickLinks.filter(l => l.id !== linkId);
  saveLinks();
  renderLinks();
  showToast('Link removed.', 'info');
}

function initQuickLinks() {
  loadLinks();
  renderLinks();

  document.getElementById('addLinkBtn')?.addEventListener('click', addLink);

  // Allow Enter in either input to add the link
  document.getElementById('linkNameInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addLink();
  });
  document.getElementById('linkUrlInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addLink();
  });
}

/* ================================================================
   8. THEME TOGGLE (Light / Dark Pink Mode)
================================================================ */

const STORAGE_KEY_THEME = 'dashboard_theme';

function applyTheme(isDark) {
  document.body.classList.toggle('dark-mode', isDark);

  const iconEl  = document.getElementById('themeIcon');
  const labelEl = document.getElementById('themeLabel');

  if (iconEl)  iconEl.textContent  = isDark ? '☀️' : '🌙';
  if (labelEl) labelEl.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

function initTheme() {
  const savedTheme = storageGet(STORAGE_KEY_THEME, 'light');
  applyTheme(savedTheme === 'dark');

  document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-mode');
    applyTheme(isDark);
    storageSet(STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
  });
}

/* ================================================================
   9. SEED DATA (first-load defaults)
================================================================ */

/**
 * If localStorage is empty (no tasks, no links), pre-populate with
 * default items that match the project specification sample mockup.
 */
function seedDefaultData() {
  const existingTasks = storageGet(STORAGE_KEY_TASKS, null);
  const existingLinks = storageGet(STORAGE_KEY_LINKS, null);

  if (existingTasks === null) {
    const seedTasks = [
      { id: generateId(), text: 'belanja',  completed: false, createdAt: Date.now() - 2000 },
      { id: generateId(), text: 'belajar',  completed: true,  createdAt: Date.now() - 1000 },
    ];
    storageSet(STORAGE_KEY_TASKS, seedTasks);
  }

  if (existingLinks === null) {
    const seedLinks = [
      { id: generateId(), name: 'Google',   url: 'https://google.com' },
      { id: generateId(), name: 'Gmail',    url: 'https://mail.google.com' },
      { id: generateId(), name: 'Calendar', url: 'https://calendar.google.com' },
    ];
    storageSet(STORAGE_KEY_LINKS, seedLinks);
  }
}

/* ================================================================
   10. INITIALISATION
================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Apply theme first to avoid flash of wrong theme
  initTheme();

  // 2. Seed default data if localStorage is empty (first-time visitors)
  seedDefaultData();

  // 3. Start live clock
  initClock();

  // 4. Custom name greeting
  initCustomName();

  // 5. Focus timer
  initTimer();

  // 6. To-Do list
  initTodoList();

  // 7. Quick Links
  initQuickLinks();
});
