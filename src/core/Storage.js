export default class Storage {

    static save(key, value) {

        GM_setValue(key, value);

    }

    static load(key, defaultValue = null) {

        return GM_getValue(key, defaultValue);

    }

    static remove(key) {

        GM_deleteValue(key);

    }

}
