# Cadastro de Subsetores

## Objetivo

O módulo de Subsetores representa o segundo nível da estrutura organizacional da fábrica.

Todo subsetor pertence obrigatoriamente a um setor.

---

## Responsabilidades

Este módulo é responsável por:

- cadastrar subsetores;
- editar subsetores;
- inativar subsetores;
- listar subsetores ativos.

---

## Regras de negócio

### Cadastro

Todo subsetor deve estar vinculado a um setor.

Cada setor pode possuir vários subsetores.

Exemplo:

Setor:
Produção

Subsetor:
Montagem

---

### Edição

É permitido alterar:

- nome;
- setor ao qual pertence.

Os vínculos são preservados através do ID interno do banco.

---

### Inativação

O sistema não remove registros fisicamente.

Ao inativar:

ativo = 0

O histórico permanece preservado.

---

### Validações

Um subsetor não pode ser inativado caso existam postos de trabalho ativos vinculados.

Caso isso aconteça, o sistema informa ao usuário que primeiro é necessário remover ou inativar os postos vinculados.