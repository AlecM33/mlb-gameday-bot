const globalCache = require('./global-cache');
const globals = require('../config/globals');
const mlbAPIUtil = require('../modules/MLB-API-util');

module.exports = {
    process: async (currentPlayJSON) => {
        // console.log('PLAY: ' + JSON.stringify(currentPlayJSON, null, 2))
        let reply = '';
        if (!globalCache.values.game.startReported && currentPlayJSON.playEvents.find(event => event.details?.description === 'Status Change - In Progress')) {
            globalCache.values.game.startReported = true;
            reply += 'A game is starting! Go Guards!';
        }
        if (currentPlayJSON.about.isComplete || currentPlayJSON.result.eventType === "pitching_substitution") {
            globalCache.values.game.lastCompleteAtBatIndex = currentPlayJSON.about.atBatIndex;
            reply += getDescription(currentPlayJSON);
            if (currentPlayJSON.about?.hasOut) {
                reply += ' **' + currentPlayJSON.count.outs + (currentPlayJSON.count.outs > 1 ? ' outs. **' : ' out. **');
            }
            if (currentPlayJSON.about?.isScoringPlay) {
                reply += '\n';
                if (currentPlayJSON.result.homeScore > currentPlayJSON.result.awayScore) {
                    reply += '## ' + globalCache.values.game.currentLiveFeed.gameData.teams.home.abbreviation +
                        ' now leads ' + currentPlayJSON.result.homeScore + '-' + currentPlayJSON.result.awayScore + '\n';
                } else if (currentPlayJSON.result.homeScore === currentPlayJSON.result.awayScore) {
                    reply += '## The game is now tied at ' + currentPlayJSON.result.homeScore + '-' + currentPlayJSON.result.awayScore + '\n';
                } else {
                    reply += '## ' + globalCache.values.game.currentLiveFeed.gameData.teams.away.abbreviation +
                        ' now leads ' + currentPlayJSON.result.awayScore + '-' + currentPlayJSON.result.homeScore + '\n';
                }
            }
            const lastEvent = currentPlayJSON.playEvents[currentPlayJSON.playEvents.length - 1];
            if (lastEvent?.details?.isInPlay) {
                if (lastEvent.hitData.launchSpeed) { // this data can be randomly unavailable
                    reply += '\n\n';
                    reply += 'EV: ' + lastEvent.hitData.launchSpeed + ' mph' +
                        (lastEvent.hitData.launchSpeed > 95.0 ? ' \uD83D\uDD25\uD83D\uDD25' : '') + '\n';
                    reply += 'Launch Angle: ' + lastEvent.hitData.launchAngle + '° \n';
                    reply += 'Distance: ' + lastEvent.hitData.totalDistance + ' ft.\n';
                    reply += '\n**Statcast:**\nPending...'
                } else {
                    reply += '\n\n';
                    reply += 'Exit Velocity: Unavailable\n';
                    reply += 'Launch Angle: Unavailable\n';
                    reply += 'Distance: Unavailable\n';
                }
            }
        }
        return {
            reply: reply,
            description: currentPlayJSON.result?.description,
            event: currentPlayJSON.result?.event,
            eventType: currentPlayJSON.result?.eventType,
            isScoringPlay: currentPlayJSON.about?.isScoringPlay,
            isInPlay: lastEvent?.details?.isInPlay,
            playId: lastEvent?.playId,
            hitDistance: lastEvent?.hitData?.hitDistance
        };
    }
};

function getDescription (currentPlayJSON) {
    if (currentPlayJSON.result?.event === 'Home Run'
        && guardiansBatting(currentPlayJSON)
        && currentPlayJSON.result?.description) {
        return getGuardiansHomeRunDescription(currentPlayJSON.result.description);
    }
    return (currentPlayJSON.result?.description || '');
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
