/*global describe, it*/

const assert = require('assert');
const TranslationAssistant = require('../lib/translation-assistant');

const {stringToGroupKey, createTemplate, populateTemplate} = TranslationAssistant;

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

const getEnglishStr = item => item.englishStr;
const getTranslation = item => item.translatedStr;
const lang = 'fr';

/**
 * Assert that the suggested translations match the translations.
 */
function assertSuggestions(allItems, itemsToTranslate, translatedStrs) {
    const assistant =
        new TranslationAssistant(allItems, getEnglishStr, getTranslation, lang);

    const suggestions = assistant.suggest(itemsToTranslate);

    for (let i = 0; i < translatedStrs.length; i++) {
        assert.equal(suggestions[i][1], translatedStrs[i]);
    }
}

describe('TranslationAssistant', function() {
    it('should handle no math', function() {
        const allItems = [{
            englishStr: 'Both are wrong',
            translatedStr: 'Ambas son impares'
        }];
        const itemsToTranslate = [{
            englishStr: 'Both are wrong',
            translatedStr: ''
        }];
        const translatedStrs = ['Ambas son impares'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle non-string items', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$',
            translatedStr: 'simplifyz $2x = 4$'
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$',
            translatedStr: ''
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
            translatedStr: ''
        }];
        const translatedStrs = [];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle having no items to translate', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$, answer $x = 2$',
            translatedStr: 'simplifyz $2x = 4$, answerz $x = 2$',
        }];
        const itemsToTranslate = [];
        const translatedStrs = [];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle having no translations', function() {
        const allItems = [{
            englishStr: 'simplify $5x = 25$',
            translatedStr: '',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $6x = 36$',
            translatedStr: ''
        }];
        const translatedStrs = [];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it("can provide suggestions for multiple groups", function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$, answer $x = 2$',
            translatedStr: 'simplifyz $2x = 4$, answerz $x = 2$',
        }, {
            englishStr: 'simplify $2x = 4$',
            translatedStr: 'simplifyz $2x = 4$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$, answer $x = 3$',
            translatedStr: '',
        }, {
            englishStr: 'simplify $4x = 16$',
            translatedStr: 'crowdin:98:crowdin'
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
                translatedStr: '',
            }];
            const translatedStrs = [null];

            assertSuggestions(allItems, itemsToTranslate, translatedStrs);
        });

        it('should return the same math', function() {
            const allItems = [];
            const itemsToTranslate = [
                { englishStr: '$3x = 9$', translatedStr: '' },
                { englishStr: 'hello', translatedStr: '' },
            ];
            const translatedStrs = ['$3x = 9$', null];

            assertSuggestions(allItems, itemsToTranslate, translatedStrs);
        });

        it('should return the same widget', function() {
            const allItems = [];
            const itemsToTranslate = [{
                englishStr: '[[\u2603 Expression 1]]',
                translatedStr: '',
            }, {
                englishStr: 'hello',
                translatedStr: '',
            }];
            const translatedStrs = ['[[\u2603 Expression 1]]', null];

            assertSuggestions(allItems, itemsToTranslate, translatedStrs);
        });

        it('should return the same graphie', function() {
            const graphie = makeGraphie();
            const allItems = [];
            const itemsToTranslate = [{
                englishStr: graphie,
                translatedStr: '',
            }, {
                englishStr: 'hello',
                translatedStr: '',
            }];
            const translatedStr = [graphie, null];

            assertSuggestions(allItems, itemsToTranslate, translatedStr);
        });
    });
});

