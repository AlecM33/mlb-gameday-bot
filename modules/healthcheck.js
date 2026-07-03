// @ts-check
/**
 * Optional healthchecks.io uptime monitoring integration.
 * Set HC_PING_URL to enable. Set HC_PING_INTERVAL_MS to configure the interval. Defaults to 600000ms (10 min).
 */

const { LOG_LEVEL } = require('../config/globals');
const LOGGER = require('./logger')(process.env.LOG_LEVEL?.trim() || LOG_LEVEL.INFO);

const HC_PING_URL = process.env.HC_PING_URL?.trim();
const HC_PING_INTERVAL_MS = parseInt(process.env.HC_PING_INTERVAL_MS?.trim()) || 600000;

/**
 * Sends a single GET request to the configured healthchecks.io ping URL.
 * @returns {Promise<void>}
 */
async function ping () {
    const response = await fetch(HC_PING_URL);
    LOGGER.debug(`Healthcheck ping responded: ${response.status}`);
}

/**
 * Schedules recurring pings with drift correction.
 * Each tick advances a fixed `nextPing` wall-clock target by `intervalMs`, then schedules
 * the next setTimeout for the remaining time to that target. This prevents compounding drift
 * that would otherwise occur if each call were simply scheduled `intervalMs` after the previous
 * one actually ran.
 * @param {number} intervalMs
 */
function schedulePings (intervalMs) {
    let nextPing = Date.now() + intervalMs;

    const tick = async () => {
        try {
            await ping();
        } catch (e) {
            LOGGER.error('Healthcheck ping failed: ' + e);
        }
        nextPing += intervalMs;
        const delay = Math.max(0, nextPing - Date.now());
        setTimeout(tick, delay);
    };

    setTimeout(tick, intervalMs);
    LOGGER.info(`Healthcheck: pinging ${HC_PING_URL} every ${intervalMs / 1000}s`);
}

/**
 * Starts the healthcheck ping loop.
 */
function start () {
    if (!HC_PING_URL) {
        LOGGER.debug('Healthcheck: HC_PING_URL not configured, skipping uptime monitoring.');
        return;
    }
    schedulePings(HC_PING_INTERVAL_MS);
}

module.exports = { start, ping, schedulePings };
