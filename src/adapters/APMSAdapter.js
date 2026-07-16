import Logger from "../core/Logger.js";

export default class APMSAdapter {

    constructor() {

        this.document = document;

    }

    /**
     * Procura um elemento
     */
    find(selector) {

        return this.document.querySelector(selector);

    }

    /**
     * Procura vários elementos
     */
    findAll(selector) {

        return [...this.document.querySelectorAll(selector)];

    }

    /**
     * Clica em um elemento
     */
    click(selector) {

        const element = this.find(selector);

        if (!element) {

            Logger.warn(`Elemento não encontrado: ${selector}`);

            return false;

        }

        element.click();

        return true;

    }

    /**
     * Digita em um campo
     */
    type(selector, value) {

        const element = this.find(selector);

        if (!element) {

            Logger.warn(`Campo não encontrado: ${selector}`);

            return false;

        }

        element.focus();

        element.value = value;

        element.dispatchEvent(new Event("input",{bubbles:true}));

        element.dispatchEvent(new Event("change",{bubbles:true}));

        return true;

    }

}
