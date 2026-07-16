class State {

    constructor() {

        this.reset();

    }

    reset() {

        this.data = {

            campaign: null,

            colportor: null,

            razao: {},

            consignado: {},

            ng: {},

            demonstrativo: {},

            status: "ready"

        };

    }

    get(key) {

        return this.data[key];

    }

    set(key, value) {

        this.data[key] = value;

    }

}

export default new State();
