/*global describe, it*/

const expect = require('expect.js');
const { suggest, group } = require('../lib/translation-assistant');

/**
 * Assert that the suggested translations match the translations.
 *
 * @param {Array} translationPairs An array of [englishStr, translatedStr]
 *        pairs.
 * @param {Array} englishStrs An array of English strings to translate.
 * @param {Array} translatedStrs An array of translated strings to test
 *        against.
 * @returns {void}
 */
function assertSuggestions(translationPairs, englishStrs, translatedStrs) {
    const suggestions =
        suggest(translationPairs, englishStrs, 'fr');

    for (let i = 0; i < translatedStrs.length; i++) {
        expect(suggestions[i][1]).to.equal(translatedStrs[i]);
    }
}

/**
 * Return a fake graphie string.
 * @returns {String} A fake graphie string.
 */
function makeGraphie() {
    const baseURL = 'web+graphie://ka-perseus-graphie.s3.amazonaws.com';
    const id = Date.now() + (1000 * Math.random() | 0);
    return `![](${baseURL}/${id})`;
}

describe('suggest', function() {
    it('should handle no math', function() {
        assertSuggestions(
            [['Both are wrong', 'Ambas son impares']],
            ['Both are wrong'],
            ['Ambas son impares']
        );
    });

    it('should handle non-string items', function() {
        let suggestions = suggest(
            [['simplify $2x = 4$', 'simplifyz $2x = 4$']],
            [{ englishStr: 'simplify $3x = 9$' }],
            'fr',
            item => item.englishStr
        );
        expect(suggestions[0][1]).to.equal('simplifyz $3x = 9$');
        expect(suggestions[0][0].englishStr).to.equal('simplify $3x = 9$');
    });

    describe("invalid translation pairs", function() {
        it('should return null when there\'s nl text', function() {
            let suggestion = suggest(
                [],
                ['simplify $3x = 9$\n\nx = [[\u2603 Expression 1]]'],
                'fr',
                str => str);
            expect(suggestion[0][1]).to.equal(null);

            suggestion = suggest(
                [['simplify $2x = 4$\n\nx = [[\u2603 Expression 1]]', '']],
                ['simplify $3x = 9$\n\nx = [[\u2603 Expression 1]]'],
                'fr',
                str => str);
            expect(suggestion[0][1]).to.equal(null);
        });

        it('should return the same math', function() {
            let suggestion = suggest([], ['$3x = 9$', 'hello']);
            expect(suggestion[0][1]).to.equal('$3x = 9$');
            expect(suggestion[1][1]).to.equal(null);
        });

        it('should return the same widget', function() {
            let suggestion = suggest([], ['[[\u2603 Expression 1]]', 'hello']);
            expect(suggestion[0][1]).to.equal('[[\u2603 Expression 1]]');
            expect(suggestion[1][1]).to.equal(null);
        });

        it('should return the same graphie', function() {
            let graphie = makeGraphie();
            let suggestion = suggest([], [graphie, 'hello']);
            expect(suggestion[0][1]).to.equal(graphie);
            expect(suggestion[1][1]).to.equal(null);
        });
    });
});

describe('suggest (math)', function() {
    it('should populate a single line template with math', function() {
        assertSuggestions(
            [['simplify $2x = 4$', 'simplifyz $2x = 4$']],
            ['simplify $3x = 9$'],
            ['simplifyz $3x = 9$']
        );
    });

    it('should handle math on multiple lines', function() {
        assertSuggestions(
            [['simplify $2x = 4$\n\nanswer $x = 2$',
                'simplifyz $2x = 4$\n\nanswerz $x = 2$']],
            ['simplify $3x = 9$\n\nanswer $x = 3$'],
            ['simplifyz $3x = 9$\n\nanswerz $x = 3$']
        );
    });

    it('should handle multiple math on the same line', function() {
        assertSuggestions(
            [['simplify $2x = 4$, answer $x = 2$',
                'simplifyz $2x = 4$, answerz $x = 2$']],
            ['simplify $3x = 9$, answer $x = 3$'],
            ['simplifyz $3x = 9$, answerz $x = 3$']
        );
    });

    it('should handle multiple math on multiple lines', function() {
        assertSuggestions(
            [['simplify $2x = 4$, answer $x = 2$\n\nhints: $x$ is not $1$',
                'simplifyz $2x = 4$, answerz $x = 2$\n\nhintz: $x$ iznot $1$']],
            ['simplify $3x = 9$, answer $x = 3$\n\nhints: $x$ is not $2$'],
            ['simplifyz $3x = 9$, answerz $x = 3$\n\nhintz: $x$ iznot $2$']
        );
    });

    it('should handle translations that re-order math', function() {
        assertSuggestions(
            [['simplify $2x = 4$, answer $x = 2$',
                'answerz $x = 2$, simplifyz $2x = 4$']],
            ['simplify $3x = 9$, answer $x = 3$'],
            ['answerz $x = 3$, simplifyz $3x = 9$']
        );
    });

    it('should work when math chunks are reused', function() {
        assertSuggestions(
            [['**When counting by $5$s starting from $18$,  ' +
            'which numbers will you say? **',
                '**Al contar de $5$ en $5$ empezando en $18$, ' +
                '¿cuáles números dirás? **']],
            ['**When counting by $5$s starting from $18$,  ' +
            'which numbers will you say? **'],
            ['**Al contar de $5$ en $5$ empezando en $18$, ' +
            '¿cuáles números dirás? **']
        );
    });

    it('should translate multiple strings', function() {
        assertSuggestions(
            [['simplify $2x = 4$', 'simplifyz $2x = 4$']],
            ['simplify $3x = 9$',
                'simplify $4x = 16$'],
            ['simplifyz $3x = 9$', 'simplifyz $4x = 16$']
        );
    });

    it('should return an Error when the math doesn\'t match', function() {
        const suggestion = suggest(
            [['$\\sin \\theta$', '$\\operatorname{sen} \\theta$']],
            ['$\\sin \\phi']);
        expect(suggestion instanceof Error).to.be(true);
    });
});

