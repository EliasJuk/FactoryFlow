# Cadastro de Setores

## Objetivo

O módulo de Setores representa o primeiro nível da estrutura organizacional da fábrica.

Todo o restante do sistema depende dele.

---

## Responsabilidades

Este módulo é responsável por:

- cadastrar setores;
- editar setores;
- inativar setores (excluir);
- listar setores ativos.

---

## Regras de negócio

### Cadastro

Um setor possui:

- Nome
- Sigla

<br>

**Exemplo:**

- Nome:  Produção
- Sigla: PRD

---

### Edição

É permitido alterar:

- nome
- sigla

A alteração não quebra os vínculos com os subsetores, pois todas as relações utilizam o ID interno do banco.

---

### Exclusão

O sistema não remove registros do banco.

Ao excluir um setor:

ativo = 0

Dessa forma mantemos a integridade dos dados e preservamos o histórico.

---

### Validações

Um setor NÃO pode ser inativado caso existam subsetores ativos vinculados.

Caso isso ocorra o sistema informa ao usuário que primeiro é necessário remover ou inativar os subsetores (excluir).

---

## Fluxo
```

Usuário

↓

React
(Renderer)

↓

Preload
(Ponte segura entre Renderer e Main)

↓

IPC
(Comunicação entre processos)

↓

Repository
(Regras de negócio e consultas SQL)

↓

SQLite

↓

Retorna para interface
```

---


```bash
# INATIVAR SETORES

Usuário clica em Inativar
            │
            ▼
Verifica vínculos (Subsetores)
            │
      ┌─────┴─────┐
      │           │
      ▼           ▼
Possui        Não possui
vínculos      vínculos
      │           │
      ▼           ▼
Modal         Modal de
informativo   confirmação
      │           │
      ▼           ▼
   Voltar     Confirmar
                  │
                  ▼
         UPDATE ativo = 0
                  │
                  ▼
        Atualiza a tabela
```
---

## Melhorias futuras

```
- [ㅤ] Pesquisa por nome e sigla.
- [ㅤ] pesquisa
- [ㅤ] paginação
- [ㅤ] Auditoria de alterações.
- [ㅤ] data de criação
- [ㅤ] usuário responsável pela alteração
- [ㅤ] Histórico de modificações.
```