describe('TranslationAssistant (math)', function() {
    it('should populate a single line template with math', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$',
            translatedStr: 'simplifyz $2x = 4$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$',
            translatedStr: '',
        }];
        const translatedStrs = ['simplifyz $3x = 9$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle math on multiple lines', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$\n\nanswer $x = 2$',
            translatedStr: 'simplifyz $2x = 4$\n\nanswerz $x = 2$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$\n\nanswer $x = 3$',
            translatedStr: '',
        }];
        const translatedStrs = ['simplifyz $3x = 9$\n\nanswerz $x = 3$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle multiple math on the same line', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$, answer $x = 2$',
            translatedStr: 'simplifyz $2x = 4$, answerz $x = 2$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$, answer $x = 3$',
            translatedStr: '',
        }];
        const translatedStrs = ['simplifyz $3x = 9$, answerz $x = 3$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle multiple math on multiple lines', function() {
        const allItems = [{
            englishStr:
                'simplify $2x = 4$, answer $x = 2$\n\nhints: $x$ is not $1$',
            translatedStr:
                'simplifyz $2x = 4$, answerz $x = 2$\n\nhintz: $x$ iznot $1$',
        }];
        const itemsToTranslate = [{
            englishStr:
                'simplify $3x = 9$, answer $x = 3$\n\nhints: $x$ is not $2$',
            translatedStr: '',
        }];
        const translatedStrs = [
            'simplifyz $3x = 9$, answerz $x = 3$\n\nhintz: $x$ iznot $2$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle trailing newline mismatches', function() {
        assertSuggestions([{
            englishStr:
                'simplify $2x = 4$, answer $x = 2$\n\n',
            translatedStr:
                'simplifyz $2x = 4$, answerz $x = 2$',
        }], [{
            englishStr:
                'simplify $3x = 9$, answer $x = 3$\n\n',
            translatedStr: '',
        }], [
            'simplifyz $3x = 9$, answerz $x = 3$'
        ]);
    });

    it('should handle translations that re-order math', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$, answer $x = 2$',
            translatedStr: 'answerz $x = 2$, simplifyz $2x = 4$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$, answer $x = 3$',
            translatedStr: '',
        }];
        const translatedStrs = ['answerz $x = 3$, simplifyz $3x = 9$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should work when math chunks are reused', function() {
        const allItems = [{
            englishStr: '**When counting by $5$s starting from $18$,  ' +
                'which numbers will you say? **',
            translatedStr: '**Al contar de $5$ en $5$ empezando en $18$, ' +
                '¿cuáles números dirás? **',
        }];
        const itemsToTranslate = [{
            englishStr: '**When counting by $5$s starting from $18$,  ' +
                'which numbers will you say? **',
            translatedStr: '',
        }];
        const translatedStrs = [
            '**Al contar de $5$ en $5$ empezando en $18$, ' +
            '¿cuáles números dirás? **'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should translate multiple strings', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$',
            translatedStr: 'simplifyz $2x = 4$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$',
            translatedStr: '',
        }, {
            englishStr: 'simplify $4x = 16$',
            translatedStr: 'crowdin:98:crowdin'
        }];
        const translatedStrs = ['simplifyz $3x = 9$', 'simplifyz $4x = 16$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should return null when the math doesn\'t match', function() {
        const allItems = [{
            englishStr: '$\\sin \\theta$',
            translatedStr: '$\\operatorname{sen} \\theta$',
        }];
        const itemsToTranslate = [{
            englishStr: '$\\sin \\phi',
            translatedStr: '',
        }];
        const translatedStrs = [null];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });
});

