// ========== SISTEMA DE USUÁRIOS ==========
let currentUser = null;
let users = [];

// Carregar usuários do localStorage
function loadUsers() {
  const saved = localStorage.getItem('financas_usuarios');
  if (saved) {
    users = JSON.parse(saved);
  } else {
    // Só cria usuário demo se NÃO EXISTIR nenhum usuário
    if (users.length === 0) {
      users = [{
        id: 1,
        nome: 'Usuário Demo',
        email: 'demo@email.com',
        senha: '123456',
        transactions: []
      }];
      saveUsers();
    }
  }
}

function saveUsers() {
  localStorage.setItem('financas_usuarios', JSON.stringify(users));
}

function login(email, senha) {
  const user = users.find(u => u.email === email && u.senha === senha);
  if (user) {
    currentUser = JSON.parse(JSON.stringify(user)); // Cria uma cópia
    localStorage.setItem('financas_current_user', JSON.stringify({ 
      id: currentUser.id, 
      email: currentUser.email, 
      nome: currentUser.nome 
    }));
    return true;
  }
  return false;
}

function register(nome, email, senha, confirmar) {
  // Validações
  if (!nome || !email || !senha) {
    alert('Preencha todos os campos');
    return false;
  }
  
  if (senha !== confirmar) {
    alert('As senhas não coincidem');
    return false;
  }
  
  if (senha.length < 4) {
    alert('A senha deve ter pelo menos 4 caracteres');
    return false;
  }
  
  if (users.find(u => u.email === email)) {
    alert('Este e-mail já está cadastrado');
    return false;
  }
  
  const newUser = {
    id: Date.now(),
    nome: nome,
    email: email,
    senha: senha,
    transactions: []
  };
  
  users.push(newUser);
  saveUsers();
  alert('✅ Cadastro realizado com sucesso! Faça login.');
  return true;
}

function logout() {
  currentUser = null;
  localStorage.removeItem('financas_current_user');
}

function loadCurrentUser() {
  const saved = localStorage.getItem('financas_current_user');
  if (saved) {
    const userData = JSON.parse(saved);
    const user = users.find(u => u.id === userData.id);
    if (user) {
      currentUser = JSON.parse(JSON.stringify(user));
    }
  }
}

// ========== TRANSAÇÕES DO USUÁRIO ==========
function getUserTransactions() {
  if (!currentUser) return [];
  return currentUser.transactions || [];
}

function saveUserTransactions(transactions) {
  if (currentUser) {
    currentUser.transactions = transactions;
    // Atualiza o usuário no array users
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex].transactions = transactions;
      saveUsers();
      
      // Atualiza o currentUser no localStorage
      localStorage.setItem('financas_current_user', JSON.stringify({ 
        id: currentUser.id, 
        email: currentUser.email, 
        nome: currentUser.nome 
      }));
    }
  }
}

// ========== DADOS DAS TRANSAÇÕES ==========
let transactions = [];
let anoSelecionado = new Date().getFullYear();
let chart;

// ========== ELEMENTOS DO DOM ==========
const descricaoInput = document.getElementById('descricao');
const valorInput = document.getElementById('valor');
const tipoSelect = document.getElementById('tipo');
const addBtn = document.getElementById('add-transacao');
const transactionsList = document.getElementById('transactions-list');
const totalBalanceSpan = document.getElementById('total-balance');
const totalIncomeSpan = document.getElementById('total-income');
const totalExpenseSpan = document.getElementById('total-expense');
const totalTransacoesCount = document.getElementById('total-transacoes-count');

// ========== FUNÇÕES DO SELETOR DE ANO ==========
function atualizarAnoDisplay() {
  const anoDisplay = document.getElementById('ano-atual-display');
  if (anoDisplay) anoDisplay.textContent = anoSelecionado;
}

function setupAnoNavegacao() {
  const btnAnterior = document.getElementById('ano-anterior');
  const btnProximo = document.getElementById('ano-proximo');
  
  if (btnAnterior) {
    btnAnterior.addEventListener('click', () => { 
      anoSelecionado--; 
      atualizarAnoDisplay(); 
    });
  }
  if (btnProximo) {
    btnProximo.addEventListener('click', () => { 
      anoSelecionado++; 
      atualizarAnoDisplay(); 
    });
  }
  atualizarAnoDisplay();
}

// ========== FUNÇÕES DE DATA ==========
function formatarDataParaExibicao(dataStr) {
  if (!dataStr) return '';
  const [year, month, day] = dataStr.split('-');
  return `${day}/${month}/${year}`;
}

