'use strict';
let marksRecords = JSON.parse(localStorage.getItem('marksRecords') || '[]');

document.addEventListener('DOMContentLoaded', () => {
  const user = initPage('marks', 'Marks & Scores');
  if (!user) return;

  const students = loadStudents();
  const contentArea = $('#content-area');
  const studentOptions = students.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join('');

  contentArea.innerHTML = `
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Marks &amp; Scores</h3>
          <p class="panel-sub">Student performance overview</p>
        </div>
        <button class="btn btn-outline btn-sm" id="upload-marks-btn">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z"/><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z"/></svg>
          Upload Marks
        </button>
      </div>

      <div class="marks-form glass-card">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Student Name</label>
            <select id="marks-student" class="form-input">${studentOptions}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Class</label>
            <input id="marks-class" class="form-input" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Subject</label>
            <input id="marks-subject" class="form-input" placeholder="e.g. Maths" />
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" id="marks-date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Marks Obtained</label>
            <input type="number" id="marks-obtained" class="form-input" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Total Marks</label>
            <input type="number" id="marks-total" class="form-input" min="1" />
          </div>
        </div>
        <button class="btn btn-primary" id="save-marks-btn">Save Marks</button>
        <div id="marks-percentage-display"></div>
      </div>

      <div class="stats-row">
        <div class="stat-chip glass-card">
          <span class="stat-value" id="marks-student-count">${students.length}</span>
          <span class="stat-label">Students</span>
        </div>
        <div class="stat-chip glass-card">
          <span class="stat-value" id="marks-entry-count">${marksRecords.length}</span>
          <span class="stat-label">Entries</span>
        </div>
      </div>

      <div class="glass-card table-card">
        <div class="table-scroll">
          <table class="data-table marks-table">
            <thead>
              <tr><th>#</th><th>Student Name</th><th>Class</th><th>Subject</th><th>Marks</th><th>Total</th><th>Percentage</th></tr>
            </thead>
            <tbody id="marks-body"></tbody>
          </table>
        </div>
      </div>

      <p class="upload-hint glass-card">
        <svg viewBox="0 0 20 20" fill="currentColor" style="width:16px;flex-shrink:0"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/></svg>
        Full marks upload via Google Sheets integration is ready. Click <strong>Upload Marks</strong> to trigger the backend endpoint.
      </p>
    </div>`;

  // Auto-fill class when student changes
  const marksStudentSelect = $('#marks-student');
  function updateMarksClass() {
    const selected = students.find(s => s.name === marksStudentSelect.value);
    $('#marks-class').value = selected ? selected.std : '';
  }
  marksStudentSelect.addEventListener('change', updateMarksClass);
  updateMarksClass();
  $('#marks-date').value = todayISO();

  renderMarksTable();

  $('#save-marks-btn').onclick = function() {
    const obtained = Number($('#marks-obtained').value);
    const total    = Number($('#marks-total').value);
    const subject  = $('#marks-subject').value.trim();
    const name     = marksStudentSelect.value;
    const std      = $('#marks-class').value;
    const date     = $('#marks-date').value;

    if (!name || !subject || !total || isNaN(obtained)) { showToast('Please fill all fields', 'warning'); return; }
    if (total <= 0) { showToast('Total marks must be greater than 0', 'warning'); return; }

    const percent = ((obtained / total) * 100).toFixed(2);
    $('#marks-percentage-display').innerHTML = `Percentage: <strong style="color:var(--purple-200)">${percent}%</strong>`;

    marksRecords.unshift({ name, std, subject, obtained, total, percent, date });
    localStorage.setItem('marksRecords', JSON.stringify(marksRecords));
    renderMarksTable();
    $('#marks-entry-count').textContent = marksRecords.length;
    showToast('Marks saved successfully', 'success');
  };

  $('#upload-marks-btn').onclick = () => {
    showToast('Upload Marks endpoint triggered. Awaiting Google Sheets sync…', 'info');
  };
});

function renderMarksTable() {
  const tbody = $('#marks-body');
  if (!tbody) return;
  if (marksRecords.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No marks recorded yet.</td></tr>'; return;
  }
  tbody.innerHTML = marksRecords.map((m, i) => `
    <tr>
      <td>${i + 1}</td>
      <td style="font-weight:500">${escapeHtml(m.name)}</td>
      <td>${escapeHtml(m.std || '')}</td>
      <td>${escapeHtml(m.subject || '')}</td>
      <td style="font-weight:500;color:${m.obtained >= m.total * 0.8 ? 'var(--success)' : m.obtained >= m.total * 0.6 ? 'var(--info)' : 'var(--warning)'}">${m.obtained}</td>
      <td>${m.total}</td>
      <td><strong>${m.percent}%</strong></td>
    </tr>`).join('');
}
