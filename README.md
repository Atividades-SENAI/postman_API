# API de Notas com Front-end

Aplicação completa com API REST em **Node.js (Express)** e interface web responsiva e moderna em **HTML5, CSS3 e JavaScript puro**.

---

## 🚀 Como Executar o Projeto

1. Certifique-se de ter as dependências instaladas:
   ```bash
   npm install
   ```

2. Inicie o servidor:
   ```bash
   npm start
   ```

3. Abra no navegador:
   ```text
   http://localhost:3000
   ```

---

## ✨ Funcionalidades do Front-end

- **Listagem de Notas**: exibe todos os cartões de notas salvos com título, conteúdo e data formatada.
- **Criação de Notas**: formulário intuitivo para adicionar novas anotações.
- **Edição de Notas**: permite alterar o título e conteúdo de notas já existentes (com botão de cancelamento).
- **Exclusão de Notas**: remoção direta com confirmação e feedback visual.
- **Busca em Tempo Real**: barra de pesquisa rápida para filtrar notas por título ou texto.
- **Status da API**: badge visual que indica em tempo real se a API está online ou offline.
- **Feedback Visual (Toast)**: notificações sutis ao criar, editar ou excluir notas.
- **Design Moderno e Responsivo**: layout escuro (*dark mode*) elegante adaptado para desktop e celular.

---

## 📡 Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/` | Página web do front-end (`index.html`) |
| `GET` | `/api/status` | Retorna o status de conexão da API |
| `GET` | `/api/notes` | Lista todas as notas cadastradas |
| `GET` | `/api/notes/:id` | Busca uma nota específica por ID |
| `POST` | `/api/notes` | Cadastra uma nova nota (`{ titulo, texto }`) |
| `PUT` | `/api/notes/:id` | Atualiza uma nota existente |
| `DELETE` | `/api/notes/:id` | Remove uma nota pelo ID |
