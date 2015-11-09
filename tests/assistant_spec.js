/*global describe, it*/

const expect = require('expect.js');
const TranslationAssistant = require('../lib/translation-assistant');

/**
 * Return a fake graphie string.
 * @returns {String} A fake graphie string.
 */
function makeGraphie() {
    const baseURL = 'web+graphie://ka-perseus-graphie.s3.amazonaws.com';
    const id = Date.now() + (1000 * Math.random() | 0);
    return `![](${baseURL}/${id})`;
}

const graphie1 = makeGraphie();
const graphie2 = makeGraphie();
const graphie3 = makeGraphie();
const graphie4 = makeGraphie();
const graphie5 = makeGraphie();
const graphie6 = makeGraphie();

const jiptStrings = {
    'crowdin:0:crowdin': 'Ambas son impares',
    'crowdin:1:crowdin': 'simplifyz $2x = 4$',
    'crowdin:2:crowdin': 'simplifyz $2x = 4$',
    'crowdin:3:crowdin': 'simplifyz $2x = 4$\n\nanswerz $x = 2$',
    'crowdin:4:crowdin': 'simplifyz $2x = 4$, answerz $x = 2$',
    'crowdin:5:crowdin':
        'simplifyz $2x = 4$, answerz $x = 2$\n\nhintz: $x$ iznot $1$',
    'crowdin:6:crowdin': 'answerz $x = 2$, simplifyz $2x = 4$',
    'crowdin:7:crowdin': '**Al contar de $5$ en $5$ empezando en $18$, ' +
        '¿cuáles números dirás? **',
    'crowdin:8:crowdin': 'simplifyz $2x = 4$',
    'crowdin:9:crowdin': '$\\operatorname{sen} \\theta$',
    'crowdin:10:crowdin': `simplifyz ${graphie1}, answerz ${graphie2}\n\n` +
        `hintz: ${graphie3}`,
    'crowdin:11:crowdin': `answerz ${graphie2}, simplifyz ${graphie1}`,
    'crowdin:12:crowdin': graphie1,
    'crowdin:13:crowdin':
        'simplifyz [[☃ Expression 1]], answerz [[☃ Expression 2]]\n\n' +
        'hintz: [[☃ Expression 3]]',
    'crowdin:14:crowdin':
        'answerz [[☃ Expression 2]], simplifyz [[☃ Expression 1]]',
    'crowdin:15:crowdin': '[[☃ Expression 1]]',
};

const getEnglishStr = item => item.englishStr;
const getTranslation = item => jiptStrings[item.jiptStr];
const lang = 'fr';

/**
 * Assert that the suggested translations match the translations.
 */
function assertSuggestions(allItems, itemsToTranslate, translatedStrs) {
    const assistant =
        new TranslationAssistant(allItems, getEnglishStr, getTranslation, lang);

    const suggestions = assistant.suggest(itemsToTranslate);

    for (let i = 0; i < translatedStrs.length; i++) {
        expect(suggestions[i][1]).to.equal(translatedStrs[i]);
    }
}

