<template>
  <div>
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h6">Nova Lista de Tarefas</v-card-title>
        <v-card-text>
          <v-text-field 
            label="Nome da Lista" 
            v-model="novaLista.nomeLista" 
            required
          />
          <v-text-field 
            label="ID do Criador" 
            v-model="novaLista.criadorId" 
            required
          />

          <v-combobox
            v-model="novaLista.tags"
            label="Tags"
            multiple
            chips
            clearable
          />

          <v-divider class="my-4"></v-divider>
          <h4 class="text-h6 mb-4">Primeira Tarefa</h4>
          
          <v-text-field 
            label="Descrição da Tarefa" 
            v-model="tarefa.descricao" 
            required
          />
          <v-text-field 
            label="Responsável (ID)" 
            v-model="tarefa.responsavelId" 
            required
          />
          <v-select
            :items="prioridades"
            item-title="title"
            item-value="value"
            label="Prioridade"
            v-model="tarefa.prioridade"
            required
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="salvarLista">Salvar</v-btn>
          <v-btn color="error" variant="text" @click="fecharDialog">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      dialog: false,
      prioridades: [
        { title: 'Alta', value: 1 },
        { title: 'Média', value: 2 },
        { title: 'Baixa', value: 3 }
      ],
      novaLista: {
        nomeLista: '',
        criadorId: '',
        colaboradoresIds: [],
        tags: [],
        tarefas: []
      },
      tarefa: {
        idTarefa: Date.now().toString(),
        descricao: '',
        concluida: false,
        dataCriacaoTarefa: new Date().toISOString(),
        responsavelId: '',
        prioridade: 1
      }
    }
  },
  methods: {
    abrirDialog() {
      this.dialog = true;
    },
    fecharDialog() {
      this.dialog = false;
      this.resetarFormulario();
    },
    resetarFormulario() {
      this.novaLista = {
        nomeLista: '',
        criadorId: '',
        colaboradoresIds: [],
        tags: [],
        tarefas: []
      };
      this.tarefa = {
        idTarefa: Date.now().toString(),
        descricao: '',
        concluida: false,
        dataCriacaoTarefa: new Date().toISOString(),
        responsavelId: '',
        prioridade: 1
      };
    },
    async salvarLista() {
      try {
        // Adiciona a tarefa à lista
        this.novaLista.tarefas = [this.tarefa];
        
        // Adiciona o criador como colaborador
        if (!this.novaLista.colaboradoresIds.includes(this.novaLista.criadorId)) {
          this.novaLista.colaboradoresIds.push(this.novaLista.criadorId);
        }

        const response = await fetch('http://localhost:8080/api/listas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.novaLista)
        });

        if (!response.ok) throw new Error('Erro ao criar lista');

        const resultado = await response.json();
        console.log('Lista criada:', resultado);
        
        this.$emit('lista-criada', resultado);
        this.fecharDialog();
        
      } catch (err) {
        console.error('Erro ao salvar lista:', err);
        alert('Erro ao criar lista: ' + err.message);
      }
    }
  }
}
</script>

<style scoped>
.v-card-text {
  padding-bottom: 0;
}
</style>