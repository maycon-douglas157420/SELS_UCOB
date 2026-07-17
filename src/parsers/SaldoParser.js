import Colportor from "../models/Colportor.js";

export default class SaldoParser {

    constructor() {

        this.colportores = new Map();

    }

    parse(textoPDF) {

        // Limpa a lista
        this.colportores.clear();

        // Divide o PDF em linhas
        const linhas = textoPDF.split("\n");

        for (const linha of linhas) {

            this.processarLinha(linha);

        }

        return this.colportores;

    }

    processarLinha(linha) {

        // Será implementado na próxima etapa.

    }

}