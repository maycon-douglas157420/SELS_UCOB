export default class Statement {

    constructor() {

        // Dados do Colportor
        this.name = "";
        this.campaign = "";

        // Razão
        this.accountBalance = 0;

        // Consignado
        this.consignedValue = 0;
        this.consignedTithe = 0;

        // Nota de Garantia
        this.ngNormal = 0;
        this.ngRegistered = 0;

        this.ngNormalTithe = 0;
        this.ngRegisteredTithe = 0;

        // Outros
        this.freight = 0;
        this.interest = 0;

    }

}
