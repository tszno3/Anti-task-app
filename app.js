// ============================================================
// app.js — Router, State, Event Bus, Nav Badges, Toast
// ============================================================

// ── Toast ────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── Priority badge HTML ──────────────────────────────────────
function priorityBadge(p) {
  if (!p) return '';
  const cls = { P1:'p1', P2:'p2', P3:'p3', P4:'p4' }[p] || 'p4';
  return `<span class="badge badge-${cls}">${p}</span>`;
}

function statusBadge(s) {
  if (!s) return '';
  const key = s.toLowerCase().replace(/\s+/g,'');
  const map = {
    'inbox':'inbox','clarifying':'clarifying','planned':'planned',
    'inprogress':'inprogress','waitingreply':'waiting','done':'done','archived':''
  };
  return `<span class="badge badge-status badge-status--${map[key] || ''}">${s}</span>`;
}

function categoryBadge(c) {
  if (!c) return '';
  return `<span class="badge badge-cat">${c}</span>`;
}

function timeBadge(mins) {
  if (!mins) return '';
  return `<span class="badge badge-time">⏱ ${formatMinutes(parseInt(mins))}</span>`;
}

function overdueBadge(dateStr) {
  if (!dateStr || !isOverdue(dateStr)) return '';
  return `<span class="badge badge-overdue">⚠ 기한 초과</span>`;
}

// ── Update sidebar nav badges ────────────────────────────────
function updateBadges() {
  const inboxCount  = getTasksByStatus('Inbox').length;
  const clarifyCount = getTasksByStatus('Inbox','Clarifying').filter(t => !t.category || !t.priority || !t.due_date).length;
  const todayCount  = getTodayTasks().length;
  const waitingCount = getWaitingTasks().length;

  const setB = (id, n) => {
    const el = document.getElementById(id);
    if (el) el.textContent = n > 0 ? n : '';
  };
  setB('badge-inbox',   inboxCount);
  setB('badge-clarify', clarifyCount);
  setB('badge-today',   todayCount);
  setB('badge-waiting', waitingCount);
}

// ── Router ───────────────────────────────────────────────────
const VIEWS = {
  dashboard: renderDashboard,
  inbox:     renderInbox,
  clarify:   renderClarify,
  plan:      renderPlan,
  today:     renderToday,
  waiting:   renderWaiting,
  done:      renderDone,
};

let currentView = 'dashboard';

function navigate(view) {
  if (!VIEWS[view]) return;
  currentView = view;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });

  const container = document.getElementById('view-container');
  container.innerHTML = '';
  VIEWS[view](container);
  updateBadges();
}

function refresh() {
  navigate(currentView);
}

// ── Sidebar nav clicks ───────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(el.dataset.view);
  });
});

// ── Seed / Clear buttons ─────────────────────────────────────
document.getElementById('btn-seed').addEventListener('click', () => {
  if (getTasks().length > 0) {
    if (!confirm('기존 데이터가 있습니다. 샘플 데이터를 추가할까요? (기존 데이터는 유지됩니다)')) return;
    // Force seed regardless
    localStorage.removeItem(STORAGE_KEY);
    loadTasks();
    seedData();
  } else {
    seedData();
  }
  showToast('샘플 데이터를 불러왔습니다', 'success');
  refresh();
});

document.getElementById('btn-clear').addEventListener('click', () => {
  if (!confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
  localStorage.removeItem(STORAGE_KEY);
  loadTasks();
  showToast('데이터가 초기화되었습니다', 'warning');
  refresh();
});

// ── Modal close ──────────────────────────────────────────────
document.getElementById('modal-close').addEventListener('click', closeTaskModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeTaskModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTaskModal();
});

// ── Init ─────────────────────────────────────────────────────
(function init() {
  seedData(); // seeds only if empty
  navigate('dashboard');
})();
