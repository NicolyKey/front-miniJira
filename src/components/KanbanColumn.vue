<template>
  <v-row class="kanban-board">
    <v-col 
      v-for="lista in listas" 
      :key="lista.id"
      cols="12" 
      md="4" 
      class="column-container"
    >
      <v-card class="fill-height" elevation="4">
        <v-card-title class="column-header d-flex align-center">
          <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
          {{ lista.nomeLista }}
          <v-spacer></v-spacer>
          <v-chip size="small" color="white" text-color="primary">
            {{ lista.tarefas.length }}
          </v-chip>
        </v-card-title>

        <v-card-text 
          class="drop-zone pa-3"
          :class="{ 'drag-over': isDragOver[lista.id] }"
          @dragover.prevent="() => handleDragOver(lista.id)"
          @dragleave="() => handleDragLeave(lista.id)"
          @drop="(event) => handleDrop(event, lista.id)"
        >
          <task-card
            v-for="tarefa in lista.tarefas"
            :key="tarefa.idTarefa"
            :tarefa="tarefa"
            :lista="lista"
            @drag-start="(tarefa) => handleDragStart(tarefa, lista)"
            @atualizar="(tarefaAtualizada) => atualizarTarefa(lista.id, tarefaAtualizada)"
          ></task-card>

          <div v-if="lista.tarefas.length === 0" class="empty-column">
            <v-icon size="48" color="grey-lighten-1">mdi-inbox</v-icon>
            <p class="mt-2 text-grey">Nenhuma tarefa</p>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import TaskCard from './TaskCard.vue'
import apiService from '../services/api.service.js'

export default {
  name: 'KanbanBoard',
  components: {
    TaskCard
  },
  data() {
    return {
      listas: [],
      isDragOver: {},
      draggedItem: null,
      sourceListId: null
    }
  },
  async created() {
    await this.carregarListas()
  },
  methods: {
    async carregarListas() {
      try {
        this.listas = await apiService.fetchLista()
    
        this.listas.forEach(lista => {
          this.$set(this.isDragOver, lista.id, false)
        })
      } catch (error) {
        console.error('Erro ao carregar listas:', error)
        
      }
    },
    
    handleDragOver(listaId) {
      this.isDragOver[listaId] = true
    },
    
    handleDragLeave(listaId) {
      this.isDragOver[listaId] = false
    },
    
    async handleDrop(event, listaDestinoId) {
      event.preventDefault()
      this.isDragOver[listaDestinoId] = false
      
      if (!this.draggedItem || this.sourceListId === listaDestinoId) return
      
      try {
       
        const tarefaAtualizada = {
          ...this.draggedItem,
          listaId: listaDestinoId 
        }
        
        await apiService.atualizarTarefa(
          this.sourceListId,
          this.draggedItem.idTarefa,
          tarefaAtualizada
        )
        
        
        await this.carregarListas()
      } catch (error) {
        console.error('Erro ao mover tarefa:', error)
      
      } finally {
        this.draggedItem = null
        this.sourceListId = null
      }
    },
    
    handleDragStart(tarefa, lista) {
      this.draggedItem = tarefa
      this.sourceListId = lista.id
    },
    
    async atualizarTarefa(listaId, tarefaAtualizada) {
      try {
        await apiService.atualizarTarefa(
          listaId,
          tarefaAtualizada.idTarefa,
          tarefaAtualizada
        )
        await this.carregarListas()
      } catch (error) {
        console.error('Erro ao atualizar tarefa:', error)
      }
    }
  }
}
</script>

<style scoped>
.kanban-board {
  overflow-x: auto;
  flex-wrap: nowrap;
  align-items: flex-start;
}

.column-container {
  min-width: 320px;
  max-width: 400px;
}

.column-header {
  background: linear-gradient(135deg, var(--v-primary-base), var(--v-primary-darken2)) !important;
  color: white !important;
}

.drop-zone {
  min-height: 500px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.drop-zone.drag-over {
  background-color: rgba(var(--v-theme-primary), 0.1);
  border: 2px dashed rgb(var(--v-theme-primary));
}

.empty-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  margin-top: 20px;
}
</style>