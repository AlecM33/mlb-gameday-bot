// @ts-check
const { LOG_LEVEL } = require('../config/globals');
const LOGGER = require('./logger')(process.env.LOG_LEVEL?.trim() || LOG_LEVEL.INFO);

/**
 * @param {string} url
 * @param {ReconnectingWebSocketOptions} [options]
 */
module.exports = (url, {
    heartbeatMessage,
    heartbeatInterval,
    connectionTimeout = 10000,
    reconnectDelay = 3000,
    WebSocket: WSClass = require('ws').WebSocket
} = {}) => {
    const listeners = { open: [], close: [], message: [], error: [] };
    /** @type {import('ws').WebSocket | null} */
    let socket = null;
    let intentionallyClosed = false;
    let heartbeatTimer = null;
    let connectTimeout = null;

    /**
     * @param {() => void} fn
     * @returns {void}
     */
    const heartbeat = () => {
        LOGGER.trace(`ping: ${heartbeatMessage}`);
        if (socket?.readyState === WSClass.OPEN) {
            socket.send(heartbeatMessage);
        }
    };

    /**
     * @returns {void}
     */
    const connect = () => {
        if (intentionallyClosed) {
            return;
        }
        socket = new WSClass(url);

        connectTimeout = setTimeout(() => {
            LOGGER.debug('WebSocket connection timed out. Retrying...');
            socket.terminate();
        }, connectionTimeout);

        socket.on('open', () => {
            LOGGER.info('WebSocket opened.');
            clearTimeout(connectTimeout);
            if (heartbeatMessage && heartbeatInterval) {
                heartbeatTimer = setInterval(heartbeat, heartbeatInterval);
            }
            listeners.open.forEach(fn => fn({}));
        });

        socket.on('message', (data) => {
            listeners.message.forEach(fn => fn({ data: data.toString() }));
        });

        socket.on('error', (e) => {
            LOGGER.error(`WebSocket error: ${e.message ?? e}`);
            listeners.error.forEach(fn => fn(e));
        });

        socket.on('close', () => {
            clearTimeout(connectTimeout);
            clearInterval(heartbeatTimer);
            listeners.close.forEach(fn => fn({}));
            if (!intentionallyClosed) {
                LOGGER.info(`WebSocket closed. Reconnecting in ${reconnectDelay}ms.`);
                setTimeout(connect, reconnectDelay);
            }
        });
    };

    connect();

    /** @returns {ReconnectingWebSocket} */
    return {
        /**
         * @param {WebSocketEventType} event
         * @param {(event: any) => void} fn
         */
        addEventListener: (event, fn) => {
            if (listeners[event]) {
                listeners[event].push(fn);
            }
        },
        /** @param {string} data */
        send: (data) => {
            if (socket?.readyState === WSClass.OPEN) {
                socket.send(data);
            }
        },
        close: () => {
            intentionallyClosed = true;
            clearTimeout(connectTimeout);
            clearInterval(heartbeatTimer);
            socket?.close();
        }
    };
};
