// Configuração da API
const API_BASE = '/api';

// Estado da aplicação
let currentSection = 'dashboard';
let currentData = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadDashboardData();
});

// Inicializar aplicação
function initializeApp() {
    setupNavigation();
    setupModal();
    setupEventListeners();
    setTodayDate();
}

// Configurar navegação
function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            switchSection(section);
        });
    });
}

// Trocar seção
function switchSection(section) {
    // Atualizar menu ativo
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Atualizar seção ativa
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Atualizar título
    const titles = {
        dashboard: 'Dashboard',
        estoque: 'Controle de Estoque',
        servicos: 'Serviços e Preços',
        agendamentos: 'Agendamentos',
        clientes: 'Clientes'
    };
    document.getElementById('page-title').textContent = titles[section];
    
    // Atualizar botão adicionar
    const addBtn = document.getElementById('add-btn');
    if (section === 'dashboard') {
        addBtn.style.display = 'none';
    } else {
        addBtn.style.display = 'flex';
        addBtn.onclick = () => openAddModal(section);
    }
    
    currentSection = section;
    loadSectionData(section);
}

// Carregar dados da seção
function loadSectionData(section) {
    switch(section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'estoque':
            loadProdutos();
            break;
        case 'servicos':
            loadServicos();
            break;
        case 'agendamentos':
            loadAgendamentos();
            break;
        case 'clientes':
            loadClientes();
            break;
    }
}

// Dashboard
async function loadDashboardData() {
    try {
        showLoading();
        
        const [produtos, agendamentos, clientes] = await Promise.all([
            fetch(`${API_BASE}/produtos`).then(r => r.json()),
            fetch(`${API_BASE}/agendamentos`).then(r => r.json()),
            fetch(`${API_BASE}/clientes`).then(r => r.json())
        ]);
        
        // Atualizar cards
        document.getElementById('total-produtos').textContent = produtos.length;
        document.getElementById('estoque-baixo').textContent = produtos.filter(p => p.estoque_baixo).length;
        document.getElementById('total-clientes').textContent = clientes.length;
        
        // Agendamentos de hoje
        const hoje = new Date().toISOString().split('T')[0];
        const agendamentosHoje = agendamentos.filter(a => 
            a.data_agendamento.startsWith(hoje) && 
            ['agendado', 'confirmado'].includes(a.status)
        );
        document.getElementById('agendamentos-hoje').textContent = agendamentosHoje.length;
        
        // Próximos agendamentos
        loadProximosAgendamentos(agendamentos);
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    } finally {
        hideLoading();
    }
}

function loadProximosAgendamentos(agendamentos) {
    const container = document.getElementById('proximos-agendamentos');
    const proximos = agendamentos
        .filter(a => new Date(a.data_agendamento) >= new Date() && a.status !== 'cancelado')
        .sort((a, b) => new Date(a.data_agendamento) - new Date(b.data_agendamento))
        .slice(0, 5);
    
    if (proximos.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Nenhum agendamento próximo</p>';
        return;
    }
    
    container.innerHTML = proximos.map(ag => `
        <div class="agendamento-item">
            <div>
                <strong>${ag.cliente_nome}</strong><br>
                <small>${ag.servico_nome}</small>
            </div>
            <div class="text-right">
                <div>${formatDateTime(ag.data_agendamento)}</div>
                <span class="status-badge status-${ag.status}">${formatStatus(ag.status)}</span>
            </div>
        </div>
    `).join('');
}

