// ============================================================
// views/task-modal.js — Full Task Detail / Edit Modal
// ============================================================

function openTaskModal(taskId) {
  const task = getTaskById(taskId);
  if (!task) return;

  document.getElementById('modal-title').textContent = '업무 상세';
  const body = document.getElementById('modal-body');
  body.innerHTML = buildModalForm(task);
  document.getElementById('modal-overlay').classList.remove('hidden');

  // Wire save
  document.getElementById('modal-btn-save').addEventListener('click', () => {
    const updates = {
      title:           document.getElementById('modal-title-input').value.trim(),
      description:     document.getElementById('modal-desc').value.trim(),
      requester:       document.getElementById('modal-requester').value.trim(),
      owner:           document.getElementById('modal-owner').value.trim(),
      category:        document.getElementById('modal-category').value,
      priority:        document.getElementById('modal-priority').value,
      status:          document.getElementById('modal-status').value,
      estimated_time:  document.getElementById('modal-est-time').value,
      received_date:   document.getElementById('modal-received').value,
      due_date:        document.getElementById('modal-due').value,
      planned_date:    document.getElementById('modal-planned').value,
      next_action:     document.getElementById('modal-next-action').value.trim(),
      waiting_on:      document.getElementById('modal-waiting-on').value.trim(),
      follow_up_date:  document.getElementById('modal-followup').value,
      notes:           document.getElementById('modal-notes').value.trim(),
      links:           document.getElementById('modal-links').value.trim(),
    };
    if (!updates.title) { showToast('업무명을 입력하세요', 'error'); return; }
    if (updates.status === 'Done' && !getTaskById(taskId).completed_date) {
      updates.completed_date = today();
    }
    updateTask(taskId, updates);
    showToast('저장되었습니다', 'success');
    closeTaskModal();
    refresh();
  });

  // Wire delete
  document.getElementById('modal-btn-delete').addEventListener('click', () => {
    if (!confirm('이 업무를 삭제하시겠습니까?')) return;
    deleteTask(taskId);
    showToast('삭제되었습니다', 'warning');
    closeTaskModal();
    refresh();
  });

  // Wire cancel
  document.getElementById('modal-btn-cancel').addEventListener('click', closeTaskModal);
}

function buildModalForm(task) {
  const cats = ['', ...CATEGORIES].map(c =>
    `<option value="${c}" ${task.category === c ? 'selected' : ''}>${c || '카테고리 선택'}</option>`).join('');
  const pris = ['', ...PRIORITIES].map(p =>
    `<option value="${p}" ${task.priority === p ? 'selected' : ''}>${p || '우선순위 선택'}</option>`).join('');
  const stats = STATUSES.map(s =>
    `<option value="${s}" ${task.status === s ? 'selected' : ''}>${s}</option>`).join('');

  return `
    <div class="modal-grid">
      <div class="form-group span-2">
        <label class="form-label">업무명 *</label>
        <input class="form-control" id="modal-title-input" type="text" value="${esc(task.title)}" placeholder="업무명 입력" />
      </div>
      <div class="form-group span-2">
        <label class="form-label">설명</label>
        <textarea class="form-control" id="modal-desc" rows="2" placeholder="업무 내용 요약">${esc(task.description)}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">요청자</label>
        <input class="form-control" id="modal-requester" type="text" value="${esc(task.requester)}" placeholder="요청자 이름" />
      </div>
      <div class="form-group">
        <label class="form-label">담당자</label>
        <input class="form-control" id="modal-owner" type="text" value="${esc(task.owner)}" />
      </div>
      <div class="form-group">
        <label class="form-label">카테고리</label>
        <select class="form-control" id="modal-category">${cats}</select>
      </div>
      <div class="form-group">
        <label class="form-label">우선순위</label>
        <select class="form-control" id="modal-priority">${pris}</select>
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" id="modal-status">${stats}</select>
      </div>
      <div class="form-group">
        <label class="form-label">예상 시간 (분)</label>
        <input class="form-control" id="modal-est-time" type="number" min="1" value="${task.estimated_time || ''}" placeholder="예: 60" />
      </div>
      <div class="form-group">
        <label class="form-label">접수일</label>
        <input class="form-control" id="modal-received" type="date" value="${task.received_date || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">마감일</label>
        <input class="form-control" id="modal-due" type="date" value="${task.due_date || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">계획일</label>
        <input class="form-control" id="modal-planned" type="date" value="${task.planned_date || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">팔로우업 날짜</label>
        <input class="form-control" id="modal-followup" type="date" value="${task.follow_up_date || ''}" />
      </div>
      <div class="form-group span-2">
        <label class="form-label">다음 액션</label>
        <input class="form-control" id="modal-next-action" type="text" value="${esc(task.next_action)}" placeholder="바로 해야 할 다음 단계" />
      </div>
      <div class="form-group span-2">
        <label class="form-label">대기 중 (담당자/부서)</label>
        <input class="form-control" id="modal-waiting-on" type="text" value="${esc(task.waiting_on)}" placeholder="답변 기다리는 대상" />
      </div>
      <div class="form-group span-2">
        <label class="form-label">메모</label>
        <textarea class="form-control" id="modal-notes" rows="2" placeholder="참고 사항, 히스토리 등">${esc(task.notes)}</textarea>
      </div>
      <div class="form-group span-2">
        <label class="form-label">링크</label>
        <input class="form-control" id="modal-links" type="text" value="${esc(task.links)}" placeholder="관련 파일 경로 또는 URL" />
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-danger btn-sm" id="modal-btn-delete">🗑 삭제</button>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline" id="modal-btn-cancel">취소</button>
        <button class="btn btn-primary" id="modal-btn-save">저장</button>
      </div>
    </div>
  `;
}

function closeTaskModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
