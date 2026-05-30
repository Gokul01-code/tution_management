'use strict';

// Load attendance history from localStorage
let attendanceHistory = JSON.parse(localStorage.getItem('eduvault_attendance') || '[]');

document.addEventListener('DOMContentLoaded', () => {
  const user = initPage('attendance', 'Attendance');
  if (!user) return;

  const students = loadStudents();
  const contentArea = $('#content-area');

  // Access control: only admin
  if (user.role !== 'admin') {
    contentArea.innerHTML = `
      <div class="access-denied-overlay" style="position:relative;inset:unset;min-height:60vh">
        <div class="access-denied-card glass-card">
          <div class="access-denied-icon">🔒</div>
          <h3>Access Denied</h3>
          <p>Contact <strong>Gokul</strong> for marking attendance.</p>
        </div>
      </div>`;
    return;
  }

  contentArea.innerHTML = `
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Daily Attendance</h3>
          <p class="panel-sub" id="attendance-date-label">Date: ${todayFormatted()}</p>
        </div>
        <div class="panel-actions">
          <button class="btn btn-outline btn-sm" id="select-all-btn">Select All Present</button>
        </div>
      </div>

      <div class="glass-card student-list-card">
        <div class="student-list-header">
          <span>Student</span>
          <span>Status</span>
        </div>
        <ul id="attendance-list" class="student-list" role="list"></ul>
      </div>

      <div class="submit-row">
        <button id="submit-attendance-btn" class="btn btn-primary">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg>
          Submit Attendance
        </button>
      </div>

      <!-- ── Attendance History ── -->
      <div class="history-section" style="margin-top:2rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem">
          <h4 class="history-title" style="margin:0">Attendance History</h4>
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
            <select id="att-filter-date" class="form-input" style="width:auto;min-width:160px;padding:0.4rem 0.75rem;font-size:0.85rem">
              <option value="">All Dates</option>
            </select>
            <select id="att-filter-status" class="form-input" style="width:auto;min-width:130px;padding:0.4rem 0.75rem;font-size:0.85rem">
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        </div>

        <div class="stats-row" style="margin-bottom:1rem">
          <div class="stat-chip glass-card">
            <span class="stat-value" id="att-stat-total">0</span>
            <span class="stat-label">Total Entries</span>
          </div>
          <div class="stat-chip glass-card">
            <span class="stat-value" id="att-stat-present" style="color:var(--success)">0</span>
            <span class="stat-label">Present</span>
          </div>
          <div class="stat-chip glass-card">
            <span class="stat-value" id="att-stat-absent" style="color:var(--warning)">0</span>
            <span class="stat-label">Absent</span>
          </div>
          <div class="stat-chip glass-card">
            <span class="stat-value" id="att-stat-days">0</span>
            <span class="stat-label">Days Recorded</span>
          </div>
        </div>

        <div class="glass-card table-card">
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr><th>#</th><th>Date</th><th>Student</th><th>Status</th></tr>
              </thead>
              <tbody id="attendance-history-body"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;

  // Render student list
  const list = $('#attendance-list');
  students.forEach((student, idx) => {
    const li = document.createElement('li');
    li.className = 'student-item';
    li.style.animationDelay = `${idx * 0.04}s`;
    const toggleId = `att-toggle-${idx}`;
    li.innerHTML = `
      <div class="student-name-col">
        <span class="student-num">${idx + 1}</span>
        <span class="student-name">${escapeHtml(student.name)}</span>
      </div>
      <div class="attendance-toggle">
        <label class="toggle-switch" for="${toggleId}" aria-label="Attendance toggle for ${escapeHtml(student.name)}">
          <input type="checkbox" id="${toggleId}" data-student="${escapeHtml(student.name)}" />
          <span class="toggle-track"></span>
          <span class="toggle-label">
            <span class="lbl-present">Present</span>
            <span class="lbl-absent">Absent</span>
          </span>
        </label>
      </div>`;
    list.appendChild(li);
  });

  $('#select-all-btn').onclick = () => {
    $$('#attendance-list input[type="checkbox"]').forEach(cb => { cb.checked = true; });
    showToast('All students marked Present', 'info');
  };

  // Populate date filter with unique dates from history
  function refreshDateFilter() {
    const sel = $('#att-filter-date');
    const current = sel.value;
    const dates = [...new Set(attendanceHistory.map(r => r.date))].sort((a, b) => b.localeCompare(a));
    sel.innerHTML = '<option value="">All Dates</option>' +
      dates.map(d => `<option value="${d}"${d === current ? ' selected' : ''}>${shortDate(d)}</option>`).join('');
  }

  // Render table + update stats
  function renderAttendanceHistory() {
    refreshDateFilter();
    const filterDate   = $('#att-filter-date').value;
    const filterStatus = $('#att-filter-status').value;

    const filtered = attendanceHistory.filter(r =>
      (!filterDate   || r.date   === filterDate) &&
      (!filterStatus || r.status === filterStatus)
    );

    const tbody = $('#attendance-history-body');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No attendance records yet.</td></tr>';
    } else {
      tbody.innerHTML = filtered.map((r, i) => `
        <tr>
          <td style="color:var(--text-muted)">${i + 1}</td>
          <td>${shortDate(r.date)}</td>
          <td style="font-weight:500">${escapeHtml(r.name)}</td>
          <td>
            <span style="
              display:inline-block;padding:2px 10px;border-radius:999px;font-size:0.8rem;font-weight:600;
              background:${r.status === 'Present' ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)'};
              color:${r.status === 'Present' ? 'var(--success)' : 'var(--warning)'};
            ">${escapeHtml(r.status)}</span>
          </td>
        </tr>`).join('');
    }

    // Update summary stats (always from full history, not filtered)
    const totalEntries = attendanceHistory.length;
    const presentCount = attendanceHistory.filter(r => r.status === 'Present').length;
    const absentCount  = attendanceHistory.filter(r => r.status === 'Absent').length;
    const uniqueDays   = new Set(attendanceHistory.map(r => r.date)).size;

    $('#att-stat-total').textContent   = totalEntries;
    $('#att-stat-present').textContent = presentCount;
    $('#att-stat-absent').textContent  = absentCount;
    $('#att-stat-days').textContent    = uniqueDays;
  }

  // Wire up filters
  $('#att-filter-date').addEventListener('change', renderAttendanceHistory);
  $('#att-filter-status').addEventListener('change', renderAttendanceHistory);

  // Initial render
  renderAttendanceHistory();

  $('#submit-attendance-btn').onclick = async function() {
    const btn = this;
    const checkboxes = $$('#attendance-list input[type="checkbox"]');
    if (checkboxes.length === 0) { showToast('No students to submit attendance for.', 'warning'); return; }

    const date = todayISO();
    const records = checkboxes.map(cb => ({ name: cb.dataset.student, status: cb.checked ? 'Present' : 'Absent' }));

    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      // ── Save to localStorage ──
      records.forEach(r => {
        attendanceHistory.unshift({ date, name: r.name, status: r.status });
      });
      // Keep up to 2000 entries
      if (attendanceHistory.length > 2000) attendanceHistory = attendanceHistory.slice(0, 2000);
      localStorage.setItem('eduvault_attendance', JSON.stringify(attendanceHistory));

      // Also try GAS (won't break if it fails)
      try { await GAS.saveAttendance(date, records); } catch(_) {}

      renderAttendanceHistory();
      showToast(`Attendance saved for ${records.length} students (${date})`, 'success');

      // Reset all toggles after successful save
      checkboxes.forEach(cb => { cb.checked = false; });
    } catch(err) {
      showToast('Failed to save attendance.', 'error'); console.error(err);
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg> Submit Attendance`;
    }
  };
});
