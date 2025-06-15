<template>
  <v-card
    class="task-card"
    :class="{ 'dragging': isDragging }"
    elevation="2"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="abrirDetalhes"
  >
    <v-card-title class="py-2 px-3">
      <div class="d-flex align-center justify-space-between w-100">
        <span class="text-subtitle-1 font-weight-medium">
          #{{ tarefa.idTarefa }}
        </span>
        <v-chip
          :class="prioridadeClass"
          size="small"
          variant="elevated"
        >
          {{ prioridadeTexto }}
        </v-chip>
      </div>
    </v-card-title>

    <v-card-text class="py-2 px-3">
      <p class="text-body-2 mb-2">{{ tarefa.descricao }}</p>
      

      <div v-if="lista.tags && lista.tags.length > 0" class="task-tags mb-2">
        <v-chip
          v-for="tag in lista.tags"
          :key="tag"
          size="x-small"
          variant="outlined"
          color="primary"
          class="task-tag"
        >
          {{ tag }}
        </v-chip>
      </div>

      <div class="task-meta d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon size="14" class="mr-1">mdi-calendar</v-icon>
          <span class="text-caption">{{ dataFormatada }}</span>
        </div>
        
        <div v-if="responsavel" class="d-flex align-center">
          <v-icon size="14" class="mr-1">mdi-account</v-icon>
          <span class="text-caption">{{ responsavel.nome || responsavel.id }}</span>
        </div>
      </div>


      <div class="mt-2">
        <v-chip
          :color="tarefa.concluida ? 'success' : 'warning'"
          size="small"
          variant="tonal"
        >
          <v-icon size="16" class="mr-1">
            {{ tarefa.concluida ? 'mdi-check-circle' : 'mdi-clock-outline' }}
          </v-icon>
          {{ tarefa.concluida ? 'Concluída' : 'Em Andamento' }}
        </v-chip>
      </div>
    </v-card-text>
    <v-card-actions class="px-3 py-2">
      <v-btn
        variant="text"
        size="small"
        color="primary"
        @click.stop="editarTarefa"
      >
        <v-icon size="16">mdi-pencil</v-icon>
        Editar
      </v-btn>
      
      <v-spacer></v-spacer>
      
      <v-btn
        variant="text"
        size="small"
        :color="tarefa.concluida ? 'warning' : 'success'"
        @click.stop="toggleConcluida"
      >
        <v-icon size="16">
          {{ tarefa.concluida ? 'mdi-undo' : 'mdi-check' }}
        </v-icon>
        {{ tarefa.concluida ? 'Reabrir' : 'Concluir' }}
      </v-btn>
    </v-card-actions>

    <v-dialog v-model="dialogDetalhes" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-information</v-icon>
          Detalhes da Tarefa #{{ tarefa.idTarefa }}
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="tarefaEditavel.descricao"
                label="Descrição"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>
            
            <v-col cols="6">
              <v-select
                v-model="tarefaEditavel.prioridade"
                :items="prioridades"
                label="Prioridade"
                variant="outlined"
                density="comfortable"
              ></v-select>
            </v-col>
            
            <v-col cols="6">
              <v-switch
                v-model="tarefaEditavel.concluida"
                label="Concluída"
                color="success"
              ></v-switch>
            </v-col>
            
            <v-col cols="12">
              <p><strong>Data de Criação:</strong> {{ dataCompletaFormatada }}</p>
              <p><strong>Responsável ID:</strong> {{ tarefa.responsavelId }}</p>
              <p><strong>Lista:</strong> {{ lista.nomeLista }}</p>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogDetalhes = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" @click="salvarEdicao">
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import apiService from '../services/api.service.js'


