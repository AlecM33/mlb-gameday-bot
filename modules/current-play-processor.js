const globalCache = require('./global-cache');
const globals = require('../config/globals');

module.exports = {
    process: async (currentPlayJSON) => {
        let reply = '';
        if (!globalCache.values.game.startReported
            && currentPlayJSON.playEvents?.find(event => event?.details?.description === 'Status Change - In Progress')) {
            globalCache.values.game.startReported = true;
            reply += 'A game is starting! Go Guards!';
        }
        let lastEvent;
        if (currentPlayJSON.about?.isComplete
            || globals.EVENT_WHITELIST.includes((currentPlayJSON.result?.eventType || currentPlayJSON.details?.eventType))
        ) {
            reply += getDescription(currentPlayJSON);
            if (currentPlayJSON.about?.hasOut || currentPlayJSON.details?.isOut) {
                reply += ' **' + currentPlayJSON.count.outs + (currentPlayJSON.count.outs > 1 ? ' outs. **' : ' out. **');
            }
            if (currentPlayJSON.about?.isScoringPlay || currentPlayJSON.details?.isScoringPlay) {
                reply += '\n';
                let homeScore, awayScore;
                if (currentPlayJSON.result) {
                    homeScore = currentPlayJSON.result.homeScore;
                    awayScore = currentPlayJSON.result.awayScore;
                } else if (currentPlayJSON.details) {
                    homeScore = currentPlayJSON.details.homeScore;
                    awayScore = currentPlayJSON.details.awayScore;
                }
                if (homeScore > awayScore) {
                    reply += '## ' + globalCache.values.game.currentLiveFeed.gameData.teams.home.abbreviation +
                        ' now leads ' + homeScore + '-' + awayScore + '\n';
                } else if (homeScore === awayScore) {
                    reply += '## The game is now tied at ' + homeScore + '-' + awayScore + '\n';
                } else {
                    reply += '## ' + globalCache.values.game.currentLiveFeed.gameData.teams.away.abbreviation +
                        ' now leads ' + awayScore + '-' + homeScore + '\n';
                }
            }
            if (currentPlayJSON.playEvents) {
                lastEvent = currentPlayJSON.playEvents[currentPlayJSON.playEvents.length - 1];
                if (lastEvent?.details?.isInPlay) {
                    reply = addMetrics(lastEvent, reply);
                }
            } else if (currentPlayJSON.details?.isInPlay) {
                reply = addMetrics(currentPlayJSON, reply);
            }
        }
        return {
            reply,
            description: (currentPlayJSON.result?.description || currentPlayJSON.details?.description),
            event: (currentPlayJSON.result?.event || currentPlayJSON.details?.event),
            eventType: (currentPlayJSON.result?.eventType || currentPlayJSON.details?.eventType),
            isScoringPlay: (currentPlayJSON.about?.isScoringPlay || currentPlayJSON.details?.isScoringPlay),
            isInPlay: (lastEvent?.details?.isInPlay || currentPlayJSON.details?.isInPlay),
            playId: (lastEvent?.playId || currentPlayJSON.playId),
            hitDistance: (lastEvent?.hitData?.totalDistance || currentPlayJSON.hitData?.totalDistance)
        };
    }
};

function addMetrics (lastEvent, reply) {
    if (lastEvent.hitData.launchSpeed) { // this data can be randomly unavailable
        reply += '\n\n**Statcast Metrics:**\n';
        reply += 'Exit Velo: ' + lastEvent.hitData.launchSpeed + ' mph' +
            (lastEvent.hitData.launchSpeed > 95.0 ? ' \uD83D\uDD25\uD83D\uDD25' : '') + '\n';
        reply += 'Launch Angle: ' + lastEvent.hitData.launchAngle + '° \n';
        reply += 'Distance: ' + lastEvent.hitData.totalDistance + ' ft.\n';
        reply += 'xBA: Pending...\n';
        reply += lastEvent.hitData.totalDistance && lastEvent.hitData.totalDistance >= 300 ? 'HR/Park: Pending...' : '';
    } else {
        reply += '\n\n**Statcast Metrics:**\n';
        reply += 'Exit Velocity: Unavailable\n';
        reply += 'Launch Angle: Unavailable\n';
        reply += 'Distance: Unavailable\n';
        reply += 'xBA: Unavailable\n';
        reply += 'HR/Park: Unavailable';
    }

    return reply;
}

function getDescription (currentPlayJSON) {
    if (currentPlayJSON.result?.event === 'Home Run'
        && guardiansBatting(currentPlayJSON)
        && currentPlayJSON.result?.description) {
        return getGuardiansHomeRunDescription(currentPlayJSON.result.description);
    }
    return (currentPlayJSON.result?.description || currentPlayJSON.details.description || '');
}

function guardiansBatting (currentPlayJSON) {
    return (currentPlayJSON.about.halfInning === 'bottom' && globalCache.values.game.currentLiveFeed.gameData.teams.home.id === globals.GUARDIANS)
        || (currentPlayJSON.about.halfInning === 'top' && globalCache.values.game.currentLiveFeed.gameData.teams.away.id === globals.GUARDIANS);
}

function getGuardiansHomeRunDescription (description) {
    const player = /(?<person>.+)( homers| hits a grand slam)/.exec(description)?.groups.person;
    const partOfField = /to (?<partOfField>[a-zA-Z ]+) field./.exec(description)?.groups.partOfField;
    const scorers = /field.[ ]+(?<scorers>.+)/.exec(description)?.groups.scorers;
    return player.toUpperCase() + ' WITH A SWING AND A DRIVE! TO DEEP ' + partOfField.toUpperCase() + '! A-WAAAAY BACK! GONE!!!\n' + (scorers || '');
}
