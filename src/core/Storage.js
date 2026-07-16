import Config from "./Config.js";

class Storage {

    static save(key, value) {

        localStorage.setItem(
            `${Config.STORAGE_PREFIX}.${key}`,
            JSON.stringify(value)
        );

    }

    static load(key) {

        const value = localStorage.getItem(
            `${Config.STORAGE_PREFIX}.${key}`
        );

        if (!value) {
            return null;
        }

        return JSON.parse(value);

    }

    static remove(key) {

        localStorage.removeItem(
            `${Config.STORAGE_PREFIX}.${key}`
        );

    }

}

export default Storage;