// Determina os possíveis endpoints da API de forma inteligente
function getCandidates() {
  if (window.location.protocol === 'file:') {
    return ['http://localhost:3000', 'http://127.0.0.1:3000'];
  }
  if (window.location.port === '3000') {
    return ['']; // Mesma origem
  }
  const host = window.location.hostname || 'localhost';
  return [
    `http://${host}:3000`,
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];
}

let API_BASE_HOST = getCandidates()[0];

// Elementos do DOM
const form = document.getElementById('note-form');
const noteIdInput = document.getElementById('note-id');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const formTitle = document.getElementById('form-title');
const editIndicator = document.getElementById('edit-indicator');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const searchInput = document.getElementById('search-input');
const notesGrid = document.getElementById('notes-grid');
const emptyState = document.getElementById('empty-state');
const emptyDescription = document.getElementById('empty-description');
const troubleshootBox = document.getElementById('troubleshoot-box');
const retryBtn = document.getElementById('retry-btn');
const notesCount = document.getElementById('notes-count');
const apiStatusBadge = document.getElementById('api-status');
const statusLabel = document.getElementById('status-label');
const toast = document.getElementById('toast');
const fileProtocolWarning = document.getElementById('file-protocol-warning');

// Se aberto como file:///, exibir aviso claro no topo
if (window.location.protocol === 'file:') {
  if (fileProtocolWarning) fileProtocolWarning.classList.remove('hidden');
}

// Estado da aplicação
let allNotes = [];
let toastTimeout = null;

