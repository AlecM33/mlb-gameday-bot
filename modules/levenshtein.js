module.exports = {
    distance: (a, b, maxDistance = Infinity) => {
        if (a.length === 0) return b.length <= maxDistance ? b.length : maxDistance + 1;
        if (b.length === 0) return a.length <= maxDistance ? a.length : maxDistance + 1;

        const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(0));

        for (let i = 0; i <= a.length; i ++) {
            matrix[0][i] = i;
        }
        for (let j = 0; j <= b.length; j ++) {
            matrix[j][0] = j;
        }

        for (let j = 1; j <= b.length; j ++) {
            for (let i = 1; i <= a.length; i ++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1, // deletion
                    matrix[j - 1][i] + 1, // insertion
                    matrix[j - 1][i - 1] + cost // substitution
                );
            }
            if (Math.min(...matrix[j]) > maxDistance) {
                return maxDistance + 1;
            }
        }
        return matrix[b.length][a.length];
    }
};
