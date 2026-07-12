// @ts-check
const { LOG_LEVEL } = require('../config/globals');

const RESET = '\x1b[0m';
const COLORS = {
    info: '\x1b[34m', // blue
    error: '\x1b[31m', // red
    warn: '\x1b[33m', // yellow
    debug: '\x1b[36m', // cyan
    trace: '\x1b[35m' // magenta
};

/** @param {string} level @param {string} label */
function prefix (level, label) {
    return `${COLORS[level]}${label}${RESET}`;
}

/** @returns {Logger} */
module.exports = function (logLevel = LOG_LEVEL.INFO) {
    return {
        logLevel,
        info (message = '') {
            const now = new Date();
            console.log(prefix('info', 'LOG   '), now.toGMTString(), ': ', message);
        },

        error (message = '') {
            if (logLevel === LOG_LEVEL.INFO) { return; }
            const now = new Date();
            console.error(prefix('error', 'ERROR '), now.toGMTString(), ': ', message);
        },

        warn (message = '') {
            if (logLevel === LOG_LEVEL.INFO || logLevel === LOG_LEVEL.ERROR) return;
            const now = new Date();
            console.warn(prefix('warn', 'WARN  '), now.toGMTString(), ': ', message);
        },

        debug (message = '') {
            if (logLevel === LOG_LEVEL.INFO || logLevel === LOG_LEVEL.ERROR || logLevel === LOG_LEVEL.WARN) return;
            const now = new Date();
            console.debug(prefix('debug', 'DEBUG '), now.toGMTString(), ': ', message);
        },

        trace (message = '') {
            if (
                logLevel === LOG_LEVEL.INFO
                    || logLevel === LOG_LEVEL.WARN
                    || logLevel === LOG_LEVEL.DEBUG
                    || logLevel === LOG_LEVEL.ERROR
            ) return;
            const now = new Date();
            console.log(prefix('trace', 'TRACE '), now.toGMTString(), ': ', message);
        }
    };
};
