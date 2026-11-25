import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;
const FILE = 'data.json';

// Configuração completa de CORS para aceitar requisições de qualquer origem (inclusive Live Server e file://)
app.use(cors({ origin: '*' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middlewares
app.use(express.json());
app.use(express.static('public')); // Serve os arquivos do front-end (index.html, style.css, script.js)

// Funções auxiliares para leitura e gravação no data.json
function readNotes() {
  try {
    const data = fs.readFileSync(FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  fs.writeFileSync(FILE, JSON.stringify(notes, null, 2));
}

// Rota de status da API
app.get('/api/status', (req, res) => {
  res.json({
    date: new Date().toLocaleString('pt-BR'),
    status: 'API funcionando com sucesso!'
  });
});

// 1. Listar todas as notas (GET)
app.get('/api/notes', (req, res) => {
  res.json(readNotes());
});

// 2. Buscar nota por ID (GET)
app.get('/api/notes/:id', (req, res) => {
  const notes = readNotes();
  const note = notes.find(n => n.id === req.params.id);
  if (note) {
    res.json(note);
  } else {
    res.status(404).json({ erro: 'Nota não encontrada' });
  }
});

// 3. Criar nova nota (POST)
app.post('/api/notes', (req, res) => {
  const notes = readNotes();
  const novaNota = {
    id: Date.now().toString(),
    titulo: req.body.titulo || 'Sem título',
    texto: req.body.texto || '',
    criadoEm: new Date().toISOString()
  };
  notes.push(novaNota);
  saveNotes(notes);
  res.status(201).json(novaNota);
});

// 4. Atualizar nota existente (PUT)
app.put('/api/notes/:id', (req, res) => {
  const notes = readNotes();
  const index = notes.findIndex(n => n.id === req.params.id);
  if (index >= 0) {
    notes[index].titulo = req.body.titulo !== undefined ? req.body.titulo : notes[index].titulo;
    notes[index].texto = req.body.texto !== undefined ? req.body.texto : notes[index].texto;
    saveNotes(notes);
    res.json(notes[index]);
  } else {
    res.status(404).json({ erro: 'Nota não encontrada' });
  }
});

// 5. Excluir nota (DELETE)
app.delete('/api/notes/:id', (req, res) => {
  const notes = readNotes();
  const novasNotas = notes.filter(n => n.id !== req.params.id);
  saveNotes(novasNotas);
  res.json({ mensagem: 'Nota removida com sucesso' });
});

// Escuta em 0.0.0.0 para aceitar conexões via localhost, 127.0.0.1 ou rede local
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Frontend disponível em http://localhost:${PORT}`);
});
