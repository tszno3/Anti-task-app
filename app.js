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
  const inboxCount   = getTasksByStatus('Inbox').length;
  const clarifyCount = getTasksByStatus('Inbox','Clarifying').filter(t => !t.category || !t.priority || !t.due_date).length;
  const todayCount   = getTodayTasks().length;
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

// ── Backup / Restore ─────────────────────────────────────────
const BACKUP_API = `${SUPABASE_URL}/rest/v1/task_backups`;

async function createBackup(label = '') {
  const tasks = getTasks();
  const backupLabel = label || `백업 ${new Date().toLocaleString('ko-KR')}`;
  try {
    await fetch(BACKUP_API, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ label: backupLabel, data: tasks })
    });
    showToast(`백업 완료: ${backupLabel}`, 'success');
  } catch(e) {
    showToast('백업 실패', 'error');
  }
}

async function loadBackupList() {
  const res = await fetch(`${BACKUP_API}?order=created_at.desc&limit=20`, { headers: HEADERS });
  return await res.json();
}

async function restoreBackup(backupId) {
  const res = await fetch(`${BACKUP_API}?id=eq.${backupId}`, { headers: HEADERS });
  const rows = await res.json();
  if (!rows || !rows[0]) { showToast('백업 데이터를 찾을 수 없어요', 'error'); return; }

  const tasks = rows[0].data;
  // 기존 데이터 전체 삭제 후 복원
  for (const t of getTasks()) await deleteTask(t.id);
  for (const t of tasks) {
    await fetch(API, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(t)
    });
  }
  await loadTasks();
  showToast('복원 완료!', 'success');
  refresh();
}

async function showBackupModal() {
  const backups = await loadBackupList();

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;';

  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--bg-card, #1e1e2e);border-radius:12px;padding:24px;width:480px;max-width:90vw;max-height:80vh;overflow-y:auto;';

  const listHtml = backups.length === 0
    ? '<p style="color:var(--text-muted,#888);text-align:center;padding:16px;">저장된 백업이 없어요</p>'
    : backups.map(b => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
          <div>
            <div style="font-size:14px;font-weight:500;">${b.label}</div>
            <div style="font-size:12px;color:var(--text-muted,#888);margin-top:2px;">${new Date(b.created_at).toLocaleString('ko-KR')} · ${b.data.length}개 항목</div>
          </div>
          <button onclick="restoreBackup(${b.id}).then(()=>this.closest('.backup-overlay').remove())" 
            style="background:#4f46e5;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:13px;">
            복원
          </button>
        </div>`).join('');

  modal.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="margin:0;font-size:16px;">백업 목록</h3>
      <button onclick="this.closest('.backup-overlay').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted,#888);">✕</button>
    </div>
    ${listHtml}
  `;

  overlay.className = 'backup-overlay';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ── Seed / Clear buttons ─────────────────────────────────────
document.getElementById('btn-seed').addEventListener('click', async () => {
  if (getTasks().length > 0) {
    if (!confirm('기존 데이터가 있습니다. 샘플 데이터를 추가할까요?')) return;
  }
  await seedData();
  showToast('샘플 데이터를 불러왔습니다', 'success');
  refresh();
});

document.getElementById('btn-clear').addEventListener('click', async () => {
  if (!confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
  await createBackup('초기화 전 자동 백업');
  const tasks = getTasks();
  for (const t of tasks) await deleteTask(t.id);
  showToast('데이터가 초기화되었습니다 (자동 백업 완료)', 'warning');
  refresh();
});

// ── 백업 버튼 동적 추가 ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const toolbar = document.getElementById('btn-clear')?.parentElement;
  if (toolbar) {
    const btnBackup = document.createElement('button');
    btnBackup.id = 'btn-backup';
    btnBackup.textContent = '💾 백업';
    btnBackup.className = document.getElementById('btn-seed').className;
    btnBackup.addEventListener('click', () => createBackup());
    toolbar.appendChild(btnBackup);

    const btnRestore = document.createElement('button');
    btnRestore.id = 'btn-restore';
    btnRestore.textContent = '🔄 복원';
    btnRestore.className = document.getElementById('btn-seed').className;
    btnRestore.addEventListener('click', showBackupModal);
    toolbar.appendChild(btnRestore);
  }
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
(async function init() {
  const container = document.getElementById('view-container');
  container.innerHTML = '<p style="padding:2rem;color:var(--text-muted)">데이터 불러오는 중...</p>';
  await loadTasks();
  await seedData();
  navigate('dashboard');
})();
