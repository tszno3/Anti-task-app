// ============================================================
// views/waiting.js — Waiting / Follow-up Tracker
// ============================================================

function renderWaiting(container) {
  const tasks = getWaitingTasks();
  const followupDue  = tasks.filter(t => t.follow_up_date && isPastOrToday(t.follow_up_date));
  const followupLater = tasks.filter(t => !t.follow_up_date || !isPastOrToday(t.follow_up_date));

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">⏳ 대기 중</h1>
        <div class="view-subtitle">답변·승인·서류를 기다리는 업무를 추적하세요</div>
      </div>
      <button class="btn btn-outline" id="btn-add-waiting">+ 대기 업무 추가</button>
    </div>

    ${followupDue.length > 0 ? `
    <div class="section-title" style="color:var(--color-warning)">⚡ 팔로우업 필요 (${followupDue.length}건)</div>
    <div id="waiting-due-list">
      ${followupDue.map(t => waitingCardHTML(t, true)).join('')}
    </div>
    <div class="divider"></div>` : ''}

    <div class="section-title">대기 중 (${followupLater.length}건)</div>
    <div id="waiting-later-list">
      ${followupLater.length === 0 && followupDue.length === 0
        ? `<div class="task-list--empty">대기 중인 업무가 없습니다.<br>답변이나 승인을 기다리는 업무를 여기서 추적하세요.</div>`
        : followupLater.length === 0
          ? `<div class="task-list--empty" style="border-color:transparent;background:transparent;padding:8px 0;font-size:13px;color:var(--color-text-muted)">기타 없음</div>`
          : followupLater.map(t => waitingCardHTML(t, false)).join('')
      }
    </div>
  `;

  // Add waiting task
  document.getElementById('btn-add-waiting').addEventListener('click', () => {
    const task = createTask({ status: 'Waiting Reply', follow_up_date: daysFromNow(3) });
    showToast('대기 업무가 추가되었습니다', 'success');
    openTaskModal(task.id);
  });

  // Log follow-up
  container.querySelectorAll('.btn-log-followup').forEach(btn => {
    btn.addEventListener('click', () => {
      updateTask(btn.dataset.id, { last_follow_up_date: today() });
      showToast('팔로우업 기록됨', 'success');
      refresh();
    });
  });

  // Resolve
  container.querySelectorAll('.btn-resolve').forEach(btn => {
    btn.addEventListener('click', () => {
      markDone(btn.dataset.id);
      showToast('완료 처리됨 ✓', 'success');
      refresh();
    });
  });

  // Escalate
  container.querySelectorAll('.btn-escalate').forEach(btn => {
    btn.addEventListener('click', () => {
      const task = getTaskById(btn.dataset.id);
      if (!task) return;
      updateTask(btn.dataset.id, {
        priority: task.priority === 'P1' ? 'P1' : 'P' + (parseInt(task.priority[1]) - 1),
        notes: (task.notes ? task.notes + '\n' : '') + `[${today()}] 에스컬레이션`
      });
      showToast('우선순위가 상향되었습니다', 'warning');
      refresh();
    });
  });

  wireTaskCards(container);
}

function waitingCardHTML(task, isUrgent) {
  const followupOverdue = task.follow_up_date && isPastOrToday(task.follow_up_date);

  return `
    <div class="waiting-card ${followupOverdue ? 'waiting-card--followup-due' : ''}">
      <div class="waiting-card__row">
        <div style="flex:1;min-width:0">
          <div class="task-card__title task-open-modal" data-id="${task.id}" style="margin-bottom:6px">
            ${esc(task.title)}
          </div>
          <div class="waiting-card__meta">
            ${priorityBadge(task.priority)}
            ${task.category ? categoryBadge(task.category) : ''}
            ${task.waiting_on ? `<span class="badge badge-status badge-status--waiting">🕐 ${esc(task.waiting_on)}</span>` : '<span class="text-muted">대기 대상 미입력</span>'}
            ${task.due_date ? `<span class="text-muted">마감: ${formatDate(task.due_date)}</span>` : ''}
          </div>
          <div style="margin-top:8px;display:flex;gap:16px;font-size:12px;color:var(--color-text-muted)">
            ${task.follow_up_date
              ? `<span style="${followupOverdue ? 'color:var(--color-warning);font-weight:600' : ''}">
                  📌 팔로우업: ${formatDate(task.follow_up_date)}${followupOverdue ? ' ⚡' : ''}
                 </span>`
              : '<span>팔로우업 날짜 미설정</span>'}
            ${task.last_follow_up_date ? `<span>마지막 연락: ${formatDate(task.last_follow_up_date)}</span>` : ''}
            ${task.requester ? `<span>요청자: ${esc(task.requester)}</span>` : ''}
          </div>
          ${task.notes ? `<div class="text-muted mt-2" style="font-size:12px">📝 ${esc(task.notes.split('\n')[0])}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;align-items:flex-end">
          <button class="btn btn-outline btn-xs btn-log-followup" data-id="${task.id}">📬 팔로우업 기록</button>
          <button class="btn btn-success btn-xs btn-resolve" data-id="${task.id}">✓ 해결됨</button>
          <button class="btn btn-warning btn-xs btn-escalate" data-id="${task.id}">↑ 에스컬레이션</button>
        </div>
      </div>
    </div>
  `;
}
