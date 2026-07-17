/**
 * ======================================================================
 * SELS Assistant
 * ----------------------------------------------------------------------
 * Regras de negócio relacionadas aos materiais.
 *
 * Este arquivo contém todas as exceções referentes aos materiais
 * utilizados pelo APMS.
 *
 * Sempre que um novo material promocional for criado ou alguma regra
 * mudar, a alteração deverá ser feita APENAS neste arquivo.
 * ======================================================================
 */

/**
 * Materiais que NÃO possuem cobrança de dízimo.
 *
 * Regras:
 * - Comparação por "contains" (includes).
 * - Não diferencia maiúsculas e minúsculas.
 */
export const MATERIAL_RULES = {

    SEM_DIZIMO: [

        "Jogo da Memória - Oque Vou Ser Quando Crescer",

        "MINIATURA",

        "LIVRO ILUSTRADO N.A. - O QUE VOU SER QUANDO CRESCER"

    ]

};

/**
 * Verifica se o material deve cobrar dízimo.
 *
 * @param {string} nomeMaterial
 * @returns {boolean}
 */
export function cobraDizimo(nomeMaterial) {

    if (!nomeMaterial) {
        return true;
    }

    const nome = nomeMaterial.trim().toUpperCase();

    const isento = MATERIAL_RULES.SEM_DIZIMO.some(regra =>
        nome.includes(regra.toUpperCase())
    );

    return !isento;

}

/**
 * Calcula o valor do dízimo de um material.
 *
 * @param {string} nomeMaterial
 * @param {number} valorMaterial
 * @returns {number}
 */
export function calcularDizimoMaterial(nomeMaterial, valorMaterial) {

    if (!cobraDizimo(nomeMaterial)) {
        return 0;
    }

    return Number((valorMaterial * 0.10).toFixed(2));

}