// ==UserScript==
// @name         SELS ASSISTANT 6.1
// @namespace    http://tampermonkey.net/
// @version      6.1
// @description  Demonstrativo de Saldo em lote — le os 3 relatorios do APMS (Saldo, Vendas Faturadas, Nota de Garantia), cruza por colportor e gera o demonstrativo individual ou de toda a equipe.
// @author       SELS UCOB
// @match        https://apms.sdasystems.org/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @require      https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
// ==/UserScript==

(function () {
    'use strict';

    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const LOGO_SELS = "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";

// ===============================================================
// MOTOR DE ANÁLISE (validado contra relatórios reais da equipe 9389:
// 32 colportores, Francisco Pinheiro consignado 9.701,40 / dízimo
// 233,54 — idêntico à captura manual pelo Pedido de Fatura)
// ===============================================================
    // ---------- utilitários ----------
    function parseValorPtBr(str) {
        if (str === null || str === undefined) return 0;
        if (typeof str === 'number') return str;
        const limpo = String(str).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
        const n = parseFloat(limpo);
        return isNaN(n) ? 0 : n;
    }

    function fmtBr(n) {
        return (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function round2(n) { return Math.round(n * 100) / 100; }

    function normalizar(s) {
        return (s || "")
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toUpperCase().replace(/\s+/g, ' ').trim();
    }

    // ---------- isenção de dízimo ----------
    // Regra de negócio: MINIATURA = brinde, nunca paga dízimo (qualquer linha).
    // "contém" e não "igual" para que combos herdem a isenção do material base.
    const FAMILIA_ISENTA = "MINIATURA";
    const ISENTOS_AVULSOS = [
        "Bloco de Contrato de Compra",
        "CARTAZ PROATIVE",
        "Colecao Comentario Biblico Andrews",
        "FOLDER PROATIVE",
        "Histórias do Nosso Amiguinho",
        "Jogo da Memória - Oque Vou Ser Quando Crescer",
        "LIVRO ILUSTRADO N.A. - O QUE VOU SER QUANDO CRESCER",
        "Tabuada Turma Nosso Amiguinho"
    ].map(normalizar);

    function produtoEIsentoDeDizimo(nomeProduto) {
        const n = normalizar(nomeProduto);
        if (!n) return false;
        if (n.includes(FAMILIA_ISENTA)) return true;
        return ISENTOS_AVULSOS.some(a => n.includes(a));
    }

    // ---------- padrões ----------
    const NUM = String.raw`-?\d{1,3}(?:\.\d{3})*,\d{2}`;
    const RUIDO = /^(União Centro|SELS UCOB$|Saldo dos Colportores|Vendas Faturadas|Nota de Garantia|Equipe\s*-|Campanha\s*-|Líder|Usuário|Página|[\w.+-]+@|Colportor:$)/i;

    // ===============================================================
    // 1) SALDO DOS COLPORTORES
    // Estrutura: Nome + 9 valores + percentual. O Saldo é o 9º valor
    // (penúltimo antes do %). Nomes longos QUEBRAM em duas linhas —
    // a continuação vem na linha seguinte, sem números.
    // ===============================================================
    function parseSaldo(linhas) {
        const re = new RegExp(`^(.+?)\\s+((?:${NUM}\\s+){8})(${NUM})\\s+(-?[\\d.]+,\\d{2})%$`);
        const res = {};
        let ultimo = null;

        linhas.forEach(l => {
            l = l.trim();
            if (RUIDO.test(l) || /^Nome Compra/i.test(l) || /^Quantidade de Colportores/i.test(l)) {
                ultimo = null; return;
            }
            const m = l.match(re);
            if (m) {
                const nome = m[1].trim();
                res[nome] = { nome: nome, saldo: parseValorPtBr(m[3]) };
                ultimo = nome;
            } else if (ultimo && l && !/\d/.test(l)) {
                // continuação de nome quebrado em duas linhas
                const novo = (ultimo + ' ' + l).replace(/\s+/g, ' ').trim();
                res[novo] = res[ultimo];
                res[novo].nome = novo;
                delete res[ultimo];
                ultimo = null;
            }
        });
        return res;
    }

    // ===============================================================
    // 2) VENDAS FATURADAS POR COLPORTOR (= consignado)
    // "Qtd. a Faturar" e "Vlr. a Faturar" (2 últimas colunas) são o
    // material ainda em consignado. Dízimo é calculado por item.
    // ===============================================================
    function parseConsignado(linhas) {
        const reItem = new RegExp(`^(.+?)\\s+(\\d+)\\s+(${NUM})\\s+(\\d+)\\s+(${NUM})\\s+(\\d+)\\s+(${NUM})$`);
        const res = {};
        let atual = null, secao = null;

        linhas.forEach(l => {
            l = l.trim();
            const mCol = l.match(/^Colportor:\s*(.+)$/i);
            if (mCol) {
                atual = mCol[1].replace(/\s+/g, ' ').trim();
                if (!res[atual]) res[atual] = { nome: atual, itens: [], total: 0, dizimo: 0 };
                secao = 'produto';
                return;
            }
            if (/^Assinaturas\s/i.test(l)) { secao = 'assinatura'; return; }
            if (/^Produto\s/i.test(l)) { secao = 'produto'; return; }
            if (!atual || RUIDO.test(l)) return;

            const m = l.match(reItem);
            if (!m || secao !== 'produto') return;

            const nome = m[1].trim();
            if (/^total(\s+geral)?$/i.test(nome)) return;

            const qtdAFaturar = parseInt(m[6], 10);
            const vlrAFaturar = parseValorPtBr(m[7]);
            if (qtdAFaturar === 0 && vlrAFaturar === 0) return; // nada em consignado

            const isento = produtoEIsentoDeDizimo(nome);
            const dizimo = isento ? 0 : round2(vlrAFaturar * 0.10);

            res[atual].itens.push({
                produto: nome, qtd: qtdAFaturar, valor: vlrAFaturar,
                dizimo: dizimo, isento: isento
            });
            res[atual].total = round2(res[atual].total + vlrAFaturar);
            res[atual].dizimo = round2(res[atual].dizimo + dizimo);
        });
        return res;
    }

    // ===============================================================
    // 3) NOTA DE GARANTIA (= NGs pendentes)
    // Só "Entregue" está pendente. Demais status são ignorados.
    // Normal vs Registrada: se "Valor" (última coluna, com frete) for
    // maior que "Valor Total" (sem frete), a diferença é o frete →
    // é Registrada. Se forem iguais → Normal.
    // Dízimo = 10% do "Valor Total" (pré-frete).
    // ===============================================================
    const STATUS_NG = ['Integrado CPB', 'Inutilizado', 'Entregue', 'Cancelado', 'Pendente', 'Aberto'];

    function parseNgs(linhas) {
        const re = new RegExp(`^(\\d{10,})\\s+(.+?)\\s+(\\d+)\\s+(${NUM})\\s+(${NUM})\\s+(${NUM})$`);
        const res = {};
        const statusDesconhecidos = new Set();

        linhas.forEach(l => {
            l = l.trim();
            if (RUIDO.test(l) || /^Número Status/i.test(l) || /^Quantidade de NGs/i.test(l)) return;
            const m = l.match(re);
            if (!m) return;

            const numero = m[1];
            const meio = m[2].trim(); // "<Status> <Nome do Colportor>"
            let status = null, nome = null;
            for (const s of STATUS_NG) {
                if (meio.toUpperCase().startsWith(s.toUpperCase())) {
                    status = s;
                    nome = meio.slice(s.length).replace(/\s+/g, ' ').trim();
                    break;
                }
            }
            if (!status) { statusDesconhecidos.add(meio.split(' ')[0]); return; }
            if (status !== 'Entregue') return; // só pendentes interessam

            const qtd = parseInt(m[3], 10);
            const valorTotal = parseValorPtBr(m[4]); // sem frete
            const valorComFrete = parseValorPtBr(m[6]);
            const frete = round2(valorComFrete - valorTotal);
            const registrada = Math.abs(frete) > 0.001;
            const dizimo = round2(valorTotal * 0.10);

            if (!res[nome]) {
                res[nome] = {
                    nome: nome,
                    normal: { itens: [], valor: 0, dizimo: 0, frete: 0 },
                    registrada: { itens: [], valor: 0, dizimo: 0, frete: 0 }
                };
            }
            const alvo = registrada ? res[nome].registrada : res[nome].normal;
            alvo.itens.push({
                ng: numero, qtd: qtd, valor: valorTotal,
                dizimo: dizimo, frete: registrada ? frete : 0
            });
            alvo.valor = round2(alvo.valor + valorTotal);
            alvo.dizimo = round2(alvo.dizimo + dizimo);
            if (registrada) alvo.frete = round2(alvo.frete + frete);
        });

        return { ngs: res, statusDesconhecidos: Array.from(statusDesconhecidos) };
    }

    // ===============================================================
    // CRUZAMENTO + CÁLCULO DO LUCRO REAL
    //
    // LucroReal = SaldoAPMS (sinal real, não forçado)
    //           + |MaterialConsignado| + |DízimoConsignado|
    //           + |NgNormal| + |DízimoNgNormal|
    //           + |NgRegistrada| + |DízimoNgRegistrada|
    //           + |FreteNGs|
    //
    // Lógica: material consignado e NG pendente já foram debitados do
    // colportor no razão, mas ainda não foram efetivados — somar
    // "desfaz" esse débito temporário. O frete das NGs registradas
    // segue a mesma lógica (também já foi cobrado).
    // ===============================================================
    function cruzarECalcular(saldos, consignados, ngsPorNome) {
        const idxC = {}; Object.keys(consignados).forEach(k => idxC[normalizar(k)] = consignados[k]);
        const idxN = {}; Object.keys(ngsPorNome).forEach(k => idxN[normalizar(k)] = ngsPorNome[k]);

        const VAZIO_NG = { itens: [], valor: 0, dizimo: 0, frete: 0 };
        const resultado = [];

        Object.keys(saldos).forEach(nome => {
            const s = saldos[nome];
            const c = idxC[normalizar(nome)] || null;
            const n = idxN[normalizar(nome)] || null;

            const materialConsignado = c ? c.total : 0;
            const dizimoConsignado = c ? c.dizimo : 0;
            const ngN = n ? n.normal : VAZIO_NG;
            const ngR = n ? n.registrada : VAZIO_NG;
            const freteTotal = round2(ngN.frete + ngR.frete);

            const lucroReal = round2(
                s.saldo
                + Math.abs(materialConsignado) + Math.abs(dizimoConsignado)
                + Math.abs(ngN.valor) + Math.abs(ngN.dizimo)
                + Math.abs(ngR.valor) + Math.abs(ngR.dizimo)
                + Math.abs(freteTotal)
            );

            resultado.push({
                nome: nome,
                saldoAPMS: s.saldo,
                materialConsignado: materialConsignado,
                dizimoConsignado: dizimoConsignado,
                ngNormal: ngN.valor, dizimoNgNormal: ngN.dizimo,
                ngRegistrada: ngR.valor, dizimoNgRegistrada: ngR.dizimo,
                freteTotal: freteTotal,
                dizimoConsolidado: round2(dizimoConsignado + ngN.dizimo + ngR.dizimo),
                lucroReal: lucroReal,
                itensConsignado: c ? c.itens : [],
                itensNgNormal: ngN.itens,
                itensNgRegistrada: ngR.itens,
                temConsignado: !!c, temNg: !!n
            });
        });

        // órfãos: existem em consignado/NG mas não no relatório de Saldo
        const nomesSaldo = new Set(Object.keys(saldos).map(normalizar));
        const orfaos = []
            .concat(Object.keys(idxC).filter(k => !nomesSaldo.has(k)))
            .concat(Object.keys(idxN).filter(k => !nomesSaldo.has(k)));

        resultado.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        return { resultado: resultado, orfaos: Array.from(new Set(orfaos)) };
    }

    // ===============================================================
    // EXTRAÇÃO DE LINHAS DO PDF (posição espacial real)
    // O APMS renderiza os relatórios como PDF; o texto vem em caixas
    // soltas. Agrupamos por Y (mesma linha visual) e ordenamos por X
    // (esquerda→direita) para reconstruir a linha como ela é vista.
    // ===============================================================
    async function extrairLinhasDoPDF() {
        const resposta = await fetch(location.href, { credentials: 'include' });
        if (!resposta.ok) {
            throw new Error(`Falha ao baixar o PDF (status ${resposta.status}). ` +
                            `A sessão pode ter expirado — atualize a página (F5) e tente de novo.`);
        }
        const buffer = await resposta.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

        const linhas = [];
        for (let p = 1; p <= pdf.numPages; p++) {
            const pagina = await pdf.getPage(p);
            const conteudo = await pagina.getTextContent();
            const itens = conteudo.items
                .map(i => ({ texto: i.str, x: i.transform[4], y: i.transform[5] }))
                .filter(i => i.texto.trim() !== '');

            const grupos = {};
            const TOL = 2;
            itens.forEach(item => {
                let chave = null;
                for (const k in grupos) {
                    if (Math.abs(parseFloat(k) - item.y) <= TOL) { chave = k; break; }
                }
                if (chave) grupos[chave].push(item);
                else grupos[item.y] = [item];
            });

            Object.keys(grupos)
                .sort((a, b) => parseFloat(b) - parseFloat(a))
                .forEach(k => {
                    const texto = grupos[k].sort((a, b) => a.x - b.x)
                        .map(i => i.texto).join(' ').replace(/\s+/g, ' ').trim();
                    if (texto) linhas.push(texto);
                });
        }
        return linhas;
    }

    // Identifica qual dos 3 relatórios está aberto, pelo título
    function detectarRelatorio(linhas) {
        const cabecalho = linhas.slice(0, 12).join(' | ').toUpperCase();
        if (cabecalho.includes('SALDO DOS COLPORTORES')) return 'saldo';
        if (cabecalho.includes('VENDAS FATURADAS POR COLPORTOR')) return 'consignado';
        if (cabecalho.includes('NOTA DE GARANTIA')) return 'ngs';
        return null;
    }

    const ROTULOS = {
        saldo: 'Saldo dos Colportores',
        consignado: 'Vendas Faturadas (Consignado)',
        ngs: 'Nota de Garantia (NGs)'
    };

    // ===============================================================
    // PAINEL FLUTUANTE
    // ===============================================================
    const painel = document.createElement('div');
    painel.id = 'sels-painel';
    painel.innerHTML = `
      <style>
        #sels-painel { position: fixed; bottom: 20px; right: 20px; z-index: 999999;
          width: 320px; background: #fff; border: 2px solid #1a365d; border-radius: 10px;
          box-shadow: 0 4px 16px rgba(15,35,64,.25); font-family: Arial, sans-serif;
          font-size: 13px; color: #2d2d2d; overflow: hidden; }
        #sels-painel .topo { background: linear-gradient(135deg,#1a365d,#0f2340); color:#fff;
          padding: 9px 12px; display:flex; align-items:center; gap:8px; }
        #sels-painel .topo b { flex:1; font-size:13px; }
        #sels-painel .topo span { cursor:pointer; opacity:.85; font-size:14px; }
        #sels-painel .topo span:hover { opacity:1; }
        #sels-painel .corpo { padding: 12px; }
        #sels-painel button { width:100%; padding:8px; margin-bottom:6px; border:none;
          border-radius:5px; cursor:pointer; font-size:12.5px; font-weight:bold; color:#fff;
          background:#2b6cb0; }
        #sels-painel button:disabled { background:#a0aec0; cursor:not-allowed; }
        #sels-painel button.verde { background:#2f7d4f; }
        #sels-painel button.cinza { background:#718096; font-weight:normal; }
        #sels-painel button.vermelho { background:#c0392b; font-weight:normal; font-size:11px; }
        #sels-painel .check { font-size:11.5px; margin:3px 0; }
        #sels-painel .ok { color:#2f7d4f; font-weight:bold; }
        #sels-painel .pend { color:#a0aec0; }
        #sels-painel .aviso { background:#fdf6e3; border-left:3px solid #d9a441;
          padding:6px 8px; font-size:11px; margin-bottom:8px; border-radius:3px; }
        #sels-painel .avancado { display:none; border-top:1px solid #eee; margin-top:8px; padding-top:8px; }
        #sels-painel.minimizado .corpo { display:none; }
      </style>
      <div class="topo">
        <b>🚀 SELS ASSISTANT 6.1</b>
        <span id="sels-refresh" title="Procurar relatório de novo">⟳</span>
        <span id="sels-gear" title="Ferramentas avançadas">⚙</span>
        <span id="sels-min" title="Minimizar">—</span>
      </div>
      <div class="corpo">
        <div id="sels-detectado" class="aviso">Abra um dos 3 relatórios do APMS.</div>
        <button id="sels-capturar" disabled>Capturar relatório</button>
        <div class="check" id="ck-saldo">○ Saldo dos Colportores</div>
        <div class="check" id="ck-consignado">○ Vendas Faturadas (Consignado)</div>
        <div class="check" id="ck-ngs">○ Nota de Garantia (NGs)</div>
        <button id="sels-analisar" class="verde" style="margin-top:10px" disabled>📊 Analisar e conferir</button>
        <div class="avancado" id="sels-avancado">
          <button id="sels-debug" class="cinza">🔍 Ver linhas cruas no console</button>
          <button id="sels-limpar" class="vermelho">Limpar dados capturados</button>
        </div>
      </div>`;
    document.body.appendChild(painel);

    document.getElementById('sels-min').onclick = () => painel.classList.toggle('minimizado');
    document.getElementById('sels-gear').onclick = () => {
        const a = document.getElementById('sels-avancado');
        a.style.display = a.style.display === 'block' ? 'none' : 'block';
    };

    function lidos() {
        return {
            saldo: JSON.parse(GM_getValue('linhas_saldo', 'null')),
            consignado: JSON.parse(GM_getValue('linhas_consignado', 'null')),
            ngs: JSON.parse(GM_getValue('linhas_ngs', 'null'))
        };
    }

    function atualizarPainel() {
        const L = lidos();
        ['saldo', 'consignado', 'ngs'].forEach(k => {
            const el = document.getElementById('ck-' + k);
            if (L[k]) { el.className = 'check ok'; el.textContent = '✓ ' + ROTULOS[k]; }
            else { el.className = 'check pend'; el.textContent = '○ ' + ROTULOS[k]; }
        });
        // Saldo é obrigatório: é a lista mestra de colportores da equipe.
        // Consignado e NGs são opcionais (equipe pode não ter nenhum).
        document.getElementById('sels-analisar').disabled = !L.saldo;
    }

    let tipoDetectado = null;
    // Faz UMA tentativa de identificar o relatório aberto na aba atual.
    // Retorna o tipo ('saldo'/'consignado'/'ngs') ou null.
    async function tentarDetectarUmaVez() {
        try {
            const r = await fetch(location.href, { credentials: 'include', method: 'GET' });
            const ct = (r.headers.get('content-type') || '');
            if (!ct.includes('pdf')) return null;
            const buffer = await r.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
            const c = await (await pdf.getPage(1)).getTextContent();
            const topo = c.items.map(i => i.str).join(' ').toUpperCase();
            return topo.includes('SALDO DOS COLPORTORES') ? 'saldo'
                 : topo.includes('VENDAS FATURADAS') ? 'consignado'
                 : topo.includes('NOTA DE GARANTIA') ? 'ngs' : null;
        } catch (e) { return null; }
    }

    // Tenta detectar VÁRIAS vezes com intervalo crescente. Motivo: ao gerar
    // o relatório, o APMS às vezes ainda não terminou de servir o PDF quando
    // o script roda — uma única tentativa falha e o botão nunca habilita.
    // Aqui insistimos por ~15s antes de desistir, sem precisar recarregar.
    let deteccaoEmAndamento = false;
    async function detectarPaginaAtual(silencioso) {
        if (deteccaoEmAndamento) return;
        deteccaoEmAndamento = true;

        const aviso = document.getElementById('sels-detectado');
        const btn = document.getElementById('sels-capturar');
        const esperas = [0, 800, 1500, 2500, 4000, 6000]; // ms entre tentativas (~15s total)

        for (let i = 0; i < esperas.length; i++) {
            if (esperas[i]) await new Promise(r => setTimeout(r, esperas[i]));
            if (!silencioso && i > 0) aviso.textContent = `Procurando relatório… (tentativa ${i + 1})`;

            tipoDetectado = await tentarDetectarUmaVez();
            if (tipoDetectado) {
                aviso.innerHTML = `Detectado: <b>${ROTULOS[tipoDetectado]}</b>`;
                btn.disabled = false;
                btn.textContent = 'Capturar: ' + ROTULOS[tipoDetectado];
                deteccaoEmAndamento = false;
                return;
            }
        }

        // Esgotou as tentativas
        aviso.innerHTML = 'Não encontrei um relatório nesta aba. ' +
            '<a href="#" id="sels-retry" style="color:#2b6cb0">Tentar de novo</a>';
        btn.disabled = true;
        btn.textContent = 'Capturar relatório';
        const retry = document.getElementById('sels-retry');
        if (retry) retry.onclick = (ev) => { ev.preventDefault(); detectarPaginaAtual(); };
        deteccaoEmAndamento = false;
    }

    document.getElementById('sels-capturar').onclick = async () => {
        const btn = document.getElementById('sels-capturar');
        const txt = btn.textContent;
        btn.disabled = true; btn.textContent = '⏳ Lendo PDF...';
        try {
            const linhas = await extrairLinhasDoPDF();
            const tipo = detectarRelatorio(linhas);
            if (!tipo) throw new Error('Não reconheci este relatório. Abra Saldo dos Colportores, Vendas Faturadas por Colportor ou Nota de Garantia.');
            GM_setValue('linhas_' + tipo, JSON.stringify(linhas));

            let resumo = '';
            if (tipo === 'saldo') {
                const s = parseSaldo(linhas);
                resumo = `${Object.keys(s).length} colportores lidos.`;
            } else if (tipo === 'consignado') {
                const c = parseConsignado(linhas);
                resumo = `${Object.keys(c).length} colportores com material consignado.`;
            } else {
                const { ngs, statusDesconhecidos } = parseNgs(linhas);
                resumo = `${Object.keys(ngs).length} colportores com NG pendente (status "Entregue").`;
                if (statusDesconhecidos.length) resumo += `\n\n⚠ Status não reconhecidos (ignorados): ${statusDesconhecidos.join(', ')}`;
            }
            alert(`✅ ${ROTULOS[tipo]} capturado!\n\n${resumo}`);
            atualizarPainel();
        } catch (e) {
            console.error(e);
            alert('❌ ' + e.message);
        } finally {
            btn.disabled = false; btn.textContent = txt;
        }
    };

    document.getElementById('sels-debug').onclick = () => {
        const L = lidos();
        console.log('=== LINHAS CRUAS CAPTURADAS ===', L);
        alert('Linhas impressas no Console (F12).');
    };

    document.getElementById('sels-limpar').onclick = () => {
        if (!confirm('Apagar os 3 relatórios capturados?')) return;
        GM_deleteValue('linhas_saldo'); GM_deleteValue('linhas_consignado'); GM_deleteValue('linhas_ngs');
        atualizarPainel();
        alert('Dados limpos.');
    };

    // ===============================================================
    // TELA DE CONFERÊNCIA
    // Mostra todos os colportores calculados ANTES de oficializar.
    // Aqui é onde entra a supervisão humana: o "copiloto" não gera
    // nada sem você bater o olho primeiro.
    // ===============================================================
    function analisar() {
        const L = lidos();
        const saldos = parseSaldo(L.saldo);
        const consig = L.consignado ? parseConsignado(L.consignado) : {};
        const ngsRes = L.ngs ? parseNgs(L.ngs) : { ngs: {}, statusDesconhecidos: [] };
        const { resultado, orfaos } = cruzarECalcular(saldos, consig, ngsRes.ngs);
        return { resultado, orfaos, statusDesconhecidos: ngsRes.statusDesconhecidos };
    }

    function abrirConferencia() {
        let dados;
        try { dados = analisar(); }
        catch (e) { console.error(e); alert('❌ Erro na análise: ' + e.message); return; }

        const { resultado, orfaos, statusDesconhecidos } = dados;
        const L = lidos();

        const avisos = [];
        if (!L.consignado) avisos.push('Relatório de <b>Vendas Faturadas</b> não capturado — consignado será considerado zero para todos.');
        if (!L.ngs) avisos.push('Relatório de <b>Nota de Garantia</b> não capturado — NGs serão consideradas zero para todos.');
        if (orfaos.length) avisos.push('Aparecem no consignado/NG mas <b>não</b> no relatório de Saldo: ' + orfaos.join(', '));
        if (statusDesconhecidos.length) avisos.push('Status de NG não reconhecidos (ignorados): ' + statusDesconhecidos.join(', '));

        const overlay = document.createElement('div');
        overlay.id = 'sels-conf';
        overlay.innerHTML = `
          <style>
            #sels-conf { position:fixed; inset:0; z-index:1000000; background:rgba(15,35,64,.55);
              display:flex; align-items:center; justify-content:center; font-family:Arial, sans-serif; }
            #sels-conf .cx { background:#fff; width:min(1050px,94vw); max-height:90vh; border-radius:12px;
              display:flex; flex-direction:column; overflow:hidden; }
            #sels-conf .hd { background:linear-gradient(135deg,#1a365d,#0f2340); color:#fff; padding:14px 18px;
              display:flex; align-items:center; gap:12px; }
            #sels-conf .hd h2 { margin:0; font-size:17px; flex:1; }
            #sels-conf .hd .x { cursor:pointer; font-size:20px; }
            #sels-conf .bd { padding:14px 18px; overflow:auto; }
            #sels-conf table { width:100%; border-collapse:collapse; font-size:12.5px; }
            #sels-conf th { background:#f7e9cf; color:#0f2340; text-transform:uppercase; font-size:10.5px;
              padding:7px 6px; position:sticky; top:0; }
            #sels-conf td { padding:6px; border-bottom:1px solid #eee; }
            #sels-conf td.n { text-align:right; font-variant-numeric:tabular-nums; }
            #sels-conf tr:hover { background:#faf7ee; }
            #sels-conf .neg { color:#c0392b; } #sels-conf .pos { color:#2f7d4f; }
            #sels-conf .tag { font-size:9.5px; background:#eee; border-radius:8px; padding:1px 6px; color:#666; }
            #sels-conf .ft { padding:12px 18px; border-top:1px solid #eee; display:flex; gap:10px; align-items:center; }
            #sels-conf .ft button { padding:9px 16px; border:none; border-radius:6px; cursor:pointer;
              font-weight:bold; font-size:13px; }
            #sels-conf .ft .ger { background:#2f7d4f; color:#fff; }
            #sels-conf .ft .can { background:#fff; color:#1a365d; border:1px solid #1a365d; }
            #sels-conf .av { background:#fdf6e3; border-left:3px solid #d9a441; padding:8px 10px;
              font-size:11.5px; margin-bottom:10px; border-radius:3px; }
            #sels-conf .mini { background:none; border:1px solid #2b6cb0; color:#2b6cb0; border-radius:4px;
              font-size:10.5px; padding:2px 8px; cursor:pointer; }
          </style>
          <div class="cx">
            <div class="hd">
              <h2>Conferência — ${resultado.length} colportor(es)</h2>
              <span class="x" id="conf-x">✕</span>
            </div>
            <div class="bd">
              ${avisos.map(a => `<div class="av">⚠ ${a}</div>`).join('')}
              <table>
                <thead><tr>
                  <th style="width:26px"><input type="checkbox" id="conf-all" checked></th>
                  <th>Colportor</th><th class="n">Saldo APMS</th><th class="n">Consignado</th>
                  <th class="n">Dízimo</th><th class="n">NGs</th><th class="n">Frete</th>
                  <th class="n">Lucro real</th><th></th>
                </tr></thead>
                <tbody>
                ${resultado.map((r, i) => {
                    const ng = round2(r.ngNormal + r.ngRegistrada);
                    const cls = r.lucroReal < 0 ? 'neg' : 'pos';
                    const tags = [];
                    if (!r.temConsignado && !r.temNg) tags.push('<span class="tag">sem pendência</span>');
                    if (r.ngRegistrada > 0) tags.push('<span class="tag">NG reg.</span>');
                    return `<tr>
                      <td><input type="checkbox" class="conf-ck" data-i="${i}" checked></td>
                      <td>${r.nome} ${tags.join(' ')}</td>
                      <td class="n">${fmtBr(r.saldoAPMS)}</td>
                      <td class="n">${fmtBr(r.materialConsignado)}</td>
                      <td class="n">${fmtBr(r.dizimoConsolidado)}</td>
                      <td class="n">${fmtBr(ng)}</td>
                      <td class="n">${fmtBr(r.freteTotal)}</td>
                      <td class="n ${cls}"><b>${fmtBr(r.lucroReal)}</b></td>
                      <td><button class="mini" data-ver="${i}">ver</button></td>
                    </tr>`;
                }).join('')}
                </tbody>
              </table>
            </div>
            <div class="ft">
              <button class="can" id="conf-cancel">Cancelar</button>
              <span style="flex:1;font-size:11.5px;color:#888" id="conf-cont"></span>
              <button class="ger" id="conf-gerar">Gerar demonstrativo(s)</button>
            </div>
          </div>`;
        document.body.appendChild(overlay);

        const fechar = () => overlay.remove();
        overlay.querySelector('#conf-x').onclick = fechar;
        overlay.querySelector('#conf-cancel').onclick = fechar;

        const marcados = () => Array.from(overlay.querySelectorAll('.conf-ck:checked'))
            .map(c => resultado[parseInt(c.dataset.i, 10)]);

        const atualizarContador = () => {
            overlay.querySelector('#conf-cont').textContent = marcados().length + ' selecionado(s)';
        };
        atualizarContador();

        overlay.querySelector('#conf-all').onchange = e => {
            overlay.querySelectorAll('.conf-ck').forEach(c => c.checked = e.target.checked);
            atualizarContador();
        };
        overlay.querySelectorAll('.conf-ck').forEach(c => c.onchange = atualizarContador);
        overlay.querySelectorAll('[data-ver]').forEach(b => {
            b.onclick = () => gerarDemonstrativos([resultado[parseInt(b.dataset.ver, 10)]]);
        });

        overlay.querySelector('#conf-gerar').onclick = () => {
            const sel = marcados();
            if (!sel.length) { alert('Selecione ao menos um colportor.'); return; }
            gerarDemonstrativos(sel);
        };
    }

    document.getElementById('sels-analisar').onclick = abrirConferencia;

    // ===============================================================
    // GERAÇÃO DO DEMONSTRATIVO (mesmo layout do 5.0: logo, navy/gold,
    // resumo em destaque, detalhes por seção, exportação PDF/PNG)
    // ===============================================================
    function linhasItens(itens, colunas, vazio) {
        if (!itens || !itens.length) {
            return `<tr><td colspan="${colunas.length}" style="color:#aaa;font-style:italic">${vazio}</td></tr>`;
        }
        return itens.map(it => `<tr>${colunas.map((c, i) => {
            const v = it[c.k];
            const txt = c.money ? fmtBr(v) : (v ?? '');
            return `<td class="${i === 0 ? '' : 'n'}">${txt}</td>`;
        }).join('')}</tr>`).join('');
    }

    function htmlDemonstrativo(d) {
        const cor = d.lucroReal < 0 ? '#c0392b' : '#2f7d4f';
        const rotulo = d.lucroReal < 0 ? ' (a pagar)' : (d.lucroReal > 0 ? ' (a receber)' : '');
        const data = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        return `<div class="card">
      <div class="cabecalho">
        <img src="data:image/png;base64,${LOGO_SELS}" alt="SELS UCOB">
        <h1>Demonstrativo de Saldo</h1>
        <div class="sub">SELS UCOB · União Centro Oeste Brasileira</div>
      </div>
      <div class="corpo">
        <div class="nome">${d.nome}</div>
        <div class="data">Gerado em ${data}</div>

        <div class="resumo-box">
          <div class="resumo-tit">Resumo do Acerto</div>
          <table class="resumo">
            <tr class="destaque"><td>Saldo APMS (razão original)</td><td>R$ ${fmtBr(d.saldoAPMS)}</td></tr>
            <tr><td>Total Consignado</td><td>R$ ${fmtBr(d.materialConsignado)}</td></tr>
            <tr><td>Total Dízimo (consignado + NGs)</td><td>R$ ${fmtBr(d.dizimoConsolidado)}</td></tr>
            <tr><td>Total NGs Pendentes (normal)</td><td>R$ ${fmtBr(d.ngNormal)}</td></tr>
            <tr><td>Total NGs Pendentes (registrada)</td><td>R$ ${fmtBr(d.ngRegistrada)}</td></tr>
            <tr><td>Total Frete (NGs registradas)</td><td>R$ ${fmtBr(d.freteTotal)}</td></tr>
          </table>
          <div class="lucro">
            <div class="lb">Lucro real a solicitar</div>
            <div class="vl" style="color:${cor}">R$ ${fmtBr(Math.abs(d.lucroReal))}${rotulo}</div>
          </div>
        </div>

        <h2>Material em Consignado (Atualizado)</h2>
        <table class="det">
          <tr><th>Produto</th><th class="n">Qtd.</th><th class="n">Total</th><th class="n">Dízimo</th></tr>
          ${linhasItens(d.itensConsignado,
            [{k:'produto'},{k:'qtd'},{k:'valor',money:1},{k:'dizimo',money:1}],
            'Nenhum material em consignado')}
          <tr class="tot"><td>Total</td><td class="n"></td>
            <td class="n">R$ ${fmtBr(d.materialConsignado)}</td>
            <td class="n">R$ ${fmtBr(d.dizimoConsignado)}</td></tr>
        </table>

        <h2>NGs Pendentes — Normal</h2>
        <table class="det">
          <tr><th>Nº da NG</th><th class="n">Qtd. Exemplar</th><th class="n">Valor</th><th class="n">Dízimo</th></tr>
          ${linhasItens(d.itensNgNormal,
            [{k:'ng'},{k:'qtd'},{k:'valor',money:1},{k:'dizimo',money:1}],
            'Nenhuma NG normal pendente')}
          <tr class="tot"><td>Total</td><td class="n"></td>
            <td class="n">R$ ${fmtBr(d.ngNormal)}</td>
            <td class="n">R$ ${fmtBr(d.dizimoNgNormal)}</td></tr>
        </table>

        <h2>NGs Pendentes — Registrada</h2>
        <table class="det">
          <tr><th>Nº da NG</th><th class="n">Qtd. Exemplar</th><th class="n">Valor</th><th class="n">Dízimo</th><th class="n">V. Frete</th></tr>
          ${linhasItens(d.itensNgRegistrada,
            [{k:'ng'},{k:'qtd'},{k:'valor',money:1},{k:'dizimo',money:1},{k:'frete',money:1}],
            'Nenhuma NG registrada pendente')}
          <tr class="tot"><td>Total</td><td class="n"></td>
            <td class="n">R$ ${fmtBr(d.ngRegistrada)}</td>
            <td class="n">R$ ${fmtBr(d.dizimoNgRegistrada)}</td>
            <td class="n">R$ ${fmtBr(d.freteTotal)}</td></tr>
        </table>

        <p class="rodape">Gerado automaticamente pelo SELS ASSISTANT · confira os valores com o setor financeiro em caso de dúvida.</p>
      </div>
    </div>`;
    }

    function gerarDemonstrativos(lista) {
        const nomeArq = lista.length === 1
            ? 'demonstrativo-' + lista[0].nome.replace(/\s+/g, '_')
            : 'demonstrativos-equipe';

        const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>${lista.length === 1 ? 'Demonstrativo - ' + lista[0].nome : 'Demonstrativos da Equipe'}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
<style>
  :root { --navy:#1a365d; --navy2:#0f2340; --gold:#d9a441; --gold-l:#f7e9cf; --bg:#FAF7EE; }
  * { box-sizing:border-box; }
  body { font-family:'Georgia','Times New Roman',serif; background:var(--bg); margin:0; padding:26px; }
  .card { max-width:840px; margin:0 auto 26px auto; background:#fff; border-radius:12px;
    box-shadow:0 4px 18px rgba(15,35,64,.12); overflow:hidden; page-break-after:always; }
  .card:last-of-type { page-break-after:auto; }
  .cabecalho { background:linear-gradient(135deg,var(--navy),var(--navy2)); color:#fff;
    padding:24px; text-align:center; }
  .cabecalho img { width:58px; margin-bottom:8px; filter:drop-shadow(0 2px 4px rgba(0,0,0,.3)); }
  .cabecalho h1 { margin:0; font-size:21px; letter-spacing:.3px; }
  .cabecalho .sub { font-size:11.5px; color:var(--gold-l); opacity:.9; margin-top:2px; }
  .corpo { padding:24px 30px 26px 30px; }
  .nome { font-size:17px; font-weight:bold; color:var(--navy); }
  .data { font-size:11px; color:#999; margin-bottom:16px; }
  .resumo-box { border:2px solid var(--gold); border-radius:10px; padding:14px 16px;
    background:linear-gradient(180deg,#fffdf8,#fff); margin-bottom:6px; }
  .resumo-tit { color:var(--navy); font-size:13px; font-weight:bold; text-transform:uppercase;
    letter-spacing:.5px; margin-bottom:6px; }
  table { width:100%; border-collapse:collapse; font-family:Arial, sans-serif; table-layout:fixed; }
  .resumo { font-size:12.5px; }
  .resumo td { padding:5px 4px; border-bottom:1px solid #f0ece2; }
  .resumo td:last-child { text-align:right; font-weight:bold; width:150px;
    font-variant-numeric:tabular-nums; }
  .resumo tr.destaque td { color:var(--navy); font-weight:bold; }
  .lucro { margin-top:12px; padding:14px; border-radius:8px; background:var(--gold-l); text-align:center; }
  .lucro .lb { font-size:11.5px; color:var(--navy); text-transform:uppercase; letter-spacing:.5px; }
  .lucro .vl { font-size:27px; font-weight:bold; font-family:Arial, sans-serif; margin-top:2px; }
  h2 { color:var(--navy); font-size:13px; margin:22px 0 4px 0; border-bottom:2px solid var(--gold-l);
    padding-bottom:5px; text-transform:uppercase; letter-spacing:.4px; }
  .det { font-size:12px; }
  .det th { background:var(--gold-l); color:var(--navy2); font-size:10px; text-transform:uppercase;
    padding:6px; text-align:left; }
  .det td { padding:5px 6px; border-bottom:1px solid #f2f2f2; }
  .det th.n, .det td.n { text-align:center; width:105px; font-variant-numeric:tabular-nums; }
  .det tr.tot td { font-weight:bold; background:#faf7ee; border-top:2px solid var(--gold-l); }
  .rodape { margin-top:18px; font-size:10px; color:#aaa; font-family:Arial, sans-serif; }
  .barra { position:sticky; top:0; text-align:center; padding:10px; background:rgba(250,247,238,.95);
    z-index:10; margin:-26px -26px 20px -26px; border-bottom:1px solid #e8e2d4; }
  .barra button { font-family:Arial, sans-serif; font-size:13px; padding:9px 18px; margin:0 4px;
    border:none; border-radius:6px; cursor:pointer; background:var(--navy); color:#fff; font-weight:bold; }
  .barra button.sec { background:#fff; color:var(--navy); border:1px solid var(--navy); }
  @media print { body{background:#fff;padding:0;} .card{box-shadow:none;margin:0;} .barra{display:none;} }
</style></head>
<body>
  <div class="barra" id="barra">
    <button onclick="baixarPDF()">Baixar PDF${lista.length > 1 ? ' (todos)' : ''}</button>
    <button class="sec" onclick="baixarPNG()">Baixar imagem (PNG)</button>
    ${lista.length > 1 ? `<span style="font-size:12px;color:#666;margin-left:8px">${lista.length} demonstrativos</span>` : ''}
  </div>
  ${lista.map(htmlDemonstrativo).join('\n')}
<script>
  async function aguardarImagens() {
    const imgs = Array.from(document.images);
    await Promise.all(imgs.map(i => i.complete ? Promise.resolve()
      : new Promise(r => { i.onload = r; i.onerror = r; })));
  }
  async function capturar(el) {
    const barra = document.getElementById('barra');
    barra.style.display = 'none';                 // não sai no arquivo exportado
    await aguardarImagens();
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#FAF7EE' });
    barra.style.display = '';
    return canvas;
  }
  async function baixarPNG() {
    const cards = document.querySelectorAll('.card');
    for (let i = 0; i < cards.length; i++) {
      const canvas = await capturar(cards[i]);
      const a = document.createElement('a');
      a.download = '${nomeArq}' + (cards.length > 1 ? '-' + (i+1) : '') + '.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    }
  }
  async function baixarPDF() {
    const { jsPDF } = window.jspdf;
    const cards = document.querySelectorAll('.card');
    let pdf = null;
    for (let i = 0; i < cards.length; i++) {
      const canvas = await capturar(cards[i]);
      const img = canvas.toDataURL('image/png');
      const w = canvas.width * 0.264583 / 2, h = canvas.height * 0.264583 / 2;
      if (!pdf) pdf = new jsPDF({ orientation: h > w ? 'p' : 'l', unit: 'mm', format: [w + 20, h + 20] });
      else pdf.addPage([w + 20, h + 20], h > w ? 'p' : 'l');
      pdf.addImage(img, 'PNG', 10, 10, w, h);
    }
    pdf.save('${nomeArq}.pdf');
  }
<\/script>
</body></html>`;

        const aba = window.open('', '_blank');
        if (!aba) { alert('O navegador bloqueou a nova aba. Permita pop-ups para este site.'); return; }
        aba.document.open(); aba.document.write(html); aba.document.close();
    }

    // ===============================================================
    document.getElementById('sels-refresh').onclick = () => detectarPaginaAtual();

    // Re-detecta automaticamente quando a URL muda (ex: você gera outro
    // relatório na mesma aba sem recarregar a página inteira).
    let urlAnterior = location.href;
    setInterval(() => {
        if (location.href !== urlAnterior) {
            urlAnterior = location.href;
            detectarPaginaAtual(true);
        }
    }, 1500);

    atualizarPainel();
    detectarPaginaAtual();
})();
