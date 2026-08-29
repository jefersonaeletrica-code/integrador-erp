# Integrador ERP e Fornecedores

Este projeto é uma aplicação back-end construída com Node.js e Express, projetada para atuar como um hub central de integração entre sistemas ERP (como Bling e CissPoder) e portais de fornecedores (através de web scraping). A plataforma permite gerenciar conexões, buscar produtos em tempo real e consolidar informações de diferentes fontes.

## ✨ Funcionalidades Principais

- **Gerenciamento de Conexões**: API RESTful para criar, listar, atualizar e remover conexões com ERPs e fornecedores.
- **Integração com ERPs**:
  - Suporte nativo para **Bling** e **CissPoder**.
  - Arquitetura de serviços modular que facilita a adição de novos ERPs.
  - Manipulação de autenticação OAuth 2.0 (Bling) e baseada em token (CissPoder), com renovação automática.
- **Web Scraping para Fornecedores**:
  - Implementação de um scraper robusto para o portal **Dismatal**, utilizando **Puppeteer**.
  - Conexão com serviço de navegador remoto (**Browserless.io**) para evitar problemas de dependência e consumo de recursos no servidor.
  - Gerenciador de sessão inteligente (`BrowserManager`) que reutiliza instâncias de navegador autenticadas para otimizar a performance.
  - Fila de tarefas (`ScraperQueue`) para garantir que as operações de scraping (que consomem muitos recursos) sejam executadas sequencialmente.
- **Busca de Produtos Unificada**: Endpoints de API para buscar produtos por nome ou SKU tanto nos ERPs quanto nos fornecedores.
- **Banco de Dados MySQL**: Persistência de dados robusta para armazenar as configurações de conexão e sessões de scraping.

## 🏗️ Arquitetura

O projeto segue uma arquitetura em camadas para separar as responsabilidades:

- **`src/api`**: Define as rotas da API (endpoints) usando Express.js. É a porta de entrada para todas as requisições.
- **`src/services`**: Contém a lógica de negócio. Para cada ERP (Bling, CissPoder), há um serviço dedicado que encapsula as chamadas de API e a manipulação de dados.
- **`src/scrapers`**: Abriga a lógica de web scraping. Cada scraper é uma classe responsável por interagir com o portal de um fornecedor específico.
- **`src/core`**: Contém os módulos centrais e reutilizáveis do sistema, como o gerenciador de logs (`logger.js`), o gerenciador de navegador (`browserManager.js`) e a fila de tarefas (`scraperQueue.js`).
- **`src/database`**: Responsável pela conexão e inicialização do banco de dados MySQL.

## 🚀 Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:
- Node.js (versão 18.x ou superior)
- npm (geralmente vem com o Node.js)
- Um servidor de banco de dados MySQL.

Você também precisará de uma chave de API do Browserless.io para a funcionalidade de web scraping.

## ⚙️ Instalação e Configuração

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-seu-repositorio>
    cd integrador-erp
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo chamado `.env` na raiz do projeto e adicione as seguintes variáveis, substituindo os valores pelos seus:

    ```ini
    # Configurações do Banco de Dados
    DB_HOST=localhost
    DB_USER=seu_usuario_mysql
    DB_PASSWORD=sua_senha_mysql
    DB_NAME=integrador_erp
    DB_PORT=3306

    # Chave da API do Browserless.io
    BROWSERLESS_API_KEY=sua_chave_do_browserless

    # Porta do Servidor
    PORT=3000

    # Nível de Log (opcional: 'debug' para mais detalhes)
    LOG_LEVEL=info
    ```

## ▶️ Executando a Aplicação

- **Para produção:**
  ```bash
  npm start
  ```

- **Para desenvolvimento (com reinício automático):**
  ```bash
  npm run dev
  ```

O servidor estará rodando em `http://localhost:3000`.

## 🔌 Principais Endpoints da API

### Conexões ERP

- `GET /api/erp-connections`: Lista todas as conexões ERP configuradas e seu status.
- `POST /api/erp-connections`: Cria uma nova conexão ERP.
- `PUT /api/erp-connections/:id`: Atualiza uma conexão ERP existente.
- `DELETE /api/erp-connections/:id`: Remove uma conexão ERP.
- `POST /api/erp-connections/:id/products`: Busca produtos em um ERP específico pelo `searchTerm`.

### Conexões de Fornecedores (Scraper)

- `GET /api/supplier-connections`: Lista todas as conexões de fornecedores.
- `POST /api/supplier-connections`: Cria uma nova conexão de fornecedor.
- `PUT /api/supplier-connections/:id`: Atualiza uma conexão de fornecedor.
- `DELETE /api/supplier-connections/:id`: Remove uma conexão de fornecedor.
- `POST /api/supplier-connections/:id/authenticate`: Inicia uma tarefa em segundo plano para autenticar e salvar a sessão do scraper.
- `POST /api/supplier-connections/:id/validate-authentication`: Inicia uma tarefa para validar se a sessão salva ainda está ativa.
- `POST /api/supplier-connections/:id/products`: Busca um produto em um fornecedor específico pelo `searchTerm` (SKU).

---

Este `README.md` serve como um guia central para entender, configurar e utilizar o projeto.