describe('TranslationAssistant (graphie)', function() {
    it('should handle multiple math on multiple lines', function() {
        const allItems = [{
            englishStr: `simplify ${graphie1}, answer ${graphie2}\n\n` +
                `hints: ${graphie3}`,
            translatedStr: `simplifyz ${graphie1}, answerz ${graphie2}\n\n` +
                `hintz: ${graphie3}`,
        }];
        const itemsToTranslate = [{
            englishStr: `simplify ${graphie4}, answer ${graphie5}\n\n` +
                `hints: ${graphie6}`,
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            `simplifyz ${graphie4}, answerz ${graphie5}\n\n` +
            `hintz: ${graphie6}`
        ]);
    });

    it('should handle translations that re-order graphies', function() {
        const allItems = [{
            englishStr: `simplify ${graphie1}, answer ${graphie2}`,
            translatedStr: `answerz ${graphie2}, simplifyz ${graphie1}`,
        }];
        const itemsToTranslate = [{
            englishStr: `simplify ${graphie3}, answer ${graphie4}`,
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            `answerz ${graphie4}, simplifyz ${graphie3}`
        ]);
    });

    it('should handle strings that are only graphies', function() {
        const allItems = [{
            englishStr: graphie1,
            translatedStr: graphie1
        }];
        const itemsToTranslate = [{
            englishStr: graphie2,
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [graphie2]);
    });
});

describe('TranslationAssistant (widgets)', function() {
    it('should handle multiple math on multiple lines', function() {
        const allItems = [{
            englishStr:
                'simplify [[☃ Expression 1]], answer [[☃ Expression 2]]\n\n' +
                'hints: [[☃ Expression 3]]',
            translatedStr:
                'simplifyz [[☃ Expression 1]], answerz [[☃ Expression 2]]\n\n' +
                'hintz: [[☃ Expression 3]]',
        }];
        const itemsToTranslate = [{
            englishStr:
                'simplify [[☃ Expression 1]], answer [[☃ Expression 2]]\n\n' +
                'hints: [[☃ Expression 3]]',
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            'simplifyz [[☃ Expression 1]], answerz [[☃ Expression 2]]\n\n' +
            'hintz: [[☃ Expression 3]]'
        ]);
    });

    it('should handle translations that re-order widgets', function() {
        const allItems = [{
            englishStr:
                'simplify [[☃ Expression 1]], answer [[☃ Expression 2]]',
            translatedStr:
                'answerz [[☃ Expression 2]], simplifyz [[☃ Expression 1]]',
        }];
        const itemsToTranslate = [{
            englishStr:
                'simplify [[☃ Expression 1]], answer [[☃ Expression 2]]',
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            'answerz [[☃ Expression 2]], simplifyz [[☃ Expression 1]]'
        ]);
    });

    it('should handle strings that are only widgets', function() {
        const allItems = [{
            englishStr: '[[☃ Expression 1]]',
            translatedStr: '[[☃ Expression 1]]'
        }];
        const itemsToTranslate = [{
            englishStr: '[[☃ Expression 1]]',
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, ['[[☃ Expression 1]]']);
    });
});

describe('TranslationAssistant (\\text{})', function() {
    it('should handle a single \\text{}', function() {
        const allItems = [{
            englishStr: 'simplify $\\text{red} = 5$',
            translatedStr: 'simplifyz $\\text{roja} = 5$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3 * \\text{red} = 20$',
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            'simplifyz $3 * \\text{roja} = 20$'
        ]);
    });

    it('should handle multiple items with one per item \\text{}', function() {
        const allItems = [{
            englishStr: 'simplify $\\text{red} = 5$',
            translatedStr: 'simplifyz $\\text{roja} = 5$',
        }, {
            englishStr: 'simplify $\\text{blue} = 10$',
            translatedStr: 'simplifyz $\\text{azul} = 10$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3 * \\text{red} = 20$',
            translatedStr: '',
        }, {
            englishStr: 'simplify $14 = \\text{blue} - 9$',
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            'simplifyz $3 * \\text{roja} = 20$',
            'simplifyz $14 = \\text{azul} - 9$'
        ]);
    });

    it('should handle an item with multiple \\text{}', function() {
        const allItems = [{
            englishStr: 'simplify $\\text{red} = 5 * \\text{blue}$',
            translatedStr: 'simplifyz $\\text{azul} = 5 * \\text{roja}$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3 * \\text{red} = 20 - \\text{blue}$',
            translatedStr: '',
        }];

        // Even though "red" in Spanish should be "roja", smart translations
        // doesn't know that.  The template built from allItems will contain a
        // mathDictionary which maps "red" to "azul" and "blue" to "roja".
        assertSuggestions(allItems, itemsToTranslate, [
            'simplifyz $3 * \\text{azul} = 20 - \\text{roja}$'
        ]);
    });

    it('should handle multiple items with multiple \\text{}', function() {
        const allItems = [{
            englishStr: 'simplify $\\text{red} = 5 * \\text{blue}$',
            translatedStr: 'simplifyz $\\text{azul} = 5 * \\text{roja}$',
        }, {
            englishStr: 'simplify $\\text{red} + \\text{yellow} = 42$',
            translatedStr: 'simplifyz $\\text{roja} + \\text{amarillo} = 42$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3 * \\text{red} = 20 - \\text{blue}$',
            translatedStr: '',
        }, {
            englishStr: 'simplify $x - \\text{yellow} = \\text{red}$',
            translatedStr: '',
        }];

        // The group keys are different for the items in allItems.  The first
        // is {str:"simplify __MATH__",texts:[["red","blue"]]}.  The second is
        // {str:"simplify __MATH__",texts:[["red","yellow"]]}.  Because the
        // group keys are different there ends up being two different groups,
        // each with their own template with its own mathDictionary.  The first
        // template translates \\text{red} to \\text{azul} while the second
        // template translates \\text{red} to \\text{roja}.
        assertSuggestions(allItems, itemsToTranslate, [
            'simplifyz $3 * \\text{azul} = 20 - \\text{roja}$',
            'simplifyz $x - \\text{amarillo} = \\text{roja}$',
        ]);
    });

    it('should not translate items with unknown text', function() {
        const allItems = [{
            englishStr: 'simplify $\\text{red} = 5$',
            translatedStr: 'simplifyz $\\text{roja} = 5$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $\\text{blue}$',
            translatedStr: '',
        }];

        const assistant = new TranslationAssistant(
            allItems, getEnglishStr, getTranslation, lang);

        const translation = assistant.suggest(itemsToTranslate);
        assert.equal(translation[0][1], null);
    });

    it('should use the translation from the first item', function() {
        const allItems = [{
            englishStr: '$\\text{red} = 5$',
            translatedStr: '$\\text{roja} = 5$',
        }, {
            englishStr: '$\\text{red} = 10$',
            translatedStr: '$\\text{azul} = 10$',
        }];
        const itemsToTranslate = [{
            englishStr: '$\\text{red} = 15$',
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, ['$\\text{roja} = 15$']);
    });

    it('should work with spaces between \\text and {', function() {
        assertSuggestions([{
            englishStr: '$\\text{Area}} = 6 \\text { square cm}$',
            translatedStr: '$\\text{Fläche}} = 6 \\text { Quadratzentimeter}$'
        }], [{
            englishStr: '$\\text{Area}} = 12 \\text { square cm}$',
            translated: ''
        }], ['$\\text{Fläche}} = 12 \\text { Quadratzentimeter}$']);
    });
});

describe('TranslationAssistant **bold**', function() {
    it('should group bold and non-bold text separately', function() {
        const allItems = [{
            englishStr: '**Solve** $2x = 5$',
            translatedStr: '**Solvez** $2x = 5$',
        }, {
            englishStr: 'Solve $3x = 9$',
            translatedStr: 'Solvez $3x = 9$',
        }];
        const itemsToTranslate = [{
            englishStr: '**Solve** $4x = 16$',
            translatedStr: '',
        }, {
            englishStr: 'Solve $2x - 5 = 10$',
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            '**Solvez** $4x = 16$',
            'Solvez $2x - 5 = 10$'
        ]);
    });

    it('should not translate non-bold from bold', function () {
        const allItems = [{
            englishStr: '**Solve** $2x = 5$',
            translatedStr: '**Solvez** $2x = 5$',
        }];
        const itemsToTranslate = [{
            englishStr: 'Solve $2x - 5 = 10$',
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [null]);
    });
});

describe('normalizeString', function() {
    it('should return a json string', function() {
        assert.equal(
            stringToGroupKey('simplify ${\\text{red} = 5$'),
            '{"str":"simplify __MATH__","texts":[["red"]]}');

        assert.equal(
            stringToGroupKey('${\\text{red}, \\text{blue}$'),
            '{"str":"__MATH__","texts":[["blue","red"]]}');

        assert.equal(
            stringToGroupKey('${\\text{red}$ and $\\text{blue}$'),
            '{"str":"__MATH__ and __MATH__","texts":[["red"],["blue"]]}');

        assert.equal(
            stringToGroupKey('${\\text{red} + \\text{blue}$ and $1 + 2$'),
            '{"str":"__MATH__ and __MATH__","texts":[["blue","red"],[]]}');
    });
});

describe('populateTemplate where englishStr contains \\text{}', function() {
    const englishStr = '$x = 1$, $\\text{red} = 5$, $\\text{yellow} = 10$, ' +
        '$\\text{blue} = 10$';
    const translatedStr = '$\\text{azul} = 10$, $x = 1$, ' +
        '$\\text{amarillo} = 10$, $\\text{roja} = 5$, $x = 1$, ' +
        '$\\text{azul} = 10$';
    const lang = 'es';

    let template;

    beforeEach(function() {
        template = createTemplate(englishStr, translatedStr, lang);
    });

    it('should translate the string used to create the template', function() {
        const template = createTemplate(englishStr, translatedStr, lang);
        const actual = populateTemplate(template, englishStr, lang);

        assert.equal(actual, translatedStr);
    });

    it('should translate other similar strings', function() {
        const template = createTemplate(englishStr, translatedStr, lang);

        const newEnglishStr = '$x = 21$, $\\text{red} = 25$, ' +
            '$\\text{yellow} = 210$, $\\text{blue} = 210$';
        const newTranslatedStr =
            populateTemplate(template, newEnglishStr, lang);

        assert.equal(newTranslatedStr,
            '$\\text{azul} = 210$, $x = 21$, $\\text{amarillo} = 210$, ' +
            '$\\text{roja} = 25$, $x = 21$, $\\text{azul} = 210$');
    });
});
