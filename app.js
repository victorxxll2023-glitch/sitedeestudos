/**
 * ADS Study Hub — app.js
 * Funcionalidades: matérias, tarefas, anotações, progresso, dark mode
 * Armazenamento: localStorage
 */

/* ============================================
   ESTADO GLOBAL
   ============================================ */
const state = {
  subjects: [],   // { id, name, desc, color, icon, createdAt }
  tasks:    [],   // { id, desc, subjectId, priority, done, createdAt }
  notes:    [],   // { id, title, content, subjectId, updatedAt }
  theme:    'dark'
};

/* ============================================
   PERSISTÊNCIA — localStorage
   ============================================ */
function saveState() {
  localStorage.setItem('ads_hub_subjects', JSON.stringify(state.subjects));
  localStorage.setItem('ads_hub_tasks',    JSON.stringify(state.tasks));
  localStorage.setItem('ads_hub_notes',    JSON.stringify(state.notes));
  localStorage.setItem('ads_hub_theme',    state.theme);
}

function loadState() {
  state.subjects = JSON.parse(localStorage.getItem('ads_hub_subjects') || '[]');
  state.tasks    = JSON.parse(localStorage.getItem('ads_hub_tasks')    || '[]');
  state.notes    = JSON.parse(localStorage.getItem('ads_hub_notes')    || '[]');
  state.theme    = localStorage.getItem('ads_hub_theme') || 'dark';
}

