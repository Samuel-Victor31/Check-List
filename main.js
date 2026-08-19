// ============================================
// CONFIGURAÇÃO INICIAL E CONSTANTES
// ============================================

const WORKER_URL = 'https://sistema-inspecoes.samuelvivi1996.workers.dev';

// GABARITO DA PROVA (4 QUESTÕES)
const GABARITO = {
  q1: 'Borracha',
  q2: 'Todos os dias',
  q3: 'Ir para um ponto mais próximo indicado pela brigada de emergência',
  q4: 'Bloqueada pelo responsável CSN CIMENTOS.'
};

let cpfAtual = '';
let dadosMotoristaAtual = {};
let ehPrimeiraVez = false;
let tipoCarregamentoSelecionado = '';

// ============================================
// FUNÇÕES AUXILIARES DE VALIDAÇÃO
// ============================================

// Valida Placa Tradicional (ABC1234) ou Mercosul (ABC1A34)
function validarPlaca(placa) {
  const regexPlaca = /^[A-Z]{3}[0-9]{1}[A-Z0-9]{1}[0-9]{2}$/;
  return regexPlaca.test(placa);
}

// Valida se o número do pedido tem entre 7 e 8 dígitos numéricos
function validarPedido(pedido) {
  const regexPedido = /^[0-9]{7,8}$/;
  return regexPedido.test(pedido);
}

// Valida Telefone com DDD (10 dígitos para Fixo, 11 para Celular)
function validarTelefone(telefone) {
  const regexTelefone = /^[1-9]{2}(?:[2-8][0-9]{7}|9[0-9]{8})$/;
  return regexTelefone.test(telefone);
}

// Valida se a quantidade de eixos é apenas 1 dígito numérico entre 1 e 9
function validarEixos(eixos) {
  const regexEixos = /^[1-9]{1}$/;
  return regexEixos.test(eixos);
}

// Função auxiliar simples para obter elemento por ID
function id(el) {
  return document.getElementById(el);
}

// ============================================
// ETAPA 1: VERIFICAR CPF E TIPO DE CARREGAMENTO
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
      ehPrimeiraVez = false; // Motorista veterano
      dadosMotoristaAtual = resultado.dados;
      console.log('Motorista encontrado:', dadosMotoristaAtual);

      // Auto-preenche os dados já cadastrados
      if (dadosMotoristaAtual.nome) document.getElementById('nome').value = dadosMotoristaAtual.nome;
      if (dadosMotoristaAtual.placa) document.getElementById('placa').value = dadosMotoristaAtual.placa;
      if (dadosMotoristaAtual.telefone) document.getElementById('telefone').value = dadosMotoristaAtual.telefone;
      if (dadosMotoristaAtual.cnh) document.getElementById('cnh').value = dadosMotoristaAtual.cnh;

      irParaSelecaoCarregamento();
    } else {
      ehPrimeiraVez = true; // Novo motorista
      console.log('Novo motorista - mostrando prova e cadastro');
      irParaIntegracao();
    }
  } catch (erro) {
    console.error('Erro ao verificar CPF:', erro);
    alert('⚠️ Erro ao conectar com o servidor. Verifique a conexão.');
  }
}

function irParaSelecaoCarregamento() {
  ocultarTodas();
  document.getElementById('step-tipo-carregamento').classList.remove('hidden');
}

function confirmarTipoCarregamento() {
  const opcao = document.querySelector('input[name="modelo_carregamento"]:checked')?.value;

  if (!opcao) {
    alert('⚠️ Por favor, selecione o Tipo de Carregamento (FOB ou TRANSFERÊNCIA/CIF)!');
    return;
  }

  tipoCarregamentoSelecionado = opcao;

  if (opcao === 'FOB') {
    irParaInspecao();
  } else if (opcao === 'CIF') {
    irParaInspecaoCIF();
  }
}

// ============================================
// LÓGICA DE BLOQUEIO / DESBLOQUEIO DA PROVA
// ============================================

