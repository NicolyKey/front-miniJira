<template>
  <v-container fluid class="kanban-board pa-4">
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-title class="d-flex text-black align-center">
            <v-icon class="mr-2" size="32">mdi-view-dashboard</v-icon>
            <div>
              <h2 class="text-black">{{ listaAtual.nomeLista || 'Kaban board' }}</h2>
              <div class="d-flex align-center mt-1">
                <v-chip
                  v-for="tag in listaAtual.tags"
                  :key="tag"
                  size="small"
                  class="mr-2"
                  color="primary"
                  variant="outlined"
                >
                  {{ tag }}
                </v-chip>
              </div>
            </div>
            <v-spacer></v-spacer>
            <div class="d-flex align-center">
              <v-chip class="mr-2" color="info" variant="elevated">
                <v-icon start>mdi-account</v-icon>
                Criador: {{ listaAtual.criadorId }}
              </v-chip>
              <v-chip color="secondary" variant="elevated">
                <v-icon start>mdi-checkbox-marked-circle-outline</v-icon>
                Tarefas: {{ totalTarefas }} ({{ tarefasConcluidas }} concluídas)
              </v-chip>
              <v-btn
                @click="abrirDialogNovaLista"
                color="success"
                class="ml-2"
                variant="elevated"
              >
                <v-icon start>mdi-plus</v-icon>
                Nova Lista
              </v-btn>
               <DialogNewList ref="dialogNovaLista" />
              <v-btn
                @click="carregarDados"
                :loading="loading"
                icon="mdi-refresh"
                class="ml-2"
                variant="tonal"
                color="primary"
              ></v-btn>
            </div>
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

    <v-alert
      v-if="erro"
      type="error"
      class="mb-4"
      closable
      @click:close="erro = null"
      variant="tonal"
    >
      <v-icon start>mdi-alert-circle</v-icon>
      {{ erro }}
    </v-alert>

    <v-row v-if="!loading && !erro" class="fill-height" style="min-height: 70vh">
      <kanban-column
        titulo="listaAtual.nomeLista"
        icone="mdi-format-list-bulleted"
        cor="#2196F3"
        status="todo"
        :tarefas="listaAtual.tarefas || []"
        :lista-completa="listaAtual"
        @mover-tarefa="moverTarefa"
        @atualizar-tarefa="atualizarTarefa"
        @adicionar-tarefa="abrirDialogNovaTarefa"
      />
    </v-row>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
      location="bottom right"
    >
      <v-icon class="mr-2">{{ snackbar.icon }}</v-icon>
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
import DialogNewList from './DialogNewList.vue';


export default {
  name: 'KanbanBoard',
  components: {
    KanbanColumn,
    DialogNewList  
  },
  data() {
    return {
      loading: false,
      erro: null,
      listaAtual: {},
      prioridades: [
        { title: 'Alta', value: 1 },
        { title: 'Média', value: 2 },
        { title: 'Baixa', value: 3 }
      ],
      colaboradores: [
        { id: 'user123', nome: 'Criador' },
        { id: 'user456', nome: 'Colaborador 1' },
        { id: 'user789', nome: 'Colaborador 2' }
      ],
      snackbar: {
        show: false,
        message: '',
        color: 'success',
        icon: 'mdi-check-circle'
      }
    }
  },
  computed: {
    totalTarefas() {
      return this.listaAtual.tarefas ? this.listaAtual.tarefas.length : 0
    },
    tarefasConcluidas() {
      return this.listaAtual.tarefas 
        ? this.listaAtual.tarefas.filter(t => t.concluida).length 
        : 0
    }
  },
  async mounted() {
    await this.carregarDados();
  },
  methods: {

     abrirDialogNovaLista() {
      this.$refs.dialogNovaLista.dialog = true;  // Corrigido o nome da ref
    },

    async carregarDados() {
      this.loading = true;
      this.erro = null;
      
      try {
        const listaId = '683cca7572949ccbc8b23d53'; // Exemplo de ID
        this.listaAtual = await apiService.fetchLista(listaId);
        document.title = this.listaAtual.nomeLista || 'Kanban Board';
        this.mostrarSnackbar('Dados carregados com sucesso!', 'success', 'mdi-check-circle');
      } catch (error) {
        this.mostrarSnackbar(`Erro ao carregar dados: ${error.message}`, 'error', 'mdi-alert-circle');
        this.erro = error.message;
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
      
        
        await apiService.atualizarTarefa(
          this.listaAtual.id,
          tarefaId,
          tarefaAtualizada
        );
        
        const index = this.listaAtual.tarefas.findIndex(t => t.idTarefa === tarefaId);
        if (index !== -1) {
          this.listaAtual.tarefas[index] = tarefaAtualizada;
        }
        
        this.mostrarSnackbar(
          `Tarefa movida para ${this.getNomeColuna(colunaDestino)}!`,
          'success',
          'mdi-check-circle'
        );
      } catch (error) {
        this.mostrarSnackbar(
          `Erro ao mover tarefa: ${error.message}`,
          'error',
          'mdi-alert-circle'
        );
      }
    },
    
    async atualizarTarefa(tarefaAtualizada) {
      try {
        const resposta = await apiService.atualizarTarefa(
          this.listaAtual.id,
          tarefaAtualizada.idTarefa,
          tarefaAtualizada
        );
        
        const index = this.listaAtual.tarefas.findIndex(t => t.idTarefa === tarefaAtualizada.idTarefa);
        if (index !== -1) {
          this.listaAtual.tarefas[index] = resposta;
        }
        
        this.mostrarSnackbar('Tarefa atualizada com sucesso!', 'success', 'mdi-check-circle');
      } catch (error) {
        this.mostrarSnackbar(
          `Erro ao atualizar tarefa: ${error.message}`,
          'error',
          'mdi-alert-circle'
        );
      }
    },
    
    abrirDialogNovaTarefa() {
      this.novaTarefa = {
        descricao: '',
        prioridade: 2,
        responsavelId: this.listaAtual.criadorId || '',
        concluida: false
      };
      this.dialogNovaTarefa = true;
    },
    
    mostrarSnackbar(message, color = 'success', icon = 'mdi-information') {
      this.snackbar = {
        show: true,
        message,
        color,
        icon
      };
    }
  }
}
</script>

<style scoped>
.kanban-board {
  background-color: #410462;
  min-height: 100vh;
}

.column-container {
  transition: all 0.3s ease;
}

.column-container:hover {
  transform: translateY(-5px);
}
.text-black{
  color: black;
}
</style>