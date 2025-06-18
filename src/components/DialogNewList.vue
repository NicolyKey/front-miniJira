<template>
  <div>
    <v-btn color="primary" @click="dialog = true">Criar nova lista</v-btn>

    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h6">Nova Lista de Tarefas</v-card-title>
        <v-card-text>
          <v-text-field label="Nome da Lista" v-model="novaLista.nomeLista" />
          <v-text-field label="ID do Criador" v-model="novaLista.criadorId" />

          <v-combobox
            v-model="novaLista.tags"
            label="Tags"
            multiple
            chips
          />

          <v-text-field label="Descrição da Tarefa" v-model="tarefa.descricao" />
          <v-text-field label="Responsável (ID)" v-model="tarefa.responsavelId" />
          <v-select
            :items="[1, 2, 3]"
            label="Prioridade"
            v-model="tarefa.prioridade"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="salvarLista">Salvar</v-btn>
          <v-btn text @click="dialog = false">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const dialog = ref(false)

const novaLista = ref({
  nomeLista: '',
  criadorId: '',
  colaboradoresIds: [],
  tags: [],
  tarefas: []
})

const tarefa = ref({
  idTarefa: '1',
  descricao: '',
  concluida: false,
  dataCriacaoTarefa: new Date().toISOString(),
  responsavelId: '',
  prioridade: 1
})

async function salvarLista() {
  try {
    // Adiciona a tarefa à lista
    novaLista.value.tarefas = [tarefa.value]

    const response = await fetch('http://localhost:8080/api/listas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaLista.value)
    })

    if (!response.ok) throw new Error('Erro ao criar lista')

    const resultado = await response.json()
    console.log('Lista criada:', resultado)

    dialog.value = false
    // Resetar formulário
    novaLista.value = {
      nomeLista: '',
      criadorId: '',
      colaboradoresIds: [],
      tags: [],
      tarefas: []
    }
    tarefa.value = {
      idTarefa: '1',
      descricao: '',
      concluida: false,
      dataCriacaoTarefa: new Date().toISOString(),
      responsavelId: '',
      prioridade: 1
    }
  } catch (err) {
    console.error('Erro ao salvar lista:', err)
  }
}
</script>
