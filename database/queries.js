// @ts-check
const pool = require('./db');

module.exports = {
    /**
     * @returns {Promise<ChannelSubscription[]>}
     */
    getAllSubscribedChannels: () => {
        return query({
            text: 'SELECT channel_id, scoring_plays_only, delay FROM gameday_subscribe_channels;',
            values: []
        });
    },

    /**
     * @param {string} guildId
     * @param {string} channelId
     * @param {boolean} scoringPlaysOnly
     * @param {number} reportingDelay
     * @returns {Promise<any[]>}
     */
    addToSubscribedChannels: (guildId, channelId, scoringPlaysOnly, reportingDelay) => {
        return query({
            text: 'INSERT INTO gameday_subscribe_channels VALUES ($1, $2, $3, $4);',
            values: [guildId, channelId, scoringPlaysOnly, reportingDelay]
        });
    },

    /**
     * @param {string} guildId
     * @param {string} channelId
     * @param {boolean | null} scoringPlaysOnly
     * @param {number | null} reportingDelay
     * @returns {Promise<any[]>}
     */
    updatePlayPreference: (guildId, channelId, scoringPlaysOnly, reportingDelay) => {
        return query({
            text: 'UPDATE gameday_subscribe_channels SET scoring_plays_only' +
                ' = $1, delay = $2 WHERE guild_id = $3 and channel_id = $4 RETURNING channel_id;',
            values: [scoringPlaysOnly, reportingDelay, guildId, channelId]
        });
    },

    /**
     * @param {string} guildId
     * @param {string} channelId
     * @returns {Promise<any[]>}
     */
    removeFromSubscribedChannels: (guildId, channelId) => {
        return query({
            text: 'DELETE FROM gameday_subscribe_channels WHERE guild_id = $1 AND channel_id = $2;',
            values: [guildId, channelId]
        });
    }
};

/**
 * @param {{ text: string, values: any[] }} queryParams
 * @returns {Promise<any[]>}
 */
function query (queryParams) {
    return new Promise((resolve, reject) => {
        pool.connect().then((client) => client.query(queryParams, (err, res) => {
            if (err) {
                client.release();
                reject(err);
            } else {
                client.release();
                resolve(res.rows);
            }
        })).catch((e) => {
            console.error(e);
            reject(new Error('The bot could not complete your request due to connection issues.'));
        });
    });
}