function preencherDatasRelatorio() {
  const dataInicio = document.getElementById('relatorio-data-inicio');
  const dataFim = document.getElementById('relatorio-data-fim');
  
  if (dataInicio && dataFim) {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    dataInicio.value = primeiroDiaMes.toISOString().split('T')[0];
    dataFim.value = ultimoDiaMes.toISOString().split('T')[0];
  }
}

// ========== NAVEGAÇÃO ENTRE SEÇÕES ==========
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = ['dashboard', 'nova-transacao', 'relatorios', 'configuracoes'];

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      sections.forEach(section => {
        const el = document.getElementById(`${section}-section`);
        if (el) el.classList.remove('active');
      });
      
      const sectionId = link.getAttribute('data-section');
      const activeSection = document.getElementById(`${sectionId}-section`);
      if (activeSection) activeSection.classList.add('active');
      
      const titles = {
        dashboard: 'Dashboard Financeiro',
        'nova-transacao': 'Nova Transação',
        relatorios: 'Relatórios',
        configuracoes: 'Configurações'
      };
      const pageTitle = document.getElementById('page-title');
      if (pageTitle) {
        pageTitle.innerHTML = `<i class="fas ${getIconForSection(sectionId)}"></i> ${titles[sectionId]}`;
      }
      
      if (sectionId === 'relatorios') {
        const dataInicio = document.getElementById('relatorio-data-inicio');
        const dataFim = document.getElementById('relatorio-data-fim');
        if (dataInicio && dataFim && dataInicio.value && dataFim.value) {
          atualizarRelatorio(dataInicio.value, dataFim.value);
        }
      }
    });
  });
}

function getIconForSection(section) {
  const icons = {
    dashboard: 'fa-chart-line',
    'nova-transacao': 'fa-plus-circle',
    relatorios: 'fa-chart-bar',
    configuracoes: 'fa-cog'
  };
  return icons[section] || 'fa-chart-line';
}

// ========== GERENCIAMENTO DE TRANSAÇÕES ==========
function loadTransactions() {
  transactions = getUserTransactions();
  updateDashboard();
}

function saveTransactions() {
  saveUserTransactions(transactions);
}

function addTransaction() {
  const descricao = descricaoInput.value.trim();
  const valor = parseFloat(valorInput.value);
  const tipo = tipoSelect.value;
  const dia = document.getElementById('nova-dia')?.value || '01';
  const mes = document.getElementById('nova-mes')?.value || '01';
  const dataCompleta = `${anoSelecionado}-${mes}-${dia}`;

  if (!descricao || isNaN(valor) || valor <= 0) {
    alert('Preencha todos os campos corretamente');
    return;
  }

  // Verifica se a data é válida
  const dataTeste = new Date(dataCompleta);
  if (isNaN(dataTeste.getTime())) {
    alert('Data inválida!');
    return;
  }

  const newTransaction = {
    id: Date.now(),
    descricao,
    valor,
    tipo,
    dataCompleta,
    dataExibicao: formatarDataParaExibicao(dataCompleta)
  };

  transactions.unshift(newTransaction);
  transactions.sort((a, b) => b.dataCompleta.localeCompare(a.dataCompleta));
  saveTransactions();
  updateDashboard();

  // Limpar formulário
  descricaoInput.value = '';
  valorInput.value = '';
  
  // Voltar para dashboard
  const dashboardLink = document.querySelector('.nav-link[data-section="dashboard"]');
  if (dashboardLink) dashboardLink.click();
}

function deleteTransaction(id) {
  if (confirm('Tem certeza que deseja excluir esta transação?')) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateDashboard();
  }
}

// ========== CÁLCULOS ==========
function calculateTotals() {
  let income = 0, expense = 0;
  transactions.forEach(t => {
    if (t.tipo === 'income') income += t.valor;
    else expense += t.valor;
  });
  return { income, expense, balance: income - expense };
}

