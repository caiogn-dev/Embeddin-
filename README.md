# Embeddin-

Bem-vindo ao **Embeddin-**, uma ferramenta projetada para ajudá-lo a explorar, fazer upload e gerenciar documentos PDF com facilidade. Este projeto combina um backend robusto construído com Django e um frontend dinâmico desenvolvido com React e TypeScript.

## Visão Geral

O Embeddin- permite que os usuários façam upload de arquivos PDF, visualizem listas de documentos, pesquisem conteúdo e obtenham insights sobre seus documentos por meio de um painel de controle amigável.

## Funcionalidades

- **Upload de Documentos**: Faça upload de arquivos PDF para processamento com facilidade.
- **Listagem de Documentos**: Veja todos os documentos enviados em uma lista organizada.
- **Interface de Pesquisa**: Pesquise pelo conteúdo dos documentos de forma eficiente.
- **Painel de Controle**: Obtenha insights e análises sobre sua coleção de documentos.
- **Integração RAG**: Aproveite a Geração Aumentada por Recuperação para análise de conteúdo aprimorada (via utilitários do backend).

## Estrutura do Projeto

- **Backend**: Construído com Django, gerenciando requisições de API, processamento de documentos e integração com modelos de linguagem para análise de conteúdo. Componentes-chave incluem modelos de documentos, embeddings e utilitários de fragmentação.
- **Frontend**: Desenvolvido com React e TypeScript usando Vite para tempos de desenvolvimento e construção rápidos, proporcionando uma interface de usuário responsiva e interativa com componentes como Upload, SearchInterface e Dashboard.

## Primeiros Passos

### Pré-requisitos

- **Python 3.8+** para o backend (Django)
- **Node.js 18+** e **npm** para o frontend (React com Vite)
- **Git** para clonar o repositório

### Instalação

1. **Clonar o Repositório**:
   ```bash
=======
   git clone https://github.com/caiogn-dev/insight-pdf-explore.git
   cd insight-pdf-explorer
   ```

2. **Configuração do Backend**:
   Navegue até o diretório do backend e configure um ambiente virtual:
   ```bash
   cd beckend
   python -m venv venv
   source venv/bin/activate  # No Windows: venv\Scripts\activate
   pip install -r requirements.txt  # Certifique-se de que requirements.txt está presente ou instale as dependências manualmente
   python manage.py migrate  # Aplique as migrações do banco de dados
   python manage.py runserver  # Inicie o servidor de desenvolvimento do Django
   ```
   **Nota**: Configure variáveis de ambiente em `beckend/.env` para configurações de banco de dados, chaves de API ou outras informações sensíveis.

3. **Configuração do Frontend**:
   A partir do diretório raiz, instale e execute o frontend:
   ```bash
   npm install  # Instala as dependências definidas em package.json
   npm run dev  # Inicia o servidor de desenvolvimento Vite para o frontend React
   ```

### Uso

- Acesse a aplicação frontend via `http://localhost:5173` (porta padrão do Vite, verifique a saída do console após `npm run dev`).
- A API do backend está disponível em `http://localhost:8000/api/` (porta padrão do Django).

### Configuração de Ambiente

- **Backend**: Certifique-se de que um arquivo `.env` está configurado no diretório `beckend/` com as configurações necessárias (por exemplo, URL do banco de dados, chave secreta).
- **Frontend**: Variáveis de ambiente podem ser definidas em `.env` na raiz para uso pelo Vite (por exemplo, configuração de endpoint de API).

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para enviar um Pull Request. Certifique-se de seguir os padrões de codificação do projeto e testar suas alterações antes do envio.

## Licença

Este projeto está licenciado sob a Licença MIT - consulte o arquivo LICENSE para detalhes.
