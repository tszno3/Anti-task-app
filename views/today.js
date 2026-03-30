// ============================================================
// views/today.js — Today's Do View
// ============================================================

function renderToday(container) {
  const todayTasks   = sortByPriorityAndDue(getTodayTasks());
  const overdueTasks = sortByPriorityAndDue(getOverdueTasks().filter(t =>
    !todayTasks.find(tt => tt.id === t.id)
  ));

  const quick   = todayTasks.filter(t => t.estimated_time && parseInt(t.estimated_time) <= 30);
  const regular = todayTasks.filter(t => !t.estimated_time || parseInt(t.estimated_time) > 30);

  const totalMins = todayTasks.reduce((s, t) => s + (parseInt(t.estimated_time) || 0), 0);

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">▶ 오늘 할 일</h1>
        <div class="view-subtitle">
          ${formatDate(today())} &nbsp;·&nbsp;
          ${todayTasks.length}개 업무
          ${totalMins ? `&nbsp;·&nbsp; 예상 ${formatMinutes(totalMins)}` : ''}
        </div>
      </div>
    </div>

    ${overdueTasks.length > 0 ? `
    <div class="section-title" style="color:var(--color-danger)">⚠ 기한 초과 (${overdueTasks.length}건)</div>
    <div class="task-list">
      ${overdueTasks.map(t => todayCardHTML(t, true)).join('')}
    </div>
    <div class="divider"></div>` : ''}

    <div class="section-title">오늘 업무 (${regular.length}건)</div>
    <div class="task-list">
      ${regular.length === 0
        ? `<div class="task-list--empty">오늘 예정된 업무가 없습니다. 계획 화면에서 업무를 배정하세요.</div>`
        : regular.map(t => todayCardHTML(t, false)).join('')
      }
    </div>

    ${quick.length > 0 ? `
    <div class="section-title" style="color:var(--color-success)">⚡ 빠른 업무 30분 이하 (${quick.length}건)</div>
    <div class="task-list">
      ${quick.map(t => todayCardHTML(t, false, true)).join('')}
    </div>` : ''}
  `;

  // Start button → In Progress
  container.querySelectorAll('.btn-start').forEach(btn => {
    btn.addEventListener('click', () => {
      updateTask(btn.dataset.id, { status: 'In Progress' });
      showToast('진행 중으로 변경되었습니다', 'success');
      refresh();
    });
  });

  // Done button
  container.querySelectorAll('.btn-done-today').forEach(btn => {
    btn.addEventListener('click', () => {
      markDone(btn.dataset.id);
      showToast('완료 처리됨 ✓', 'success');
      refresh();
    });
  });

  // Waiting button
  container.querySelectorAll('.btn-waiting-today').forEach(btn => {
    btn.addEventListener('click', () => {
      updateTask(btn.dataset.id, { status: 'Waiting Reply' });
      showToast('대기 중으로 이동됨', 'warning');
      refresh();
    });
  });

  wireTaskCards(container);
}

function todayCardHTML(task, isOD = false, isQuick = false) {
  const inProgress = task.status === 'In Progress';
  let cls = 'task-card';
  if (isOD) cls += ' task-card--overdue';
  if (isQuick) cls += ' task-card--quick';

  return `
    <div class="${cls}" data-id="${task.id}">
      <div class="task-card__body">
        <div class="task-card__title task-open-modal" data-id="${task.id}">${esc(task.title)}</div>
        <div class="task-card__meta">
          ${priorityBadge(task.priority)}
          ${task.category ? categoryBadge(task.category) : ''}
          ${task.due_date ? `<span class="text-muted">마감: ${formatDate(task.due_date)}</span>` : ''}
          ${timeBadge(task.estimated_time)}
          ${isOD ? overdueBadge(task.due_date) : ''}
          ${inProgress ? `<span class="badge badge-status badge-status--inprogress">진행 중</span>` : ''}
          ${task.requester ? `<span class="text-muted">👤 ${esc(task.requester)}</span>` : ''}
        </div>
        ${task.next_action ? `<div class="text-muted mt-2" style="font-size:12px">→ ${esc(task.next_action)}</div>` : ''}
      </div>
      <div class="task-card__actions">
        ${!inProgress
          ? `<button class="btn btn-outline btn-xs btn-start" data-id="${task.id}">▶ 시작</button>`
          : `<button class="btn btn-outline btn-xs btn-waiting-today" data-id="${task.id}">⏳ 대기</button>`
        }
        <button class="btn btn-success btn-xs btn-done-today" data-id="${task.id}">✓ 완료</button>
      </div>
    </div>
  `;
}