function updateCards() {
  const { income, expense, balance } = calculateTotals();
  if (totalIncomeSpan) totalIncomeSpan.textContent = `R$ ${income.toFixed(2)}`;
  if (totalExpenseSpan) totalExpenseSpan.textContent = `R$ ${expense.toFixed(2)}`;
  if (totalBalanceSpan) totalBalanceSpan.textContent = `R$ ${balance.toFixed(2)}`;
  if (totalTransacoesCount) totalTransacoesCount.textContent = transactions.length;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderTransactions() {
  if (!transactionsList) return;
  
  if (transactions.length === 0) {
    transactionsList.innerHTML = '<p class="empty-message">Nenhuma transação adicionada</p>';
    return;
  }

  transactionsList.innerHTML = '';
  transactions.slice(0, 10).forEach(t => {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    div.innerHTML = `
      <div class="transaction-info">
        <span class="transaction-desc">${escapeHtml(t.descricao)}</span>
        <span class="transaction-date">${t.dataExibicao || ''}</span>
      </div>
      <div class="transaction-amount ${t.tipo === 'income' ? 'income' : 'expense'}">
        ${t.tipo === 'income' ? '+' : '-'} R$ ${t.valor.toFixed(2)}
      </div>
      <button class="delete-btn" onclick="deleteTransaction(${t.id})">
        <i class="fas fa-trash-alt"></i>
      </button>
    `;
    transactionsList.appendChild(div);
  });
}

function updateChart() {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const incomeByMonth = new Array(12).fill(0);
  const expenseByMonth = new Array(12).fill(0);
  const currentYear = new Date().getFullYear();

  transactions.forEach(t => {
    if (t.dataCompleta) {
      const date = new Date(t.dataCompleta);
      const year = date.getFullYear();
      const month = date.getMonth();
      if (year === currentYear && !isNaN(month)) {
        if (t.tipo === 'income') incomeByMonth[month] += t.valor;
        else expenseByMonth[month] += t.valor;
      }
    }
  });

  const ctx = document.getElementById('financeChart')?.getContext('2d');
  if (!ctx) return;
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Receitas', data: incomeByMonth, backgroundColor: '#2E7D32', borderRadius: 8 },
        { label: 'Despesas', data: expenseByMonth, backgroundColor: '#D32F2F', borderRadius: 8 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// ========== RELATÓRIOS ==========
function setupRelatorios() {
  const filtrarBtn = document.getElementById('filtrar-relatorio');
  preencherDatasRelatorio();
  
  if (filtrarBtn) {
    filtrarBtn.addEventListener('click', () => {
      const dataInicio = document.getElementById('relatorio-data-inicio').value;
      const dataFim = document.getElementById('relatorio-data-fim').value;
      if (dataInicio && dataFim) {
        atualizarRelatorio(dataInicio, dataFim);
      }
    });
  }
  
  const dataInicio = document.getElementById('relatorio-data-inicio')?.value;
  const dataFim = document.getElementById('relatorio-data-fim')?.value;
  if (dataInicio && dataFim) {
    atualizarRelatorio(dataInicio, dataFim);
  }
}

function atualizarRelatorio(dataInicio, dataFim) {
  const transacoesFiltradas = transactions.filter(t => {
    return t.dataCompleta && t.dataCompleta >= dataInicio && t.dataCompleta <= dataFim;
  });
  
  let income = 0, expense = 0;
  transacoesFiltradas.forEach(t => {
    if (t.tipo === 'income') income += t.valor;
    else expense += t.valor;
  });
  const balance = income - expense;
  
  const relatorioIncome = document.getElementById('relatorio-income');
  const relatorioExpense = document.getElementById('relatorio-expense');
  const relatorioBalance = document.getElementById('relatorio-balance');
  const relatorioTransacoes = document.getElementById('relatorio-transacoes');
  
  if (relatorioIncome) relatorioIncome.textContent = `R$ ${income.toFixed(2)}`;
  if (relatorioExpense) relatorioExpense.textContent = `R$ ${expense.toFixed(2)}`;
  if (relatorioBalance) {
    relatorioBalance.textContent = `R$ ${balance.toFixed(2)}`;
    relatorioBalance.style.color = balance >= 0 ? '#2E7D32' : '#D32F2F';
  }
  
  if (relatorioTransacoes) {
    if (transacoesFiltradas.length === 0) {
      relatorioTransacoes.innerHTML = '<p class="empty-message">Nenhuma transação neste período</p>';
    } else {
      relatorioTransacoes.innerHTML = '';
      transacoesFiltradas.forEach(t => {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        div.innerHTML = `
          <div class="transaction-info">
            <span class="transaction-desc">${escapeHtml(t.descricao)}</span>
            <span class="transaction-date">${t.dataExibicao || ''}</span>
          </div>
          <div class="transaction-amount ${t.tipo === 'income' ? 'income' : 'expense'}">
            ${t.tipo === 'income' ? '+' : '-'} R$ ${t.valor.toFixed(2)}
          </div>
        `;
        relatorioTransacoes.appendChild(div);
      });
    }
  }
}

// ========== CONFIGURAÇÕES ==========
function setupConfiguracoes() {
  const exportarBtn = document.getElementById('exportar-dados');
  const limparBtn = document.getElementById('limpar-dados');
  
  if (exportarBtn) {
    exportarBtn.addEventListener('click', exportarDados);
  }
  if (limparBtn) {
    limparBtn.addEventListener('click', limparDados);
  }
}

function exportarDados() {
  const dataStr = JSON.stringify(transactions, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financas_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  alert('✅ Dados exportados com sucesso!');
}

function limparDados() {
  if (confirm('⚠️ ATENÇÃO! Isso irá apagar TODAS as suas transações. Tem certeza?')) {
    transactions = [];
    saveTransactions();
    updateDashboard();
    alert('🗑️ Todos os dados foram removidos!');
  }
}

function updateDashboard() {
  updateCards();
  renderTransactions();
  updateChart();
  
  const dataInicio = document.getElementById('relatorio-data-inicio')?.value;
  const dataFim = document.getElementById('relatorio-data-fim')?.value;
  if (dataInicio && dataFim) {
    atualizarRelatorio(dataInicio, dataFim);
  }
}

// ========== AUTENTICAÇÃO ==========
function initAuth() {
  const loginContainer = document.getElementById('login-container');
  const registerContainer = document.getElementById('register-container');
  const dashboardContainer = document.getElementById('dashboard-container');
  
  const showRegister = document.getElementById('show-register');
  const showLogin = document.getElementById('show-login');
  const btnLogin = document.getElementById('btn-login');
  const btnRegister = document.getElementById('btn-register');
  const btnLogout = document.getElementById('btn-logout');
  
  if (showRegister) {
    showRegister.addEventListener('click', (e) => {
      e.preventDefault();
      loginContainer.style.display = 'none';
      registerContainer.style.display = 'flex';
    });
  }
  
  if (showLogin) {
    showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerContainer.style.display = 'none';
      loginContainer.style.display = 'flex';
    });
  }
  
  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      const email = document.getElementById('login-email').value;
      const senha = document.getElementById('login-senha').value;
      if (login(email, senha)) {
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        loadTransactions();
        setupDashboardAfterLogin();
        
        const userNameSpan = document.getElementById('user-name-display');
        const userWelcomeSpan = document.getElementById('user-welcome');
        if (userNameSpan) userNameSpan.textContent = currentUser.nome;
        if (userWelcomeSpan) userWelcomeSpan.textContent = `Olá, ${currentUser.nome}`;
      } else {
        alert('E-mail ou senha incorretos');
      }
    });
  }
  
  if (btnRegister) {
    btnRegister.addEventListener('click', () => {
      const nome = document.getElementById('register-nome').value;
      const email = document.getElementById('register-email').value;
      const senha = document.getElementById('register-senha').value;
      const confirmar = document.getElementById('register-confirmar').value;
      if (register(nome, email, senha, confirmar)) {
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
        document.getElementById('register-nome').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-senha').value = '';
        document.getElementById('register-confirmar').value = '';
      }
    });
  }
  
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logout();
      dashboardContainer.style.display = 'none';
      loginContainer.style.display = 'flex';
      document.getElementById('login-email').value = '';
      document.getElementById('login-senha').value = '';
    });
  }
}

function setupDashboardAfterLogin() {
  setupNavigation();
  setupRelatorios();
  setupConfiguracoes();
  setupAnoNavegacao();
  
  const now = new Date();
  const mesAtual = String(now.getMonth() + 1).padStart(2, '0');
  const diaAtual = String(now.getDate()).padStart(2, '0');
  const mesSelect = document.getElementById('nova-mes');
  const diaSelect = document.getElementById('nova-dia');
  if (mesSelect) mesSelect.value = mesAtual;
  if (diaSelect) diaSelect.value = diaAtual;
}

// ========== EVENT LISTENERS ==========
if (addBtn) addBtn.addEventListener('click', addTransaction);

// ========== INICIAR APLICAÇÃO ==========
loadUsers();
loadCurrentUser();
initAuth();

if (currentUser) {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('dashboard-container').style.display = 'block';
  loadTransactions();
  setupDashboardAfterLogin();
  
  const userNameSpan = document.getElementById('user-name-display');
  const userWelcomeSpan = document.getElementById('user-welcome');
  if (userNameSpan) userNameSpan.textContent = currentUser.nome;
  if (userWelcomeSpan) userWelcomeSpan.textContent = `Olá, ${currentUser.nome}`;
}