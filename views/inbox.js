// ============================================================
// views/inbox.js — Quick Capture + Inbox Task List
// ============================================================

function renderInbox(container) {
  const inboxTasks = getTasksByStatus('Inbox');

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">📥 수신함</h1>
        <div class="view-subtitle">새로운 업무를 빠르게 등록하세요</div>
      </div>
    </div>

    <!-- Quick Capture Bar -->
    <div class="capture-bar">
      <div class="capture-bar__row">
        <input
          class="capture-bar__title form-control"
          id="capture-title"
          type="text"
          placeholder="업무명 입력 (Enter로 저장)..."
          autocomplete="off"
        />
        <input
          class="form-control"
          id="capture-requester"
          type="text"
          placeholder="요청자"
          style="width:140px"
        />
        <input
          class="form-control"
          id="capture-date"
          type="date"
          value="${today()}"
          style="width:140px"
        />
        <button class="btn btn-primary" id="capture-btn">+ 추가</button>
      </div>
      <div class="capture-bar__hint">💡 Tip: 업무명 입력 후 Enter 키를 눌러 빠르게 저장할 수 있습니다</div>
    </div>

    <!-- Inbox Task List -->
    <div class="section-title">수신함 (${inboxTasks.length}건)</div>
    <div class="task-list" id="inbox-list">
      ${inboxTasks.length === 0
        ? `<div class="task-list--empty">📭 수신함이 비어 있습니다.<br>위에서 업무를 추가하거나 사이드바에서 샘플 데이터를 불러오세요.</div>`
        : inboxTasks.map(t => inboxCardHTML(t)).join('')
      }
    </div>
  `;

  // Wire capture
  const doCapture = () => {
    const title = document.getElementById('capture-title').value.trim();
    if (!title) { showToast('업무명을 입력하세요', 'error'); return; }
    const requester     = document.getElementById('capture-requester').value.trim();
    const received_date = document.getElementById('capture-date').value || today();
    createTask({ title, requester, received_date, status: 'Inbox' });
    showToast(`"${title}" 추가됨`, 'success');
    document.getElementById('capture-title').value = '';
    document.getElementById('capture-requester').value = '';
    refresh();
  };

  document.getElementById('capture-btn').addEventListener('click', doCapture);
  document.getElementById('capture-title').addEventListener('keydown', e => {
    if (e.key === 'Enter') doCapture();
  });

  // Clarify button -> open modal then mark as Clarifying
  container.querySelectorAll('.btn-clarify').forEach(btn => {
    btn.addEventListener('click', () => {
      updateTask(btn.dataset.id, { status: 'Clarifying' });
      openTaskModal(btn.dataset.id);
    });
  });

  wireTaskCards(container);
}

function inboxCardHTML(task) {
  return `
    <div class="task-card" data-id="${task.id}">
      <div class="task-card__body">
        <div class="task-card__title task-open-modal" data-id="${task.id}">${esc(task.title)}</div>
        <div class="task-card__meta">
          ${task.requester ? `<span class="text-muted">👤 ${esc(task.requester)}</span>` : ''}
          <span class="text-muted">📅 접수: ${formatDate(task.received_date)}</span>
          ${task.description ? `<span class="text-muted">— ${esc(task.description.slice(0,60))}${task.description.length>60?'…':''}</span>` : ''}
        </div>
      </div>
      <div class="task-card__actions">
        <button class="btn btn-outline btn-sm btn-clarify" data-id="${task.id}">🔍 검토 →</button>
      </div>
    </div>
  `;
}
