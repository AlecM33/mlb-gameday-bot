const pool = require('./db');

module.exports = {

    getAllSubscribedChannels: () => {
        return query({
            text: 'SELECT channel_id FROM gameday_subscribe_channels;',
            values: []
        });
    },

    addToSubscribedChannels: (guildId, channelId) => {
        return query({
            text: 'INSERT INTO gameday_subscribe_channels VALUES ($1, $2);',
            values: [guildId, channelId]
        });
    },

    removeFromSubscribedChannels: (guildId, channelId) => {
        return query({
            text: 'DELETE FROM gameday_subscribe_channels WHERE guild_id = $1 AND channel_id = $2;',
            values: [guildId, channelId]
        });
    }
};

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
