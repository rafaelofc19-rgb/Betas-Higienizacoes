# Sistema de Gestão para Estética Automotiva

## Descrição do Projeto

Este é um sistema web desenvolvido em Flask para gerenciar uma estética automotiva, oferecendo funcionalidades de controle de estoque, precificação de serviços e agendamento de atendimentos.

## Funcionalidades Principais

### 1. Dashboard
- Visão geral dos indicadores principais
- Produtos em estoque
- Produtos com estoque baixo
- Agendamentos do dia
- Total de clientes cadastrados

### 2. Controle de Estoque
- Cadastro de produtos
- Controle de quantidade em estoque
- Alertas de estoque baixo
- Categorização de produtos (Ceras, Shampoos, Panos, Acessórios)
- Preços de custo e venda

### 3. Serviços e Preços
- Cadastro de serviços oferecidos
- Cálculo automático de preços baseado em:
  - Custo de mão de obra
  - Custo de materiais
  - Margem de lucro
- Tempo estimado para cada serviço

### 4. Agendamentos
- Sistema de agendamento de serviços
- Controle de status dos agendamentos
- Histórico de atendimentos

### 5. Clientes
- Cadastro de clientes
- Histórico de serviços
- Dados de contato

## Tecnologias Utilizadas

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **Banco de Dados**: SQLite
- **Estilização**: CSS responsivo com design moderno
- **Deploy**: Servidor em nuvem

## Estrutura do Projeto

```
estetica_automotiva/
├── src/
│   ├── main.py                 # Arquivo principal da aplicação
│   ├── models/                 # Modelos do banco de dados
│   │   ├── produto.py
│   │   ├── servico.py
│   │   ├── agendamento.py
│   │   └── user.py
│   ├── routes/                 # Rotas da API
│   │   ├── produtos.py
│   │   ├── servicos.py
│   │   └── agendamentos.py
│   └── static/                 # Arquivos estáticos
│       ├── index.html
│       ├── styles.css
│       └── script.js
├── venv/                       # Ambiente virtual
├── requirements.txt            # Dependências
└── README.md
```

## Como Executar Localmente

1. Clone o repositório
2. Crie um ambiente virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # ou
   venv\Scripts\activate     # Windows
   ```
3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
4. Execute a aplicação:
   ```bash
   python src/main.py
   ```
5. Acesse http://localhost:5001

## Características da Interface

- **Design Responsivo**: Funciona em desktop e dispositivos móveis
- **Interface Intuitiva**: Navegação simples e clara
- **Cores Modernas**: Paleta de cores profissional em tons de roxo e azul
- **Formulários Dinâmicos**: Modais para cadastro e edição
- **Tabelas Interativas**: Listagem organizada dos dados

## Benefícios para o Negócio

1. **Controle de Estoque**: Evita desperdícios e rupturas de estoque
2. **Precificação Inteligente**: Garante margem de lucro adequada
3. **Organização de Agendamentos**: Melhora a experiência do cliente
4. **Histórico de Clientes**: Facilita o relacionamento e fidelização
5. **Relatórios Visuais**: Dashboard com indicadores importantes

## Desenvolvido por

Rafael Silva dos Santos - Proprietário da Estética Automotiva
Endereço: Rua Paraguaçu, 59. Realengo, RJ.
CPF: 17596934722

---

Este sistema foi desenvolvido como parte de um projeto de extensão universitária, visando a digitalização e modernização de pequenos negócios locais.

