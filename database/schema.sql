CREATE TABLE gameday_subscribe_channels(
    guild_id character varying(64) NOT NULL,
    channel_id character varying(64) NOT NULL,
    PRIMARY KEY (guild_id, channel_id)
);
