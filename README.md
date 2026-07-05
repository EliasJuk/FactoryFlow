# FactoryFlow

----


### ✨ Principais Funcionalidades
- Login de Usuários
- Cadastro de Setores
- Cadastro de Subsetores
- Cadastro de Componentes
- Cadastro de Circuitos
- Cadastro de Postos
- Cadastro de Defeitos
- Cadastro de Usuários
- Cadastro de Roteiros
- Lançamento de Refugos
- Impressão da Ficha de Refugo (A6)
- Importação de dados CSV
- Exportação de dados
- Configuração do Banco de Dados

---

# 🖥️ Tecnologias Utilizadas

- Linguagem
  - JavaScript
  - TypeScript
- Front-end
  - React
  - CSS (tailwind)
  - HTML
- Desktop
  - Electron
  - Electron Vite
- Banco de Dados
  - SQLite
  - PostgreSQL
- Ferramentas
  - Node.js
  - npm
  - Git

---

## Checks e Futuras Implementações

### Segurança e Usuários

- ⬛️ Histórico de login dos usuários.
- ⬛️ Controle de permissões mais detalhado por perfil.
- ⬛️ Recuperação ou redefinição de senha.
- ⬛️ Registro de usuário responsável por cada cadastro, edição, inativação e exclusão.
- ⬛️ Bloqueio de ações críticas para usuários sem permissão.
- ⬛️ Tela de auditoria para administradores.

### Auditoria e Histórico

- ⬛️ Histórico de modificações.
- ⬛️ Registro de quem alterou, quando alterou e o que foi alterado.
- ⬛️ Histórico de alterações em componentes, circuitos, roteiros e refugos.
- ⬛️ Versionamento de circuitos.
- ⬛️ Versionamento de roteiros.
- ⬛️ Restauração de versões anteriores.
- ⬛️ Log de erros da aplicação.

### Banco de Dados e Backup

- ⬛️ Backup automático do banco de dados.
- ⬛️ Backup manual pela tela de configurações.
- ⬛️ Restauração de backup.
- ⬛️ Agendamento de backup diário/semanal.
- ⬛️ Exportação completa dos dados.
- ⬛️ Validação de integridade do banco.
- ⬛️ Tela de status da conexão com o banco.

### Cadastros e Regras de Negócio

- ⬛️ Validação avançada para impedir cadastros duplicados.
- ⬛️ Histórico completo de preços dos componentes.
- ⬛️ Cadastro de turnos configurável.
- ⬛️ Cadastro de máquinas ou equipamentos por posto.

### Refugos

- ⬛️  Melhorias na tela de lançamento de refugo.
- ✅ Validação para permitir apenas componentes do roteiro selecionado.
- ⬛️ Edição controlada de lançamentos.
- ⬛️ Histórico de alterações em refugos.
- ⬛️ Cancelamento com motivo obrigatório.
- ⬛️ Impressão em diferentes modelos de ficha.
- ✅ Reimpressão de ficha.
- ⬛️ Geração de número único mais robusta.
- ⬛️ Anexar evidências, como fotos ou observações técnicas.

### Relatórios e Indicadores

- ⬛️ Dashboard principal.
- ⬛️ Gráficos de refugo por setor.
- ⬛️ Gráficos de refugo por posto.
- ⬛️ Gráficos de refugo por defeito.
- ⬛️ Gráficos de custo por componente.
- ⬛️ Ranking dos circuitos mais críticos.
- ⬛️ Ranking dos defeitos mais recorrentes.
- ⬛️ Comparativo por turno.
- ⬛️ Comparativo por período.
- ⬛️ Exportação para CSV, Excel e PDF.
- ⬛️ Filtros avançados por data, setor, posto, circuito e defeito.

### Interface e Experiência do Usuário

- ⬛️ Tema claro/escuro.
- ⬛️ Melhorias de responsividade.
- ⬛️ Atalhos de teclado.
- ⬛️ Paginação padronizada em todos os módulos.
- ⬛️ Mensagens de erro mais amigáveis.
- ⬛️ Confirmações para ações críticas.
- ⬛️ Feedback visual durante carregamentos.
- ⬛️ Tela de configurações do sistema.
- ⬛️ Preferências do usuário.
- ⬛️ Melhorias na navegação lateral.

### Importação e Exportação

- ⬛️ Importação de componentes por planilha.
- ⬛️ Importação de circuitos por planilha.
- ⬛️ Importação de roteiros por planilha.
- ⬛️ Validação prévia antes da importação.
- ⬛️ Relatório de erros da importação.
- ⬛️ Exportação de cadastros.
- ⬛️ Exportação de resultados filtrados.
- ⬛️ Geração de modelos de planilha.

