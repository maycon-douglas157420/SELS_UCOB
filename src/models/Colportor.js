export default class Colportor {

    constructor(nome) {

        this.nome = nome;

        // Razão
        this.saldoRazao = 0;

        // Consignação
        this.materiais = [];
        this.totalConsignado = 0;
        this.dizimoConsignado = 0;

        // Notas de Garantia
        this.ngs = [];
        this.totalNGNormal = 0;
        this.dizimoNGNormal = 0;

        this.totalNGRegistrada = 0;
        this.dizimoNGRegistrada = 0;

        this.totalFrete = 0;

        // Resultado
        this.saldoDisponivel = 0;
    }

}