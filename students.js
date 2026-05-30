'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const user = initPage('students', 'Student Manager');
  if (!user) return;

  // Only admin can access this page
  const contentArea = $('#content-area');
  if (user.role !== 'admin') {
    contentArea.innerHTML = `
      <div class="access-denied-overlay" style="position:relative;inset:unset;min-height:60vh">
        <div class="access-denied-card glass-card">
          <div class="access-denied-icon">🔒</div>
          <h3>Access Denied</h3>
          <p>Contact <strong>Gokul</strong> for managing students.</p>
        </div>
      </div>`;
    return;
  }

  let students = loadStudents();

  contentArea.innerHTML = `
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Student Manager</h3>
          <p class="panel-sub">Add, edit, or remove students</p>
        </div>
      </div>

      <div class="glass-card timetable-form">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Student Name</label>
            <input type="text" id="student-name-input" class="form-input" placeholder="Enter student name" />
          </div>
          <div class="form-group">
            <label class="form-label">Standard / Class</label>
            <input type="text" id="student-std-input" class="form-input" placeholder="e.g. 10" />
          </div>
          <div class="form-group">
            <label class="form-label">School</label>
            <input type="text" id="student-school-input" class="form-input" placeholder="Enter school name" />
          </div>
          <div class="form-group">
            <label class="form-label">Date of Joining</label>
            <input type="date" id="student-joining-input" class="form-input" />
          </div>
        </div>
        <button id="add-student-btn" class="btn btn-primary">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
          Add Student
        </button>
      </div>

      <div class="glass-card table-card" style="margin-top:1.5rem">
        <div class="table-scroll">
          <table class="data-table">
            <thead><tr><th>#</th><th>Name</th><th>Standard</th><th>School</th><th>Joined</th><th>Action</th></tr></thead>
            <tbody id="student-table-body"></tbody>
          </table>
        </div>
      </div>
    </div>`;

  renderStudentTable();

  $('#add-student-btn').onclick = async function() {
    const name    = $('#student-name-input').value.trim();
    const std     = $('#student-std-input').value.trim();
    const school  = $('#student-school-input').value.trim();
    const joining = $('#student-joining-input').value;

    if (!name || !std || !school || !joining) { showToast('Please fill all student fields', 'warning'); return; }
    if (students.some(s => s.name.toLowerCase() === name.toLowerCase())) { showToast(`"${name}" already exists.`, 'warning'); return; }

    students.push({ name, std, school, joining });
    saveStudents(students);
    renderStudentTable();

    $('#student-name-input').value = '';
    $('#student-std-input').value = '';
    $('#student-school-input').value = '';
    $('#student-joining-input').value = '';

    showToast(`"${name}" added successfully!`, 'success');
    try { await GAS.addStudent(name); } catch(_) {}
  };

  function renderStudentTable() {
    const tbody = $('#student-table-body');
    if (!tbody) return;
    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No students added yet.</td></tr>'; return;
    }
    tbody.innerHTML = students.map((s, idx) => `
      <tr>
        <td style="color:var(--text-muted)">${idx + 1}</td>
        <td style="font-weight:500">${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.std)}</td>
        <td>${escapeHtml(s.school)}</td>
        <td>${s.joining ? shortDate(s.joining) : '—'}</td>
        <td>
          <button class="btn-icon delete" data-idx="${idx}" title="Remove student" aria-label="Remove ${escapeHtml(s.name)}">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"/></svg>
          </button>
        </td>
      </tr>`).join('');

    $$('.btn-icon.delete', tbody).forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const name = students[idx].name;
        if (!confirm(`Remove "${name}" from student list?`)) return;
        students.splice(idx, 1);
        saveStudents(students);
        renderStudentTable();
        showToast(`"${name}" removed.`, 'success');
        try { await GAS.removeStudent(name); } catch(_) {}
      });
    });
  }
});