function alternarBloqueioProva() {
  const aceiteVideo = document.getElementById('aceite-video')?.checked;
  const secaoProva = document.getElementById('secao-prova');

  if (!secaoProva) return;

  if (aceiteVideo) {
    secaoProva.style.opacity = '1';
    secaoProva.style.pointerEvents = 'auto';
  } else {
    secaoProva.style.opacity = '0.5';
    secaoProva.style.pointerEvents = 'none';
    
    // Reseta marcações da prova se desmarcar o vídeo
    const radios = secaoProva.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => radio.checked = false);
  }
}

// ============================================
// ETAPA 2: INTEGRAÇÃO & PROVA (1º Acesso)
// ============================================

async function concluirIntegracao() {
  const nome = document.getElementById('reg-nome').value.trim();
  const rg = document.getElementById('reg-rg').value.trim();
  const telefone = document.getElementById('reg-telefone').value.trim();
  let placa = document.getElementById('reg-placa').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  const aceiteVideo = document.getElementById('aceite-video').checked;
  const aceitePPAE = document.getElementById('aceite-ppae').checked;
  const aceiteFOB = document.getElementById('aceite-fob').checked;
  const aceiteLGPD = document.getElementById('aceite-lgpd')?.checked;

  if (!nome || !rg || !telefone || !placa) {
    alert('⚠️ Por favor, preencha todos os dados de cadastro (Nome, RG, Telefone e Placa)!');
    return;
  }

  if (!validarTelefone(telefone)) {
    alert('❌ Telefone/WhatsApp inválido! Digite um número válido com DDD (Ex: 11999999999).');
    return;
  }

  if (!validarPlaca(placa)) {
    alert('❌ Placa do veículo inválida! A placa deve seguir o padrão ABC1234 ou ABC1A34.');
    return;
  }

  if (!aceiteVideo) {
    alert('⚠️ Você precisa confirmar que assistiu ao VÍDEO DE INTRODUÇÃO para realizar a prova!');
    return;
  }

  const respostas = {
    q1: document.querySelector('input[name="q1"]:checked')?.value,
    q2: document.querySelector('input[name="q2"]:checked')?.value,
    q3: document.querySelector('input[name="q3"]:checked')?.value,
    q4: document.querySelector('input[name="q4"]:checked')?.value
  };

  if (!respostas.q1 || !respostas.q2 || !respostas.q3 || !respostas.q4) {
    alert('⚠️ Responda todas as 4 questões da prova!');
    return;
  }

  if (!aceitePPAE || !aceiteFOB || !aceiteLGPD) {
    alert('⚠️ Você precisa marcar o aceite em TODOS os termos de compromisso (PPAE, FOB e LGPD) para continuar!');
    return;
  }

  let acertos = 0;
  let feedback = 'Resultado da Prova:\n\n';

  for (let questao in GABARITO) {
    if (respostas[questao] === GABARITO[questao]) {
      acertos++;
      feedback += `✅ Questão ${questao.replace('q', '')}: Correto!\n`;
    } else {
      feedback += `❌ Questão ${questao.replace('q', '')}: Incorreto.\n`;
    }
  }

  feedback += `\nTotal: ${acertos}/4 acertos`;
  alert(feedback);

  if (acertos === 4) {
    await salvarMotoristaComProva(nome, rg, telefone, placa, respostas);

    document.getElementById('nome').value = nome;
    document.getElementById('placa').value = placa;
    document.getElementById('telefone').value = telefone;

    irParaSelecaoCarregamento();
  } else {
    alert('⚠️ Você precisa acertar TODAS as 4 questões para avançar. Tente novamente!');
  }
}

