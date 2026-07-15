// ==UserScript==
// @name         Assistente de Demonstrativo SELS 5.0
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Parser estrutural completo do Razao Sintetico via PDF.js (secoes de debito/credito, resumo, itens) + Consignado + NGs + Gerar Demonstrativo
// @author       Sua Automacao SELS
// @match        https://apms.sdasystems.org/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @require      https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
// ==/UserScript==

(function () {
    'use strict';

    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // ---------------------------------------------------------------
    // PAINEL FLUTUANTE
    // ---------------------------------------------------------------
    const panel = document.createElement('div');
    panel.style = `
        position: fixed; bottom: 20px; right: 20px; z-index: 999999;
        background: #ffffff; border: 2px solid #1a365d; border-radius: 8px;
        padding: 0; width: 300px; box-shadow: 0px 4px 10px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif; font-size: 13px; color: #333;
        max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;
    `;

    panel.innerHTML = `
        <div id="sels-header" style="font-weight: bold; color: #fff; background:#1a365d; padding: 10px 12px; display:flex; align-items:center; justify-content:space-between;">
            <span>🚀 Copiloto SELS 5.0</span>
            <span style="display:flex; align-items:center; gap:10px;">
                <span id="btn-config" title="Mostrar/ocultar ferramentas de debug" style="cursor:pointer; font-size:15px;">⚙️</span>
                <span id="btn-minimizar" title="Minimizar" style="cursor:pointer; font-size:15px;">➖</span>
            </span>
        </div>
        <div id="sels-corpo" style="padding: 15px; overflow-y:auto;">
            <div id="sels-status" style="margin-bottom: 12px; font-size: 11px; color: #666;">
                Status: Aguardando navegacao...
            </div>
            <button id="btn-razao" style="width: 100%; margin-bottom: 6px; padding: 6px; background: #2b6cb0; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                1. Capturar Razao (PDF completo)
            </button>
            <button id="btn-consignado" style="width: 100%; margin-bottom: 6px; padding: 6px; background: #718096; color: white; border: none; border-radius: 4px; cursor: pointer;" disabled>
                2. Capturar Consignado
            </button>
            <button id="btn-ngs-normal" style="width: 100%; margin-bottom: 6px; padding: 6px; background: #718096; color: white; border: none; border-radius: 4px; cursor: pointer;" disabled>
                3a. Capturar NGs Normal
            </button>
            <button id="btn-ngs-registrada" style="width: 100%; margin-bottom: 6px; padding: 6px; background: #718096; color: white; border: none; border-radius: 4px; cursor: pointer;" disabled>
                3b. Capturar NGs Registrada
            </button>
            <button id="btn-gerar" style="width: 100%; margin-top: 4px; padding: 8px; background: #38a169; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 14px;" disabled>
                📊 Gerar Novo Demonstrativo
            </button>
            <button id="btn-limpar" style="width: 100%; margin-top: 8px; padding: 6px; background: #fff; color: #c0392b; border: 1px solid #c0392b; border-radius: 4px; cursor: pointer; font-size: 11px;">
                🗑️ Limpar Memória
            </button>

            <div id="sels-debug-tools" style="display:none; margin-top: 12px; border-top: 1px dashed #ccc; padding-top: 10px;">
                <button id="btn-debug-ngs" style="width: 100%; margin-bottom: 6px; padding: 4px; background: #d69e2e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 10px;">
                    🔍 Ver tabelas cruas (Lote/NGs)
                </button>
                <button id="btn-debug-consignado" style="width: 100%; margin-bottom: 6px; padding: 4px; background: #d69e2e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 10px;">
                    🔍 Ver tabela crua (Consignado)
                </button>
                <button id="btn-resumo" style="width: 100%; margin-bottom: 6px; padding: 4px; background: #6b46c1; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    📋 Ver resumo capturado
                </button>
                <button id="btn-debug" style="width: 100%; padding: 4px; background: #d69e2e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 10px;">
                    🔍 Ver linhas cruas (debug Razao)
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    // --- Minimizar / expandir painel ---
    document.getElementById('btn-minimizar').addEventListener('click', () => {
        const corpo = document.getElementById('sels-corpo');
        const icone = document.getElementById('btn-minimizar');
        const minimizado = corpo.style.display === 'none';
        corpo.style.display = minimizado ? 'block' : 'none';
        icone.textContent = minimizado ? '➖' : '➕';
        icone.title = minimizado ? 'Minimizar' : 'Expandir';
    });

    // --- Engrenagem: mostra/oculta ferramentas de debug ---
    document.getElementById('btn-config').addEventListener('click', () => {
        const debugTools = document.getElementById('sels-debug-tools');
        debugTools.style.display = (debugTools.style.display === 'none') ? 'block' : 'none';
    });

    function atualizarPainel() {
        let colportor = GM_getValue("nomeColportor", "");
        let statusDiv = document.getElementById("sels-status");
        if (colportor) {
            statusDiv.innerHTML = `✅ Colportor: <b>${colportor}</b><br>Razao coletado! Va para Consignado.`;
            document.getElementById("btn-razao").style.background = "#38a169";
            document.getElementById("btn-consignado").disabled = false;
            document.getElementById("btn-consignado").style.background = "#2b6cb0";
        } else {
            statusDiv.innerHTML = "⏳ Aguardando captura do Razao...";
        }

        if (GM_getValue("produtosConsignado", "")) {
            document.getElementById("btn-consignado").style.background = "#38a169";
            document.getElementById("btn-ngs-normal").disabled = false;
            document.getElementById("btn-ngs-normal").style.background = "#2b6cb0";
            document.getElementById("btn-ngs-registrada").disabled = false;
            document.getElementById("btn-ngs-registrada").style.background = "#2b6cb0";
        }

        const temNormal = !!GM_getValue("ngsNormal", "");
        const temRegistrada = !!GM_getValue("ngsRegistrada", "");
        if (temNormal) document.getElementById("btn-ngs-normal").style.background = "#38a169";
        if (temRegistrada) document.getElementById("btn-ngs-registrada").style.background = "#38a169";

        // Habilita "Gerar Demonstrativo" assim que tivermos Razao + Consignado.
        // NGs sao opcionais (podem ficar zeradas quando o colportor nao tiver nenhuma).
        if (colportor && GM_getValue("produtosConsignado", "")) {
            document.getElementById("btn-gerar").disabled = false;
        }
    }

    // ---------------------------------------------------------------
    // EXTRAÇÃO DE LINHAS DO PDF (posição espacial real)
    // ---------------------------------------------------------------
    async function extrairLinhasDoPDF() {
        const resposta = await fetch(location.href, { credentials: 'include' });
        if (!resposta.ok) {
            throw new Error(`Falha ao baixar o PDF (status ${resposta.status}). Atualize a pagina (F5) e tente novamente.`);
        }
        const arrayBuffer = await resposta.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const todasLinhas = [];
        for (let numPagina = 1; numPagina <= pdf.numPages; numPagina++) {
            const pagina = await pdf.getPage(numPagina);
            const conteudo = await pagina.getTextContent();

            const itens = conteudo.items.map(item => ({
                texto: item.str,
                x: item.transform[4],
                y: item.transform[5]
            })).filter(i => i.texto.trim() !== "");

            const linhasPorY = {};
            const TOLERANCIA_Y = 2;
            itens.forEach(item => {
                let chaveEncontrada = null;
                for (let chave in linhasPorY) {
                    if (Math.abs(parseFloat(chave) - item.y) <= TOLERANCIA_Y) {
                        chaveEncontrada = chave;
                        break;
                    }
                }
                if (chaveEncontrada) linhasPorY[chaveEncontrada].push(item);
                else linhasPorY[item.y] = [item];
            });

            const chavesOrdenadas = Object.keys(linhasPorY).sort((a, b) => parseFloat(b) - parseFloat(a));
            chavesOrdenadas.forEach(chave => {
                const itensDaLinha = linhasPorY[chave].sort((a, b) => a.x - b.x);
                const textoLinha = itensDaLinha.map(i => i.texto).join(' ').replace(/\s+/g, ' ').trim();
                if (textoLinha) todasLinhas.push(textoLinha);
            });
        }
        return todasLinhas;
    }

    // ---------------------------------------------------------------
    // FILTRO DE RUÍDO (cabeçalho/rodapé que se repete em cada página)
    // ---------------------------------------------------------------
    const RUIDO = [
        /^União Centro Oeste Brasileira/i,
        /^SELS UCOB$/i,
        /^Acerto do Colportor/i,
        /^Equipe\s*-/i,
        /^Campanha\s*-/i,
        /^Período:/i,
        /^Usuário\s*:/i,
        /^Página\s*:/i,
        /^[\w.+-]+@[\w-]+\.[\w.-]+$/i,
        /^Dados do Colportor$/i,
        /^Dados da Equipe$/i,
        /^CPF:/i,
        /^Telefone:/i,
        /^Email:/i,
        /^Líder\s*:/i,
        /^Resumo do Acerto$/i,
        /^MOVIMENTAÇÃO DAS COMPRAS$/i,
        /^Produto\s+Qtd\./i,
        /^Retirada\s+Devolvida/i,
        /^Assinaturas\s+Qtd\./i,
        /^Exemplar\s+Unitário/i,
        /^Total Produtos/i,
        /^Total de Assinaturas/i,
        /^Produto \+ Assinaturas/i,
        /^Pagar Bonificado$/i,
        /^Total Geral/i,
        /^Data\/Hora Descrição Valor$/i,
    ];

    function isRuido(linha) {
        return RUIDO.some(re => re.test(linha));
    }

    // ---------------------------------------------------------------
    // PARSER ESTRUTURAL DO RAZÃO SINTÉTICO
    // ---------------------------------------------------------------
    const REGEX_VALOR = /(-?\d{1,3}(?:\.\d{3})*,\d{2})/;
    const REGEX_TRANSACAO = /^(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s+(.+?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/;

    function pegarPrimeiroValor(texto) {
        const m = texto.match(REGEX_VALOR);
        return m ? m[1] : null;
    }

    function parseRazao(linhasBrutas) {
        const linhas = linhasBrutas.filter(l => !isRuido(l));

        const dados = {
            nome: "",
            saldoConta: "",
            totalDebitos: "",
            totalCreditos: "",
            totalFrete: "",
            secoes: {
                juros: { itens: [], total: "" },
                adiantamentos: { itens: [], total: "" },
                despesas: { itens: [], total: "" },
                transferenciasDebito: { itens: [], total: "" },
                debitoViaSels: { itens: [], total: "" },
                recebimentos: { itens: [], total: "" },
                transferenciasCredito: { itens: [], total: "" },
                creditoViaSels: { itens: [], total: "" },
                formasRecebimento: { itens: [], total: "" }
            }
        };

        const textoCompleto = linhas.join('\n');

        let m;
        if ((m = textoCompleto.match(/Nome:\s*(.+?)\s+Banco:/i))) dados.nome = m[1].trim();
        if ((m = textoCompleto.match(/SALDO DA CONTA:\s*(-?\d[\d.]*,\d{2})/i))) dados.saldoConta = m[1];
        if ((m = textoCompleto.match(/Total de Débitos\s*:?\s*(-?\d[\d.]*,\d{2})/i))) dados.totalDebitos = m[1];
        if ((m = textoCompleto.match(/Total de Créditos\s*:?\s*(-?\d[\d.]*,\d{2})/i))) dados.totalCreditos = m[1];
        if ((m = textoCompleto.match(/Total Frete:\s*(-?\d[\d.]*,\d{2})/i))) dados.totalFrete = m[1];

        let secaoAtual = null;
        let macroContexto = null;

        linhas.forEach(linhaOriginal => {
            const linha = linhaOriginal.trim();
            const linhaUpper = linha.toUpperCase();

            if (linhaUpper === "LANÇAMENTOS DE DÉBITO") { macroContexto = 'debito'; secaoAtual = null; return; }
            if (linhaUpper === "LANÇAMENTOS DE CRÉDITO") { macroContexto = 'credito'; secaoAtual = null; return; }

            if (linhaUpper === "JUROS") { secaoAtual = 'juros'; return; }
            if (linhaUpper === "ADIANTAMENTO") { secaoAtual = 'adiantamentos'; return; }
            if (linhaUpper === "DESPESAS") { secaoAtual = 'despesas'; return; }
            if (linhaUpper === "PAGAMENTOS") { secaoAtual = null; return; }
            if (linhaUpper === "TRANSFERÊNCIA ENTRE CONTAS") {
                secaoAtual = (macroContexto === 'credito') ? 'transferenciasCredito' : 'transferenciasDebito';
                return;
            }
            if (linhaUpper === "DÉBITO VIA SELS") { secaoAtual = 'debitoViaSels'; return; }
            if (linhaUpper === "RECEBIMENTO") { secaoAtual = 'recebimentos'; return; }
            if (linhaUpper === "CRÉDITO VIA SELS") { secaoAtual = 'creditoViaSels'; return; }
            if (linhaUpper === "DETALHES DO RECEBIMENTO") { secaoAtual = 'formasRecebimento'; return; }
            if (linhaUpper === "FORMA VALOR") { return; }

            if (!secaoAtual) return;

            const trans = linha.match(REGEX_TRANSACAO);
            if (trans) {
                dados.secoes[secaoAtual].itens.push({
                    data: trans[1],
                    descricao: trans[2].trim(),
                    valor: trans[3]
                });
                return;
            }

            if (/^Total\s/i.test(linha)) {
                const valor = pegarPrimeiroValor(linha);
                dados.secoes[secaoAtual].total = valor || "0,00";
                return;
            }

            if (secaoAtual === 'formasRecebimento') {
                const valor = pegarPrimeiroValor(linha);
                if (valor) {
                    const descricao = linha.replace(valor, '').trim();
                    dados.secoes.formasRecebimento.itens.push({ descricao, valor });
                }
            }
        });

        return dados;
    }

    // ---------------------------------------------------------------
    // UTILITÁRIOS DE VALOR
    // ---------------------------------------------------------------
    function parseValorPtBr(str) {
        if (!str) return 0;
        const limpo = str.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
        const n = parseFloat(limpo);
        return isNaN(n) ? 0 : n;
    }

    function fmtBr(n) {
        return (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

// Logo SELS UCOB embutida (base64) para o cabecalho do demonstrativo final
    const LOGO_SELS_BASE64 = "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";

    function dumpTodasAsTabelas() {
        const tabelas = Array.from(document.querySelectorAll('table'));
        return tabelas.map((tabela, idx) => {
            const linhas = Array.from(tabela.querySelectorAll('tr')).slice(0, 6).map(linha =>
                Array.from(linha.querySelectorAll('th, td')).map(c => c.innerText.trim())
            );
            return { indiceTabela: idx, totalLinhas: tabela.querySelectorAll('tr').length, primeirasLinhas: linhas };
        });
    }

    // ---------------------------------------------------------------
    // PASSO 2: CONSIGNADO
    // ---------------------------------------------------------------
    function localizarTabelaConsignado() {
        const tabelas = Array.from(document.querySelectorAll('table'));
        for (const tabela of tabelas) {
            const textoTabela = tabela.innerText.toUpperCase();
            if (textoTabela.includes('PRODUTO') && textoTabela.includes('DÍZIMO')) {
                return tabela;
            }
        }
        return null;
    }

    function extrairConsignado() {
        const tabela = localizarTabelaConsignado();
        if (!tabela) return null;

        const linhas = Array.from(tabela.querySelectorAll('tr'));
        let indices = null;
        let linhaCabecalho = -1;

        linhas.forEach((linha, i) => {
            const celulas = Array.from(linha.querySelectorAll('th, td')).map(c => c.innerText.trim());
            if (indices) return;
            const jointext = celulas.join('|').toUpperCase();
            if (jointext.includes('PRODUTO') && jointext.includes('DÍZIMO')) {
                indices = {
                    produto: celulas.findIndex(c => /PRODUTO/i.test(c)),
                    quantidade: celulas.findIndex(c => /^QUANTIDADE$/i.test(c)),
                    valorUnitario: celulas.findIndex(c => /VALOR\s+UNIT/i.test(c)),
                    desconto: celulas.findIndex(c => /^DESCONTO$/i.test(c)),
                    total: celulas.findIndex(c => /^TOTAL$/i.test(c)),
                    dizimo: celulas.findIndex(c => /D[ÍI]ZIMO/i.test(c))
                };
                linhaCabecalho = i;
            }
        });

        if (!indices || indices.produto === -1) return null;

        const itens = [];
        let totalMaterial = "";
        let totalDizimo = "";
        let totalQuantidade = "";

        for (let i = linhaCabecalho + 1; i < linhas.length; i++) {
            const celulas = Array.from(linhas[i].querySelectorAll('td, th')).map(c => c.innerText.trim());
            if (celulas.length === 0) continue;

            const produtoTexto = celulas[indices.produto] || "";
            const ehLinhaTotal = celulas.some(c => /^TOTAL$/i.test(c.trim()));

            if (ehLinhaTotal) {
                if (indices.quantidade > -1) totalQuantidade = celulas[indices.quantidade] || "";
                if (indices.total > -1) totalMaterial = celulas[indices.total] || "";
                if (indices.dizimo > -1) totalDizimo = celulas[indices.dizimo] || "";
                continue;
            }
            if (!produtoTexto) continue;

            itens.push({
                produto: produtoTexto,
                quantidade: indices.quantidade > -1 ? celulas[indices.quantidade] : "",
                valorUnitario: indices.valorUnitario > -1 ? celulas[indices.valorUnitario] : "",
                desconto: indices.desconto > -1 ? celulas[indices.desconto] : "",
                total: indices.total > -1 ? celulas[indices.total] : "",
                dizimo: indices.dizimo > -1 ? celulas[indices.dizimo] : ""
            });
        }

        if (!totalMaterial && itens.length) {
            const somaTotal = itens.reduce((acc, it) => acc + parseValorPtBr(it.total), 0);
            const somaDizimo = itens.reduce((acc, it) => acc + parseValorPtBr(it.dizimo), 0);
            totalMaterial = somaTotal.toFixed(2).replace('.', ',');
            totalDizimo = somaDizimo.toFixed(2).replace('.', ',');
        }

        return { itens, totalMaterial, totalDizimo, totalQuantidade };
    }

    function debugTabelaConsignado() {
        const tabela = localizarTabelaConsignado();
        if (!tabela) {
            return { encontrouTabela: false, tabelasDaPagina: Array.from(document.querySelectorAll('table')).map(t => t.innerText.slice(0, 80)) };
        }
        const linhas = Array.from(tabela.querySelectorAll('tr')).map(linha =>
            Array.from(linha.querySelectorAll('th, td')).map(c => c.innerText.trim())
        );
        return { encontrouTabela: true, linhas };
    }

    // ---------------------------------------------------------------
    // PASSO 3: LOTE (NGs Pendentes — Normal / Registrada)
    // ---------------------------------------------------------------
    function localizarTabelaLote() {
        const tabelas = Array.from(document.querySelectorAll('table'));
        for (const tabela of tabelas) {
            const textoTabela = tabela.innerText.toUpperCase();
            if (textoTabela.includes('ASSINATURA') && textoTabela.includes('VALOR') && textoTabela.includes('FRETE')) {
                return tabela;
            }
        }
        return null;
    }

    function extrairLote() {
        const tabela = localizarTabelaLote();
        if (!tabela) return null;

        const linhas = Array.from(tabela.querySelectorAll('tr'));
        let indices = null;
        let linhaCabecalho = -1;

        linhas.forEach((linha, i) => {
            const celulas = Array.from(linha.querySelectorAll('th, td')).map(c => c.innerText.trim());
            if (indices) return;
            const jointext = celulas.join('|').toUpperCase();
            if (jointext.includes('ASSINATURA') && jointext.includes('VALOR') && jointext.includes('FRETE')) {
                indices = {
                    assinatura: celulas.findIndex(c => /^ASSINATURA$/i.test(c)),
                    qtdAssinaturas: celulas.findIndex(c => /QTD\.?\s*ASSINATURAS/i.test(c)),
                    qtdExemplar: celulas.findIndex(c => /QTD\s*EXEMPLAR/i.test(c)),
                    valor: celulas.findIndex(c => /^VALOR$/i.test(c)),
                    desconto: celulas.findIndex(c => /^DESCONTO$/i.test(c)),
                    frete: celulas.findIndex(c => /FRETE/i.test(c))
                };
                linhaCabecalho = i;
            }
        });

        if (!indices || indices.valor === -1) return null;

        const itens = [];
        let totalValor = "";
        let totalFrete = "";
        let totalQtdAssinaturas = "";
        let totalQtdExemplar = "";

        for (let i = linhaCabecalho + 1; i < linhas.length; i++) {
            const celulas = Array.from(linhas[i].querySelectorAll('td, th')).map(c => c.innerText.trim());
            if (celulas.length === 0) continue;

            const colDescricao = indices.assinatura > -1 ? indices.assinatura : 0;
            const textoDescricao = celulas[colDescricao] || "";
            const ehLinhaTotal = /^TOTAL$/i.test(textoDescricao.trim());

            if (ehLinhaTotal) {
                if (indices.qtdAssinaturas > -1) totalQtdAssinaturas = celulas[indices.qtdAssinaturas] || "";
                if (indices.qtdExemplar > -1) totalQtdExemplar = celulas[indices.qtdExemplar] || "";
                if (indices.valor > -1) totalValor = celulas[indices.valor] || "";
                if (indices.frete > -1) totalFrete = celulas[indices.frete] || "";
                continue;
            }
            if (!textoDescricao) continue;

            itens.push({
                descricao: textoDescricao,
                qtdAssinaturas: indices.qtdAssinaturas > -1 ? celulas[indices.qtdAssinaturas] : "",
                qtdExemplar: indices.qtdExemplar > -1 ? celulas[indices.qtdExemplar] : "",
                valor: indices.valor > -1 ? celulas[indices.valor] : "",
                desconto: indices.desconto > -1 ? celulas[indices.desconto] : "",
                frete: indices.frete > -1 ? celulas[indices.frete] : ""
            });
        }

        if (!totalValor && itens.length) {
            const somaValor = itens.reduce((acc, it) => acc + parseValorPtBr(it.valor), 0);
            const somaFrete = itens.reduce((acc, it) => acc + parseValorPtBr(it.frete), 0);
            totalValor = somaValor.toFixed(2).replace('.', ',');
            totalFrete = somaFrete.toFixed(2).replace('.', ',');
        }

        const totalDizimo = (parseValorPtBr(totalValor) * 0.10).toFixed(2).replace('.', ',');

        return { itens, totalValor, totalFrete, totalDizimo, totalQtdAssinaturas, totalQtdExemplar };
    }

    function capturarNgs(tipo) {
        const chave = tipo === 'Normal' ? 'ngsNormal' : 'ngsRegistrada';
        const dados = extrairLote();

        if (!dados) {
            const semDados = confirm(
                `Não encontrei automaticamente a tabela de NGs ${tipo} nesta tela.\n\n` +
                `Clique OK se este colportor NÃO TEM nenhuma NG ${tipo} pendente (vai gravar zerado).\n` +
                `Clique Cancelar se ele TEM NGs ${tipo} e você quer digitar os totais manualmente.`
            );
            if (semDados) {
                GM_setValue(chave, JSON.stringify({ itens: [], totalValor: "0,00", totalFrete: "0,00", totalDizimo: "0,00" }));
                alert(`✅ NGs ${tipo}: registrado como zerado (sem lançamentos).`);
                atualizarPainel();
                return;
            }
            const totalManual = prompt(`Digite o Total de NGs ${tipo} (coluna "Valor"):`);
            if (totalManual === null) { alert("Captura cancelada."); return; }
            const freteManual = prompt(`Digite o Total de V. Frete das NGs ${tipo}:`) || "0,00";
            const dizimoCalculado = (parseValorPtBr(totalManual) * 0.10).toFixed(2).replace('.', ',');
            GM_setValue(chave, JSON.stringify({ itens: [], totalValor: totalManual || "0,00", totalFrete: freteManual, totalDizimo: dizimoCalculado }));
            alert(`✅ NGs ${tipo} registradas manualmente!\n\nValor: ${totalManual || '0,00'}\nFrete: ${freteManual}\nDízimo (10% do Valor): ${dizimoCalculado}`);
            atualizarPainel();
            return;
        }

        if (!dados.totalValor) {
            dados.totalValor = prompt(`Encontrei itens de NGs ${tipo}, mas não o total. Digite o Total (Valor):`) || "0,00";
            dados.totalDizimo = (parseValorPtBr(dados.totalValor) * 0.10).toFixed(2).replace('.', ',');
        }
        if (!dados.totalFrete) {
            dados.totalFrete = prompt(`Digite o Total de V. Frete das NGs ${tipo}:`) || "0,00";
        }

        GM_setValue(chave, JSON.stringify(dados));
        console.log(`=== NGs ${tipo} PARSEADAS ===`, dados);

        const listaItens = dados.itens
            .map(it => `• ${it.descricao} — qtd assin. ${it.qtdAssinaturas || '-'} — valor ${it.valor} — frete ${it.frete || '0,00'}`)
            .join('\n');

        alert(
            `✅ NGs ${tipo} capturadas!\n\n` +
            `${dados.itens.length} lançamento(s):\n${listaItens || '(nenhum item individual encontrado, só o total)'}\n\n` +
            `💰 Total Valor: ${dados.totalValor}\n` +
            `🚚 Total Frete: ${dados.totalFrete}\n` +
            `🔖 Dízimo (10% do Valor): ${dados.totalDizimo}`
        );
        atualizarPainel();
    }

    // --- BOTÃO 1: CAPTURAR RAZÃO ---
    document.getElementById('btn-razao').addEventListener('click', async () => {
        const btn = document.getElementById('btn-razao');
        const textoOriginal = btn.innerText;
        btn.innerText = "⏳ Lendo PDF...";
        btn.disabled = true;

        try {
            if (typeof pdfjsLib === 'undefined') {
                throw new Error("A biblioteca de leitura de PDF não carregou. Recarregue a página e tente de novo.");
            }

            const linhasBrutas = await extrairLinhasDoPDF();
            GM_setValue("linhasRazaoDebug", JSON.stringify(linhasBrutas));

            const dados = parseRazao(linhasBrutas);

            if (!dados.nome) {
                dados.nome = prompt("Não consegui identificar o Nome automaticamente. Digite o nome do Colportor:") || "";
                if (!dados.nome) throw new Error("Operação cancelada — nome é obrigatório.");
            }
            if (!dados.saldoConta) {
                dados.saldoConta = prompt("Não consegui identificar o Saldo da Conta automaticamente. Digite o valor:") || "";
                if (!dados.saldoConta) throw new Error("Operação cancelada — saldo é obrigatório.");
            }

            GM_setValue("nomeColportor", dados.nome);
            GM_setValue("dadosRazao", JSON.stringify(dados));

            const resumo =
                `✅ Razão capturado com sucesso!\n\n` +
                `👤 ${dados.nome}\n` +
                `💰 Saldo APMS (referência): ${dados.saldoConta}\n\n` +
                `(Débitos/Créditos do Razão não entram mais no demonstrativo final)\n\n` +
                `Use "Ver resumo capturado" para conferir tudo em detalhe.`;

            alert(resumo);
            atualizarPainel();

        } catch (erro) {
            console.error(erro);
            alert(`❌ Erro na leitura do PDF:\n\n${erro.message}`);
        } finally {
            btn.innerText = textoOriginal;
            btn.disabled = false;
        }
    });

    // --- BOTÃO 2: CAPTURAR CONSIGNADO ---
    document.getElementById('btn-consignado').addEventListener('click', () => {
        try {
            const dados = extrairConsignado();

            if (!dados) {
                const totalManual = prompt("Não encontrei a tabela de material consignado nesta página. Confirme que está na tela 'Detalhe do Pedido de Fatura' e, se preferir, digite o Total do Material aqui (ou cancele para tentar de novo depois):");
                if (!totalManual) throw new Error("Captura cancelada — tabela de consignado não encontrada.");
                const dizimoManual = prompt("Digite o Total de Dízimo do material:") || "0,00";
                GM_setValue("produtosConsignado", JSON.stringify({ itens: [], totalMaterial: totalManual, totalDizimo: dizimoManual, totalQuantidade: "" }));
                alert(`✅ Consignado registrado manualmente!\n\nTotal Material: ${totalManual}\nTotal Dízimo: ${dizimoManual}`);
                atualizarPainel();
                return;
            }

            if (!dados.totalMaterial) {
                dados.totalMaterial = prompt("Encontrei os itens, mas não a linha de total. Digite o Total do Material:") || "0,00";
            }
            if (!dados.totalDizimo) {
                dados.totalDizimo = prompt("Digite o Total de Dízimo do material:") || "0,00";
            }

            GM_setValue("produtosConsignado", JSON.stringify(dados));
            console.log("=== CONSIGNADO PARSEADO ===", dados);

            const listaItens = dados.itens
                .map(it => `• ${it.produto} — qtd ${it.quantidade} — total ${it.total} — dízimo ${it.dizimo}`)
                .join('\n');

            alert(
                `✅ Consignado capturado!\n\n` +
                `📦 ${dados.itens.length} produto(s):\n${listaItens || '(nenhum item individual encontrado)'}\n\n` +
                `💰 Total Material: ${dados.totalMaterial}\n` +
                `🔖 Total Dízimo: ${dados.totalDizimo}\n\n` +
                `Não esqueça de excluir esse pedido de fatura fictício no APMS, como você já faz normalmente.`
            );
            atualizarPainel();

        } catch (erro) {
            console.error(erro);
            alert(`❌ Erro ao capturar consignado:\n\n${erro.message}`);
        }
    });

    // --- BOTÃO DEBUG CRU: mostra a tabela de consignado linha por linha, sem parsing ---
    document.getElementById('btn-debug-consignado').addEventListener('click', () => {
        const resultado = debugTabelaConsignado();
        console.log("=== TABELA CRUA DO CONSIGNADO (sem parsing) ===");
        console.log(resultado);
        if (!resultado.encontrouTabela) {
            alert("Não encontrei nenhuma tabela com 'Produto' e 'Dízimo' nesta página. Veja no Console (F12) a lista de tabelas encontradas na página.");
        } else {
            alert(`Tabela encontrada com ${resultado.linhas.length} linhas. Veja o Console (F12) para copiar o conteúdo linha por linha.`);
        }
    });

    // --- BOTÃO 3a: CAPTURAR NGs NORMAL ---
    document.getElementById('btn-ngs-normal').addEventListener('click', () => {
        try {
            capturarNgs('Normal');
        } catch (erro) {
            console.error(erro);
            alert(`❌ Erro ao capturar NGs Normal:\n\n${erro.message}`);
        }
    });

    // --- BOTÃO 3b: CAPTURAR NGs REGISTRADA ---
    document.getElementById('btn-ngs-registrada').addEventListener('click', () => {
        try {
            capturarNgs('Registrada');
        } catch (erro) {
            console.error(erro);
            alert(`❌ Erro ao capturar NGs Registrada:\n\n${erro.message}`);
        }
    });

    // --- BOTÃO DEBUG CRU: despeja TODAS as tabelas da tela de Lote/NGs, sem filtrar ---
    document.getElementById('btn-debug-ngs').addEventListener('click', () => {
        const resultado = dumpTodasAsTabelas();
        console.log("=== TODAS AS TABELAS DA PÁGINA (Lote/NGs, sem parsing) ===");
        console.log(resultado);
        if (resultado.length === 0) {
            alert("Não encontrei nenhuma tabela nesta página.");
        } else {
            alert(`${resultado.length} tabela(s) encontrada(s) na página. Veja o Console (F12) para copiar cabeçalho e linhas de cada uma — me envie o conteúdo para eu ajustar o parser das NGs com precisão.`);
        }
    });

    // --- BOTÃO RESUMO: mostra tudo o que foi estruturado ---
    document.getElementById('btn-resumo').addEventListener('click', () => {
        const raw = GM_getValue("dadosRazao", "");
        if (!raw) {
            alert("Nenhuma captura feita ainda. Clique primeiro em 'Capturar Razão'.");
            return;
        }
        const dados = JSON.parse(raw);
        console.log("=== DADOS ESTRUTURADOS DO RAZÃO ===");
        console.log(dados);

        const rawConsignado = GM_getValue("produtosConsignado", "");
        if (rawConsignado) {
            console.log("=== DADOS ESTRUTURADOS DO CONSIGNADO ===");
            console.log(JSON.parse(rawConsignado));
        }

        const rawNormal = GM_getValue("ngsNormal", "");
        if (rawNormal) {
            console.log("=== DADOS ESTRUTURADOS DAS NGs NORMAL ===");
            console.log(JSON.parse(rawNormal));
        }

        const rawRegistrada = GM_getValue("ngsRegistrada", "");
        if (rawRegistrada) {
            console.log("=== DADOS ESTRUTURADOS DAS NGs REGISTRADA ===");
            console.log(JSON.parse(rawRegistrada));
        }

        alert("Dados completos impressos no Console (F12 → aba Console). Confira se todas as seções e valores batem com o sistema.");
    });

    // --- BOTÃO DEBUG: linhas cruas do Razão ---
    document.getElementById('btn-debug').addEventListener('click', () => {
        const linhas = JSON.parse(GM_getValue("linhasRazaoDebug", "[]"));
        if (linhas.length === 0) {
            alert("Nenhuma leitura feita ainda. Clique primeiro em 'Capturar Razão'.");
            return;
        }
        console.log("=== LINHAS CRUAS EXTRAÍDAS DO PDF ===");
        linhas.forEach((l, i) => console.log(`${i}: ${l}`));
        alert(`${linhas.length} linhas extraídas. Veja o Console (F12).`);
    });

    // ---------------------------------------------------------------
    // PASSO 4: GERAR NOVO DEMONSTRATIVO
    //
    // Fórmula do Saldo Final (corrigida e confirmada com caso real):
    //   SaldoAPMS (sinal real, positivo ou negativo)
    //   +MaterialConsignado + DízimoConsignado
    //   +NgPendenteNormal + DízimoNgNormal
    //   +NgPendenteRegistrada + DízimoNgRegistrada
    //   +TotalFrete (somado SOMENTE das NGs, não do Razão — evita duplicar)
    //
    // O saldo do razão entra com o sinal REAL que veio do APMS (não é
    // forçado a negativo) — se algum dia vier credor (positivo), ele soma
    // normalmente. Todos os demais itens (consignado, dízimos, NGs, frete)
    // são somados como valores positivos, pois representam responsabilidade/
    // crédito do colportor, independente do sinal do razão.
    //
    // Débitos/Créditos do Razão NÃO entram no resumo nem no cálculo —
    // por pedido explícito do usuário, para igualar ao 2.0.
    // ---------------------------------------------------------------
    function montarDemonstrativo() {
        const razao = JSON.parse(GM_getValue("dadosRazao", "{}"));
        const consignado = JSON.parse(GM_getValue("produtosConsignado", '{"itens":[],"totalMaterial":"0,00","totalDizimo":"0,00"}'));
        const ngsNormal = JSON.parse(GM_getValue("ngsNormal", '{"itens":[],"totalValor":"0,00","totalFrete":"0,00","totalDizimo":"0,00"}'));
        const ngsRegistrada = JSON.parse(GM_getValue("ngsRegistrada", '{"itens":[],"totalValor":"0,00","totalFrete":"0,00","totalDizimo":"0,00"}'));

        const saldoRazao = parseValorPtBr(razao.saldoConta);
        // Total de Débitos/Créditos do Razão: intencionalmente NÃO usados aqui.

        const materialConsignado = parseValorPtBr(consignado.totalMaterial);
        const dizimoConsignado = parseValorPtBr(consignado.totalDizimo);
        const ngPendenteNormal = parseValorPtBr(ngsNormal.totalValor);
        const dizimoNgNormal = parseValorPtBr(ngsNormal.totalDizimo);
        const freteNgNormal = parseValorPtBr(ngsNormal.totalFrete);
        const ngPendenteRegistrada = parseValorPtBr(ngsRegistrada.totalValor);
        const dizimoNgRegistrada = parseValorPtBr(ngsRegistrada.totalDizimo);
        const freteNgRegistrada = parseValorPtBr(ngsRegistrada.totalFrete);

        const totalDizimoConsolidado = dizimoConsignado + dizimoNgNormal + dizimoNgRegistrada;
        // Frete consolidado = SOMENTE o frete das NGs (Normal + Registrada).
        // O "Total Frete" do Razão (PDF) é ignorado aqui de propósito, para
        // não contar o mesmo frete duas vezes.
        const totalFreteConsolidado = freteNgNormal + freteNgRegistrada;

        const lucroReal =
            saldoRazao
            + Math.abs(materialConsignado)
            + Math.abs(dizimoConsignado)
            + Math.abs(ngPendenteNormal)
            + Math.abs(dizimoNgNormal)
            + Math.abs(ngPendenteRegistrada)
            + Math.abs(dizimoNgRegistrada)
            + Math.abs(totalFreteConsolidado);

        return {
            nome: razao.nome || GM_getValue("nomeColportor", ""),
            saldoRazao, totalFreteConsolidado,
            materialConsignado, dizimoConsignado,
            ngPendenteNormal, dizimoNgNormal, freteNgNormal,
            ngPendenteRegistrada, dizimoNgRegistrada, freteNgRegistrada,
            totalDizimoConsolidado, lucroReal,
            itensConsignado: consignado.itens || [],
            itensNgsNormal: ngsNormal.itens || [],
            itensNgsRegistrada: ngsRegistrada.itens || []
        };
    }

    function linhaItens(itens, colunas) {
        if (!itens || itens.length === 0) {
            return `<tr><td colspan="${colunas.length}" style="color:#999;">Nenhum lançamento</td></tr>`;
        }
        return itens.map(it => `<tr>${colunas.map(c => `<td>${it[c] ?? ''}</td>`).join('')}</tr>`).join('');
    }

    // Linha de rodapé de totais para as tabelas de detalhe
    function linhaTotal(labelColSpan, valores) {
        const celulas = valores.map(v => `<td>R$ ${fmtBr(v)}</td>`).join('');
        return `<tr class="total-row"><td colspan="${labelColSpan}">Total</td>${celulas}</tr>`;
    }

    function gerarHtmlDemonstrativo(d) {
        const corLucro = d.lucroReal < 0 ? '#e53e3e' : '#2f7d4f';
        const dataGeracao = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        // Dízimo por item de NG (10% do valor de cada lançamento), só para exibição.
        const itensNgsNormalComDizimo = (d.itensNgsNormal || []).map(it => ({ ...it, dizimo: fmtBr(parseValorPtBr(it.valor) * 0.10) }));
        const itensNgsRegistradaComDizimo = (d.itensNgsRegistrada || []).map(it => ({ ...it, dizimo: fmtBr(parseValorPtBr(it.valor) * 0.10) }));

        return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Demonstrativo de Saldo - ${d.nome}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
<style>
  :root {
    --navy: #1a365d;
    --navy-dark: #0f2340;
    --gold: #d9a441;
    --gold-light: #f7e9cf;
    --bg: #FAF7EE;
    --green: #2f7d4f;
    --green-bg: #e6f4ea;
    --red: #c0392b;
    --red-bg: #fbeae7;
  }
  * { box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; background: var(--bg); color: #2d2d2d; padding: 30px; margin:0; }
  .card { max-width: 820px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 0 0 30px 0; box-shadow: 0 4px 18px rgba(15,35,64,.12); overflow: hidden; }
  .cabecalho { background: linear-gradient(135deg, var(--navy) 0%, var(--navy-dark) 100%); padding: 30px 32px; color: #fff; display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px; }
  .cabecalho img { width: 62px; height: auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,.3)); }
  .cabecalho h1 { font-size: 21px; margin: 4px 0 2px 0; letter-spacing: .3px; }
  .cabecalho .sub { font-size: 12px; color: var(--gold-light); opacity: .9; }
  .corpo { padding: 26px 32px 0 32px; }
  .nome-colportor { font-size: 17px; font-weight: bold; color: var(--navy); margin-bottom: 2px; text-align:center; }
  .data-emissao { font-size: 11px; color: #888; margin-bottom: 18px; text-align:center; }
  h2 { color: var(--navy); font-size: 14px; margin: 26px 0 4px 0; border-bottom: 2px solid var(--gold-light); padding-bottom: 6px; text-transform: uppercase; letter-spacing: .4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 12.5px; font-family: Arial, sans-serif; table-layout: fixed; }
  th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #eee; overflow-wrap: break-word; }
  th { background: var(--gold-light); color: var(--navy-dark); font-size: 11px; text-transform: uppercase; }
  table th:first-child, table td:first-child { width: 40%; text-align: left; }
  table th:not(:first-child), table td:not(:first-child) { text-align: center; }
  .resumo-destaque { margin-top: 18px; background: linear-gradient(180deg, var(--gold-light) 0%, #fff 100%); border: 1px solid #eadcbd; border-radius: 12px; padding: 4px 18px 18px 18px; }
  .resumo-destaque h2 { border-bottom-color: #e3cfa0; margin-top: 16px; }
  .resumo td:first-child { color: #555; width: auto; text-align: left; }
  .resumo td:last-child { font-weight: bold; text-align: right; width: auto; }
  .resumo tr.destaque td { color: var(--navy); font-weight: bold; }
  .total-row td { font-weight: bold; background: #faf7ee; border-top: 2px solid var(--gold-light); }
  .lucro { margin-top: 18px; padding: 20px; border-radius: 10px; background: var(--navy); text-align: center; }
  .lucro .label { font-size: 12px; color: var(--gold-light); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
  .lucro .valor { font-size: 30px; font-weight: bold; color: #fff; font-family: Arial, sans-serif; }
  .botoes { text-align: center; margin-top: 26px; padding: 0 32px; }
  .botoes button { font-family: Arial, sans-serif; font-size: 13px; padding: 10px 20px; margin: 4px; border: none; border-radius: 6px; cursor: pointer; background: var(--navy); color: #fff; }
  .botoes button:hover { background: var(--navy-dark); }
  .botoes button.secundario { background: #fff; color: var(--navy); border: 1px solid var(--navy); }
  .rodape { margin-top: 24px; padding: 0 32px; font-size: 10.5px; color: #999; font-family: Arial, sans-serif; }
  @media print { body { background: #fff; padding: 0; } .card { box-shadow: none; } .botoes { display: none; } }
</style></head>
<body>
  <div class="card" id="demonstrativo-card">
    <div class="cabecalho">
      <img src="data:image/png;base64,${LOGO_SELS_BASE64}" alt="SELS UCOB" />
      <h1>Demonstrativo de Saldo</h1>
      <div class="sub">SELS UCOB · União Centro Oeste Brasileira</div>
    </div>

    <div class="corpo">
      <div class="nome-colportor">${d.nome}</div>
      <div class="data-emissao">Gerado em ${dataGeracao}</div>

      <div class="resumo-destaque">
        <h2>Resumo do Acerto</h2>
        <table class="resumo">
          <tr class="destaque"><td>Saldo APMS (razão original)</td><td>R$ ${fmtBr(d.saldoRazao)}</td></tr>
          <tr><td>Total Consignado</td><td>R$ ${fmtBr(d.materialConsignado)}</td></tr>
          <tr><td>Total Dízimo (consignado + NGs normal + NGs registrada)</td><td>R$ ${fmtBr(d.totalDizimoConsolidado)}</td></tr>
          <tr><td>Total NGs Pendentes (normal)</td><td>R$ ${fmtBr(d.ngPendenteNormal)}</td></tr>
          <tr><td>Total NGs Pendentes (registrada)</td><td>R$ ${fmtBr(d.ngPendenteRegistrada)}</td></tr>
          <tr><td>Total Frete (NGs normal + NGs registrada)</td><td>R$ ${fmtBr(d.totalFreteConsolidado)}</td></tr>
        </table>

        <div class="lucro">
          <div class="label">Lucro real a solicitar</div>
          <div class="valor">R$ ${fmtBr(Math.abs(d.lucroReal))}${d.lucroReal < 0 ? ' (a pagar)' : ''}</div>
        </div>
      </div>

      <h2>Material em Consignado (Atualizado)</h2>
      <table>
        <tr><th>Produto</th><th>Qtd.</th><th>Total</th><th>Dízimo</th></tr>
        ${linhaItens(d.itensConsignado, ['produto', 'quantidade', 'total', 'dizimo'])}
        ${linhaTotal(2, [d.materialConsignado, d.dizimoConsignado])}
      </table>

      <h2>NGs Pendentes — Normal</h2>
      <table>
        <tr><th>Assinatura</th><th>Qtd. Assin.</th><th>Valor</th><th>Dízimo</th><th>V. Frete</th></tr>
        ${linhaItens(itensNgsNormalComDizimo, ['descricao', 'qtdAssinaturas', 'valor', 'dizimo', 'frete'])}
        ${linhaTotal(2, [d.ngPendenteNormal, d.dizimoNgNormal, d.freteNgNormal])}
      </table>

      <h2>NGs Pendentes — Registrada</h2>
      <table>
        <tr><th>Assinatura</th><th>Qtd. Assin.</th><th>Valor</th><th>Dízimo</th><th>V. Frete</th></tr>
        ${linhaItens(itensNgsRegistradaComDizimo, ['descricao', 'qtdAssinaturas', 'valor', 'dizimo', 'frete'])}
        ${linhaTotal(2, [d.ngPendenteRegistrada, d.dizimoNgRegistrada, d.freteNgRegistrada])}
      </table>
    </div>

    <div class="botoes" id="botoes-export">
      <button onclick="baixarPNG()">Baixar imagem (PNG)</button>
      <button class="secundario" onclick="baixarPDF()">Baixar PDF</button>
    </div>

    <p class="rodape">Gerado automaticamente pelo Copiloto SELS · confira os valores com o setor financeiro em caso de dúvida.</p>
  </div>

<script>
function aguardarImagens(container) {
  const imgs = Array.from(container.querySelectorAll('img'));
  return Promise.all(imgs.map(img => {
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    return new Promise(resolve => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
      // Segurança extra: nunca trava a exportação por mais de 3s esperando uma imagem.
      setTimeout(resolve, 3000);
    });
  }));
}

async function capturarCard() {
  const card = document.getElementById('demonstrativo-card');
  const botoes = document.getElementById('botoes-export');
  // Garante que a logo (e qualquer outra imagem) já esteja pintada antes do html2canvas rodar.
  await aguardarImagens(card);
  // Esconde os botões de exportar durante a captura, para não aparecerem na imagem/PDF gerado.
  const displayOriginal = botoes.style.display;
  botoes.style.display = 'none';
  try {
    return await html2canvas(card, { scale: 2, backgroundColor: '#FAF7EE', useCORS: true, imageTimeout: 5000 });
  } finally {
    botoes.style.display = displayOriginal;
  }
}

async function baixarPNG() {
  const canvas = await capturarCard();
  const link = document.createElement('a');
  link.download = 'demonstrativo-${d.nome.replace(/\s+/g, '_')}.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function baixarPDF() {
  const canvas = await capturarCard();
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const widthMm = canvas.width * 0.264583 / 2;
  const heightMm = canvas.height * 0.264583 / 2;
  const pdf = new jsPDF({ orientation: heightMm > widthMm ? 'p' : 'l', unit: 'mm', format: [widthMm + 20, heightMm + 20] });
  pdf.addImage(imgData, 'PNG', 10, 10, widthMm, heightMm);
  pdf.save('demonstrativo-${d.nome.replace(/\s+/g, '_')}.pdf');
}
<\/script>
</body></html>`;
    }

    // --- BOTÃO GERAR NOVO DEMONSTRATIVO ---
    document.getElementById('btn-gerar').addEventListener('click', () => {
        try {
            const dados = montarDemonstrativo();
            const html = gerarHtmlDemonstrativo(dados);
            const janela = window.open('', '_blank');
            if (!janela) {
                alert("O navegador bloqueou a nova aba (pop-up). Permita pop-ups para este site e tente de novo.");
                return;
            }
            janela.document.open();
            janela.document.write(html);
            janela.document.close();
        } catch (erro) {
            console.error(erro);
            alert(`❌ Erro ao gerar demonstrativo:\n\n${erro.message}`);
        }
    });

    document.getElementById('btn-limpar').addEventListener('click', () => {
        GM_deleteValue("nomeColportor");
        GM_deleteValue("dadosRazao");
        GM_deleteValue("produtosConsignado");
        GM_deleteValue("ngsNormal");
        GM_deleteValue("ngsRegistrada");
        GM_deleteValue("linhasRazaoDebug");
        alert("Memória limpa!");
        location.reload();
    });

    atualizarPainel();
})();
