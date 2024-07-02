class LocalStorage {
    /**
     * 
     * @param {Window} window 
     */
    constructor(window) {
        /**
         * @type {Window}
         */
        this.window = window;
    }

    /**
     * 
     * @param {string} key Key to look for
     * @param {boolean} deserialize If true, will JSON parse the value
     * @returns {string | object}
     */
    get(key, deserialize=false) {
        let value = this.window.localStorage.getItem(key);
        if (deserialize) {
            value = JSON.parse(value);
        }
        return value;
    }

    /**
     * 
     * @param {string} key Key to store in
     * @param {string | object} value Value: String or object
     * @param {boolean} serialize Will JSON serialize passed value before storing
     * @returns {void}
     */
    set(key, value, serialize=false) {
        if (value == null) {
            this.clear(key);
            return;
        }

        if (serialize) {
            value = JSON.stringify(value);
        }
        this.window.localStorage.setItem(key, value);
    }

    clear() {
        this.window.localStorage.clear();
    }

    /**
     * 
     * @param {string} key Key to remove
     * @returns {void}
     */
    remove(key) {
        this.window.localStorage.removeItem();
    }
}