// Produtos (Estoque)
async function loadProdutos() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/produtos`);
        const produtos = await response.json();
        
        currentData.produtos = produtos;
        renderProdutosTable(produtos);
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    } finally {
        hideLoading();
    }
}

function renderProdutosTable(produtos) {
    const tbody = document.querySelector('#produtos-table tbody');
    
    if (produtos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum produto cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = produtos.map(produto => `
        <tr>
            <td>${produto.nome}</td>
            <td>${produto.categoria}</td>
            <td>${produto.quantidade_estoque} ${produto.unidade_medida}</td>
            <td>R$ ${produto.preco_custo.toFixed(2)}</td>
            <td>R$ ${produto.preco_venda.toFixed(2)}</td>
            <td>
                <span class="status-badge ${produto.estoque_baixo ? 'estoque-baixo' : 'estoque-ok'}">
                    ${produto.estoque_baixo ? 'Estoque Baixo' : 'OK'}
                </span>
            </td>
            <td class="table-actions">
                <button class="btn btn-sm btn-primary" onclick="editProduto(${produto.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="movimentarEstoque(${produto.id})">
                    <i class="fas fa-exchange-alt"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduto(${produto.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Serviços
async function loadServicos() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/servicos`);
        const servicos = await response.json();
        
        currentData.servicos = servicos;
        renderServicosTable(servicos);
        
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
    } finally {
        hideLoading();
    }
}

function renderServicosTable(servicos) {
    const tbody = document.querySelector('#servicos-table tbody');
    
    if (servicos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum serviço cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = servicos.map(servico => `
        <tr>
            <td>${servico.nome}</td>
            <td>${servico.categoria}</td>
            <td>${servico.tempo_estimado}</td>
            <td>R$ ${servico.custo_mao_obra.toFixed(2)}</td>
            <td>R$ ${servico.custo_materiais.toFixed(2)}</td>
            <td>${servico.margem_lucro_percentual}%</td>
            <td><strong>R$ ${servico.preco_final.toFixed(2)}</strong></td>
            <td class="table-actions">
                <button class="btn btn-sm btn-primary" onclick="editServico(${servico.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteServico(${servico.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Agendamentos
async function loadAgendamentos() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/agendamentos`);
        const agendamentos = await response.json();
        
        currentData.agendamentos = agendamentos;
        renderAgendamentosTable(agendamentos);
        
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
    } finally {
        hideLoading();
    }
}

function renderAgendamentosTable(agendamentos) {
    const tbody = document.querySelector('#agendamentos-table tbody');
    
    if (agendamentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum agendamento encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = agendamentos.map(agendamento => `
        <tr>
            <td>${formatDateTime(agendamento.data_agendamento)}</td>
            <td>${agendamento.cliente_nome}</td>
            <td>${agendamento.servico_nome}</td>
            <td>
                <span class="status-badge status-${agendamento.status}">
                    ${formatStatus(agendamento.status)}
                </span>
            </td>
            <td>R$ ${agendamento.valor_total.toFixed(2)}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-primary" onclick="editAgendamento(${agendamento.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="cancelarAgendamento(${agendamento.id})">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Clientes
async function loadClientes() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/clientes`);
        const clientes = await response.json();
        
        currentData.clientes = clientes;
        renderClientesTable(clientes);
        
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    } finally {
        hideLoading();
    }
}

function renderClientesTable(clientes) {
    const tbody = document.querySelector('#clientes-table tbody');
    
    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum cliente cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = clientes.map(cliente => `
        <tr>
            <td>${cliente.nome}</td>
            <td>${cliente.telefone}</td>
            <td>${cliente.email || '-'}</td>
            <td>${formatDate(cliente.data_criacao)}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-primary" onclick="editCliente(${cliente.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCliente(${cliente.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Modal
function setupModal() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancel-btn');
    
    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;
    
    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
}

function openModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-form').innerHTML = content;
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Modais específicos
function openAddModal(section) {
    const forms = {
        estoque: getProdutoForm(),
        servicos: getServicoForm(),
        agendamentos: getAgendamentoForm(),
        clientes: getClienteForm()
    };
    
    const titles = {
        estoque: 'Adicionar Produto',
        servicos: 'Adicionar Serviço',
        agendamentos: 'Novo Agendamento',
        clientes: 'Adicionar Cliente'
    };
    
    openModal(titles[section], forms[section]);
    
    // Configurar submit do formulário
    document.getElementById('modal-form').onsubmit = function(e) {
        e.preventDefault();
        handleFormSubmit(section);
    };
}

// Formulários
function getProdutoForm(produto = {}) {
    return `
        <div class="form-group">
            <label>Nome do Produto</label>
            <input type="text" name="nome" value="${produto.nome || ''}" required>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Categoria</label>
                <select name="categoria" required>
                    <option value="">Selecione...</option>
                    <option value="Ceras" ${produto.categoria === 'Ceras' ? 'selected' : ''}>Ceras</option>
                    <option value="Shampoos" ${produto.categoria === 'Shampoos' ? 'selected' : ''}>Shampoos</option>
                    <option value="Panos" ${produto.categoria === 'Panos' ? 'selected' : ''}>Panos</option>
                    <option value="Acessórios" ${produto.categoria === 'Acessórios' ? 'selected' : ''}>Acessórios</option>
                </select>
            </div>
            <div class="form-group">
                <label>Unidade de Medida</label>
                <select name="unidade_medida">
                    <option value="unidade" ${produto.unidade_medida === 'unidade' ? 'selected' : ''}>Unidade</option>
                    <option value="litro" ${produto.unidade_medida === 'litro' ? 'selected' : ''}>Litro</option>
                    <option value="kg" ${produto.unidade_medida === 'kg' ? 'selected' : ''}>Kg</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Descrição</label>
            <textarea name="descricao" rows="3">${produto.descricao || ''}</textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Preço de Custo</label>
                <input type="number" name="preco_custo" step="0.01" value="${produto.preco_custo || ''}" required>
            </div>
            <div class="form-group">
                <label>Preço de Venda</label>
                <input type="number" name="preco_venda" step="0.01" value="${produto.preco_venda || ''}" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Quantidade em Estoque</label>
                <input type="number" name="quantidade_estoque" value="${produto.quantidade_estoque || 0}" required>
            </div>
            <div class="form-group">
                <label>Estoque Mínimo</label>
                <input type="number" name="estoque_minimo" value="${produto.estoque_minimo || 5}" required>
            </div>
        </div>
    `;
}

function getServicoForm(servico = {}) {
    return `
        <div class="form-group">
            <label>Nome do Serviço</label>
            <input type="text" name="nome" value="${servico.nome || ''}" required>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Categoria</label>
                <select name="categoria" required>
                    <option value="">Selecione...</option>
                    <option value="Lavagem" ${servico.categoria === 'Lavagem' ? 'selected' : ''}>Lavagem</option>
                    <option value="Enceramento" ${servico.categoria === 'Enceramento' ? 'selected' : ''}>Enceramento</option>
                    <option value="Detalhamento" ${servico.categoria === 'Detalhamento' ? 'selected' : ''}>Detalhamento</option>
                    <option value="Proteção" ${servico.categoria === 'Proteção' ? 'selected' : ''}>Proteção</option>
                </select>
            </div>
            <div class="form-group">
                <label>Tempo Estimado (minutos)</label>
                <input type="number" name="tempo_estimado" value="${servico.tempo_estimado || ''}" required>
            </div>
        </div>
        <div class="form-group">
            <label>Descrição</label>
            <textarea name="descricao" rows="3">${servico.descricao || ''}</textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Custo Mão de Obra</label>
                <input type="number" name="custo_mao_obra" step="0.01" value="${servico.custo_mao_obra || ''}" required>
            </div>
            <div class="form-group">
                <label>Custo Materiais</label>
                <input type="number" name="custo_materiais" step="0.01" value="${servico.custo_materiais || 0}">
            </div>
        </div>
        <div class="form-group">
            <label>Margem de Lucro (%)</label>
            <input type="number" name="margem_lucro_percentual" step="0.01" value="${servico.margem_lucro_percentual || 30}" required>
        </div>
    `;
}

async function getAgendamentoForm(agendamento = {}) {
    // Carregar clientes e serviços para os selects
    const [clientes, servicos] = await Promise.all([
        fetch(`${API_BASE}/clientes`).then(r => r.json()),
        fetch(`${API_BASE}/servicos`).then(r => r.json())
    ]);
    
    return `
        <div class="form-row">
            <div class="form-group">
                <label>Cliente</label>
                <select name="cliente_id" required>
                    <option value="">Selecione um cliente...</option>
                    ${clientes.map(c => `
                        <option value="${c.id}" ${agendamento.cliente_id === c.id ? 'selected' : ''}>
                            ${c.nome}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Serviço</label>
                <select name="servico_id" required>
                    <option value="">Selecione um serviço...</option>
                    ${servicos.map(s => `
                        <option value="${s.id}" ${agendamento.servico_id === s.id ? 'selected' : ''}>
                            ${s.nome} - R$ ${s.preco_final.toFixed(2)}
                        </option>
                    `).join('')}
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Data</label>
                <input type="date" name="data" value="${agendamento.data_agendamento ? agendamento.data_agendamento.split('T')[0] : ''}" required>
            </div>
            <div class="form-group">
                <label>Horário</label>
                <select name="horario" required>
                    <option value="">Selecione um horário...</option>
                    ${generateHorarios().map(h => `
                        <option value="${h}" ${agendamento.data_agendamento && agendamento.data_agendamento.includes(h) ? 'selected' : ''}>
                            ${h}
                        </option>
                    `).join('')}
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Observações</label>
            <textarea name="observacoes" rows="3">${agendamento.observacoes || ''}</textarea>
        </div>
    `;
}

function getClienteForm(cliente = {}) {
    return `
        <div class="form-group">
            <label>Nome Completo</label>
            <input type="text" name="nome" value="${cliente.nome || ''}" required>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Telefone</label>
                <input type="tel" name="telefone" value="${cliente.telefone || ''}" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" value="${cliente.email || ''}">
            </div>
        </div>
        <div class="form-group">
            <label>Endereço</label>
            <textarea name="endereco" rows="3">${cliente.endereco || ''}</textarea>
        </div>
    `;
}

// Submissão de formulários
async function handleFormSubmit(section) {
    const form = document.getElementById('modal-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
        showLoading();
        
        let url = `${API_BASE}/${section === 'estoque' ? 'produtos' : section === 'agendamentos' ? 'agendamentos' : section}`;
        
        // Preparar dados específicos
        if (section === 'agendamentos') {
            data.data_agendamento = `${data.data}T${data.horario}:00`;
            delete data.data;
            delete data.horario;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal();
            loadSectionData(section);
            showNotification('Item adicionado com sucesso!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.error || 'Erro ao salvar', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showNotification('Erro ao salvar', 'error');
    } finally {
        hideLoading();
    }
}

// Funções de edição
async function editProduto(id) {
    const produto = currentData.produtos.find(p => p.id === id);
    openModal('Editar Produto', getProdutoForm(produto));
    
    document.getElementById('modal-form').onsubmit = async function(e) {
        e.preventDefault();
        await updateItem('produtos', id, this);
    };
}

async function editServico(id) {
    const servico = currentData.servicos.find(s => s.id === id);
    openModal('Editar Serviço', getServicoForm(servico));
    
    document.getElementById('modal-form').onsubmit = async function(e) {
        e.preventDefault();
        await updateItem('servicos', id, this);
    };
}

async function editAgendamento(id) {
    const agendamento = currentData.agendamentos.find(a => a.id === id);
    const form = await getAgendamentoForm(agendamento);
    openModal('Editar Agendamento', form);
    
    document.getElementById('modal-form').onsubmit = async function(e) {
        e.preventDefault();
        await updateItem('agendamentos', id, this);
    };
}

async function editCliente(id) {
    const cliente = currentData.clientes.find(c => c.id === id);
    openModal('Editar Cliente', getClienteForm(cliente));
    
    document.getElementById('modal-form').onsubmit = async function(e) {
        e.preventDefault();
        await updateItem('clientes', id, this);
    };
}

// Função genérica de atualização
async function updateItem(endpoint, id, form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
        showLoading();
        
        // Preparar dados específicos para agendamentos
        if (endpoint === 'agendamentos' && data.data && data.horario) {
            data.data_agendamento = `${data.data}T${data.horario}:00`;
            delete data.data;
            delete data.horario;
        }
        
        const response = await fetch(`${API_BASE}/${endpoint}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal();
            loadSectionData(currentSection);
            showNotification('Item atualizado com sucesso!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.error || 'Erro ao atualizar', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao atualizar:', error);
        showNotification('Erro ao atualizar', 'error');
    } finally {
        hideLoading();
    }
}

// Funções de exclusão
async function deleteProduto(id) {
    if (confirm('Tem certeza que deseja remover este produto?')) {
        await deleteItem('produtos', id);
    }
}

async function deleteServico(id) {
    if (confirm('Tem certeza que deseja remover este serviço?')) {
        await deleteItem('servicos', id);
    }
}

async function deleteCliente(id) {
    if (confirm('Tem certeza que deseja remover este cliente?')) {
        await deleteItem('clientes', id);
    }
}

async function cancelarAgendamento(id) {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
        await deleteItem('agendamentos', id);
    }
}

// Função genérica de exclusão
async function deleteItem(endpoint, id) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/${endpoint}/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadSectionData(currentSection);
            showNotification('Item removido com sucesso!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.error || 'Erro ao remover', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao remover:', error);
        showNotification('Erro ao remover', 'error');
    } finally {
        hideLoading();
    }
}

// Movimentação de estoque
async function movimentarEstoque(id) {
    const produto = currentData.produtos.find(p => p.id === id);
    
    const form = `
        <div class="form-group">
            <label>Produto: ${produto.nome}</label>
            <p>Estoque atual: ${produto.quantidade_estoque} ${produto.unidade_medida}</p>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Tipo de Movimentação</label>
                <select name="tipo" required>
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                </select>
            </div>
            <div class="form-group">
                <label>Quantidade</label>
                <input type="number" name="quantidade" min="1" required>
            </div>
        </div>
    `;
    
    openModal('Movimentar Estoque', form);
    
    document.getElementById('modal-form').onsubmit = async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        try {
            showLoading();
            
            const response = await fetch(`${API_BASE}/produtos/${id}/movimentar-estoque`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                closeModal();
                loadProdutos();
                showNotification('Estoque movimentado com sucesso!', 'success');
            } else {
                const error = await response.json();
                showNotification(error.error || 'Erro ao movimentar estoque', 'error');
            }
            
        } catch (error) {
            console.error('Erro ao movimentar estoque:', error);
            showNotification('Erro ao movimentar estoque', 'error');
        } finally {
            hideLoading();
        }
    };
}

// Funções utilitárias
function setupEventListeners() {
    // Filtros e buscas
    document.getElementById('search-produtos')?.addEventListener('input', filterProdutos);
    document.getElementById('filter-categoria')?.addEventListener('change', filterProdutos);
    document.getElementById('search-servicos')?.addEventListener('input', filterServicos);
    document.getElementById('search-clientes')?.addEventListener('input', filterClientes);
    document.getElementById('filter-data')?.addEventListener('change', filterAgendamentos);
    document.getElementById('filter-status')?.addEventListener('change', filterAgendamentos);
}

function filterProdutos() {
    const search = document.getElementById('search-produtos').value.toLowerCase();
    const categoria = document.getElementById('filter-categoria').value;
    
    const filtered = currentData.produtos?.filter(produto => {
        const matchSearch = produto.nome.toLowerCase().includes(search) ||
                          produto.descricao.toLowerCase().includes(search);
        const matchCategoria = !categoria || produto.categoria === categoria;
        
        return matchSearch && matchCategoria;
    });
    
    renderProdutosTable(filtered || []);
}

function filterServicos() {
    const search = document.getElementById('search-servicos').value.toLowerCase();
    
    const filtered = currentData.servicos?.filter(servico => 
        servico.nome.toLowerCase().includes(search) ||
        servico.categoria.toLowerCase().includes(search)
    );
    
    renderServicosTable(filtered || []);
}

function filterClientes() {
    const search = document.getElementById('search-clientes').value.toLowerCase();
    
    const filtered = currentData.clientes?.filter(cliente => 
        cliente.nome.toLowerCase().includes(search) ||
        cliente.telefone.includes(search) ||
        (cliente.email && cliente.email.toLowerCase().includes(search))
    );
    
    renderClientesTable(filtered || []);
}

function filterAgendamentos() {
    const data = document.getElementById('filter-data').value;
    const status = document.getElementById('filter-status').value;
    
    const filtered = currentData.agendamentos?.filter(agendamento => {
        const matchData = !data || agendamento.data_agendamento.startsWith(data);
        const matchStatus = !status || agendamento.status === status;
        
        return matchData && matchStatus;
    });
    
    renderAgendamentosTable(filtered || []);
}

function generateHorarios() {
    const horarios = [];
    for (let h = 8; h < 18; h++) {
        horarios.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return horarios;
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('filter-data');
    if (dateInput) {
        dateInput.value = today;
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('pt-BR');
}

function formatStatus(status) {
    const statusMap = {
        agendado: 'Agendado',
        confirmado: 'Confirmado',
        em_andamento: 'Em Andamento',
        concluido: 'Concluído',
        cancelado: 'Cancelado'
    };
    return statusMap[status] || status;
}

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Adicionar estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        background-color: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#3182ce'};
    `;
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Adicionar estilos de animação para notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

