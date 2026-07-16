export default class Logger {

    static info(message, data = null) {
        console.log(
            `%c[SELS Assistant]`,
            "color:#2E86DE;font-weight:bold;",
            message,
            data ?? ""
        );
    }

    static warn(message, data = null) {
        console.warn(
            `[SELS Assistant] ${message}`,
            data ?? ""
        );
    }

    static error(message, data = null) {
        console.error(
            `[SELS Assistant] ${message}`,
            data ?? ""
        );
    }

}