async function salvarMotoristaComProva(nome, rg, telefone, placa, respostas) {
  const aceiteVideo = document.getElementById('aceite-video').checked;

  try {
    await fetch(`${WORKER_URL}/api/salvar-motorista`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpf: cpfAtual,
        nome: nome,
        rg: rg,
        telefone: telefone,
        placa: placa,
        aceite_video: aceiteVideo,
        aceite_ppae: true,
        aceite_fob: true,
        aceite_lgpd: true,
        data_aceite: new Date().toISOString(),
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
// CONTROLE DO CAMPO DE PALETES E EXIBIÇÕES
// ============================================

function mostrarQuantidadePaletes() {
  const container = document.getElementById('quantidade-paletes-container');
  if (container) container.style.display = 'block';
}

function ocultarQuantidadePaletes() {
  const container = document.getElementById('quantidade-paletes-container');
  if (container) container.style.display = 'none';

  const inputQtd = document.getElementById('quantidade-paletes');
  if (inputQtd) inputQtd.value = '';
}

// ============================================
// ETAPA 3A: INSPEÇÃO FOB E LÓGICA DE VEÍCULOS
// ============================================

function atualizarCamposPorTipoVeiculo() {
  const tipoVeiculo = document.querySelector('input[name="tipo_veiculo"]:checked')?.value;
  
  const containerTampaSilo = document.getElementById('container-tampa-silo');
  const selectTampaSilo = document.getElementById('tampa_silo');
  
  const secaoPaletes = document.getElementById('secao-paletes');
  const radiosPaletes = document.querySelectorAll('input[name="paletes_opcao"]');

  if (tipoVeiculo === 'CARGA_SECA') {
    if (containerTampaSilo) containerTampaSilo.style.display = 'none';
    if (selectTampaSilo) selectTampaSilo.value = '';

    if (secaoPaletes) secaoPaletes.style.display = 'block';
    radiosPaletes.forEach(radio => radio.checked = false);
    ocultarQuantidadePaletes();

  } else if (tipoVeiculo === 'CARRETA_SILO') {
    if (containerTampaSilo) containerTampaSilo.style.display = 'flex';
    if (selectTampaSilo) selectTampaSilo.value = '';

    if (secaoPaletes) secaoPaletes.style.display = 'none';
    radiosPaletes.forEach(radio => radio.checked = false);
    ocultarQuantidadePaletes();
  }
}

document.addEventListener('change', function(e) {
  if (e.target && e.target.name === 'tipo_veiculo') {
    atualizarCamposPorTipoVeiculo();
  }
});

async function gerarJSONeToken() {
  let placaDigitada = document.getElementById('placa').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let pedidoDigitado = document.getElementById('pedido').value.trim();
  let eixosDigitados = document.getElementById('eixos').value.trim();
  let telefoneDigitado = document.getElementById('telefone').value.trim();

  const tipoVeiculo = document.querySelector('input[name="tipo_veiculo"]:checked')?.value;

  if (!tipoVeiculo) {
    alert('⚠️ Por favor, selecione qual é o seu tipo de veículo (Carga Seca ou Carreta Silo)!');
    return;
  }

  if (!validarTelefone(telefoneDigitado)) {
    alert('❌ Telefone/WhatsApp inválido! Digite um número válido com DDD (Ex: 11999999999).');
    return;
  }

  if (!validarPlaca(placaDigitada)) {
    alert('❌ Placa do veículo inválida! Digite no formato ABC1234 ou ABC1A34.');
    return;
  }

  if (!validarPedido(pedidoDigitado)) {
    alert('❌ Número de Pedido inválido! O pedido deve conter de 7 a 8 dígitos numéricos.');
    return;
  }

  if (!validarEixos(eixosDigitados)) {
    alert('❌ Quantidade de eixos inválida! Informe apenas 1 dígito numérico (ex: de 1 a 9).');
    return;
  }

  let paletesOpcao = document.querySelector('input[name="paletes_opcao"]:checked')?.value;
  let quantidadePaletes = '';

  if (tipoVeiculo === 'CARRETA_SILO') {
    paletesOpcao = 'NA';
  } else if (paletesOpcao === 'SIM') {
    quantidadePaletes = document.getElementById('quantidade-paletes').value.trim();
    if (!quantidadePaletes) {
      alert('⚠️ Se selecionou SIM em paletes, informe a quantidade!');
      return;
    }
  }

  let valTampaSilo = document.getElementById('tampa_silo').value;
  if (tipoVeiculo === 'CARGA_SECA') {
    valTampaSilo = 'NA';
  }

  const inspecao = {
    nome: document.getElementById('nome').value.trim(),
    cnh: document.getElementById('cnh').value.trim(),
    telefone: telefoneDigitado,
    placa: placaDigitada,
    pedido: pedidoDigitado,
    eixos: eixosDigitados,
    tipo_veiculo: tipoVeiculo,
    sinalizacao: document.getElementById('sinalizacao').value,
    pneus: document.getElementById('pneus').value,
    carroceria: document.getElementById('carroceria').value,
    cinto: document.getElementById('cinto').value,
    farois: document.getElementById('farois').value,
    alarme_re: document.getElementById('alarme_re').value,
    vazamentos: document.getElementById('vazamentos').value,
    calcos: document.getElementById('calcos').value,
    tampa_silo: valTampaSilo,
    epi_capacete: document.getElementById('epi_capacete').value,
    epi_colete: document.getElementById('epi_colete').value,
    epi_oculos: document.getElementById('epi_oculos').value,
    epi_botina: document.getElementById('epi_botina').value,
    epi_luvas: document.getElementById('epi_luvas').value,
    paletes_opcao: paletesOpcao || 'NA',
    paletes_quantidade: quantidadePaletes || ''
  };

  if (!inspecao.nome || !inspecao.cnh || !inspecao.placa || !inspecao.pedido || !inspecao.eixos ||
      !inspecao.sinalizacao || !inspecao.pneus || !inspecao.carroceria || !inspecao.cinto || 
      !inspecao.farois || !inspecao.alarme_re || !inspecao.vazamentos || !inspecao.calcos || 
      !inspecao.tampa_silo || !inspecao.epi_capacete || !inspecao.epi_colete || 
      !inspecao.epi_oculos || !inspecao.epi_botina || !inspecao.epi_luvas) {
    alert('⚠️ Preencha todos os campos obrigatórios da inspeção e EPIs!');
    return;
  }

  if (tipoVeiculo === 'CARGA_SECA' && !paletesOpcao) {
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
    } else {
      alert('⚠️ Erro ao salvar inspeção: ' + (resultado.erro || 'Falha no servidor.'));
    }
  } catch (erro) {
    console.error('Erro ao salvar inspeção:', erro);
    alert('⚠️ Erro de conexão ao salvar inspeção!');
  }
}

// ============================================
// ETAPA 3B: INSPEÇÃO CIF / FCA (32 ITENS)
// ============================================

async function salvarInspecaoCIF() {
  const tipoChecklist = document.getElementById('cif-tipo-checklist').value;
  const segmento = document.getElementById('cif-segmento').value;

  if (!tipoChecklist || !segmento) {
    alert('⚠️ Por favor, selecione o Tipo de Checklist CIP e o Segmento!');
    return;
  }

  const inspecaoDados = {
    nome: (dadosMotoristaAtual.nome || document.getElementById('nome').value).trim(),
    cnh: (dadosMotoristaAtual.cnh || document.getElementById('cnh').value).trim(),
    placa: (dadosMotoristaAtual.placa || document.getElementById('placa').value).toUpperCase().replace(/[^A-Z0-9]/g, ''),
    telefone: (dadosMotoristaAtual.telefone || document.getElementById('telefone').value).trim(),
    pedido: (document.getElementById('pedido')?.value || '').trim(),
    eixos: (document.getElementById('eixos')?.value || '').trim(),
    data: new Date().toLocaleDateString('pt-BR'),
    tipo_checklist: tipoChecklist,
    segmento: segmento,
    observacoes: document.getElementById('cif-observacoes').value.trim()
  };

  // Coleta dinamicamente todos os 32 itens
  for (let i = 1; i <= 32; i++) {
    const el = document.getElementById(`cif-item-${i}`);
    if (el) {
      inspecaoDados[`item_${i}`] = el.value;
      if (!el.value) {
        alert(`⚠️ Por favor, selecione uma resposta para o Item ${i}!`);
        return;
      }
    }
  }

  try {
    const response = await fetch(`${WORKER_URL}/api/salvar-inspecao-cif`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpf: cpfAtual,
        inspecao_dados: inspecaoDados
      })
    });

    const resultado = await response.json();

    if (resultado.sucesso) {
      document.getElementById('form-inspecao-cif').reset();
      document.getElementById('token-gerado').innerText = resultado.id_inspecao;
      irParaSucesso();
    } else {
      alert('❌ Erro ao salvar inspeção CIF: ' + (resultado.erro || 'Erro no servidor'));
    }
  } catch (erro) {
    console.error('Erro:', erro);
    alert('⚠️ Erro de conexão ao salvar inspeção CIF!');
  }
}