/* ============================================
   UTILITÁRIOS
   ============================================ */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Exibe o toast de notificação
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  toast.className = `toast show ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// Modal de confirmação
let confirmCallback = null;
function showConfirm(title, message, cb) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  confirmCallback = cb;
  document.getElementById('confirmModal').classList.add('open');
}

// Popula selects de matéria em toda a UI
function populateSubjectSelects() {
  const selects = [
    document.getElementById('taskSubject'),
    document.getElementById('filterSubject'),
    document.getElementById('noteSubject')
  ];
  selects.forEach(sel => {
    if (!sel) return;
    const isFilter = sel.id === 'filterSubject';
    const current = sel.value;
    sel.innerHTML = isFilter
      ? '<option value="">Todas as matérias</option>'
      : '<option value="">Sem matéria</option>';
    state.subjects.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      sel.appendChild(opt);
    });
    sel.value = current;
  });
}

// Retorna o objeto de matéria pelo id
function getSubject(id) {
  return state.subjects.find(s => s.id === id) || null;
}

/* ============================================
   TEMA CLARO / ESCURO
   ============================================ */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon  = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (theme === 'dark') {
    icon.className = 'fa-solid fa-moon';
    label.textContent = 'Tema Escuro';
  } else {
    icon.className = 'fa-solid fa-sun';
    label.textContent = 'Tema Claro';
  }
}

document.getElementById('themeToggle').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.theme);
  saveState();
});

/* ============================================
   NAVEGAÇÃO ENTRE PÁGINAS
   ============================================ */
const PAGE_TITLES = {
  home:     'Dashboard',
  subjects: 'Matérias',
  tasks:    'Tarefas',
  notes:    'Anotações'
};

function navigateTo(page) {
  // Desativa páginas e itens de nav
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Ativa a página e o item de nav corretos
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  document.getElementById('topbarTitle').textContent = PAGE_TITLES[page] || '';

  // Fecha sidebar no mobile
  document.getElementById('sidebar').classList.remove('open');

  // Atualiza a renderização da página correspondente
  if (page === 'home')     renderHome();
  if (page === 'subjects') renderSubjects();
  if (page === 'tasks')    renderTasks();
  if (page === 'notes')    renderNotes();
}

// Listeners de nav
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.page));
});

// Botões "Ver todas" / "btn-link"
document.querySelectorAll('.btn-link').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.page));
});

// Sidebar toggle (desktop: colapsa)
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

// Menu mobile
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ============================================
   BARRA DE PESQUISA GLOBAL
   ============================================ */
document.getElementById('globalSearch').addEventListener('input', function () {
  const q = this.value.trim().toLowerCase();
  if (!q) { renderTasks(); return; }

  // Navega para tarefas e aplica filtro
  navigateTo('tasks');
  renderTasks(q);
});

/* ============================================
   RENDER: HOME
   ============================================ */
function renderHome() {
  const total = state.tasks.length;
  const done  = state.tasks.filter(t => t.done).length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  // Stats
  document.getElementById('statSubjects').textContent = state.subjects.length;
  document.getElementById('statTasks').textContent    = total;
  document.getElementById('statDone').textContent     = done;
  document.getElementById('statNotes').textContent    = state.notes.length;

  // Progresso
  document.getElementById('progressPct').textContent = `${pct}%`;
  document.getElementById('progressBar').style.width = `${pct}%`;
  document.getElementById('progressHint').textContent =
    total === 0 ? 'Nenhuma tarefa cadastrada ainda.'
    : `${done} de ${total} tarefas concluídas`;

  // Preview de matérias
  const spEl = document.getElementById('subjectsPreview');
  if (state.subjects.length === 0) {
    spEl.innerHTML = '<div class="empty-state-small">Nenhuma matéria cadastrada.</div>';
  } else {
    spEl.innerHTML = state.subjects.map(s => `
      <span class="subject-chip" style="background:${s.color}">
        <i class="fa-solid ${s.icon}"></i> ${s.name}
      </span>
    `).join('');
  }

  // Preview de tarefas pendentes (últimas 4)
  const pending = state.tasks.filter(t => !t.done).slice(-4).reverse();
  const tpEl = document.getElementById('tasksPreview');
  if (pending.length === 0) {
    tpEl.innerHTML = '<div class="empty-state-small">Nenhuma tarefa pendente. 🎉</div>';
  } else {
    tpEl.innerHTML = pending.map(t => {
      const subj = getSubject(t.subjectId);
      return `
        <div class="task-preview-item">
          <span class="priority-dot dot-${t.priority}"></span>
          <span style="flex:1;font-size:.88rem">${t.desc}</span>
          ${subj ? `<span class="task-badge" style="background:${subj.color}">${subj.name}</span>` : ''}
        </div>
      `;
    }).join('');
  }
}

/* ============================================
   RENDER: MATÉRIAS
   ============================================ */
function renderSubjects() {
  const list  = document.getElementById('subjectsList');
  const empty = document.getElementById('subjectsEmpty');

  if (state.subjects.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = state.subjects.map((s, i) => {
    const taskCount = state.tasks.filter(t => t.subjectId === s.id).length;
    const doneCount = state.tasks.filter(t => t.subjectId === s.id && t.done).length;
    return `
      <div class="subject-card" style="animation-delay:${i * 0.05}s">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${s.color};border-radius:${14}px ${14}px 0 0"></div>
        <div class="subject-card-header">
          <div class="subject-card-icon" style="background:${s.color}">
            <i class="fa-solid ${s.icon}"></i>
          </div>
          <div class="subject-card-actions">
            <button class="btn-icon danger" onclick="deleteSubject('${s.id}')" title="Excluir">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="subject-card-name">${s.name}</div>
        ${s.desc ? `<div class="subject-card-desc">${s.desc}</div>` : ''}
        <div class="subject-task-count">
          <i class="fa-solid fa-list-check"></i>
          ${taskCount === 0 ? 'Nenhuma tarefa' : `${doneCount}/${taskCount} tarefas`}
        </div>
      </div>
    `;
  }).join('');
}

/* Adicionar matéria */
let selectedColor = '#4f8ef7';

document.getElementById('colorPicker').addEventListener('click', e => {
  const btn = e.target.closest('.color-btn');
  if (!btn) return;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedColor = btn.dataset.color;
});

document.getElementById('addSubjectBtn').addEventListener('click', () => {
  const name = document.getElementById('subjectName').value.trim();
  const desc = document.getElementById('subjectDesc').value.trim();
  const icon = document.getElementById('subjectIcon').value;

  if (!name) { showToast('Informe o nome da matéria.', 'error'); return; }
  if (state.subjects.find(s => s.name.toLowerCase() === name.toLowerCase())) {
    showToast('Já existe uma matéria com esse nome.', 'error'); return;
  }

  state.subjects.push({ id: genId(), name, desc, color: selectedColor, icon, createdAt: new Date().toISOString() });
  saveState();
  populateSubjectSelects();
  renderSubjects();
  showToast(`Matéria "${name}" adicionada!`, 'success');

  document.getElementById('subjectName').value = '';
  document.getElementById('subjectDesc').value = '';
});

function deleteSubject(id) {
  const s = getSubject(id);
  if (!s) return;
  showConfirm('Excluir Matéria', `Tem certeza que deseja excluir "${s.name}"? As tarefas vinculadas perderão a matéria.`, () => {
    state.subjects = state.subjects.filter(x => x.id !== id);
    state.tasks.forEach(t => { if (t.subjectId === id) t.subjectId = ''; });
    saveState();
    populateSubjectSelects();
    renderSubjects();
    renderHome();
    showToast('Matéria excluída.', 'info');
  });
}

/* ============================================
   RENDER: TAREFAS
   ============================================ */
let activeFilter  = 'all';
let activeSubjFilter = '';

function renderTasks(searchQuery = '') {
  const list  = document.getElementById('tasksList');
  const empty = document.getElementById('tasksEmpty');

  // Progresso
  const total = state.tasks.length;
  const done  = state.tasks.filter(t => t.done).length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('taskProgressPct').textContent = `${pct}%`;
  document.getElementById('taskProgressBar').style.width  = `${pct}%`;

  // Filtragem
  let filtered = [...state.tasks];

  if (activeFilter === 'pending') filtered = filtered.filter(t => !t.done);
  if (activeFilter === 'done')    filtered = filtered.filter(t => t.done);

  if (activeSubjFilter) filtered = filtered.filter(t => t.subjectId === activeSubjFilter);

  if (searchQuery) {
    filtered = filtered.filter(t => t.desc.toLowerCase().includes(searchQuery));
  }

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  // Ordena: pendentes antes, depois por data desc
  filtered.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  list.innerHTML = filtered.map((t, i) => {
    const subj = getSubject(t.subjectId);
    const priorityLabels = { alta: '🔴 Alta', media: '🟡 Média', baixa: '🟢 Baixa' };
    return `
      <div class="task-item ${t.done ? 'done' : ''}" style="animation-delay:${i * 0.04}s">
        <div class="task-checkbox" onclick="toggleTask('${t.id}')" title="Marcar como ${t.done ? 'pendente' : 'concluída'}">
          ${t.done ? '<i class="fa-solid fa-check"></i>' : ''}
        </div>
        <span class="task-text">${t.desc}</span>
        <span class="task-badge priority-${t.priority}">${priorityLabels[t.priority]}</span>
        ${subj ? `<span class="task-badge" style="background:${subj.color};opacity:.85">${subj.name}</span>` : ''}
        <div class="task-actions">
          <button class="btn-icon danger" onclick="deleteTask('${t.id}')" title="Excluir">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* Adicionar tarefa */
