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
      
      // Auto-preenche os dados já cadastrados do motorista na tela de inspeção
      if (dadosMotoristaAtual.nome) document.getElementById('nome').value = dadosMotoristaAtual.nome;
      if (dadosMotoristaAtual.placa) document.getElementById('placa').value = dadosMotoristaAtual.placa;
      
      irParaInspecao();
    } else {
      console.log('Novo motorista - mostrando prova e cadastro');
      irParaIntegracao();
    }
  } catch (erro) {
    console.error('Erro ao verificar CPF:', erro);
    alert('⚠️ Erro ao conectar com o servidor. Verifique a conexão.');
  }
}
 
// ============================================
// ETAPA 2: INTEGRAÇÃO & PROVA (1º Acesso)
// ============================================
 
async function concluirIntegracao() {
  // Capturar novos dados cadastrais
  const nome = document.getElementById('reg-nome').value.trim();
  const telefone = document.getElementById('reg-telefone').value.trim();
  let placa = document.getElementById('reg-placa').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
 
  if (!nome || !telefone || !placa) {
    alert('⚠️ Por favor, preencha todos os dados de cadastro (Nome, Telefone e Placa do Cavalo)!');
    return;
  }
 
  // Pegar respostas da prova
  const respostas = {
    q1: document.querySelector('input[name="q1"]:checked')?.value,
    q2: document.querySelector('input[name="q2"]:checked')?.value,
    q3: document.querySelector('input[name="q3"]:checked')?.value
  };
 
  if (!respostas.q1 || !respostas.q2 || !respostas.q3) {
    alert('⚠️ Responda todas as questões da prova!');
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
  alert(feedback);
 
  if (acertos === 3) {
    // Salvar o cadastro e aprovação do motorista no Cloudflare
    await salvarMotoristaComProva(nome, telefone, placa, respostas);
    
    // Transfere o nome e a placa para o formulário da Etapa 3
    document.getElementById('nome').value = nome;
    document.getElementById('placa').value = placa;
    
    irParaInspecao();
  } else {
    alert('⚠️ Você precisa acertar TODAS as questões. Tente novamente!');
    document.getElementById('form-prova').reset();
  }
}
 
async function salvarMotoristaComProva(nome, telefone, placa, respostas) {
  try {
    await fetch(`${WORKER_URL}/api/salvar-motorista`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpf: cpfAtual,
        nome: nome,
        telefone: telefone,
        placa: placa,
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
// FUNÇÕES PARA CONTROLAR CAMPO DE PALETES
// ============================================
 
function mostrarQuantidadePaletes() {
  document.getElementById('quantidade-paletes-container').style.display = 'block';
}
 
function ocultarQuantidadePaletes() {
  document.getElementById('quantidade-paletes-container').style.display = 'none';
  document.getElementById('quantidade-paletes').value = '';
}
 
// ============================================
// ETAPA 3: INSPEÇÃO VEICULAR
// ============================================
 
async function gerarJSONeToken() {
  let placaDigitada = document.getElementById('placa').value.toUpperCase().replace(/[^A-Z0-9]/g, '');

  const paletesOpcao = document.querySelector('input[name="paletes_opcao"]:checked')?.value;
  let quantidadePaletes = '';
  
  if (paletesOpcao === 'SIM') {
    quantidadePaletes = document.getElementById('quantidade-paletes').value.trim();
    if (!quantidadePaletes) {
      alert('⚠️ Se selecionou SIM em paletes, informe a quantidade!');
      return;
    }
  }

  const inspecao = {
    nome: document.getElementById('nome').value,
    cnh: document.getElementById('cnh').value,
    placa: placaDigitada,
    pedido: document.getElementById('pedido').value,
    eixos: document.getElementById('eixos').value,
    sinalizacao: document.getElementById('sinalizacao').value,
    pneus: document.getElementById('pneus').value,
    carroceria: document.getElementById('carroceria').value,
    cinto: document.getElementById('cinto').value,
    farois: document.getElementById('farois').value,
    alarme_re: document.getElementById('alarme_re').value,
    vazamentos: document.getElementById('vazamentos').value,
    calcos: document.getElementById('calcos').value,
    tampa_silo: document.getElementById('tampa_silo').value,
    epi_capacete: document.getElementById('epi_capacete').value,
    epi_colete: document.getElementById('epi_colete').value,
    epi_oculos: document.getElementById('epi_oculos').value,
    epi_botina: document.getElementById('epi_botina').value,
    epi_luvas: document.getElementById('epi_luvas').value,
    paletes_opcao: paletesOpcao || '',
    paletes_quantidade: quantidadePaletes || ''
  };

  if (!inspecao.nome || !inspecao.cnh || !inspecao.placa || !inspecao.sinalizacao || !inspecao.tampa_silo ||
      !inspecao.epi_capacete || !inspecao.epi_colete || !inspecao.epi_oculos || !inspecao.epi_botina || !inspecao.epi_luvas) {
    alert('⚠️ Preencha todos os campos obrigatórios da inspeção e EPIs!');
    return;
  }

  if (!paletesOpcao) {
    alert('⚠️ Selecione uma opção para paletes!');
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
// CONTROLE DE ABAS / ETAPAS
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
  
  // Limita o tamanho e ajusta o placeholder da placa
  const inputPlaca = document.getElementById('placa');
  if (inputPlaca) {
    inputPlaca.maxLength = 7;
    inputPlaca.placeholder = 'abc1234';
  }
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