// ============================================
// NAVEGAÇÃO E RESET
// ============================================

function copiarToken() {
  const token = document.getElementById('token-gerado').innerText;
  navigator.clipboard.writeText(token).then(() => {
    alert('📋 Código copiado com sucesso!');
  });
}

function voltarPaginaAnterior() {
  const etapaCarregamentoVisivel = !document.getElementById('step-tipo-carregamento').classList.contains('hidden');
  const etapaInspecaoVisivel = !document.getElementById('step-inspecao').classList.contains('hidden');
  const etapaInspecaoCIFVisivel = !document.getElementById('step-inspecao-cif').classList.contains('hidden');

  if (etapaInspecaoVisivel || etapaInspecaoCIFVisivel) {
    irParaSelecaoCarregamento();
  } else if (etapaCarregamentoVisivel && ehPrimeiraVez) {
    irParaIntegracao();
  } else {
    irParaCPF();
  }
}

function irParaCPF() {
  ocultarTodas();

  const inputCPF = document.getElementById('input-cpf');
  if (inputCPF) inputCPF.value = '';

  const formProva = document.getElementById('form-prova');
  if (formProva) formProva.reset();

  const formInspecao = document.getElementById('form-inspecao');
  if (formInspecao) formInspecao.reset();

  const formCIF = document.getElementById('form-inspecao-cif');
  if (formCIF) formCIF.reset();

  ocultarQuantidadePaletes();
  alternarBloqueioProva();

  cpfAtual = '';
  dadosMotoristaAtual = {};
  ehPrimeiraVez = false;
  tipoCarregamentoSelecionado = '';

  document.getElementById('step-cpf').classList.remove('hidden');
}

