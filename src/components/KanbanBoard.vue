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

    <!-- Main Board Content -->
    <v-row v-if="!loading && !erro" class="fill-height" style="min-height: 70vh">
      <kanban-column
        titulo="📋 A Fazer"
        icone="mdi-format-list-bulleted"
        cor="#2196F3"
        status="todo"
        :tarefas="listaAtual.tarefas || []"
        :lista-completa="listaAtual"
        @mover-tarefa="moverTarefa"
        @atualizar-tarefa="atualizarTarefa"
        @adicionar-tarefa="abrirDialogNovaTarefa"
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

    <!-- Dialog Nova Lista -->
    <v-dialog v-model="dialogNovaLista" max-width="700">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-plus-circle</v-icon>
          Criar Nova Lista
        </v-card-title>
        <v-card-text>
          <v-form v-model="formListaValido" @submit.prevent="criarLista">
            <v-text-field
              v-model="novaLista.nomeLista"
              label="Nome da Lista"
              required
              :rules="[v => !!v || 'Nome da lista é obrigatório']"
              hint="Ex: Lista de Desenvolvimento Backend"
            ></v-text-field>
            
            <v-text-field
              v-model="novaLista.criadorId"
              label="ID do Criador"
              required
              :rules="[v => !!v || 'ID do criador é obrigatório']"
              hint="Ex: 683ccbd041f2504551138a8e"
            ></v-text-field>
            
            <v-text-field
              v-model="tagInput"
              label="Tags"
              @keydown.enter.prevent="adicionarTag"
              hint="Digite uma tag e pressione Enter para adicionar"
            ></v-text-field>
            
            <div v-if="novaLista.tags.length > 0" class="mb-4">
              <v-chip
                v-for="(tag, index) in novaLista.tags"
                :key="index"
                closable
                @click:close="removerTag(index)"
                class="mr-2 mb-2"
                color="primary"
                variant="outlined"
              >
                {{ tag }}
              </v-chip>
            </div>

            <v-divider class="my-4"></v-divider>
            <h4 class="mb-3">Tarefa Inicial (Opcional)</h4>
            
            <v-text-field
              v-model="tarefaInicial.descricao"
              label="Descrição da Tarefa"
              hint="Ex: Criar endpoint de login"
            ></v-text-field>
            
            <v-select
              v-model="tarefaInicial.prioridade"
              :items="prioridades"
              label="Prioridade"
              item-title="title"
              item-value="value"
            ></v-select>
            
            <v-text-field
              v-model="tarefaInicial.responsavelId"
              label="ID do Responsável"
              hint="Ex: 66596f44215cb34b048d623f"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialogNovaLista = false">Cancelar</v-btn>
          <v-btn
            color="success"
            @click="criarLista"
            :loading="salvandoLista"
            :disabled="!formListaValido"
          >
            <v-icon start>mdi-plus</v-icon>
            Criar Lista
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Nova Tarefa -->
    <v-dialog v-model="dialogNovaTarefa" max-width="600">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-plus-circle</v-icon>
          Adicionar Nova Tarefa
        </v-card-title>
        <v-card-text>
          <v-form v-model="formValido" @submit.prevent="adicionarTarefa">
            <v-text-field
              v-model="novaTarefa.descricao"
              label="Descrição"
              required
              :rules="[v => !!v || 'Descrição é obrigatória']"
            ></v-text-field>
            
            <v-select
              v-model="novaTarefa.prioridade"
              :items="prioridades"
              label="Prioridade"
              item-title="title"
              item-value="value"
              required
            ></v-select>
            
            <v-select
              v-model="novaTarefa.responsavelId"
              :items="colaboradores"
              label="Responsável"
              item-title="nome"
              item-value="id"
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialogNovaTarefa = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            @click="adicionarTarefa"
            :loading="salvandoTarefa"
            :disabled="!formValido"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
      
      // Dialog Nova Lista
      dialogNovaLista: false,
      formListaValido: false,
      salvandoLista: false,
      tagInput: '',
      novaLista: {
        nomeLista: '',
        criadorId: '',
        colaboradoresIds: [],
        tags: []
      },
      tarefaInicial: {
        descricao: '',
        prioridade: 2,
        responsavelId: ''
      },
      
      // Dialog Nova Tarefa
      dialogNovaTarefa: false,
      formValido: false,
      salvandoTarefa: false,
      novaTarefa: {
        descricao: '',
        prioridade: 2,
        responsavelId: '',
        concluida: false
      },
      
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
    async carregarDados() {
      this.loading = true;
      this.erro = null;
      
      try {
        const listaId = '683cca7572949ccbc8b23d53'; // Exemplo de ID
        this.listaAtual = await apiService.fetchLista(listaId);
        this.mostrarSnackbar('Dados carregados com sucesso!', 'success', 'mdi-check-circle');
      } catch (error) {
        this.mostrarSnackbar(`Erro ao carregar dados: ${error.message}`, 'error', 'mdi-alert-circle');
        this.erro = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    // Métodos para Nova Lista
    abrirDialogNovaLista() {
      this.novaLista = {
        nomeLista: '',
        criadorId: '',
        colaboradoresIds: [],
        tags: []
      };
      this.tarefaInicial = {
        descricao: '',
        prioridade: 2,
        responsavelId: ''
      };
      this.tagInput = '';
      this.dialogNovaLista = true;
    },
    
    adicionarTag() {
      if (this.tagInput.trim() && !this.novaLista.tags.includes(this.tagInput.trim())) {
        this.novaLista.tags.push(this.tagInput.trim());
        this.tagInput = '';
      }
    },
    
    removerTag(index) {
      this.novaLista.tags.splice(index, 1);
    },
    
    async criarLista() {
      this.salvandoLista = true;
      try {
        const listaParaCriar = {
          ...this.novaLista,
          tarefas: []
        };
        
        // Se há uma tarefa inicial, adiciona ela
        if (this.tarefaInicial.descricao.trim()) {
          const tarefa = {
            idTarefa: `task${Date.now()}`,
            descricao: this.tarefaInicial.descricao,
            concluida: false,
            dataCriacaoTarefa: new Date().toISOString(),
            responsavelId: this.tarefaInicial.responsavelId || this.novaLista.criadorId,
            prioridade: this.tarefaInicial.prioridade
          };
          listaParaCriar.tarefas.push(tarefa);
        }
        
        const novaListaCriada = await apiService.criarLista(listaParaCriar);
        
        // Atualiza a lista atual com a nova lista criada
        this.listaAtual = novaListaCriada;
        
        this.dialogNovaLista = false;
        this.mostrarSnackbar('Lista criada com sucesso!', 'success', 'mdi-check-circle');
      } catch (error) {
        this.mostrarSnackbar(
          `Erro ao criar lista: ${error.message}`,
          'error',
          'mdi-alert-circle'
        );
      } finally {
        this.salvandoLista = false;
      }
    },
    
    // Métodos existentes
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
            tarefaAtualizada.dataConclusaoTarefa = null;
            break;
          case 'progress':
            tarefaAtualizada.concluida = false;
            tarefaAtualizada.prioridade = 1;
            tarefaAtualizada.dataConclusaoTarefa = null;
            break;
          case 'done':
            tarefaAtualizada.concluida = true;
            tarefaAtualizada.dataConclusaoTarefa = new Date().toISOString();
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
    
    async adicionarTarefa() {
      this.salvandoTarefa = true;
      try {
        const novaTarefaCompleta = {
          ...this.novaTarefa,
          idTarefa: `task${Date.now()}`,
          dataCriacaoTarefa: new Date().toISOString(),
          dataConclusaoTarefa: null
        };
        
        // Aqui você precisaria implementar o método no seu service para adicionar tarefa
        // await apiService.adicionarTarefa(this.listaAtual.id, novaTarefaCompleta);
        
        // Simulação de adição local (remova quando implementar a API)
        this.listaAtual.tarefas.push(novaTarefaCompleta);
        
        this.dialogNovaTarefa = false;
        this.mostrarSnackbar('Tarefa adicionada com sucesso!', 'success', 'mdi-check-circle');
      } catch (error) {
        this.mostrarSnackbar(
          `Erro ao adicionar tarefa: ${error.message}`,
          'error',
          'mdi-alert-circle'
        );
      } finally {
        this.salvandoTarefa = false;
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
  background-color: #f5f7fa;
  min-height: 100vh;
}

.column-container {
  transition: all 0.3s ease;
}

.column-container:hover {
  transform: translateY(-5px);
}
</style>