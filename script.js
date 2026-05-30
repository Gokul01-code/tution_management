/**
 * ══════════════════════════════════════════════════════════════
 *  EDUVAULT — Shared Utilities (script.js)
 *  Handles: login check, localStorage, sidebar toggle, toasts
 * ══════════════════════════════════════════════════════════════
 */
'use strict';

/* ── CONFIGURATION ──────────────────────────────────────────── */
const CREDENTIALS = {
  gokul:   { password: 'teach123', role: 'admin',   display: 'Gokul'   },
  rohith:  { password: 'teach123', role: 'teacher',  display: 'Rohith'  },
  sameera: { password: 'teach123', role: 'teacher',  display: 'Sameera' },
  umaid:   { password: 'teach123', role: 'teacher',  display: 'Umaid'   },
};

const DEFAULT_STUDENTS = [
  { name: 'Aarav Sharma',  std: '10', school: 'ABC School', joining: '2026-01-10' },
  { name: 'Bhavna Patel',  std: '9',  school: 'XYZ School', joining: '2026-02-01' },
];

/* ── DOM HELPERS ────────────────────────────────────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
function show(el) { if (el) el.hidden = false; }
function hide(el) { if (el) el.hidden = true; }

/* ── DATE UTILITIES ─────────────────────────────────────────── */
function todayFormatted() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
function todayISO() { return new Date().toISOString().split('T')[0]; }
function shortDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── LOCAL STORAGE HELPERS ──────────────────────────────────── */
function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem('eduvault_user')); } catch(_) { return null; }
}
function setCurrentUser(user) {
  sessionStorage.setItem('eduvault_user', JSON.stringify(user));
}
function loadStudents() {
  try {
    const stored = localStorage.getItem('eduvault_students');
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return [...DEFAULT_STUDENTS];
}
function saveStudents(students) {
  try { localStorage.setItem('eduvault_students', JSON.stringify(students)); } catch (_) {}
}

/* ── AUTH GUARD ─────────────────────────────────────────────── */
function requireAuth() {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'index.html'; return null; }
  return user;
}

/* ── SECURITY ───────────────────────────────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/* ── TOAST NOTIFICATIONS ────────────────────────────────────── */
let _toastTimer = null;
function showToast(message, type = 'success') {
  const toast  = $('#toast');
  const iconEl = $('#toast-icon');
  const msgEl  = $('#toast-msg');
  if (!toast) return;

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  iconEl.textContent = icons[type] || '✓';
  msgEl.textContent  = message;
  iconEl.style.color = ({ success: 'var(--success)', error: 'var(--danger)', info: 'var(--info)', warning: 'var(--warning)' })[type] || 'var(--success)';

  toast.classList.remove('hide');
  show(toast);
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => { hide(toast); toast.classList.remove('hide'); }, 300);
  }, 3500);
}

/* ── SIDEBAR SETUP (shared dashboard pages) ─────────────────── */
function setupSidebar() {
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';
  document.body.appendChild(overlay);

  const menuToggle = $('#menu-toggle');
  const sidebarClose = $('#sidebar-close');
  if (menuToggle) menuToggle.addEventListener('click', openSidebar);
  if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);
}
function openSidebar() {
  const s = $('#sidebar'); const o = $('#sidebar-overlay');
  if (s) s.classList.add('open');
  if (o) o.classList.add('visible');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  const s = $('#sidebar'); const o = $('#sidebar-overlay');
  if (s) s.classList.remove('open');
  if (o) o.classList.remove('visible');
  document.body.style.overflow = '';
}

/* ── USER UI (shared) ───────────────────────────────────────── */
function updateUserUI(user) {
  const initial = user.display[0].toUpperCase();
  const sidebarUser = $('#sidebar-username'); if (sidebarUser) sidebarUser.textContent = user.display;
  const sidebarRole = $('#sidebar-role'); if (sidebarRole) sidebarRole.textContent = user.role === 'admin' ? 'Super Admin' : 'Teacher';
  const userAvatar = $('#user-avatar'); if (userAvatar) userAvatar.textContent = initial;
  const topbarUser = $('#topbar-username'); if (topbarUser) topbarUser.textContent = user.display;
  const topbarAv = $('#topbar-avatar'); if (topbarAv) topbarAv.textContent = initial;
  const topbarDate = $('#topbar-date'); if (topbarDate) topbarDate.textContent = todayFormatted();
  if (user.role === 'admin') { const adminSection = $('#admin-section'); if (adminSection) show(adminSection); }
}

/* ── LOGOUT ─────────────────────────────────────────────────── */
function setupLogout() {
  const btn = $('#logout-btn');
  if (btn) btn.addEventListener('click', () => {
    sessionStorage.removeItem('eduvault_user');
    window.location.href = 'index.html';
  });
}

/* ── GOOGLE APPS SCRIPT BRIDGE ──────────────────────────────── */
const GAS = (function () {
  const _gas = (typeof google !== 'undefined' && google.script) ? google.script.run : null;

  function run(fnName, args = [], successCb = () => {}, failureCb = null) {
    if (_gas) {
      let runner = _gas
        .withSuccessHandler(successCb)
        .withFailureHandler(failureCb || ((err) => {
          console.error(`GAS Error [${fnName}]:`, err);
          showToast(`Server error: ${err.message}`, 'error');
        }));
      runner[fnName](...args);
    } else {
      console.log(`[GAS Mock] Calling "${fnName}" with:`, args);
      setTimeout(() => successCb({ status: 'ok', mock: true }), 400);
    }
  }

  return {
    saveAttendance(date, records) { return new Promise((res, rej) => run('saveAttendance', [date, records], res, rej)); },
    saveSession(date, students, teacherName) { return new Promise((res, rej) => run('saveSession', [date, students, teacherName], res, rej)); },
    saveTimetable(className, date, subject) { return new Promise((res, rej) => run('saveTimetable', [className, date, subject], res, rej)); },
    addStudent(name) { return new Promise((res, rej) => run('addStudent', [name], res, rej)); },
    removeStudent(name) { return new Promise((res, rej) => run('removeStudent', [name], res, rej)); },
  };
})();

/* ── SHAKE KEYFRAMES ────────────────────────────────────────── */
(function injectShakeKeyframes() {
  const style = document.createElement('style');
  style.textContent = `@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }`;
  document.head.appendChild(style);
})();
