/**
 * ============================================================
 * SELS Assistant V6
 * Logger
 * ============================================================
 */

class Logger {

    static info(message, ...args) {
        console.log(
            `%c[SELS]%c ${message}`,
            "color:#1976d2;font-weight:bold;",
            "color:inherit;",
            ...args
        );
    }

    static success(message, ...args) {
        console.log(
            `%c[SELS]%c ${message}`,
            "color:#2e7d32;font-weight:bold;",
            "color:inherit;",
            ...args
        );
    }

    static warn(message, ...args) {
        console.warn(
            `%c[SELS]%c ${message}`,
            "color:#f57c00;font-weight:bold;",
            "color:inherit;",
            ...args
        );
    }

    static error(message, ...args) {
        console.error(
            `%c[SELS]%c ${message}`,
            "color:#c62828;font-weight:bold;",
            "color:inherit;",
            ...args
        );
    }

    static debug(message, ...args) {

        if (!window.SELS_DEBUG) {
            return;
        }

        console.log(
            `%c[DEBUG]%c ${message}`,
            "color:#7b1fa2;font-weight:bold;",
            "color:inherit;",
            ...args
        );

    }

}

export default Logger;
