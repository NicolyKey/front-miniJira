<template>
  <v-container fluid class="kanban-board pa-4">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" size="32">mdi-view-dashboard</v-icon>
            <div>
              <h2>{{ listaAtual.nomeLista || 'Carregando...' }}</h2>
              <p class="text-caption mb-0">
                Criador: {{ listaAtual.criadorId }} | 
                Total de Tarefas: {{ totalTarefas }}
              </p>
            </div>
            <v-spacer></v-spacer>
            <v-btn @click="carregarDados" :loading="loading" icon="mdi-refresh"></v-btn>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading" justify="center" class="mt-12">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
        <p class="mt-4">Carregando dados da API...</p>
      </v-col>
    </v-row>

    <v-alert v-if="erro" type="error" class="mb-4" closable @click:close="erro = null">
      {{ erro }}
    </v-alert>


    <v-row v-if="!loading && !erro" class="fill-height">
      <kanban-column
        titulo="📋 A Fazer"
        icone="mdi-format-list-bulleted"
        cor="#2196F3"
        status="todo"
        :tarefas="listaAtual.tarefas || []"
        :lista-completa="listaAtual"
        @mover-tarefa="moverTarefa"
        @atualizar-tarefa="atualizarTarefa"
      />

      <kanban-column
        titulo="⚡ Em Progresso"
        icone="mdi-clock-fast"
        cor="#FF9800"
        status="progress"
        :tarefas="listaAtual.tarefas || []"
        :lista-completa="listaAtual"
        @mover-tarefa="moverTarefa"
        @atualizar-tarefa="atualizarTarefa"
      />

      <kanban-column
        titulo="✅ Concluído"
        icone="mdi-check-circle"
        cor="#4CAF50"
        status="done"
        :tarefas="listaAtual.tarefas || []"
        :lista-completa="listaAtual"
        @mover-tarefa="moverTarefa"
        @atualizar-tarefa="atualizarTarefa"
      />
    </v-row>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
      location="bottom right"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Fechar
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import KanbanColumn from './KanbanColumn.vue';
import apiService from '../services/api.service';

export default {
  name: 'KanbanBoard',
  components: {
    KanbanColumn
  },
  data() {
    return {
      loading: false,
      erro: null,
      listaAtual: {},
      snackbar: {
        show: false,
        message: '',
        color: 'success'
      }
    }
  },
  computed: {
    totalTarefas() {
      return this.listaAtual.tarefas ? this.listaAtual.tarefas.length : 0
    }
  },
  async mounted() {
    await this.carregarDados();
  },
  methods: {
    async carregarDados() {
      this.loading = true;
      this.erro = null;
      
      try {
        const listaId = '683cca7572949ccbc8b23d53'; // Exemplo de ID
        this.listaAtual = await apiService.fetchLista(listaId);
        this.mostrarSnackbar('Dados carregados com sucesso!', 'success');
      } catch (error) {
        this.erro = `Erro ao carregar dados: ${error.message}`;
      } finally {
        this.loading = false;
      }
    },
    
    async moverTarefa({ tarefaId, novoStatus, colunaDestino }) {
      try {
        const tarefa = this.listaAtual.tarefas.find(t => t.idTarefa === tarefaId);
        if (!tarefa) {
          throw new Error('Tarefa não encontrada');
        }
        
        const tarefaAtualizada = { ...tarefa };
        
        switch (colunaDestino) {
          case 'todo':
            tarefaAtualizada.concluida = false;
            tarefaAtualizada.prioridade = 2;
            break;
          case 'progress':
            tarefaAtualizada.concluida = false;
            tarefaAtualizada.prioridade = 1;
            break;
          case 'done':
            tarefaAtualizada.concluida = true;
            break;
        }
        
        await apiService.atualizarTarefa(
          this.listaAtual.id,
          tarefaId,
          tarefaAtualizada
        );
        
        const index = this.listaAtual.tarefas.findIndex(t => t.idTarefa === tarefaId);
        if (index !== -1) {
          this.listaAtual.tarefas[index] = tarefaAtualizada;
        }
        
        this.mostrarSnackbar(`Tarefa movida para ${this.getNomeColuna(colunaDestino)}!`, 'success');
      } catch (error) {
        this.mostrarSnackbar(`Erro ao mover tarefa: ${error.message}`, 'error');
      }
    },
    
    async atualizarTarefa(tarefaAtualizada) {
      try {
        await apiService.atualizarTarefa(
          this.listaAtual.id,
          tarefaAtualizada.idTarefa,
          tarefaAtualizada
        );
        
        const index = this.listaAtual.tarefas.findIndex(t => t.idTarefa === tarefaAtualizada.idTarefa);
        if (index !== -1) {
          this.listaAtual.tarefas[index] = tarefaAtualizada;
        }
        
        this.mostrarSnackbar('Tarefa atualizada com sucesso!', 'success');
      } catch (error) {
        this.mostrarSnackbar(`Erro ao atualizar tarefa: ${error.message}`, 'error');
      }
    },
    
    getNomeColuna(status) {
      switch (status) {
        case 'todo': return 'A Fazer';
        case 'progress': return 'Em Progresso';
        case 'done': return 'Concluído';
        default: return 'Desconhecido';
      }
    },
    
    mostrarSnackbar(message, color = 'success') {
      this.snackbar = {
        show: true,
        message,
        color
      };
    }
  }
}
</script>

<style scoped>
.kanban-board {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}
</style>