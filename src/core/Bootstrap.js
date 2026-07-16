import Logger from "./Logger.js";
import Config from "./Config.js";
import State from "./State.js";

export default class Bootstrap {

    static start() {

        window.SELS_DEBUG = Config.DEBUG;

        Logger.info(`Iniciando ${Config.NAME} v${Config.VERSION}`);

        State.apmsLoaded = this.isAPMS();

        if (!State.apmsLoaded) {

            Logger.warn("APMS não detectado.");

            return;

        }

        Logger.success("APMS detectado.");

    }

    static isAPMS() {

        return window.location.hostname.includes("apms");

    }

}