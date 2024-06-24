const commandUtil = require('../modules/command-util');

describe('commandUtil', () => {
    beforeAll(() => {});
    describe('#formatSplits', () => {
        it('should format splits for a player that has played on multiple teams in a season', async () => {
            const batterInfo = require('./data/stats-luis-arraez-two-teams');
            const result = commandUtil.formatSplits(
                batterInfo.stats.find(stat => stat.type.displayName === 'season'),
                batterInfo.stats.find(stat => stat.type.displayName === 'statSplits'),
                batterInfo.stats.find(stat => stat.type.displayName === 'lastXGames'));
            expect(result).toMatch(/\.314\/\.349\/\.385, 2 HR, 21 RBIs/); // total splits
            expect(result).toMatch(/\.328\/\.349\/\.402/); // lastXGames
            expect(result).toMatch(/\.344\/\.372\/\.444/); // vs righties
            expect(result).toMatch(/\.271\/\.317\/\.301/); // vs lefties
            expect(result).toMatch(/\.370\/\.386\/\.407/); // w/ RISP
        });

        it('should format splits for a player that just debuted and is missing splits', async () => {
            const batterInfo = require('./data/stats-orelvis-martinez-missing-splits');
            const result = commandUtil.formatSplits(
                batterInfo.stats.find(stat => stat.type.displayName === 'season'),
                batterInfo.stats.find(stat => stat.type.displayName === 'statSplits'),
                batterInfo.stats.find(stat => stat.type.displayName === 'lastXGames'));
            expect(result).toMatch(/\.333\/\.333\/\.333, 0 HR, 0 RBIs/); // total splits
            expect(result).toMatch(/Last 7 Games\*\* \(3 ABs\)[\s\n\t]+\.333\/\.333\/\.333/); // lastXGames
            expect(result).toMatch(/vs. Righties\*\* \(3 ABs\)[\s\n\t]+\.333\/\.333\/\.333/); // vs righties
            expect(result).toMatch(/\*\*vs\. Lefties\*\*[\s\n\t]+No at-bats!/); // vs lefties
            expect(result).toMatch(/\*\*with RISP\*\*[\s\n\t]+No at-bats!/);
        });

        it('should format splits for the happy path - player on one team with all splits', async () => {
            const batterInfo = require('./data/stats-steven-kwan-happy-path');
            const result = commandUtil.formatSplits(
                batterInfo.stats.find(stat => stat.type.displayName === 'season'),
                batterInfo.stats.find(stat => stat.type.displayName === 'statSplits'),
                batterInfo.stats.find(stat => stat.type.displayName === 'lastXGames'));
            expect(result).toMatch(/\.387\/\.448\/\.545, 5 HR, 21 RBIs/); // total splits
            expect(result).toMatch(/\.387\/\.448\/\.545/); // lastXGames
            expect(result).toMatch(/\.363\/\.430\/\.548/); // vs righties
            expect(result).toMatch(/\.446\/\.492\/\.536/); // vs lefties
            expect(result).toMatch(/\.361\/\.452\/\.528/); // w/ RISP
        });
    });
});