describe('Suggestor', function() {
    it('should handle no math', function() {
        const allItems = [{
            englishStr: 'Both are wrong',
            jiptStr: 'crowdin:0:crowdin'
        }];
        const itemsToTranslate = [{
            englishStr: 'Both are wrong',
            jiptStr: 'crowdin:0:crowdin'
        }];
        const translatedStrs = ['Ambas son impares'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle non-string items', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$',
            jiptStr: 'crowdin:1:crowdin'
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$',
            jiptStr: 'crowdin:99:crowdin'
        }];
        const translatedStrs = [
            'simplifyz $3x = 9$'
        ];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should return null if there is no existing translation', function() {
        const allItems = [];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$',
            jiptStr: 'crowdin:99:crowdin'
        }];
        const translatedStrs = [];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle having no items to translate', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$, answer $x = 2$',
            jiptStr: 'crowdin:4:crowdin',
        }];
        const itemsToTranslate = [];
        const translatedStrs = [];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle having no translations', function() {
        const allItems = [{
            englishStr: 'simplify $5x = 25$',
            jiptStr: '',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $6x = 36$',
            jiptStr: 'crowdin:99:crowdin'
        }];
        const translatedStrs = [];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it("can provide suggestions for multiple groups", function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$, answer $x = 2$',
            jiptStr: 'crowdin:4:crowdin',
        }, {
            englishStr: 'simplify $2x = 4$',
            jiptStr: 'crowdin:8:crowdin',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$, answer $x = 3$',
            jiptStr: 'crowdin:99:crowdin',
        }, {
            englishStr: 'simplify $4x = 16$',
            jiptStr: 'crowdin:98:crowdin'
        }];
        const translatedStrs = [
            'simplifyz $3x = 9$, answerz $x = 3$',
            'simplifyz $4x = 16$',
        ];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    describe("no existing translations", function() {
        it('should return null when there\'s nl text', function() {
            const allItems = [];
            const itemsToTranslate = [{
                englishStr: 'simplify $3x = 9$\n\nx = [[\u2603 Expression 1]]',
                jiptStr: 'crowdin:99:crowdin',
            }];
            const translatedStrs = [null];

            assertSuggestions(allItems, itemsToTranslate, translatedStrs);
        });

        it('should return the same math', function() {
            const allItems = [];
            const itemsToTranslate = [
                { englishStr: '$3x = 9$', jiptStr: 'crowdin:99:crowdin' },
                { englishStr: 'hello', jiptStr: 'crowdin:99:crowdin' },
            ];
            const translatedStrs = ['$3x = 9$', null];

            assertSuggestions(allItems, itemsToTranslate, translatedStrs);
        });

        it('should return the same widget', function() {
            const allItems = [];
            const itemsToTranslate = [{
                englishStr: '[[\u2603 Expression 1]]',
                jiptStr: 'crowdin:99:crowdin',
            }, {
                englishStr: 'hello',
                jiptStr: 'crowdin:99:crowdin',
            }];
            const translatedStrs = ['[[\u2603 Expression 1]]', null];

            assertSuggestions(allItems, itemsToTranslate, translatedStrs);
        });

        it('should return the same graphie', function() {
            const graphie = makeGraphie();
            const allItems = [];
            const itemsToTranslate = [{
                englishStr: graphie,
                jiptStr: 'crowdin:99:crowdin',
            }, {
                englishStr: 'hello',
                jiptStr: 'crowdin:99:crowdin',
            }];
            const translatedStr = [graphie, null];

            assertSuggestions(allItems, itemsToTranslate, translatedStr);
        });
    });
});

describe('Suggestor (math)', function() {
    it('should populate a single line template with math', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$',
            jiptStr: 'crowdin:2:crowdin',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$',
            jiptStr: 'crowdin:99:crowdin',
        }];
        const translatedStrs = ['simplifyz $3x = 9$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle math on multiple lines', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$\n\nanswer $x = 2$',
            jiptStr: 'crowdin:3:crowdin',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$\n\nanswer $x = 3$',
            jiptStr: 'crowdin:99:crowdin',
        }];
        const translatedStrs = ['simplifyz $3x = 9$\n\nanswerz $x = 3$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle multiple math on the same line', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$, answer $x = 2$',
            jiptStr: 'crowdin:4:crowdin',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$, answer $x = 3$',
            jiptStr: 'crowdin:99:crowdin',
        }];
        const translatedStrs = ['simplifyz $3x = 9$, answerz $x = 3$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle multiple math on multiple lines', function() {
        const allItems = [{
            englishStr:
                'simplify $2x = 4$, answer $x = 2$\n\nhints: $x$ is not $1$',
            jiptStr: 'crowdin:5:crowdin',
        }];
        const itemsToTranslate = [{
            englishStr:
                'simplify $3x = 9$, answer $x = 3$\n\nhints: $x$ is not $2$',
            jiptStr: 'crowdin:99:crowdin',
        }];
        const translatedStrs = [
            'simplifyz $3x = 9$, answerz $x = 3$\n\nhintz: $x$ iznot $2$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle translations that re-order math', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$, answer $x = 2$',
            jiptStr: 'crowdin:6:crowdin',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$, answer $x = 3$',
            jiptStr: 'crowdin:99:crowdin',
        }];
        const translatedStrs = ['answerz $x = 3$, simplifyz $3x = 9$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should work when math chunks are reused', function() {
        const allItems = [{
            englishStr: '**When counting by $5$s starting from $18$,  ' +
                'which numbers will you say? **',
            jiptStr: 'crowdin:7:crowdin',
        }];
        const itemsToTranslate = [{
            englishStr: '**When counting by $5$s starting from $18$,  ' +
                'which numbers will you say? **',
            jiptStr: 'crowdin:99:crowdin',
        }];
        const translatedStrs = [
            '**Al contar de $5$ en $5$ empezando en $18$, ' +
            '¿cuáles números dirás? **'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should translate multiple strings', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$',
            jiptStr: 'crowdin:8:crowdin',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$',
            jiptStr: 'crowdin:99:crowdin',
        }, {
            englishStr: 'simplify $4x = 16$',
            jiptStr: 'crowdin:98:crowdin'
        }];
        const translatedStrs = ['simplifyz $3x = 9$', 'simplifyz $4x = 16$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should return null when the math doesn\'t match', function() {
        const allItems = [{
            englishStr: '$\\sin \\theta$',
            jiptStr: 'crowdin:9:crowdin',
        }];
        const itemsToTranslate = [{
            englishStr: '$\\sin \\phi',
            jiptStr: 'crowdin:99:crowdin',
        }];
        const translatedStrs = [null];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });
});

