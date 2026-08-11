# Testes do FactoryFlow

Este documento registra os testes manuais e integrados executados durante o desenvolvimento do FactoryFlow.

## Menu

1. [Configuração inicial — administrador remoto existente](#1-configuração-inicial--administrador-remoto-existente)
2. [Configuração inicial — criação do primeiro administrador](#2-configuração-inicial--criação-do-primeiro-administrador)
3. [Recuperação de credenciais protegidas](#3-recuperação-de-credenciais-protegidas)

---

## 1. Configuração inicial — administrador remoto existente

### Objetivo

Validar o primeiro acesso de um computador novo conectado a um PostgreSQL que já possui um administrador ativo.

### 1.1 Configuração do PostgreSQL

A conexão com o banco central foi configurada usando o ambiente PostgreSQL de testes.

<p align="center">
  <img
    src="./images/first-access-postgres-connection.png"
    alt="Conexão com o PostgreSQL realizada com sucesso"
    width="auto"
  />
</p>

Resultado:

- conexão estabelecida com sucesso;
- configuração salva localmente;
- senha armazenada pelo serviço protegido do Electron;
- aplicação preparada para consultar o banco central.

### 1.2 Administrador remoto encontrado

Após salvar a configuração, o FactoryFlow encontrou um administrador existente no PostgreSQL.

<p align="center">
  <img
    src="./images/first-access-admin-synchronization.png"
    alt="Administrador remoto encontrado e aguardando sincronização"
    width="auto"
  />
</p>

Resultado:

- administrador remoto identificado;
- aplicação solicitou reinicialização;
- usuários sincronizados para o SQLite local;
- tela de login liberada após a sincronização.

### 1.3 Validação da sessão

Resultado retornado por:

```js
await window.api.auth.sessaoAtual()
```

Resultado esperado:

- sessão autenticada;
- usuário administrador retornado corretamente;
- perfil `ADMIN`;
- matrícula correspondente ao administrador sincronizado.

---

## 2. Configuração inicial — criação do primeiro administrador

### Objetivo

Validar o primeiro acesso de um computador novo conectado a um PostgreSQL que ainda não possui um administrador operacional.

### Resultado

- conexão com PostgreSQL realizada com sucesso;
- migrations executadas automaticamente;
- usuário técnico `Sistema` criado sem senha de login;
- primeiro administrador criado;
- aplicação preparada para sincronizar o administrador com o SQLite local;
- login liberado após reinicialização e sincronização.

---

## 3. Recuperação de credenciais protegidas

### Objetivo

Validar o comportamento do FactoryFlow quando o arquivo `config/secrets.json` está inválido ou não pode ser utilizado.

### Teste manual

Foi criado propositalmente um `secrets.json` inválido.

Resultado:

- aplicação continuou inicializando;
- usuário com administrador local existente conseguiu acessar a tela de login;
- nova senha do PostgreSQL pôde ser informada nas configurações;
- ao salvar, o `secrets.json` inválido foi recriado;
- nova senha foi armazenada de forma protegida;
- próxima inicialização ocorreu normalmente.

### Teste automatizado

A Recuperação de credenciais protegidas serve para impedir que um secrets.json antigo, corrompido ou impossível de descriptografar deixe o FactoryFlow inutilizável.

```
FactoryFlow inicia
        ↓
tenta ler a senha protegida do PostgreSQL
        ↓
┌─────────────────────────────┐
│ Credencial está utilizável? │
└─────────────────────────────┘
       ↓ sim            ↓ não
 funcionamento      não trava
 normal                 ↓
                 permite reconfigurar
                        ↓
                 usuário informa
                 nova senha
                        ↓
                 safeStorage criptografa
                        ↓
                 secrets.json é
                 recriado/atualizado
```

Na prática, cobrimos dois problemas diferentes. Se o arquivo é JSON válido, mas a senha criptografada não pode mais ser aberta naquele Windows/usuário, o ConfiguracaoService trata isso como credencial indisponível em vez de deixar a exceção derrubar o fluxo.

Se o próprio secrets.json estiver corrompido, por exemplo:

```JSON
{ invalid json
```

ao usuário informar uma nova senha, savePostgresPassword() ignora o conteúdo antigo inválido, cria um novo conteúdo e grava a nova senha criptografada.

Quando o arquivo existente está válido, ele continua sendo lido normalmente, então outros segredos existentes são preservados enquanto apenas postgresPassword é atualizado.

A senha continua sem ser armazenada em texto puro: antes da gravação ela passa por:

```
safeStorage.encryptString(password)
```

e somente o resultado em Base64 vai para o arquivo.

Então, resumindo:

a recuperação garante que uma credencial protegida quebrada não bloqueie o FactoryFlow e possa ser substituída com segurança por uma nova credencial informada pelo usuário.

E agora isso também ficou protegido por 3 testes automatizados: arquivo inexistente, arquivo válido preservando outros segredos e arquivo corrompido sendo recriado.

#### Arquivo:

```text
tests/configuracao/SecretStorageService.test.ts
```

#### Comando:

```powershell
npm run test:configuracao:secrets
```

```powershell
# Resultado esperado
Test Files  1 passed
Tests       3 passed
```