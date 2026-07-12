-- version 3.4.0 introduced the advanced_stats column. To migrate existing deployments:
-- ALTER TABLE gameday_subscribe_channels ADD COLUMN IF NOT EXISTS advanced_stats BOOLEAN NOT NULL DEFAULT TRUE;


CREATE TABLE IF NOT EXISTS gameday_subscribe_channels(
    guild_id character varying(64) NOT NULL,
    channel_id character varying(64) NOT NULL,
    scoring_plays_only BOOLEAN NOT NULL DEFAULT FALSE,
    delay smallint NOT NULL,
    advanced_stats BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (guild_id, channel_id)
);
