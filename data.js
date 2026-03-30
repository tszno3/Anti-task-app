// ============================================================
// data.js — Supabase 연동 버전
// ============================================================

const SUPABASE_URL = 'https://csszyptzysqeqbsnilem.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzc3p5cHR6eXNxZXFic25pbGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDQ1MzUsImV4cCI6MjA5MDQyMDUzNX0.qhon5cvvpwsmLN9wKhwI2YMRkoqTyoxWilNj5w85J7k';
const API = `${SUPABASE_URL}/rest/v1/tasks`;
const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Prefer': 'return=representation'
};

const CATEGORIES = [
  'Treasury','Accounting','Tax','Closing','Audit',
  'Payroll','AP','AR','Intercompany','HQ Reporting',
  'Banking','Compliance','Admin'
];

const PRIORITIES = ['P1','P2','P3','P4'];

const STATUSES = [
  'Inbox','Clarifying','Planned','In Progress',
  'Waiting Reply','Done','Archived'
];

// ── Helpers ──────────────────────────────────────────────────
function uuid() {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function isToday(dateStr) { return dateStr === today(); }
function isOverdue(dateStr) { return dateStr && dateStr < today(); }
function isPastOrToday(dateStr) { return dateStr && dateStr <= today(); }

function dueThisWeek(dateStr) {
  if (!dateStr) return false;
  const end = daysFromNow(7);
  return dateStr >= today() && dateStr <= end;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${m}/${d}/${y.slice(2)}`;
}

function formatMinutes(mins) {
  if (!mins) return null;
  if (mins < 60) return `${mins}분`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

// ── Data Layer ───────────────────────────────────────────────
let _tasks = [];

async function loadTasks() {
  try {
    const res = await fetch(`${API}?order=created_at.asc`, { headers: HEADERS });
    _tasks = await res.json();
    if (!Array.isArray(_tasks)) _tasks = [];
  } catch(e) {
    console.error('loadTasks error', e);
    _tasks = [];
  }
}

function saveTasks() { /* Supabase는 각 CRUD에서 직접 저장 */ }

function getTasks() { return _tasks; }

function getTaskById(id) {
  return _tasks.find(t => t.id === id) || null;
}

async function createTask(fields = {}) {
  const task = {
    id:                  uuid(),
    title:               '',
    description:         '',
    requester:           '',
    owner:               'Me',
    category:            '',
    priority:            'P3',
    status:              'Inbox',
    received_date:       today(),
    due_date:            '',
    planned_date:        '',
    next_action:         '',
    waiting_on:          '',
    follow_up_date:      '',
    last_follow_up_date: '',
    estimated_time:      '',
    notes:               '',
    links:               '',
    completed_date:      '',
    ...fields
  };
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(task)
    });
    const data = await res.json();
    const created = Array.isArray(data) ? data[0] : data;
    _tasks.push(created);
    return created;
  } catch(e) {
    console.error('createTask error', e);
    return null;
  }
}

async function updateTask(id, fields) {
  try {
    const res = await fetch(`${API}?id=eq.${id}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify(fields)
    });
    const data = await res.json();
    const updated = Array.isArray(data) ? data[0] : data;
    const idx = _tasks.findIndex(t => t.id === id);
    if (idx !== -1) _tasks[idx] = { ..._tasks[idx], ...updated };
    return _tasks[idx];
  } catch(e) {
    console.error('updateTask error', e);
    return null;
  }
}

async function deleteTask(id) {
  try {
    await fetch(`${API}?id=eq.${id}`, {
      method: 'DELETE',
      headers: HEADERS
    });
    _tasks = _tasks.filter(t => t.id !== id);
  } catch(e) {
    console.error('deleteTask error', e);
  }
}

async function markDone(id) {
  return updateTask(id, { status: 'Done', completed_date: today() });
}

// ── Queries ──────────────────────────────────────────────────
function getTasksByStatus(...statuses) {
  return _tasks.filter(t => statuses.includes(t.status));
}

function getTodayTasks() {
  return _tasks.filter(t =>
    (t.status === 'In Progress' || (t.planned_date && isToday(t.planned_date)))
    && t.status !== 'Done' && t.status !== 'Archived' && t.status !== 'Waiting Reply'
  );
}

function getOverdueTasks() {
  return _tasks.filter(t =>
    t.due_date && isOverdue(t.due_date)
    && !['Done','Archived'].includes(t.status)
  );
}

function getWaitingTasks() {
  return _tasks.filter(t => t.status === 'Waiting Reply');
}

