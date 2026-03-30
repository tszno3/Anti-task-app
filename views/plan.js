// ============================================================
// views/plan.js — Schedule Tasks
// ============================================================

function renderPlan(container) {
  const allPlanned  = getTasksByStatus('Planned', 'In Progress');
  const unscheduled = allPlanned.filter(t => !t.planned_date);
  const scheduled   = sortByPriorityAndDue(allPlanned.filter(t => t.planned_date));

  // Group scheduled by date
  const byDate = {};
  scheduled.forEach(t => {
    if (!byDate[t.planned_date]) byDate[t.planned_date] = [];
    byDate[t.planned_date].push(t);
  });

  const dateGroups = Object.keys(byDate).sort().map(d => {
    const isOD     = d < today();
    const isToday_ = d === today();
    let label = formatDate(d);
    if (isToday_) label = `오늘 (${label})`;
    return `
      <div class="section-title" style="${isOD ? 'color:var(--color-danger)' : isToday_ ? 'color:var(--color-accent)' : ''}">${label}</div>
      <div class="task-list">
        ${byDate[d].map(t => planCardHTML(t)).join('')}
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">📅 계획</h1>
        <div class="view-subtitle">업무에 날짜를 지정하고 실행 순서를 정하세요</div>
      </div>
    </div>

    <!-- ── Unscheduled List ──────────────────── -->
    <div class="section-title" style="margin-top:20px">미배정 (${unscheduled.length}건)</div>
    <div class="task-list">
      ${unscheduled.length === 0
        ? `<div class="task-list--empty">✨ 미배정 업무가 없습니다</div>`
        : unscheduled.map(t => planCardHTML(t)).join('')}
    </div>

    <!-- ── Scheduled List ───────────────────── -->
    ${scheduled.length > 0 ? `<div class="divider"></div>` : ''}
    ${dateGroups}
  `;

  // Date picker for list items
  container.querySelectorAll('.plan-date-input').forEach(inp => {
    inp.addEventListener('change', () => {
      const id  = inp.dataset.id;
      const val = inp.value;
      updateTask(id, { planned_date: val, status: 'Planned' });
      showToast('계획일이 설정되었습니다', 'success');
      refresh();
    });
  });

  // Today button for list items
  container.querySelectorAll('.btn-plan-today').forEach(btn => {
    btn.addEventListener('click', () => {
      updateTask(btn.dataset.id, { planned_date: today(), status: 'In Progress' });
      showToast('오늘 할 일로 이동됨', 'success');
      refresh();
    });
  });

  wireTaskCards(container);
}

// ── Plan card HTML ───────────────────────────────────────────
function planCardHTML(task) {
  const isOD = isOverdue(task.due_date);
  return `
    <div class="plan-task-item ${isOD ? 'task-card--overdue' : ''}" data-id="${task.id}">
      <div style="flex:1;min-width:0">
        <div class="task-card__title task-open-modal" data-id="${task.id}" style="margin-bottom:4px">
          ${esc(task.title)}
        </div>
        <div class="task-card__meta">
          ${priorityBadge(task.priority)}
          ${task.category ? categoryBadge(task.category) : ''}
          ${task.due_date ? `<span class="text-muted">마감: ${formatDate(task.due_date)}</span>` : ''}
          ${timeBadge(task.estimated_time)}
          ${isOD ? overdueBadge(task.due_date) : ''}
        </div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
        <input
          class="plan-date-input"
          type="date"
          value="${task.planned_date || ''}"
          data-id="${task.id}"
          title="계획일 선택"
        />
        <button class="btn btn-primary btn-xs btn-plan-today" data-id="${task.id}">오늘</button>
      </div>
    </div>
  `;
}