export default {
  name: 'TaskCard',
  props: {
    tarefa: {
      type: Object,
      required: true
    },
    lista: {
      type: Object,
      default: () => ({})
    },
    responsavel: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      isDragging: false,
      dialogDetalhes: false,
      tarefaEditavel: {},
      prioridades: [
        { title: 'Alta', value: 1 },
        { title: 'Média', value: 2 },
        { title: 'Baixa', value: 3 }
      ],
      carregando: false
    }
  },
  computed: {
    prioridadeClass() {
      switch (this.tarefa.prioridade) {
        case 1: return 'priority-high'
        case 2: return 'priority-medium'
        case 3: return 'priority-low'
        default: return 'priority-medium'
      }
    },
    
    prioridadeTexto() {
      switch (this.tarefa.prioridade) {
        case 1: return 'Alta'
        case 2: return 'Média'
        case 3: return 'Baixa'
        default: return 'Média'
      }
    },
    
    dataFormatada() {
      if (!this.tarefa.dataCriacaoTarefa) return 'N/A'
      return new Date(this.tarefa.dataCriacaoTarefa).toLocaleDateString('pt-BR')
    },
    
    dataCompletaFormatada() {
      if (!this.tarefa.dataCriacaoTarefa) return 'N/A'
      return new Date(this.tarefa.dataCriacaoTarefa).toLocaleString('pt-BR')
    }
  },
  methods: {
    handleDragStart(event) {
      this.isDragging = true
      event.dataTransfer.setData('text/plain', this.tarefa.idTarefa)
      event.dataTransfer.effectAllowed = 'move'
      this.$emit('drag-start', this.tarefa)
    },
    
    handleDragEnd() {
      this.isDragging = false
    },
    
    abrirDetalhes() {
      this.tarefaEditavel = { ...this.tarefa }
      this.dialogDetalhes = true
    },
    
    editarTarefa() {
      this.abrirDetalhes()
    },
    
    async toggleConcluida() {
      try {
        const tarefaAtualizada = {
          ...this.tarefa,
          concluida: !this.tarefa.concluida
        }
        
        await this.atualizarTarefaAPI(tarefaAtualizada)
        this.$emit('atualizar', tarefaAtualizada)
        
        this.$emit('show-snackbar', {
          message: `Tarefa ${tarefaAtualizada.concluida ? 'concluída' : 'reaberta'} com sucesso!`,
          color: 'success'
        })
      } catch (error) {
        this.$emit('show-snackbar', {
          message: 'Erro ao atualizar tarefa: ' + error.message,
          color: 'error'
        })
      }
    },
    
    async salvarEdicao() {
      this.carregando = true
      try {
        // Chama o service para atualizar a tarefa
        const tarefaAtualizada = await apiService.atualizarTarefa(
          this.lista.id,
          this.tarefaEditavel.idTarefa,
          this.tarefaEditavel
        )
        
        this.$emit('atualizar', tarefaAtualizada)
        this.dialogDetalhes = false
        
        this.$emit('show-snackbar', {
          message: 'Tarefa atualizada com sucesso!',
          color: 'success'
        })
      } catch (error) {
        this.$emit('show-snackbar', {
          message: 'Erro ao salvar tarefa: ' + error.message,
          color: 'error'
        })
      } finally {
        this.carregando = false
      }
    },

    async toggleConcluida() {
      this.carregando = true
      try {
        const tarefaAtualizada = {
          ...this.tarefa,
          concluida: !this.tarefa.concluida,
          // Adiciona data de conclusão se estiver marcando como concluída
          dataConclusaoTarefa: !this.tarefa.concluida ? new Date().toISOString() : null
        }
        
        // Chama o service para atualizar a tarefa
        const resposta = await apiService.atualizarTarefa(
          this.lista.id,
          tarefaAtualizada.idTarefa,
          tarefaAtualizada
        )
        
        this.$emit('atualizar', resposta)
        
        this.$emit('show-snackbar', {
          message: `Tarefa ${tarefaAtualizada.concluida ? 'concluída' : 'reaberta'} com sucesso!`,
          color: 'success'
        })
      } catch (error) {
        this.$emit('show-snackbar', {
          message: 'Erro ao atualizar tarefa: ' + error.message,
          color: 'error'
        })
      } finally {
        this.carregando = false
      }
    },
  },
  emits: ['drag-start', 'atualizar', 'show-snackbar']
}
</script>

<style scoped>
.task-card {
  cursor: grab;
  margin-bottom: 12px;
  transition: all 0.3s ease;
  border-left: 4px solid rgb(var(--v-theme-primary));
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
}

.task-card.dragging {
  cursor: grabbing;
  opacity: 0.7;
  transform: rotate(3deg) scale(1.02);
}

.priority-high {
  background-color: #f44336 !important;
  color: white !important;
}

.priority-medium {
  background-color: #ff9800 !important;
  color: white !important;
}

.priority-low {
  background-color: #4caf50 !important;
  color: white !important;
}

.task-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.task-tag {
  font-size: 0.7rem !important;
  height: 20px !important;
}

.task-meta {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
}
.task-card {
  position: relative;
}

.task-card:after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  z-index: 1;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.task-card.carregando:after {
  opacity: 1;
}
</style>