### Arquitetura e Manutenção

- ⬛️ Testes automatizados.
- ⬛️ Testes de integração com banco.
- ⬛️ Scripts de migração do banco.
- ⬛️ Documentação da arquitetura.

### Infraestrutura

- ⬛️ Instalador final para Windows.
- ⬛️ Configuração inicial guiada.
- ✅ Tela para escolher SQLite ou PostgreSQL.
- ⬛️ Atualizações automáticas.
- ⬛️ Logs locais da aplicação.
- ⬛️ Monitoramento básico de erros.

### Futuras Integrações

- ⬛️ Integração com sistemas ERP.
- ⬛️ Integração com leitores de código de barras.
- ⬛️ Integração com impressoras específicas.
- ⬛️ Integração com BI externo.
- ⬛️ API REST para consulta dos dados.
- ⬛️ Sincronização com servidor central.
- ⬛️ Modo offline com sincronização posterior.


---
<h2 align="center">Diagrama do Banco de Dados</h2>
<p align="center">
  <img src="docs/database/schema.svg" width="900" alt="Diagrama do Banco">
</p>
---

# TREE ARCHIVES

```
FactoryFlow/
├── database/                  # Banco de dados utilizado pela aplicação
├── dist/                      # Build gerada pelo Electron Vite
├── node_modules/
├── out/                       # Arquivos compilados
├── resources/                 # Recursos da aplicação (ícones, etc.)
│
├── src/
│   ├── main/                  # Processo principal do Electron
│   │   ├── database/          # Conexão e inicialização do banco
│   │   ├── ipc/               # Comunicação IPC
│   │   ├── print/             # Serviços de impressão
│   │   ├── repositories/      # Acesso aos dados (SQLite)
│   │   ├── services/          # Regras de negócio
│   │   └── index.ts           # Inicialização do Electron
│   │
│   ├── preload/              # API exposta ao Renderer
│   │
│   └── renderer/
│       └── src/
│           ├── assets/        # Imagens, ícones e arquivos estáticos
│           ├── components/    # Componentes reutilizáveis
│           ├── config/        # Configurações da aplicação
│           ├── contexts/      # React Context API
│           ├── models/        # Interfaces e modelos TypeScript
│           ├── pages/         # Telas do sistema
│           ├── routes/        # Rotas do React Router
│           ├── services/      # Comunicação com o Backend (IPC)
│           ├── styles/        # Estilos CSS
│           ├── theme/         # Tema global da aplicação
│           ├── App.tsx
│           ├── global.d.ts
│           ├── index.css
│           ├── main.tsx
│           └── vite-env.d.ts
│
├── .gitignore
├── electron-builder.yml
├── electron.vite.config.ts
├── package.json
├── package-lock.json
└── README.md
```

## Responsabilidade


| Pasta          | Responsabilidade                                                 |
| -------------- | ---------------------------------------------------------------- |
| `main`         | Processo principal do Electron (Banco, IPC, Impressão, Serviços) |
| `preload`      | Ponte segura entre Electron e React                              |
| `renderer`     | Interface do usuário (React + TypeScript)                        |
| `repositories` | Comunicação direta com o SQLite                                  |
| `services`     | Regras de negócio da aplicação                                   |
| `ipc`          | Comunicação entre Front-end e Back-end                           |
| `print`        | Geração e impressão das fichas de refugo                         |
| `pages`        | Telas da aplicação                                               |
| `components`   | Componentes reutilizáveis                                        |
| `theme`        | Padronização visual da Nossa Aplicação                               |


---
---
```
┌───────────────────────────────┐
│ FRONT-END                     │
│                               │
│ React                         │
│ Pages                         │
│ Components                    │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ PRELOAD                       │
│ (Ponte segura)                │
│                               │
│ window.api.refugos.criar()    │
│ window.api.setores.listar()   │
└───────────────┬───────────────┘
                │
                │ IPC
                ▼
┌───────────────────────────────┐
│ BACK-END                      │
│                               │
│ ipcMain                       │
│ Services                      │
│ Repositories                  │
│ SQLite                        │
└───────────────────────────────┘
```

---
---

```
           FRONT-END

┌──────────────────────────┐
│ React                    │
│ Pages                    │
│ Components               │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│ Preload                  │
│ (Porteiro)               │
└─────────────┬────────────┘
              │ IPC
══════════════╬══════════════
              ▼
┌──────────────────────────┐
│ Main Process             │
│ (Back-end)               │
└─────────────┬────────────┘
              ▼
┌──────────────────────────┐
│ Services                 │
└─────────────┬────────────┘
              ▼
┌──────────────────────────┐
│ Repositories             │
│ (SQL)                    │
└─────────────┬────────────┘
              ▼
┌──────────────────────────┐
│ SQLite                   │
└──────────────────────────┘
```

