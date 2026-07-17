/**
 * ======================================================================
 * TABLE PARSER
 * ----------------------------------------------------------------------
 * Responsável por transformar tabelas extraídas dos PDFs do APMS
 * em objetos JavaScript.
 *
 * Nenhuma regra de negócio deve existir aqui.
 * ======================================================================
 */

export default class TableParser {

    constructor() {

        this.headers = [];

        this.rows = [];

    }

    /**
     * Recebe uma matriz contendo as linhas da tabela.
     *
     * Exemplo:
     *
     * [
     *   ["Nome","Saldo"],
     *   ["João","-250,00"],
     *   ["Maria","350,00"]
     * ]
     */
    parse(tableData) {

        this.headers = [];

        this.rows = [];

        if (!tableData || tableData.length === 0) {

            return [];

        }

        this.headers = tableData[0];

        for (let i = 1; i < tableData.length; i++) {

            const row = {};

            this.headers.forEach((header, index) => {

                row[header] = tableData[i][index];

            });

            this.rows.push(row);

        }

        return this.rows;

    }

}