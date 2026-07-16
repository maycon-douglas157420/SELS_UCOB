import Logger from "../core/Logger.js";
import APMSAdapter from "../adapters/APMSAdapter.js";

export default class GenerateStatementWorkflow {

    constructor() {

        this.apms = new APMSAdapter();

    }

    start() {

        Logger.success("Iniciando geração do Demonstrativo.");

        this.openReports();

    }

    openReports() {

        Logger.info("Abrindo menu Relatórios.");

    }

}