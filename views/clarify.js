// ============================================================
// views/clarify.js — Enrich Inbox Tasks
// ============================================================

function renderClarify(container) {
  const tasks = getTasksByStatus('Inbox', 'Clarifying');

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">🔍 검토</h1>
        <div class="view-subtitle">수신된 업무에 우선순위·카테고리·마감일을 지정하세요</div>
      </div>
    </div>

    <div class="task-list" id="clarify-list">
      ${tasks.length === 0
        ? `<div class="task-list--empty">✨ 검토할 업무가 없습니다. 수신함에 업무를 추가하세요.</div>`
        : tasks.map(t => clarifyTaskHTML(t)).join('')
      }
    </div>
  `;

  // Toggle expand
  container.querySelectorAll('.clarify-task__header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      hdr.closest('.clarify-task').classList.toggle('open');
    });
  });

  // Save + Plan
  container.querySelectorAll('.btn-plan-it').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = btn.dataset.id;
      const form = document.getElementById(`clarify-form-${id}`);
      if (!form) return;

      const category      = form.querySelector('[name=category]').value;
      const priority      = form.querySelector('[name=priority]').value;
      const due_date      = form.querySelector('[name=due_date]').value;
      const estimated_time = form.querySelector('[name=estimated_time]').value;
      const next_action   = form.querySelector('[name=next_action]').value.trim();

      updateTask(id, {
        category, priority, due_date, estimated_time, next_action,
        status: 'Planned'
      });
      showToast('계획 목록으로 이동되었습니다', 'success');
      refresh();
    });
  });

  // Waiting button
  container.querySelectorAll('.btn-send-waiting').forEach(btn => {
    btn.addEventListener('click', () => {
      updateTask(btn.dataset.id, { status: 'Waiting Reply' });
      showToast('대기 중 목록으로 이동되었습니다', 'warning');
      refresh();
    });
  });

  wireTaskCards(container);
}

function clarifyTaskHTML(task) {
  const cats = ['', ...CATEGORIES].map(c =>
    `<option value="${c}" ${task.category === c ? 'selected' : ''}>${c || '선택'}</option>`).join('');
  const pris = ['', ...PRIORITIES].map(p =>
    `<option value="${p}" ${task.priority === p ? 'selected' : ''}>${p || '선택'}</option>`).join('');

  const isOD = isOverdue(task.due_date);

  return `
    <div class="clarify-task ${task.status === 'Clarifying' ? 'open' : ''}" data-id="${task.id}">
      <div class="clarify-task__header">
        <span class="clarify-task__chevron">▶</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:14px" class="task-open-modal" data-id="${task.id}">${esc(task.title)}</div>
          <div class="task-card__meta" style="margin-top:4px">
            ${task.requester ? `<span class="text-muted">👤 ${esc(task.requester)}</span>` : ''}
            <span class="text-muted">📅 ${formatDate(task.received_date)}</span>
            ${statusBadge(task.status)}
            ${task.priority ? priorityBadge(task.priority) : ''}
            ${task.category ? categoryBadge(task.category) : ''}
            ${isOD ? overdueBadge(task.due_date) : ''}
          </div>
        </div>
      </div>
      <div class="clarify-task__form" id="clarify-form-${task.id}">
        <div class="clarify-form-grid">
          <div class="form-group">
            <label class="form-label">카테고리</label>
            <select class="form-control" name="category">${cats}</select>
          </div>
          <div class="form-group">
            <label class="form-label">우선순위</label>
            <select class="form-control" name="priority">${pris}</select>
          </div>
          <div class="form-group">
            <label class="form-label">마감일</label>
            <input class="form-control" type="date" name="due_date" value="${task.due_date || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">예상 시간 (분)</label>
            <input class="form-control" type="number" name="estimated_time" min="1" value="${task.estimated_time || ''}" placeholder="예: 60" />
          </div>
          <div class="form-group full">
            <label class="form-label">다음 액션</label>
            <input class="form-control" type="text" name="next_action" value="${esc(task.next_action)}" placeholder="바로 해야 할 다음 단계" />
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:4px">
          <button class="btn btn-primary btn-sm btn-plan-it" data-id="${task.id}">✓ 계획 목록으로</button>
          <button class="btn btn-outline btn-sm btn-send-waiting" data-id="${task.id}">⏳ 대기 중으로</button>
        </div>
      </div>
    </div>
  `;
}
