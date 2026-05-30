// Shared sidebar builder — included via individual page scripts
function buildSidebar(activePage) {
  const nav = [
    { id: 'attendance', href: 'attendance.html', label: 'Attendance', adminOnly: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>` },
    { id: 'session',    href: 'session.html',    label: 'Session Handled',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>` },
    { id: 'timetable',  href: 'timetable.html',  label: 'Timetable',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>` },
    { id: 'marks',      href: 'marks.html',      label: 'Marks',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>` },
  ];

  const user = getCurrentUser();
  const isAdmin = user && user.role === 'admin';

  const navItems = nav.map(item => {
    const isActive = item.id === activePage;
    const adminBadge = item.adminOnly ? `<span class="admin-badge" aria-label="Admin only">Admin</span>` : '';
    return `
      <li>
        <a href="${item.href}" class="nav-item${isActive ? ' active' : ''}" aria-current="${isActive ? 'page' : 'false'}">
          <span class="nav-icon" aria-hidden="true">${item.icon}</span>
          <span>${item.label}</span>
          ${adminBadge}
        </a>
      </li>`;
  }).join('');

  const adminPanel = isAdmin ? `
    <div id="admin-section" class="admin-panel">
      <div class="admin-panel-header">
        <span class="admin-panel-icon" aria-hidden="true">⚙</span>
        <span>Student Management</span>
      </div>
      <a href="students.html" class="btn btn-outline btn-sm btn-full">
        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
        Add / Edit Students
      </a>
    </div>` : '';

  const displayName = user ? user.display : '';
  const displayRole = user ? (user.role === 'admin' ? 'Super Admin' : 'Teacher') : '';
  const initial = displayName ? displayName[0].toUpperCase() : '?';

  return `
    <nav id="sidebar" class="sidebar" role="navigation" aria-label="Main navigation">
      <div class="sidebar-header">
        <div class="brand-icon small" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4L36 12V28L20 36L4 28V12L20 4Z" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M20 4L20 36M4 12L36 28M36 12L4 28" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
            <circle cx="20" cy="20" r="5" fill="currentColor" opacity="0.8"/>
          </svg>
        </div>
        <span class="brand-name">EduVault</span>
        <button id="sidebar-close" class="sidebar-close-btn" aria-label="Close sidebar">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/></svg>
        </button>
      </div>

      <div class="user-badge">
        <div class="user-avatar" id="user-avatar" aria-hidden="true">${initial}</div>
        <div class="user-info">
          <span class="user-name" id="sidebar-username">${escapeHtml(displayName)}</span>
          <span class="user-role" id="sidebar-role">${escapeHtml(displayRole)}</span>
        </div>
      </div>

      <ul class="nav-list" role="list">${navItems}</ul>

      ${adminPanel}

      <button id="logout-btn" class="btn btn-ghost btn-full logout-btn">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z" clip-rule="evenodd"/></svg>
        Sign Out
      </button>
    </nav>`;
}

function buildTopbar(pageTitle) {
  const user = getCurrentUser();
  const displayName = user ? user.display : '';
  const initial = displayName ? displayName[0].toUpperCase() : '?';
  return `
    <header class="topbar">
      <button id="menu-toggle" class="menu-toggle" aria-label="Toggle sidebar">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 012 10z" clip-rule="evenodd"/></svg>
      </button>
      <div class="topbar-title">
        <h2 id="page-title">${escapeHtml(pageTitle)}</h2>
        <span id="topbar-date" class="topbar-date">${todayFormatted()}</span>
      </div>
      <div class="topbar-right">
        <div class="topbar-user">
          <div class="user-avatar topbar-avatar" id="topbar-avatar">${initial}</div>
          <span id="topbar-username" class="topbar-username">${escapeHtml(displayName)}</span>
        </div>
      </div>
    </header>`;
}

function initPage(activePage, pageTitle) {
  const user = requireAuth();
  if (!user) return null;

  // Inject sidebar + topbar
  const layout = $('#dashboard-layout');
  if (layout) {
    layout.innerHTML = buildSidebar(activePage) + `<div class="main-area">${buildTopbar(pageTitle)}<main class="content-area" id="content-area"></main></div>`;
  }

  setupSidebar();
  setupLogout();
  return user;
}