// Exibir mensagem temporária (toast)
function showToast(message) {
  if (toastTimeout) clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.remove('hidden');

  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// Tentar encontrar o endpoint funcional da API
async function resolveApiHost() {
  const candidates = getCandidates();
  for (const candidate of candidates) {
    try {
      const res = await fetch(`${candidate}/api/status`, { mode: 'cors' });
      if (res.ok) {
        API_BASE_HOST = candidate;
        return true;
      }
    } catch (e) {
      // tenta o próximo candidato
    }
  }
  return false;
}

// Checar conexão com a API
async function checkApiStatus() {
  const isOnline = await resolveApiHost();
  if (isOnline) {
    apiStatusBadge.className = 'api-status-badge online';
    statusLabel.textContent = 'API Online';
    if (troubleshootBox) troubleshootBox.classList.add('hidden');
    return true;
  } else {
    apiStatusBadge.className = 'api-status-badge offline';
    statusLabel.textContent = 'API Offline';
    return false;
  }
}

// Formatar data
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Buscar notas da API (GET)
async function fetchNotes() {
  const isOnline = await checkApiStatus();

  if (!isOnline) {
    notesGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    emptyState.querySelector('h3').textContent = 'Erro ao conectar à API';
    emptyDescription.textContent =
      'Não foi possível estabelecer conexão com o servidor Node.js.';
    if (troubleshootBox) troubleshootBox.classList.remove('hidden');
    notesCount.textContent = '0 notas';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_HOST}/api/notes`);
    if (!response.ok) throw new Error('Erro ao buscar notas');

    allNotes = await response.json();
    renderNotes();
  } catch (err) {
    console.error('Erro ao listar notas:', err);
    apiStatusBadge.className = 'api-status-badge offline';
    statusLabel.textContent = 'API Offline';
    notesGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    emptyState.querySelector('h3').textContent = 'Erro ao carregar dados';
    emptyDescription.textContent = err.message;
    if (troubleshootBox) troubleshootBox.classList.remove('hidden');
    notesCount.textContent = '0 notas';
  }
}

// Renderizar notas na tela
function renderNotes() {
  const query = searchInput.value.trim().toLowerCase();

  const filteredNotes = allNotes.filter(
    (note) =>
      (note.titulo && note.titulo.toLowerCase().includes(query)) ||
      (note.texto && note.texto.toLowerCase().includes(query))
  );

  notesCount.textContent = `${filteredNotes.length} ${
    filteredNotes.length === 1 ? 'nota' : 'notas'
  }`;

  notesGrid.innerHTML = '';

  if (filteredNotes.length === 0) {
    emptyState.classList.remove('hidden');
    if (troubleshootBox) troubleshootBox.classList.add('hidden');
    if (query) {
      emptyState.querySelector('h3').textContent = 'Nenhuma nota correspondente';
      emptyDescription.textContent = `Nenhum resultado encontrado para "${query}".`;
    } else {
      emptyState.querySelector('h3').textContent = 'Nenhuma nota ainda';
      emptyDescription.textContent = 'Crie sua primeira nota preenchendo o formulário acima!';
    }
    return;
  }

  emptyState.classList.add('hidden');

  filteredNotes.forEach((note) => {
    const card = document.createElement('article');
    card.className = 'note-item';

    card.innerHTML = `
      <div class="note-header">
        <h3 class="note-title">${escapeHtml(note.titulo || 'Sem título')}</h3>
        <span class="note-date">${formatDate(note.criadoEm)}</span>
      </div>
      <div class="note-body">${escapeHtml(note.texto || '')}</div>
      <div class="note-footer">
        <button class="btn btn-secondary btn-sm btn-edit" data-id="${note.id}">✏️ Editar</button>
        <button class="btn btn-danger btn-sm btn-delete" data-id="${note.id}">🗑️ Excluir</button>
      </div>
    `;

    notesGrid.appendChild(card);
  });
}

// Evitar injeção de HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Salvar nota (Criar ou Atualizar)
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = noteIdInput.value;
  const titulo = noteTitleInput.value.trim();
  const texto = noteContentInput.value.trim();

  if (!titulo && !texto) {
    alert('Por favor, digite ao menos um título ou conteúdo.');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Salvando...';

  try {
    if (id) {
      // Modo Edição (PUT)
      const res = await fetch(`${API_BASE_HOST}/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, texto })
      });

      if (!res.ok) throw new Error('Falha ao atualizar nota');
      showToast('✅ Nota atualizada com sucesso!');
    } else {
      // Modo Criação (POST)
      const res = await fetch(`${API_BASE_HOST}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, texto })
      });

      if (!res.ok) throw new Error('Falha ao criar nota');
      showToast('✨ Nova nota criada com sucesso!');
    }

    resetForm();
    await fetchNotes();
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar a nota. Verifique se o servidor está rodando.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = noteIdInput.value ? 'Atualizar Nota' : 'Salvar Nota';
  }
});

// Ações nos botões da lista (Editar / Excluir)
notesGrid.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('.btn-edit');
  const deleteBtn = e.target.closest('.btn-delete');

  if (editBtn) {
    const id = editBtn.dataset.id;
    const note = allNotes.find((n) => n.id === id);
    if (note) {
      startEditing(note);
    }
  }

  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
      await deleteNote(id);
    }
  }
});

// Iniciar edição
function startEditing(note) {
  noteIdInput.value = note.id;
  noteTitleInput.value = note.titulo || '';
  noteContentInput.value = note.texto || '';

  formTitle.textContent = 'Editar Nota';
  saveBtn.textContent = 'Atualizar Nota';
  editIndicator.classList.remove('hidden');
  cancelBtn.classList.remove('hidden');

  noteTitleInput.focus();
  form.scrollIntoView({ behavior: 'smooth' });
}

// Cancelar edição
cancelBtn.addEventListener('click', () => {
  resetForm();
});

function resetForm() {
  noteIdInput.value = '';
  form.reset();
  formTitle.textContent = 'Nova Nota';
  saveBtn.textContent = 'Salvar Nota';
  editIndicator.classList.add('hidden');
  cancelBtn.classList.add('hidden');
}

// Excluir nota (DELETE)
async function deleteNote(id) {
  try {
    const res = await fetch(`${API_BASE_HOST}/api/notes/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('Erro ao excluir nota');

    showToast('🗑️ Nota excluída com sucesso!');
    await fetchNotes();
  } catch (err) {
    console.error(err);
    alert('Erro ao excluir nota.');
  }
}

// Filtro de busca em tempo real
searchInput.addEventListener('input', () => {
  renderNotes();
});

// Botão de tentar reconectar
if (retryBtn) {
  retryBtn.addEventListener('click', () => {
    fetchNotes();
  });
}

// Inicialização
fetchNotes();