document.getElementById('addTaskBtn').addEventListener('click', () => {
  const desc   = document.getElementById('taskDesc').value.trim();
  const subjId = document.getElementById('taskSubject').value;
  const prio   = document.getElementById('taskPriority').value;

  if (!desc) { showToast('Informe a descrição da tarefa.', 'error'); return; }

  state.tasks.push({ id: genId(), desc, subjectId: subjId, priority: prio, done: false, createdAt: new Date().toISOString() });
  saveState();
  renderTasks();
  renderHome();
  showToast('Tarefa adicionada!', 'success');
  document.getElementById('taskDesc').value = '';
});

/* Enter na descrição da tarefa */
document.getElementById('taskDesc').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('addTaskBtn').click();
});

/* Toggle concluída */
function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveState();
  renderTasks();
  renderHome();
  showToast(task.done ? 'Tarefa concluída! 🎉' : 'Tarefa reaberta.', task.done ? 'success' : 'info');
}

/* Excluir tarefa */
function deleteTask(id) {
  showConfirm('Excluir Tarefa', 'Deseja realmente excluir esta tarefa?', () => {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveState();
    renderTasks();
    renderHome();
    showToast('Tarefa excluída.', 'info');
  });
}

/* Filtros */
document.getElementById('filterTabs').addEventListener('click', e => {
  const tab = e.target.closest('.filter-tab');
  if (!tab) return;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  activeFilter = tab.dataset.filter;
  renderTasks();
});

document.getElementById('filterSubject').addEventListener('change', function () {
  activeSubjFilter = this.value;
  renderTasks();
});

/* ============================================
   RENDER: ANOTAÇÕES
   ============================================ */
let currentNoteId = null;

