'use strict';
let sessionHistory = JSON.parse(localStorage.getItem('eduvault_sessions') || '[]');

document.addEventListener('DOMContentLoaded', () => {
  const user = initPage('session', 'Session Handled');
  if (!user) return;

  const students = loadStudents();
  const contentArea = $('#content-area');

  contentArea.innerHTML = `
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Session Handled</h3>
          <p class="panel-sub">Tick students you taught in this session</p>
        </div>
        <div class="session-teacher-badge glass-card">
          <span>Teacher:</span>
          <strong>${escapeHtml(user.display)}</strong>
        </div>
      </div>

      <div class="glass-card student-list-card">
        <div class="student-list-header">
          <span>Student</span>
          <span>Taught Today</span>
        </div>
        <ul id="session-list" class="student-list" role="list"></ul>
      </div>

      <div class="submit-row">
        <button id="save-session-btn" class="btn btn-primary">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z"/><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z"/></svg>
          Save Session
        </button>
      </div>

      <div class="history-section">
        <h4 class="history-title">Recent Sessions</h4>
        <div class="glass-card">
          <table class="data-table" id="session-history-table">
            <thead><tr><th>Date</th><th>Student</th><th>Teacher</th></tr></thead>
            <tbody id="session-history-body"></tbody>
          </table>
        </div>
      </div>
    </div>`;

  // Render session list
  const list = $('#session-list');
  students.forEach((student, idx) => {
    const li = document.createElement('li');
    li.className = 'student-item';
    li.style.animationDelay = `${idx * 0.04}s`;
    const cbId = `sess-cb-${idx}`;
    li.innerHTML = `
      <div class="student-name-col">
        <span class="student-num">${idx + 1}</span>
        <span class="student-name">${escapeHtml(student.name)}</span>
      </div>
      <div class="session-checkbox-wrapper">
        <input type="checkbox" id="${cbId}" class="session-checkbox" data-student="${escapeHtml(student.name)}" aria-label="Taught ${escapeHtml(student.name)}" />
      </div>`;
    list.appendChild(li);
  });

  renderSessionHistory();

  $('#save-session-btn').onclick = async function() {
    const checked = $$('#session-list input[type="checkbox"]:checked');
    if (checked.length === 0) { showToast('Please tick at least one student.', 'warning'); return; }

    const btn = this;
    const date = todayISO();
    const teacherName = user.display;
    const selectedStudents = checked.map(cb => cb.dataset.student);

    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await GAS.saveSession(date, selectedStudents, teacherName);
      selectedStudents.forEach(student => { sessionHistory.unshift({ date, student, teacher: teacherName }); });
      localStorage.setItem('eduvault_sessions', JSON.stringify(sessionHistory.slice(0, 100)));
      renderSessionHistory();
      showToast(`Session saved: ${selectedStudents.length} student(s) by ${teacherName}`, 'success');
      $$('#session-list input[type="checkbox"]').forEach(cb => { cb.checked = false; });
    } catch(err) {
      showToast('Failed to save session.', 'error'); console.error(err);
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z"/><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z"/></svg> Save Session`;
    }
  };
});

function renderSessionHistory() {
  const tbody = $('#session-history-body');
  if (!tbody) return;
  if (sessionHistory.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-row">No sessions recorded yet.</td></tr>'; return;
  }
  tbody.innerHTML = sessionHistory.slice(0, 20).map(entry => `
    <tr>
      <td>${shortDate(entry.date)}</td>
      <td>${escapeHtml(entry.student)}</td>
      <td><span style="color:var(--purple-300);font-weight:500">${escapeHtml(entry.teacher)}</span></td>
    </tr>`).join('');
}
