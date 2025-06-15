const API_BASE_URL = 'http://localhost:8080/api';

const apiService = {
  async fetchLista(_listaId) {
    try {
      const response = await fetch(`${API_BASE_URL}/listas`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar lista:', error);
      throw error;
    }
  },

  async criarLista(novaLista) {
    try {
      const response = await fetch(`${API_BASE_URL}/listas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(novaLista)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      throw error;
    }
  },

  async atualizarTarefa(listaId, tarefaId, tarefaAtualizada) {
    try {
      const response = await fetch(`${API_BASE_URL}/listas/${listaId}/tarefas/${tarefaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tarefaAtualizada)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      throw error;
    }
  },

  async adicionarTarefa(listaId, novaTarefa) {
    try {
      const response = await fetch(`${API_BASE_URL}/listas/${listaId}/tarefas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(novaTarefa)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      throw error;
    }
  }
};

export default apiService;