describe('Suggestor (graphie)', function() {
    it('should handle multiple math on multiple lines', function() {
        const allItems = [{
            englishStr: `simplify ${graphie1}, answer ${graphie2}\n\n` +
                `hints: ${graphie3}`,
            jiptStr: 'crowdin:10:crowdin',
        }];
        const itemsToTranslate = [{
            englishStr: `simplify ${graphie4}, answer ${graphie5}\n\n` +
                `hints: ${graphie6}`,
            jiptStr: 'crowdin:99:crowdin',
        }];
        const translatedStrs = [
            `simplifyz ${graphie4}, answerz ${graphie5}\n\n` +
            `hintz: ${graphie6}`];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle translations that re-order graphies', function() {
        const allItems = [{
            englishStr: `simplify ${graphie1}, answer ${graphie2}`,
            jiptStr: 'crowdin:11:crowdin',
        }];
        const itemsToTranslate = [{
            englishStr: `simplify ${graphie3}, answer ${graphie4}`,
            jiptStr: 'crowdin:99:crowdin',
        }];
        const translatedStrs = [`answerz ${graphie4}, simplifyz ${graphie3}`];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle strings that are only graphies', function() {
        const allItems = [{
            englishStr: graphie1,
            jiptStr: 'crowdin:12:crowdin'
        }];
        const itemsToTranslate = [{
            englishStr: graphie2,
            jiptStr: 'crowdin:99:crowdin',
        }];
        const translatedStrs = [graphie2];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });
});

describe('Suggestor (widgets)', function() {
    it('should handle multiple math on multiple lines', function() {
        const allItems = [{
            englishStr:
                'simplify [[☃ Expression 1]], answer [[☃ Expression 2]]\n\n' +
                'hints: [[☃ Expression 3]]',
            jiptStr: 'crowdin:13:crowdin',
        }];
        const itemsToTranslate = [{
            englishStr:
                'simplify [[☃ Expression 1]], answer [[☃ Expression 2]]\n\n' +
                'hints: [[☃ Expression 3]]',
            jiptStr: 'crowdin:99:crowdin',
        }];
        const translatedStrs = [
            'simplifyz [[☃ Expression 1]], answerz [[☃ Expression 2]]\n\n' +
            'hintz: [[☃ Expression 3]]'
        ];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle translations that re-order widgets', function() {
        const allItems = [{
            englishStr:
                'simplify [[☃ Expression 1]], answer [[☃ Expression 2]]',
            jiptStr: 'crowdin:14:crowdin',
        }];
        const itemsToTranslate = [{
            englishStr:
                'simplify [[☃ Expression 1]], answer [[☃ Expression 2]]',
            jiptStr: 'crowdin:99:crowdin',
        }];
        const translatedStrs = [
            'answerz [[☃ Expression 2]], simplifyz [[☃ Expression 1]]'
        ];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle strings that are only widgets', function() {
        const allItems = [{
            englishStr: '[[☃ Expression 1]]',
            jiptStr: 'crowdin:15:crowdin'
        }];
        const itemsToTranslate = [{
            englishStr: '[[☃ Expression 1]]',
            jiptStr: 'crowdin:99:crowdin',
        }];
        const translatedStrs = ['[[☃ Expression 1]]'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });
});