function getDueThisWeekTasks() {
  return _tasks.filter(t =>
    dueThisWeek(t.due_date) && !['Done','Archived'].includes(t.status)
  );
}

function sortByPriorityAndDue(tasks) {
  const pOrder = { P1: 0, P2: 1, P3: 2, P4: 3, '': 4 };
  return [...tasks].sort((a, b) => {
    const p = (pOrder[a.priority] ?? 4) - (pOrder[b.priority] ?? 4);
    if (p !== 0) return p;
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });
}

// ── Seed Data ────────────────────────────────────────────────
async function seedData() {
  if (_tasks.length > 0) return;

  const samples = [
    { title: 'HQ 월간 보고서 제출', requester: '이부장', category: 'HQ Reporting', priority: 'P1', status: 'Inbox', received_date: daysFromNow(-1), due_date: daysFromNow(2) },
    { title: 'AP 청구서 승인 요청', requester: '김과장', category: 'AP', priority: 'P2', status: 'Inbox', received_date: today(), description: '3건의 공급업체 청구서 검토 및 승인 필요' },
    { title: '법인세 신고 서류 검토', requester: '박세무사', category: 'Tax', priority: 'P1', status: 'Clarifying', received_date: daysFromNow(-3), due_date: daysFromNow(5), estimated_time: 120, next_action: '원천징수 확인서 수령 후 검토 시작' },
    { title: '급여 대장 최종 확인', requester: '인사팀', category: 'Payroll', priority: 'P1', status: 'Planned', received_date: daysFromNow(-2), due_date: today(), planned_date: today(), estimated_time: 45, next_action: '시스템에서 데이터 내보내기' },
    { title: '은행 잔액 조정', requester: '재무팀', category: 'Treasury', priority: 'P2', status: 'Planned', received_date: daysFromNow(-1), due_date: daysFromNow(1), planned_date: today(), estimated_time: 30, next_action: '은행 명세서 다운로드' },
    { title: '감사 소명 자료 준비', requester: '외부감사인', category: 'Audit', priority: 'P1', status: 'In Progress', received_date: daysFromNow(-5), due_date: daysFromNow(-1), planned_date: today(), estimated_time: 180, next_action: '전년도 재무제표 대조' },
    { title: '전신환 수수료 확인 이메일 회신', requester: '박대리', category: 'Banking', priority: 'P3', status: 'Planned', received_date: today(), due_date: today(), planned_date: today(), estimated_time: 10, next_action: '수수료 일람표 첨부하여 회신' },
    { title: '비용처리 내부 결재 상신', requester: '최사원', category: 'Accounting', priority: 'P3', status: 'Planned', planned_date: today(), due_date: daysFromNow(1), estimated_time: 20 },
    { title: '내부통제 자료 요청 (HQ)', requester: 'HQ Finance', category: 'Compliance', priority: 'P2', status: 'Waiting Reply', received_date: daysFromNow(-7), due_date: daysFromNow(3), waiting_on: 'HQ Finance Team', follow_up_date: daysFromNow(1), last_follow_up_date: daysFromNow(-2), notes: '2차 요청 발송 완료' },
    { title: 'AR 미수금 회수 확인', requester: '영업팀', category: 'AR', priority: 'P2', status: 'Waiting Reply', received_date: daysFromNow(-4), due_date: daysFromNow(2), waiting_on: '거래처 담당자 홍길동', follow_up_date: today(), last_follow_up_date: daysFromNow(-3) },
    { title: '계열사 간 거래 대사', requester: '연결팀', category: 'Intercompany', priority: 'P1', status: 'Waiting Reply', received_date: daysFromNow(-2), due_date: daysFromNow(4), waiting_on: '싱가포르 법인 재무팀', follow_up_date: daysFromNow(2) },
    { title: '전월 마감 결산 검토', requester: '재무이사', category: 'Closing', priority: 'P1', status: 'Done', received_date: daysFromNow(-14), due_date: daysFromNow(-7), completed_date: daysFromNow(-7), notes: '특이사항 없음. 정상 마감 완료.' },
    { title: '법인카드 지출 내역 정리', requester: '경영지원팀', category: 'Admin', priority: 'P4', status: 'Done', received_date: daysFromNow(-5), due_date: daysFromNow(-3), completed_date: daysFromNow(-3), estimated_time: 30 },
  ];

  for (const s of samples) {
    await createTask(s);
  }
}

// ── Init ─────────────────────────────────────────────────────
// loadTasks()는 async이므로 app.js에서 await loadTasks() 후 앱 초기화 필요
