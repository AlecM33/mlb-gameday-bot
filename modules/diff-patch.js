const globalCache = require('./global-cache');

/*
    This module concerns updating the base MLB gameday object (AKA "GUMBO") with changes derived from the "diffPatch" resource
    (/feed/live/diffPatch). What diffPatch does is return collections of "operations" which selectively manipulate the JSON tree.
    This is a lighter weight alternative to fetching the entire game object every time an event happens. There are five
    kinds of "operations" - add, replace, remove, copy, and move. Since the JSON paths diffPatch give me are not guaranteed
    to point to defined values, I have to recursively descend the tree, constructing the object if needed.
 */
module.exports = {
    hydrate: (patch) => {
        patch.diff.forEach(difference => {
            switch (difference.op) {
                case 'add':
                case 'replace':
                    setJSONValue(
                        globalCache.values.game.currentLiveFeed,
                        difference.path
                            .replaceAll('/', '.')
                            .split('.')
                            .slice(1),
                        difference.value,
                        difference.op
                    );
                    break;
                case 'remove':
                    setJSONValue(
                        globalCache.values.game.currentLiveFeed,
                        difference.path
                            .replaceAll('/', '.')
                            .split('.')
                            .slice(1),
                        undefined,
                        difference.op
                    );
                    break;
                case 'copy':
                    setJSONValue(
                        globalCache.values.game.currentLiveFeed,
                        difference.path
                            .replaceAll('/', '.')
                            .split('.')
                            .slice(1),
                        eval('globalCache.values.game.currentLiveFeed' + toJsonPath(difference.from)),
                        difference.op
                    );
                    break;
                case 'move':
                    setJSONValue(
                        globalCache.values.game.currentLiveFeed,
                        difference.path
                            .replaceAll('/', '.')
                            .split('.')
                            .slice(1),
                        eval('globalCache.values.game.currentLiveFeed' + toJsonPath(difference.from)),
                        'add'
                    );
                    setJSONValue(
                        globalCache.values.game.currentLiveFeed,
                        difference.from
                            .replaceAll('/', '.')
                            .split('.')
                            .slice(1),
                        undefined,
                        'remove'
                    );
                    break;
                default:
                    console.log('UNRECOGNIZED OPERATION: ' + difference.op);
            }
        });
    }
};

function toJsonPath (slashPath) {
    return slashPath.replaceAll('/', '.').replaceAll(/\.([0-9]+)/g, '["$1"]');
}

function setJSONValue (root, accessors, value, op) {
    const currentAccessor = accessors[0];
    if (accessors.length === 1) {
        if (op === 'remove') {
            if (Array.isArray(root)) {
                root.splice(parseInt(currentAccessor), 1);
            } else {
                delete root[currentAccessor];
            }
        } else {
            root[currentAccessor] = value;
        }
        return;
    }
    if (root[currentAccessor] === undefined) {
        if (isNaN(accessors[1])) {
            root[currentAccessor] = {};
            setJSONValue(root[currentAccessor], accessors.slice(1), value, op);
        } else {
            root[currentAccessor] = [];
            setJSONValue(root[currentAccessor], accessors.slice(1), value, op);
        }
    } else {
        setJSONValue(root[currentAccessor], accessors.slice(1), value, op);
    }
}