function renderNotes(searchQuery = '') {
  const grid  = document.getElementById('notesList');
  const empty = document.getElementById('notesEmpty');

  let notes = [...state.notes];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    notes = notes.filter(n =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }

  // Ordena por data de atualização desc
  notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (notes.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = notes.map((n, i) => {
    const subj = getSubject(n.subjectId);
    return `
      <div class="note-card" onclick="openNote('${n.id}')" style="animation-delay:${i * 0.05}s">
        <div class="note-card-title">${n.title || 'Sem título'}</div>
        <div class="note-card-preview">${n.content || '<em>Nota vazia...</em>'}</div>
        <div class="note-card-footer">
          <span class="note-card-date">${fmtDate(n.updatedAt)}</span>
          ${subj ? `<span class="note-card-badge" style="background:${subj.color}">${subj.name}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/* Abrir modal de nota (nova ou existente) */
function openNote(id) {
  currentNoteId = id || null;
  const note = id ? state.notes.find(n => n.id === id) : null;

  document.getElementById('noteTitle').value   = note ? note.title : '';
  document.getElementById('noteContent').value = note ? note.content : '';
  document.getElementById('noteSubject').value = note ? (note.subjectId || '') : '';
  document.getElementById('noteDate').textContent = note ? `Atualizado: ${fmtDate(note.updatedAt)}` : '';
  document.getElementById('deleteNoteBtn').style.display = note ? 'inline-flex' : 'none';

  document.getElementById('noteModal').classList.add('open');
  setTimeout(() => document.getElementById('noteTitle').focus(), 100);
}

/* Botão nova nota */
document.getElementById('addNoteBtn').addEventListener('click', () => openNote(null));

/* Salvar nota */
document.getElementById('saveNoteBtn').addEventListener('click', () => {
  const title   = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();
  const subjId  = document.getElementById('noteSubject').value;

  if (!title && !content) {
    showToast('A nota está vazia.', 'error');
    return;
  }

  if (currentNoteId) {
    // Editar existente
    const note = state.notes.find(n => n.id === currentNoteId);
    if (note) {
      note.title = title || 'Sem título';
      note.content = content;
      note.subjectId = subjId;
      note.updatedAt = new Date().toISOString();
    }
  } else {
    // Nova nota
    state.notes.push({
      id: genId(),
      title: title || 'Sem título',
      content,
      subjectId: subjId,
      updatedAt: new Date().toISOString()
    });
  }

  saveState();
  document.getElementById('noteModal').classList.remove('open');
  renderNotes();
  renderHome();
  showToast('Anotação salva!', 'success');
});

/* Excluir nota */
document.getElementById('deleteNoteBtn').addEventListener('click', () => {
  showConfirm('Excluir Anotação', 'Deseja realmente excluir esta anotação?', () => {
    state.notes = state.notes.filter(n => n.id !== currentNoteId);
    saveState();
    document.getElementById('noteModal').classList.remove('open');
    renderNotes();
    renderHome();
    showToast('Anotação excluída.', 'info');
  });
});

/* Fechar modal de nota */
document.getElementById('closeNoteModal').addEventListener('click', () => {
  document.getElementById('noteModal').classList.remove('open');
});

/* Pesquisa nas notas */
document.getElementById('noteSearch').addEventListener('input', function () {
  renderNotes(this.value.trim());
});

/* ============================================
   MODAL DE CONFIRMAÇÃO
   ============================================ */
document.getElementById('confirmOk').addEventListener('click', () => {
  document.getElementById('confirmModal').classList.remove('open');
  if (typeof confirmCallback === 'function') confirmCallback();
  confirmCallback = null;
});

document.getElementById('confirmCancel').addEventListener('click', () => {
  document.getElementById('confirmModal').classList.remove('open');
  confirmCallback = null;
});

/* Fechar modais ao clicar no overlay */
['noteModal', 'confirmModal'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('click', e => {
    if (e.target === el) el.classList.remove('open');
  });
});

/* ============================================
   INICIALIZAÇÃO
   ============================================ */
function init() {
  loadState();
  applyTheme(state.theme);
  populateSubjectSelects();
  navigateTo('home');
}

// Expõe funções de ação ao HTML inline (onclick)
window.toggleTask    = toggleTask;
window.deleteTask    = deleteTask;
window.deleteSubject = deleteSubject;
window.openNote      = openNote;

// Inicia o app
init();
