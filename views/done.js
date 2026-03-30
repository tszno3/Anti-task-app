// ============================================================
// views/done.js — Completed / Archive View
// ============================================================

function renderDone(container) {
  let doneTasks = getTasksByStatus('Done', 'Archived');
  doneTasks = sortByPriorityAndDue(doneTasks).reverse(); // newest completed first

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">✅ 완료</h1>
        <div class="view-subtitle">완료된 업무 기록을 열람하세요</div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="done-filter-bar">
      <input id="done-search" type="text" placeholder="🔍 검색..." style="flex:1;min-width:160px" />
      <select id="done-filter-cat">
        <option value="">전체 카테고리</option>
        ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
      <select id="done-filter-status">
        <option value="">완료 + 보관</option>
        <option value="Done">완료만</option>
        <option value="Archived">보관만</option>
      </select>
    </div>

    <div id="done-list">
      ${renderDoneList(doneTasks)}
    </div>
  `;

  // Filtering
  const update = () => {
    let filtered = getTasksByStatus('Done', 'Archived');
    const q   = document.getElementById('done-search').value.toLowerCase();
    const cat = document.getElementById('done-filter-cat').value;
    const st  = document.getElementById('done-filter-status').value;
    if (q)   filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || (t.requester || '').toLowerCase().includes(q));
    if (cat) filtered = filtered.filter(t => t.category === cat);
    if (st)  filtered = filtered.filter(t => t.status === st);
    document.getElementById('done-list').innerHTML = renderDoneList(filtered);
    wireTaskCards(document.getElementById('done-list'));
    wireDoneButtons(document.getElementById('done-list'));
  };

  document.getElementById('done-search').addEventListener('input', update);
  document.getElementById('done-filter-cat').addEventListener('change', update);
  document.getElementById('done-filter-status').addEventListener('change', update);

  wireTaskCards(container);
  wireDoneButtons(container);
}

function renderDoneList(tasks) {
  if (tasks.length === 0) {
    return `<div class="task-list--empty">완료된 업무가 없습니다.</div>`;
  }
  return `<div class="task-list">${tasks.map(t => doneCardHTML(t)).join('')}</div>`;
}

function wireDoneButtons(root) {
  root.querySelectorAll('.btn-archive').forEach(btn => {
    btn.addEventListener('click', () => {
      updateTask(btn.dataset.id, { status: 'Archived' });
      showToast('보관 처리되었습니다', 'success');
      refresh();
    });
  });
  root.querySelectorAll('.btn-reopen').forEach(btn => {
    btn.addEventListener('click', () => {
      updateTask(btn.dataset.id, { status: 'In Progress', completed_date: '' });
      showToast('다시 열렸습니다', 'warning');
      refresh();
    });
  });
}

function doneCardHTML(task) {
  const isArchived = task.status === 'Archived';
  return `
    <div class="task-card" data-id="${task.id}" style="opacity:${isArchived ? '.7' : '1'}">
      <div class="task-card__body">
        <div class="task-card__title task-open-modal" data-id="${task.id}"
          style="text-decoration:${isArchived ? 'line-through' : 'none'};color:var(--color-text-muted)">
          ${esc(task.title)}
        </div>
        <div class="task-card__meta">
          ${isArchived
            ? `<span class="badge badge-status">보관됨</span>`
            : `<span class="badge badge-status badge-status--done">✓ 완료</span>`
          }
          ${task.category ? categoryBadge(task.category) : ''}
          ${priorityBadge(task.priority)}
          ${task.requester ? `<span class="text-muted">👤 ${esc(task.requester)}</span>` : ''}
          ${task.completed_date ? `<span class="text-muted">완료일: ${formatDate(task.completed_date)}</span>` : ''}
          ${task.due_date ? `<span class="text-muted">마감: ${formatDate(task.due_date)}</span>` : ''}
        </div>
        ${task.notes ? `<div class="text-muted mt-2" style="font-size:12px">📝 ${esc(task.notes)}</div>` : ''}
        ${task.links ? `<div class="mt-2" style="font-size:12px">🔗 <a href="${esc(task.links)}" target="_blank" style="color:var(--color-accent)">${esc(task.links)}</a></div>` : ''}
      </div>
      <div class="task-card__actions">
        ${!isArchived
          ? `<button class="btn btn-outline btn-xs btn-archive" data-id="${task.id}">📦 보관</button>`
          : ``
        }
        <button class="btn btn-outline btn-xs btn-reopen" data-id="${task.id}">↩ 다시 열기</button>
      </div>
    </div>
  `;
}