describe('suggest (graphie)', function() {
    it('should handle multiple math on multiple lines', function() {
        const graphie1 = makeGraphie();
        const graphie2 = makeGraphie();
        const graphie3 = makeGraphie();
        const graphie4 = makeGraphie();
        const graphie5 = makeGraphie();
        const graphie6 = makeGraphie();

        assertSuggestions(
            [[`simplify ${graphie1}, answer ${graphie2}\n\n` +
            `hints: ${graphie3}`,
                `simplifyz ${graphie1}, answerz ${graphie2}\n\n` +
                `hintz: ${graphie3}`]],
            [`simplify ${graphie4}, answer ${graphie5}\n\n` +
            `hints: ${graphie6}`],
            [`simplifyz ${graphie4}, answerz ${graphie5}\n\n` +
            `hintz: ${graphie6}`]
        );
    });

    it('should handle translations that re-order graphies', function() {
        const graphie1 = makeGraphie();
        const graphie2 = makeGraphie();
        const graphie3 = makeGraphie();
        const graphie4 = makeGraphie();

        assertSuggestions(
            [[`simplify ${graphie1}, answer ${graphie2}`,
                `answerz ${graphie2}, simplifyz ${graphie1}`]],
            [`simplify ${graphie3}, answer ${graphie4}`],
            [`answerz ${graphie4}, simplifyz ${graphie3}`]
        );
    });

    it('should handle strings that are only graphies', function() {
        const graphie1 = makeGraphie();
        const graphie2 = makeGraphie();

        assertSuggestions([[graphie1, graphie1]], [graphie2], [graphie2]);
    });
});

describe('suggest (widgets)', function() {
    it('should handle multiple math on multiple lines', function() {
        assertSuggestions(
            [['simplify [[☃ Expression 1]], answer [[☃ Expression 2]]\n\n' +
            'hints: [[☃ Expression 3]]',
                'simplifyz [[☃ Expression 1]], answerz [[☃ Expression 2]]\n\n' +
                'hintz: [[☃ Expression 3]]']],
            ['simplify [[☃ Expression 1]], answer [[☃ Expression 2]]\n\n' +
            'hints: [[☃ Expression 3]]'],
            ['simplifyz [[☃ Expression 1]], answerz [[☃ Expression 2]]\n\n' +
            'hintz: [[☃ Expression 3]]']
        );
    });

    it('should handle translations that re-order widgets', function() {
        assertSuggestions(
            [['simplify [[☃ Expression 1]], answer [[☃ Expression 2]]',
                'answerz [[☃ Expression 2]], simplifyz [[☃ Expression 1]]']],
            ['simplify [[☃ Expression 1]], answer [[☃ Expression 2]]'],
            ['answerz [[☃ Expression 2]], simplifyz [[☃ Expression 1]]']
        );
    });

    it('should handle strings that are only widgets', function() {
        assertSuggestions(
            [['[[☃ Expression 1]]', '[[☃ Expression 1]]']],
            ['[[☃ Expression 1]]'],
            ['[[☃ Expression 1]]']
        );
    });
});

describe('group', function() {
    it('should group strings', function() {
        var groups = group(['simplify $8/4$', 'simplify $4/12$', 'find $x$']);
        var groupKeys = Object.keys(groups);
        expect(groupKeys.length).to.be(2);
        expect(groupKeys).to.contain('simplify __MATH__');
        expect(groupKeys).to.contain('find __MATH__');
    });

    it('should group objects', function() {
        var groups = group([
            {englishStr: 'simplify $8/4$'},
            {englishStr: 'simplify $4/12$'},
            {englishStr: 'find $x$'},
        ], item => item.englishStr);
        var groupKeys = Object.keys(groups);
        expect(groupKeys.length).to.be(2);
        expect(groupKeys).to.contain('simplify __MATH__');
        expect(groupKeys).to.contain('find __MATH__');
    });
});