function irParaIntegracao() {
  ocultarTodas();

  const formInspecao = document.getElementById('form-inspecao');
  if (formInspecao) formInspecao.reset();

  ocultarQuantidadePaletes();
  alternarBloqueioProva();

  document.getElementById('step-integracao').classList.remove('hidden');
}

function irParaInspecao() {
  ocultarTodas();
  document.getElementById('step-inspecao').classList.remove('hidden');
}

function irParaInspecaoCIF() {
  ocultarTodas();
  
  // Preenche dados do motorista veterano se existirem
  if (dadosMotoristaAtual) {
    if (dadosMotoristaAtual.nome) document.getElementById('cif-nome').value = dadosMotoristaAtual.nome;
    if (dadosMotoristaAtual.cnh) document.getElementById('cif-cnh').value = dadosMotoristaAtual.cnh;
    if (dadosMotoristaAtual.telefone) document.getElementById('cif-telefone').value = dadosMotoristaAtual.telefone;
    if (dadosMotoristaAtual.placa) document.getElementById('cif-placa').value = dadosMotoristaAtual.placa;
  }

  document.getElementById('step-inspecao-cif').classList.remove('hidden');
}

function irParaSucesso() {
  ocultarTodas();
  document.getElementById('step-sucesso').classList.remove('hidden');
}

function ocultarTodas() {
  document.getElementById('step-cpf').classList.add('hidden');
  document.getElementById('step-integracao').classList.add('hidden');
  
  const stepCarregamento = document.getElementById('step-tipo-carregamento');
  if (stepCarregamento) stepCarregamento.classList.add('hidden');

  document.getElementById('step-inspecao').classList.add('hidden');
  
  const stepCIF = document.getElementById('step-inspecao-cif');
  if (stepCIF) stepCIF.classList.add('hidden');

  document.getElementById('step-sucesso').classList.add('hidden');
  
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
}

document.addEventListener('DOMContentLoaded', irParaCPF);
