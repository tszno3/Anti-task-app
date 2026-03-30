// ============================================================
// views/dashboard.js — Summary Dashboard
// ============================================================

function renderDashboard(container) {
  const todayTasks   = getTodayTasks();
  const overdueTasks = getOverdueTasks();
  const waitingTasks = getWaitingTasks();
  const weekTasks    = getDueThisWeekTasks();
  const recentTasks  = [...getTasks()]
    .sort((a, b) => (b.received_date || '').localeCompare(a.received_date || ''))
    .slice(0, 5);

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">대시보드</h1>
        <div class="view-subtitle">${formatDate(today())} — 오늘의 업무 현황</div>
      </div>
    </div>

    <div class="summary-grid">
      <button class="summary-card summary-card--today" data-nav="today">
        <div class="summary-card__icon">▶</div>
        <div class="summary-card__count">${todayTasks.length}</div>
        <div class="summary-card__label">오늘 할 일</div>
      </button>
      <button class="summary-card summary-card--overdue" data-nav="today">
        <div class="summary-card__icon">⚠</div>
        <div class="summary-card__count">${overdueTasks.length}</div>
        <div class="summary-card__label">기한 초과</div>
      </button>
      <button class="summary-card summary-card--waiting" data-nav="waiting">
        <div class="summary-card__icon">⏳</div>
        <div class="summary-card__count">${waitingTasks.length}</div>
        <div class="summary-card__label">대기 중</div>
      </button>
      <button class="summary-card summary-card--week" data-nav="plan">
        <div class="summary-card__icon">📅</div>
        <div class="summary-card__count">${weekTasks.length}</div>
        <div class="summary-card__label">이번 주 마감</div>
      </button>
    </div>

    ${overdueTasks.length > 0 ? `
    <div class="section-title">⚠ 기한 초과 업무</div>
    <div class="task-list">
      ${overdueTasks.slice(0,4).map(t => taskCardHTML(t, { showDone: true })).join('')}
    </div>` : ''}

    <div class="section-title">최근 업무</div>
    <div class="task-list">
      ${recentTasks.length === 0
        ? `<div class="task-list--empty">업무가 없습니다. 수신함에서 업무를 추가하거나 샘플 데이터를 불러오세요.</div>`
        : recentTasks.map(t => taskCardHTML(t, {})).join('')}
    </div>
  `;

  // Summary card nav clicks
  container.querySelectorAll('.summary-card[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });

  wireTaskCards(container);
}

// ── Shared task card builder (used in multiple views) ────────
function taskCardHTML(task, { showDone = false, showQuick = false, showWaiting = false } = {}) {
  const isOD = isOverdue(task.due_date) && !['Done','Archived'].includes(task.status);
  const isQ  = task.estimated_time && parseInt(task.estimated_time) <= 30;
  let cls = 'task-card';
  if (isOD) cls += ' task-card--overdue';
  if (showQuick && isQ) cls += ' task-card--quick';

  const metaParts = [
    priorityBadge(task.priority),
    statusBadge(task.status),
    task.category ? categoryBadge(task.category) : '',
    task.due_date ? `<span class="text-muted">📅 ${formatDate(task.due_date)}</span>` : '',
    timeBadge(task.estimated_time),
    overdueBadge(task.due_date),
    task.requester ? `<span class="text-muted">👤 ${esc(task.requester)}</span>` : '',
  ].filter(Boolean).join('');

  const actions = showDone ? `
    <button class="btn btn-success btn-xs task-done-btn" data-id="${task.id}" title="완료 처리">✓ 완료</button>
  ` : '';

  return `
    <div class="${cls}" data-id="${task.id}">
      <div class="task-card__body">
        <div class="task-card__title task-open-modal" data-id="${task.id}">${esc(task.title)}</div>
        <div class="task-card__meta">${metaParts}</div>
        ${task.next_action ? `<div class="text-muted mt-2">→ ${esc(task.next_action)}</div>` : ''}
      </div>
      <div class="task-card__actions">${actions}</div>
    </div>
  `;
}

// Wire card click events
function wireTaskCards(container) {
  container.querySelectorAll('.task-open-modal').forEach(el => {
    el.addEventListener('click', () => openTaskModal(el.dataset.id));
  });
  container.querySelectorAll('.task-done-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      markDone(btn.dataset.id);
      showToast('완료 처리되었습니다 ✓', 'success');
      refresh();
    });
  });
}