---
---

```
                           FACTORYFLOW - ARQUITETURA

                           ┌──────────────────────────────┐
                           │        FRONT-END             │
                           │        (Renderer)            │
                           └──────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ React                                                                                     │
│-------------------------------------------------------------------------------------------│
│ • Pages (Telas do sistema)                                                                │
│ • Components (Componentes reutilizáveis)                                                  │
│ • Contexts (Estado global da aplicação)                                                   │
│ • Routes (Navegação entre telas)                                                          │
│ • Services (Chamadas para window.api)                                                     │
└──────────────────────────────────────┬────────────────────────────────────────────────────┘
                                       │
                                       │ O React NÃO acessa o banco de dados.
                                       │ Apenas solicita operações.
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ PRELOAD                                                                                   │
│-------------------------------------------------------------------------------------------│
│ Responsabilidade:                                                                         │
│                                                                                           │
│ • Expõe funções seguras ao React                                                          │
│ • Não contém regra de negócio                                                             │
│ • Não executa SQL                                                                         │
│                                                                                           │
│ Exemplo:                                                                                  │
│ window.api.refugos.criar()                                                                │
│ window.api.setores.listar()                                                               │
│ window.api.importacao.importar()                                                          │
└──────────────────────────────────────┬────────────────────────────────────────────────────┘
                                       │
                                       │ ipcRenderer.invoke(...)
                                       │
═══════════════════════════════════════ IPC ═══════════════════════════════════════════════════
             Comunicação entre Renderer e Main Process
═══════════════════════════════════════════════════════════════════════════════════════════════
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ MAIN PROCESS (Electron / Node.js)                                                         │
│-------------------------------------------------------------------------------------------│
│ Responsável por acessar recursos do sistema operacional.                                  │
│                                                                                           │
│ Pode acessar:                                                                             │
│ • SQLite                                                                                  │
│ • Impressoras                                                                             │
│ • Arquivos                                                                                │
│ • Pastas                                                                                  │
└──────────────────────────────────────┬────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ IPC HANDLERS                                                                              │
│-------------------------------------------------------------------------------------------│
│ Arquivos da pasta ipc/                                                                    │
│                                                                                           │
│ Exemplo:                                                                                  │
│ refugo.ipc.ts                                                                             │
│ setor.ipc.ts                                                                              │
│ usuario.ipc.ts                                                                            │
│ importacao.ipc.ts                                                                         │
│                                                                                           │
│ Apenas recebem a solicitação do React e encaminham para os Services.                      │
└──────────────────────────────────────┬────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ SERVICES                                                                                  │
│-------------------------------------------------------------------------------------------│
│ Contêm as regras de negócio da aplicação.                                                 │
│                                                                                           │
│ Exemplo:                                                                                  │
│ • Validar dados                                                                           │
│ • Cancelar um lançamento                                                                  │
│ • Imprimir ficha                                                                          │
│ • Gerar relatórios                                                                        │
│ • Decidir quais operações executar                                                        │
│                                                                                           │
│ Os Services NÃO conhecem a interface gráfica.                                             │
└──────────────────────────────────────┬────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ REPOSITORIES                                                                              │
│-------------------------------------------------------------------------------------------│
│ Responsáveis exclusivamente pelo acesso ao banco.                                         │
│                                                                                           │
│ Aqui ficam praticamente TODOS os comandos SQL:                                            │
│                                                                                           │
│ SELECT                                                                                    │
│ INSERT                                                                                    │
│ UPDATE                                                                                    │
│ DELETE                                                                                    │
│                                                                                           │
│ Exemplo:                                                                                  │
│ RefugoRepository.ts                                                                       │
│ UsuarioRepository.ts                                                                      │
│ SetorRepository.ts                                                                        │
└──────────────────────────────────────┬────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ DATABASE                                                                                  │
│-------------------------------------------------------------------------------------------│
│ SQLite                                                                                    │
│                                                                                           │
│ Arquivo:                                                                                  │
│ database/factoryflow.db                                                                   │
│                                                                                           │
│ Guarda todos os dados do FactoryFlow.                                                     │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 🚀 Como Executar

```bash
## clonar projeto
git clone https://github.com/#/factoryflow.git

## Instalar dependências
npm install

## Executar
npm run dev

## Build
npm run build

## Gerar Executável
npm run dist
```