const globalCache = require('./global-cache');
const globals = require('../config/globals');
const commandUtil = require('./command-util');

module.exports = {
    process: (currentPlayJSON, feed, homeTeamEmoji, awayTeamEmoji) => {
        let reply = '';
        if (!globalCache.values.game.startReported
            && currentPlayJSON.playEvents?.find(event => event?.details?.description === 'Status Change - In Progress')) {
            globalCache.values.game.startReported = true;
            reply += 'A game is starting!' + getWeatherString(feed);
        }
        let lastEvent;
        if (currentPlayJSON.about?.isComplete
            || globals.EVENT_WHITELIST.includes((currentPlayJSON.result?.eventType || currentPlayJSON.details?.eventType))) {
            reply += getDescription(currentPlayJSON, feed);
            if (currentPlayJSON.result?.isOut || currentPlayJSON.details?.isOut) {
                reply += ' **' + currentPlayJSON.count.outs + (currentPlayJSON.count.outs > 1 ? ' outs. **' : ' out. **');
            }
            if (globals.PITCH_BY_PITCH_WHITELIST.includes((currentPlayJSON.result?.eventType || currentPlayJSON.details?.eventType))
                && !currentPlayJSON.about?.hasReview) {
                reply += ` [Pitch by pitch](https://www.mlb.com/gameday/${globalCache.values.game.currentGamePk}/play/${currentPlayJSON.atBatIndex})`;
            }
            if (!currentPlayJSON.reviewDetails?.inProgress
                && (currentPlayJSON.about?.isScoringPlay || currentPlayJSON.details?.isScoringPlay)) {
                reply = addScore(reply, currentPlayJSON, feed, homeTeamEmoji, awayTeamEmoji);
            }
            if (!currentPlayJSON.about?.hasReview) {
                if (currentPlayJSON.playEvents) {
                    lastEvent = currentPlayJSON.playEvents[currentPlayJSON.playEvents.length - 1];
                    if (lastEvent?.details?.isInPlay) {
                        reply = addMetrics(lastEvent, reply);
                    }
                } else if (currentPlayJSON.details?.isInPlay) {
                    reply = addMetrics(currentPlayJSON, reply);
                }
            }
        }
        /* two kinds of objects get processed - "at bats", which will have a "result" object, and events within at bats, which put
            the same information in a "details" object. So we often have to check for both.
         */
        return {
            reply,
            isStartEvent: currentPlayJSON.playEvents?.find(event => event?.details?.description === 'Status Change - In Progress'),
            isOut: currentPlayJSON.result?.isOut || currentPlayJSON.details?.isOut,
            outs: currentPlayJSON.count?.outs,
            homeScore: (currentPlayJSON.result ? currentPlayJSON.result.homeScore : currentPlayJSON.details?.homeScore),
            awayScore: (currentPlayJSON.result ? currentPlayJSON.result.awayScore : currentPlayJSON.details?.awayScore),
            isComplete: currentPlayJSON.about?.isComplete,
            description: (currentPlayJSON.result?.description || currentPlayJSON.details?.description),
            event: (currentPlayJSON.result?.event || currentPlayJSON.details?.event),
            eventType: (currentPlayJSON.result?.eventType || currentPlayJSON.details?.eventType),
            isScoringPlay: (currentPlayJSON.about?.isScoringPlay || currentPlayJSON.details?.isScoringPlay),
            isInPlay: (lastEvent?.details?.isInPlay || currentPlayJSON.details?.isInPlay),
            playId: (lastEvent?.playId || currentPlayJSON.playId),
            metricsAvailable: (lastEvent?.hitData?.launchSpeed !== undefined || currentPlayJSON.hitData?.launchSpeed !== undefined),
            hitDistance: (lastEvent?.hitData?.totalDistance || currentPlayJSON.hitData?.totalDistance),
            currentPitcherId: currentPlayJSON.matchup?.pitcher?.id
        };
    }
};

function addScore (reply, currentPlayJSON, feed, homeTeamEmoji, awayTeamEmoji) {
    reply += '\n';
    let homeScore, awayScore;
    if (currentPlayJSON.result) {
        homeScore = currentPlayJSON.result.homeScore;
        awayScore = currentPlayJSON.result.awayScore;
    } else if (currentPlayJSON.details) {
        homeScore = currentPlayJSON.details.homeScore;
        awayScore = currentPlayJSON.details.awayScore;
    }
    reply += (feed.halfInning() === 'top'
        ? '# ' + insertEmojiIfPresent(awayTeamEmoji) + ' _' + feed.awayAbbreviation() + ' ' + awayScore + '_, ' +
        feed.homeAbbreviation() + ' ' + homeScore + ` ${insertEmojiIfPresent(homeTeamEmoji)}`
        : '# ' + `${insertEmojiIfPresent(awayTeamEmoji)} ` + feed.awayAbbreviation() + ' ' + awayScore + ', _' +
        feed.homeAbbreviation() + ' ' + homeScore + '_' + ` ${insertEmojiIfPresent(homeTeamEmoji)}`);

    return reply;
}

function addMetrics (lastEvent, reply) {
    if (lastEvent.hitData.launchSpeed) { // this data can be randomly unavailable
        reply += '\n\n';
        reply += 'Exit Velo: ' + lastEvent.hitData.launchSpeed + ' mph' +
            getFireEmojis(lastEvent.hitData.launchSpeed) + '\n';
        reply += 'Launch Angle: ' + lastEvent.hitData.launchAngle + '° \n';
        reply += 'Distance: ' + lastEvent.hitData.totalDistance + ' ft.\n';
        reply += 'xBA: Pending...\n';
        reply += 'Bat Speed: Pending...';
        reply += lastEvent.hitData.totalDistance && lastEvent.hitData.totalDistance >= globals.HOME_RUN_BALLPARKS_MIN_DISTANCE ? '\nHR/Park: Pending...' : '';
    } else {
        reply += '\n\n**Statcast Metrics:**\n';
        reply += 'Data was not available.';
    }

    return reply;
}

function getFireEmojis (launchSpeed) {
    if (launchSpeed >= 95.0 && launchSpeed < 100.0) {
        return ' \uD83D\uDD25';
    } else if (launchSpeed >= 100.0 && launchSpeed < 110.0) {
        return ' \uD83D\uDD25\uD83D\uDD25';
    } else if (launchSpeed >= 110.0) {
        return ' \uD83D\uDD25\uD83D\uDD25\uD83D\uDD25';
    } else {
        return '';
    }
}

function getDescription (currentPlayJSON, feed) {
    return (currentPlayJSON.result?.description || currentPlayJSON.details.description || '');
}

function insertEmojiIfPresent (emoji) {
    return (emoji ? `<:${emoji.name}:${emoji.id}>` : '');
}

function getWeatherString (feed) {
    try {
        const weather = feed.weather();
        const venueName = feed.venueName();

        if (weather && Object.keys(weather).length > 0 && venueName) {
            return '\n\nWeather at ' + venueName + ':\n' +
                commandUtil.getWeatherEmoji(weather.condition) + ' ' + weather.condition + '\n' +
                '\uD83C\uDF21 ' + weather.temp + '°\n' +
                '\uD83C\uDF43 ' + weather.wind;
        }
    } catch (e) {
        return '';
    }
    return '';
}

