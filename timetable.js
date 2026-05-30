'use strict';
let timetableEntries = JSON.parse(localStorage.getItem('eduvault_timetable') || '[]');

document.addEventListener('DOMContentLoaded', () => {
  const user = initPage('timetable', 'Timetable');
  if (!user) return;

  const students = loadStudents();
  const contentArea = $('#content-area');

  const studentOptions = students.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join('');

  contentArea.innerHTML = `
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Timetable Manager</h3>
          <p class="panel-sub">Manage class schedules easily</p>
        </div>
      </div>

      <div class="glass-card timetable-form">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Student Name</label>
            <select id="tt-student" class="form-input">${studentOptions}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Standard</label>
            <input type="text" id="tt-classname" class="form-input" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" id="tt-date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Subject</label>
            <input type="text" id="tt-subject" class="form-input" placeholder="Enter subject" />
          </div>
        </div>
        <button id="save-timetable-btn" class="btn btn-primary">Save Timetable</button>
      </div>

      <div class="glass-card history-section">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Std</th><th>Date</th><th>Subject</th></tr></thead>
          <tbody id="timetable-body"></tbody>
        </table>
      </div>
    </div>`;

  const studentSelect = $('#tt-student');
  function updateStd() {
    const selected = students.find(s => s.name === studentSelect.value);
    $('#tt-classname').value = selected ? selected.std : '';
  }
  studentSelect.addEventListener('change', updateStd);
  updateStd();
  $('#tt-date').value = todayISO();
  renderTimetableTable();

  $('#save-timetable-btn').onclick = async function() {
    const studentName = $('#tt-student').value;
    const className = $('#tt-classname').value;
    const date = $('#tt-date').value;
    const subject = $('#tt-subject').value.trim();
    if (!studentName || !className || !date || !subject) { showToast('Please fill all fields', 'warning'); return; }
    timetableEntries.unshift({ studentName, className, date, subject });
    localStorage.setItem('eduvault_timetable', JSON.stringify(timetableEntries));
    renderTimetableTable();
    $('#tt-subject').value = '';
    showToast('Timetable saved successfully', 'success');
    try { await GAS.saveTimetable(className, date, subject); } catch(_) {}
  };
});

function renderTimetableTable() {
  const tbody = $('#timetable-body');
  if (!tbody) return;
  if (!timetableEntries.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No timetable entries yet.</td></tr>'; return;
  }
  tbody.innerHTML = timetableEntries.map(e => `
    <tr>
      <td>${escapeHtml(e.studentName)}</td>
      <td>${escapeHtml(e.className)}</td>
      <td>${shortDate(e.date)}</td>
      <td>${escapeHtml(e.subject)}</td>
    </tr>`).join('');
}
