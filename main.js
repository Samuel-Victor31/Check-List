// ============================================
// CONFIGURAÇÃO INICIAL
// ============================================

const WORKER_URL = 'https://sistema-inspecoes.samuelvivi1996.workers.dev';

const GABARITO = {
  q1: 'Madeira',
  q2: 'Todos os dias',
  q3: 'Bloqueada pelo responsável CSN Cimentos'
};

let cpfAtual = '';
let dadosMotoristaAtual = {};

// ============================================
// ETAPA 1: VERIFICAR CPF
// ============================================

async function verificarAcesso() {
  const inputCPF = document.getElementById('input-cpf');
  const cpf = inputCPF.value.trim();

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
      dadosMotoristaAtual = resultado.dados;
      console.log('Motorista encontrado:', dadosMotoristaAtual);
      irParaInspecao();
    } else {
      console.log('Novo motorista - mostrando prova');
      irParaIntegracao();
    }
  } catch (erro) {
    console.error('Erro ao verificar CPF:', erro);
    alert('⚠️ Erro ao conectar com o servidor.');
  }
}

// ============================================
// ETAPA 2: INTEGRAÇÃO & PROVA
// ============================================

async function concluirIntegracao() {
  const respostas = {
    q1: document.querySelector('input[name="q1"]:checked')?.value,
    q2: document.querySelector('input[name="q2"]:checked')?.value,
    q3: document.querySelector('input[name="q3"]:checked')?.value
  };

  if (!respostas.q1 || !respostas.q2 || !respostas.q3) {
    alert('⚠️ Responda todas as questões!');
    return;
  }

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
  alert(feedback);

  if (acertos === 3) {
    await salvarMotoristaComProva(respostas);
    irParaInspecao();
  } else {
    alert('⚠️ Você precisa acertar TODAS as questões. Tente novamente!');
    document.getElementById('form-prova').reset();
  }
}

async function salvarMotoristaComProva(respostas) {
  try {
    await fetch(`${WORKER_URL}/api/salvar-motorista`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpf: cpfAtual,
        nome: 'Motorista ' + cpfAtual.slice(-4),
        cnh: '',
        placa: '',
        prova_respondida: {
          data: new Date().toISOString(),
          respostas,
          resultado: 'aprovado'
        }
      })
    });
  } catch (erro) {
    console.error('Erro ao salvar motorista:', erro);
  }
}

// ============================================
// ETAPA 3: INSPEÇÃO VEICULAR
// ============================================

async function gerarJSONeToken() {
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

  if (!inspecao.nome || !inspecao.cnh || !inspecao.placa) {
    alert('⚠️ Preencha todos os campos obrigatórios!');
    return;
  }

  try {
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
      document.getElementById('form-inspecao').reset();
      document.getElementById('token-gerado').innerText = resultado.id_inspecao;
      irParaSucesso();
    }
  } catch (erro) {
    console.error('Erro ao salvar inspeção:', erro);
    alert('⚠️ Erro ao salvar inspeção!');
  }
}

function copiarToken() {
  const token = document.getElementById('token-gerado').innerText;
  navigator.clipboard.writeText(token).then(() => {
    alert('📋 Código copiado com sucesso!');
  });
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

function irParaSucesso() {
  ocultarTodas();
  document.getElementById('step-sucesso').classList.remove('hidden');
}

function ocultarTodas() {
  document.getElementById('step-cpf').classList.add('hidden');
  document.getElementById('step-integracao').classList.add('hidden');
  document.getElementById('step-inspecao').classList.add('hidden');
  document.getElementById('step-sucesso').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', irParaCPF);
