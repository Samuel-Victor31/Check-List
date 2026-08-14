// ============================================
// CONFIGURAÇÃO INICIAL
// ============================================

// Substitua pela URL do seu Cloudflare Worker
const WORKER_URL = 'https://sistema-inspecoes.samuelvivi1996.workers.dev/';

// Gabarito correto da prova
const GABARITO = {
  q1: 'Madeira',      // Calço de roda deve ser de madeira
  q2: 'Todos os dias', // Inspeção é diária
  q3: 'Com o motorista' // Chave fica com o motorista
};

let cpfAtual = '';
let dadosMotoristaAtual = {};

// ============================================
// ETAPA 1: VERIFICAR CPF
// ============================================

async function verificarAcesso() {
  const inputCPF = document.getElementById('input-cpf');
  const cpf = inputCPF.value.trim();

  // Validação básica
  if (cpf.length !== 11 || isNaN(cpf)) {
    alert('❌ CPF inválido! Digite 11 números.');
    return;
  }

  cpfAtual = cpf;

  try {
    const response = await fetch(`${WORKER_URL}/api/verificar-cpf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf })
    });

    const resultado = await response.json();

    if (resultado.existe) {
      // ✅ Motorista já existe - ir direto para inspeção
      dadosMotoristaAtual = resultado.dados;
      console.log('Motorista encontrado:', dadosMotoristaAtual);
      irParaInspecao();
    } else {
      // 🆕 Primeira vez - mostrar prova
      console.log('Novo motorista - mostrando prova');
      irParaIntegracao();
    }
  } catch (erro) {
    console.error('Erro ao verificar CPF:', erro);
    alert('⚠️ Erro ao conectar com o servidor. Verifique a URL do Worker.');
  }
}

// ============================================
// ETAPA 2: INTEGRAÇÃO & PROVA (Primeira Vez)
// ============================================

async function concluirIntegracao() {
  // Pegar respostas da prova
  const respostas = {
    q1: document.querySelector('input[name="q1"]:checked')?.value,
    q2: document.querySelector('input[name="q2"]:checked')?.value,
    q3: document.querySelector('input[name="q3"]:checked')?.value
  };

  // Validar se respondeu tudo
  if (!respostas.q1 || !respostas.q2 || !respostas.q3) {
    alert('⚠️ Responda todas as questões!');
    return;
  }

  // Corrigir prova
  let acertos = 0;
  let feedback = 'Resultado da Prova:\n\n';

  for (let questao in GABARITO) {
    if (respostas[questao] === GABARITO[questao]) {
      acertos++;
      feedback += `✅ ${questao}: Correto!\n`;
    } else {
      feedback += `❌ ${questao}: Incorreto. Resposta: ${GABARITO[questao]}\n`;
    }
  }

  feedback += `\nTotal: ${acertos}/3 acertos`;

  // Mostrar resultado
  alert(feedback);

  // Exigir 100% de acerto para continuar
  if (acertos === 3) {
    // ✅ Passou - salvar e ir para inspeção
    await salvarMotoristaComProva(respostas);
    irParaInspecao();
  } else {
    alert('⚠️ Você precisa acertar TODAS as questões. Tente novamente!');
    // Limpar respostas
    document.getElementById('form-prova').reset();
  }
}

async function salvarMotoristaComProva(respostas) {
  try {
    const response = await fetch(`${WORKER_URL}/api/salvar-motorista`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpf: cpfAtual,
        nome: 'Motorista ' + cpfAtual.slice(-4), // Placeholder
        cnh: '',
        placa: '',
        prova_respondida: {
          data: new Date().toISOString(),
          respostas,
          resultado: 'aprovado'
        }
      })
    });

    const resultado = await response.json();
    console.log('Motorista salvo:', resultado);
  } catch (erro) {
    console.error('Erro ao salvar motorista:', erro);
  }
}

// ============================================
// ETAPA 3: INSPEÇÃO VEICULAR
// ============================================

async function gerarJSONeToken() {
  // Coletar dados do formulário de inspeção
  const inspecao = {
    nome: document.getElementById('nome').value,
    cnh: document.getElementById('cnh').value,
    placa: document.getElementById('placa').value,
    pedido: document.getElementById('pedido').value,
    eixos: document.getElementById('eixos').value,
    pneus: document.getElementById('pneus').value,
    carroceria: document.getElementById('carroceria').value,
    cinto: document.getElementById('cinto').value,
    farois: document.getElementById('farois').value,
    alarme_re: document.getElementById('alarme_re').value,
    vazamentos: document.getElementById('vazamentos').value,
    calcos: document.getElementById('calcos').value
  };

  // Validar preenchimento
  if (!inspecao.nome || !inspecao.cnh || !inspecao.placa) {
    alert('⚠️ Preencha todos os campos obrigatórios!');
    return;
  }

  try {
    // Salvar inspeção no Cloudflare KV
    const response = await fetch(`${WORKER_URL}/api/salvar-inspecao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpf: cpfAtual,
        inspecao_dados: inspecao
      })
    });

    const resultado = await response.json();

    if (resultado.sucesso) {
      alert(`✅ Inspeção finalizada com sucesso!\n\nID: ${resultado.id_inspecao}`);
      console.log('Inspeção salva:', resultado);
      
      // Limpar formulário
      document.getElementById('form-inspecao').reset();
      
      // Voltar para etapa 1 (opcional)
      irParaCPF();
    }
  } catch (erro) {
    console.error('Erro ao salvar inspeção:', erro);
    alert('⚠️ Erro ao salvar inspeção!');
  }
}

// ============================================
// CONTROLE DE ABAS/ETAPAS
// ============================================

function irParaCPF() {
  ocultarTodas();
  document.getElementById('step-cpf').classList.remove('hidden');
  document.getElementById('input-cpf').value = '';
}

function irParaIntegracao() {
  ocultarTodas();
  document.getElementById('step-integracao').classList.remove('hidden');
}

function irParaInspecao() {
  ocultarTodas();
  document.getElementById('step-inspecao').classList.remove('hidden');
}

function ocultarTodas() {
  document.getElementById('step-cpf').classList.add('hidden');
  document.getElementById('step-integracao').classList.add('hidden');
  document.getElementById('step-inspecao').classList.add('hidden');
}

// Mostrar primeira etapa ao carregar
document.addEventListener('DOMContentLoaded', irParaCPF);
