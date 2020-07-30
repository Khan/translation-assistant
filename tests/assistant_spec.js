/*global describe, it*/

const assert = require('assert');
const TranslationAssistant = require('../lib/translation-assistant');

const {
    stringToGroupKey,
    createTemplate,
    populateTemplate,
} = TranslationAssistant;
const {MATH_RULES_LOCALES} = require('../lib/math-translator');

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

/**
 * Return a fake image link string.
 * @returns {String} A fake image link string.
 */
function makeImageLink() {
    const baseURL = 'https://ka-perseus-graphie.s3.amazonaws.com';
    const id = Date.now() + (1000 * Math.random() | 0);
    return `${baseURL}/${id}.png`;
}

const image1 = makeImageLink();
const image2 = makeImageLink();
const image3 = makeImageLink();
const image4 = makeImageLink();
const image5 = makeImageLink();
const image6 = makeImageLink();

/**
 * Return a fake graphie link string.
 * @returns {String} A fake graphie link string.
 */
function makeGraphieLink() {
    const baseURL = 'web+graphie://ka-perseus-graphie.s3.amazonaws.com';
    const id = Date.now() + (1000 * Math.random() | 0);
    return `${baseURL}/${id}`;
}

const graphieLink1 = makeGraphieLink();
const graphieLink2 = makeGraphieLink();
const graphieLink3 = makeGraphieLink();
const graphieLink4 = makeGraphieLink();
const graphieLink5 = makeGraphieLink();
const graphieLink6 = makeGraphieLink();

const getEnglishStr = (item) => item.englishStr;
const getTranslation = (item) => item.translatedStr;

/**
 * Assert that the suggested translations match the translations.
 *
 * @param {Array<Object>} allItems The items to be grouped and used to for
 *        generating suggestions.
 * @param {Array<Object>} itemsToTranslate Items to translate using smart
 *        suggestions calculated from `allItems`.
 * @param {Array<String|null>} translatedStrs List of the expected translated
 *        strings for items, if an expected translation is `null` it means that
 *        there is no suggested translation expected for the item.
 * @param {String} lang Locale for translation of math notation
 * @returns {void}
 */
function assertSuggestions(allItems, itemsToTranslate, translatedStrs,
        lang = 'cs') {
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
            translatedStr: 'Ambas son impares',
        }];
        const itemsToTranslate = [{
            englishStr: 'Both are wrong',
            translatedStr: '',
        }];
        const translatedStrs = ['Ambas son impares'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle non-string items', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$',
            translatedStr: 'simplifyz $2x = 4$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$',
            translatedStr: '',
        }];
        const translatedStrs = [
            'simplifyz $3x = 9$',
        ];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should return null if there is no existing translation', function() {
        const allItems = [];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$',
            translatedStr: '',
        }];
        const translatedStrs = [null];

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
            translatedStr: '',
        }];
        const translatedStrs = [null];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('can provide suggestions for multiple groups', function() {
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
            translatedStr: 'crowdin:98:crowdin',
        }];
        const translatedStrs = [
            'simplifyz $3x = 9$, answerz $x = 3$',
            'simplifyz $4x = 16$',
        ];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    describe('no existing translations', function() {
        it('should return null when there\'s nl text', function() {
            const allItems = [];
            const itemsToTranslate = [{
                englishStr: 'simplify $3x = 9$\n\nx = [[\u2603 Expression 1]]',
                translatedStr: '',
            }];
            const translatedStrs = [null];

            assertSuggestions(allItems, itemsToTranslate, translatedStrs);
        });

        it('should return null when there\'s nl text inside \\text{}',
        function() {
            const allItems = [];
            const itemsToTranslate = [{
                englishStr: '$\\text {simplify } 3x = 9$',
                translatedStr: '',
            }];
            const translatedStrs = [null];

            assertSuggestions(allItems, itemsToTranslate, translatedStrs);
        });

        it('should return null when there\'s nl text inside \\textbf{}',
        function() {
            const allItems = [];
            const itemsToTranslate = [{
                englishStr: '$\\textbf {simplify } 3x = 9$',
                translatedStr: '',
            }];
            const translatedStrs = [null];

            assertSuggestions(allItems, itemsToTranslate, translatedStrs);
        });

        it('should return the same math', function() {
            const allItems = [];
            const itemsToTranslate = [
                {englishStr: '$3x = 9$', translatedStr: ''},
                {englishStr: 'hello', translatedStr: ''},
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

        it('should return the same graphie even if translator changed one',
        function() {
            const allItems = [{
                englishStr: graphie1,
                translatedStr: graphie2,
            }];
            const itemsToTranslate = [{
                englishStr: graphie3,
                translatedStr: '',
            }, {
                englishStr: 'hello',
                translatedStr: '',
            }];
            const translatedStr = [graphie3, null];

            assertSuggestions(allItems, itemsToTranslate, translatedStr);
        });

        it('should return the same image link', function() {
            const imageLink = makeImageLink();
            const allItems = [];
            const itemsToTranslate = [{
                englishStr: imageLink,
                translatedStr: '',
            }, {
                englishStr: 'hello',
                translatedStr: '',
            }];
            const translatedStr = [imageLink, null];

            assertSuggestions(allItems, itemsToTranslate, translatedStr);
        });

        it('should return the same imageLink even if translator changed one',
        function() {
            const allItems = [{
                englishStr: image1,
                translatedStr: image2,
            }];
            const itemsToTranslate = [{
                englishStr: image3,
                translatedStr: '',
            }, {
                englishStr: 'hello',
                translatedStr: '',
            }];
            const translatedStr = [image3, null];

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

    it('should not handle math on mismatched multiple lines', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$ answer $x = 2$',
            translatedStr: 'simplifyz $2x = 4$\n\nanswerz $x = 2$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$ answer $x = 3$',
            translatedStr: '',
        }];
        const translatedStrs = [null];

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

    it('should handle trailing newline in englishStr', function() {
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
            'simplifyz $3x = 9$, answerz $x = 3$',
        ]);
    });

    it('should handle trailing newline in translatedStr', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$, answer $x = 2$',
            translatedStr:'simplifyz $2x = 4$, answerz $x = 2$\n\n',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$, answer $x = 3$',
            translatedStr: '',
        }];
        // We trim trailing newlines in the translated string inside
        // createTemplate and we do the same for the English string inside
        // populateTemplate in order to match the string & template when
        // suggesting translations. That is why we have no trailing newlines
        // in translatedStrs here, since the translated string created from the
        // template will not have any trailing newlines.
        const translatedStrs = ['simplifyz $3x = 9$, answerz $x = 3$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle trailing newline in itemsToTranslate', function() {
        const allItems = [{
            englishStr: 'simplify $2x = 4$, answer $x = 2$',
            translatedStr:'simplifyz $2x = 4$, answerz $x = 2$',
        }];
        // We trim trailing newlines in order to match the English string to the
        // template for suggesting a translation.
        const itemsToTranslate = [{
            englishStr: 'simplify $3x = 9$, answer $x = 3$\n\n',
            translatedStr: '',
        }];
        // That is why we have no trailing newlines in translatedStrs here,
        // since the translated string created from the template will not have
        // any trailing newlines.
        const translatedStrs = ['simplifyz $3x = 9$, answerz $x = 3$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
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

    it('should not work when math chunks are not reused', function() {
        const allItems = [{
            englishStr: '$4$ x $4$ y $5$',
            translatedStr: '$4$ x $4$ y $5$',
        }, {
            englishStr: 'x is $4$, y is $4$, x/y is $1$',
            translatedStr: 'y is $4$, x is $4$, x/y is $1$',
        }];
        const itemsToTranslate = [{
            englishStr: '$3$ x $8$ y $3$',
            translatedStr: '',
        }, {
            englishStr: 'x is $4$, y is $2$, x/y is $2$',
            translatedStr: '',
        }];

        const assistant = new TranslationAssistant(
            allItems, getEnglishStr, getTranslation);

        const translation = assistant.suggest(itemsToTranslate);
        assert.equal(translation[0][1], null);
        assert.equal(translation[0][2], null);
    });

    it('should work when math chunks are reused', function() {
        const allItems = [{
            englishStr: '**When counting by $5$s starting from $18$,  ' +
                'which numbers will you say? **',
            translatedStr: '**Al contar de $5$ en $5$ empezando en $18$, ' +
                '¿cuáles números dirás? **',
        }, {
            englishStr: '$4$ x $4$ y $5$',
            translatedStr: '$4$ x $4$ y $5$',
        }, {
            englishStr: 'x is $4$, y is $4$, x/y is $1$',
            translatedStr: 'y is $4$, x is $4$, x/y is $1$',
        }];
        const itemsToTranslate = [{
            englishStr: '**When counting by $5$s starting from $18$,  ' +
                'which numbers will you say? **',
            translatedStr: '',
        }, {
            englishStr: '$8$ x $8$ y $3$',
            translatedStr: '',
        }, {
            englishStr: 'x is $2$, y is $2$, x/y is $1$',
            translatedStr: '',
        }];
        const translatedStrs = [
            '**Al contar de $5$ en $5$ empezando en $18$, ' +
                '¿cuáles números dirás? **',
            '$8$ x $8$ y $3$',
            'y is $2$, x is $2$, x/y is $1$'];

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
            translatedStr: 'crowdin:98:crowdin',
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

describe('TranslationAssistant (math-translate)', function() {
    it('should translate decimal point to comma for fr locale', function() {
        const allItems = [{
            englishStr: 'simplify $2.3$',
            translatedStr: 'simplifyz $2{,}3$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $\\red{2.9}$',
            translatedStr: '',
        }];
        const translatedStrs = ['simplifyz $\\red{2{,}9}$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, 'fr');
    });

    it('should not match 10=5 with decimal point regex!', function() {
        const allItems = [{
            englishStr: '$50 \\div 10=5$',
            translatedStr: '$50 \\mathbin{:} 10=5$',
        }];
        const itemsToTranslate = [{
            englishStr: '$460 \\div 10=46$',
            translatedStr: '',
        }];
        const translatedStrs = ['$460 \\mathbin{:} 10=46$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should translate math alone', function() {
        const allItems = [];
        const itemsToTranslate = [
            {englishStr: '$3 \\times x = 9.9$', translatedStr: ''},
            {englishStr: 'hello', translatedStr: ''},
        ];
        const translatedStrs = ['$3 \\cdot x = 9{,}9$', null];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should translate multiple math notations at once', function() {
        const allItems = [];
        const itemsToTranslate = [
            {englishStr: '$3 \\times x = 9.9 \\div 3$', translatedStr: ''},
        ];
        const translatedStrs = ['$3 \\cdot x = 9{,}9 \\mathbin{:} 3$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, 'de');
    });

    // NOTE(danielhollas): In reality, TA should only get unescaped strings
    // from Manticore. But I guess this test does not hurt either.
    it('should handle doubly-escaped latex commands', function() {
        const allItems = [];
        const itemsToTranslate = [
            {englishStr: '$3 \\\\times x = 9.9 \\\\div 3$', translatedStr: ''},
        ];
        const translatedStrs = ['$3 \\\\cdot x = 9{,}9 \\\\mathbin{:} 3$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should translate multiple decimals', function() {
        const allItems = [];
        const itemsToTranslate = [
            {englishStr: '$3 \\times x = 9.9 \\div 3.3$', translatedStr: ''},
        ];
        const translatedStrs = ['$3 \\cdot x = 9{,}9 \\mathbin{:} 3{,}3$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, 'de');
    });

    it('should translate thousand separator for a thin space', function() {
        const allItems = [];
        const itemsToTranslate = [
            {englishStr: '$3{,}000.5 \\times x = 9.9 \\div 3{,}300{,}000 $',
             translatedStr: ''},
        ];
        const translatedStrs =
           ['$3\\,000{,}5 \\cdot x = 9{,}9 \\mathbin{:} 3\\,300\\,000 $'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle both thousand sep. AND decimal comma for cs locale',
    function() {
        const allItems = [];
        const itemsToTranslate = [
            {englishStr: '$3{,}000.500 \\times x = 9.900 \\div 3{,}300{,}000 $',
             translatedStr: ''},
        ];
        const translatedStrs =
           ['$3\\,000{,}500 \\cdot x = 9{,}900 \\mathbin{:} 3\\,300\\,000 $'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should not translate thousand separator for ja locale', function() {
        const allItems = [];
        const itemsToTranslate = [
            {englishStr: '$3{,}000.5 \\times x = 9.9 \\div 3{,}300{,}000$',
             translatedStr: ''},
        ];
        const translatedStrs =
           ['$3{,}000.5 \\times x = 9.9 \\div 3{,}300{,}000$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, 'ja');
    });

    it('should handle extra braces around thousand separator as thin space',
    function() {
        const allItems = [{
            englishStr: 'simplify $2{,}300 20{,}000{,}090$',
            translatedStr: 'simplifyz $2{\\,}300 20{\\,}000{\\,}090$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $2{,}000{,}000$',
            translatedStr: '',
        }];
        const translatedStrs = ['simplifyz $2\\,000\\,000$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should allow ~ as a thousand separator', function() {
        const allItems = [{
            englishStr: 'simplify $2{,}300 20{,}000{,}090$',
            translatedStr: 'simplifyz $2~300 20~000~090$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $2{,}000{,}000$',
            translatedStr: '',
        }];
        const translatedStrs = ['simplifyz $2\\,000\\,000$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle superfluous braces together with \\text', function() {
        const allItems = [{
            englishStr: 'simplify $2{,}300 \\text{to} 20{,}000{,}090$',
            translatedStr: 'simplifyz $2{\\,}300 \\text{t} 20{\\,}000{\\,}090$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $2{,}000{,}000 \\text{to} 20{,}857$',
            translatedStr: '',
        }];
        const translatedStrs = ['simplifyz $2\\,000\\,000 \\text{t} 20\\,857$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle superfluous braces together with \\textbf', function() {
        const allItems = [{
            englishStr: 'simplify $2{,}300 \\textbf{to} 2{,}000{,}090$',
            translatedStr: 'simplif $2{\\,}300 \\textbf{t} 2{\\,}000{\\,}090$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $2{,}000{,}000 \\textbf{to} 20{,}857$',
            translatedStr: '',
        }];
        const translatedStrs = ['simplif $2\\,000\\,000 \\textbf{t} 20\\,857$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should translate thousand separator to none for ko locale', function() {
        const allItems = [];
        const itemsToTranslate = [
            {englishStr: '$3{,}000.500 \\times x = 9.900 \\div 3{,}300{,}000$',
             translatedStr: ''},
        ];
        const translatedStrs =
           ['$3000.500 \\times x = 9.900 \\div 3300000$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, 'ko');
    });

    it('should translate thousand separator to . for pt locale', function() {
        const allItems = [];
        const itemsToTranslate = [
            {englishStr: '$3{,}000.5 \\times x = 9.9 \\div 3{,}300{,}000 $',
             translatedStr: ''},
        ];
        const translatedStrs =
           ['$3.000{,}5 \\times x = 9{,}9 \\div 3.300.000 $'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, 'pt');
    });

    it('should handle thousand separator AND decimal comma for pt locale',
    function() {
        const allItems = [];
        const itemsToTranslate = [
            {englishStr: '$3{,}000.540 \\times x = 9.900 \\div 3{,}300{,}000 $',
             translatedStr: ''},
        ];
        const translatedStrs =
           ['$3.000{,}540 \\times x = 9{,}900 \\div 3.300.000 $'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, 'pt');
    });

    it('should translate math with \\text', function() {
        const allItems = [{
            englishStr: 'simplify $\\text{red} = 5.1$',
            translatedStr: 'simplifyz $\\text{rouge} = 5{,}1$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3 * \\text{red} = 20.4$',
            translatedStr: '',
        }];
        const translatedStrs = ['simplifyz $3 * \\text{rouge} = 20{,}4$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, 'fr');
    });

    it('should translate math with \\textbf', function() {
        const allItems = [{
            englishStr: 'simplify $\\textbf{red} = 5.1$',
            translatedStr: 'simplifyz $\\textbf{rouge} = 5{,}1$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3 * \\textbf{red} = 20.4$',
            translatedStr: '',
        }];
        const translatedStrs = ['simplifyz $3 * \\textbf{rouge} = 20{,}4$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, 'fr');
    });

    it('should translate math with \\text{} and \\textbf{}', function() {
        const allItems = [{
            englishStr: 'simplify $\\text{red} = 5 \\times \\textbf{blue}$',
            translatedStr: 'simplifyz $\\text{azul} = 5 \\cdot \\textbf{roja}$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3 \\text{red} = 2 \\div \\textbf{blue}$',
            translatedStr: '',
        }, {
            englishStr: 'simplify $3 \\textbf{red} = 2 \\div \\text{blue}$',
            translatedStr: '',
        }];

        // Even though "red" in Spanish should be "roja", smart translations
        // doesn't know that.  The template built from allItems will contain a
        // mathDictionary which maps "red" to "azul" and "blue" to "roja".
        assertSuggestions(allItems, itemsToTranslate, [
            'simplifyz $3 \\text{azul} = 2 \\mathbin{:} \\textbf{roja}$',
            'simplifyz $3 \\textbf{azul} = 2 \\mathbin{:} \\text{roja}$',
        ]);
    });

    it('should not suggest ST if math is not translated properly', function() {
        const allItems = [{
            englishStr: 'simplify $2.3$',
            translatedStr: 'simplifyz $2.3$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $2.9$',
            translatedStr: '',
        }];
        const translatedStrs = [null];
        //const translatedStrs = ['simplifyz $2{,}9$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should not translate decimal point to comma for ko', function() {
        const allItems = [{
            englishStr: 'simplify $2.3$',
            translatedStr: 'simplifyz $2{,}3$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $2.9$',
            translatedStr: '',
        }];
        const translatedStrs = [null];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, 'ko');
    });

    it('should translate \\times to \\cdot for cs locale', function() {
        const allItems = [{
            englishStr: 'simplify $2 \\times 3 \\times 2$',
            translatedStr: 'simplifyz $2 \\cdot 3 \\cdot 2$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $2 \\times 9 \\times 9$',
            translatedStr: '',
        }];
        const translatedStrs = ['simplifyz $2 \\cdot 9 \\cdot 9$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should translate \\div to \\mathbin{:} for de locale', function() {
        const allItems = [{
            englishStr: 'simplify $2 \\div 3$',
            translatedStr: 'simplifyz $2 \\mathbin{:} 3$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $2 \\div 9 \\div 3$',
            translatedStr: '',
        }];
        const translatedStrs = ['simplifyz $2 \\mathbin{:} 9 \\mathbin{:} 3$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, 'de');
    });

    it('should translate trig functions', function() {
        const allItems = [{
            englishStr: 'from $\\sin\\tan\\cot\\csc$',
            translatedStr: 'fr $\\operatorname{sen}\\operatorname{tg}' +
                           '\\operatorname{cotg}\\operatorname{cossec}$',
        }];
        const itemsToTranslate = [{
            englishStr: 'from $\\sin\\cos\\tan\\cot\\csc\\sec$',
            translatedStr: '',
        }];
        const translatedStrs = [
            'fr $\\operatorname{sen}\\cos\\operatorname{tg}' +
            '\\operatorname{cotg}\\operatorname{cossec}\\sec$',
        ];
        assertSuggestions(allItems, itemsToTranslate, translatedStrs, 'pt-pt');
    });
});

describe('TranslationAssistant (maybe-math-translate)', function() {

    it('should translate math according to a template', function() {
        const lang = 'id';
        assert(MATH_RULES_LOCALES.MAYBE_TIMES_AS_CDOT.includes(lang));
        assert(MATH_RULES_LOCALES.MAYBE_DIV_AS_COLON.includes(lang));

        const allItems = [{
            englishStr: 'simplify $2 \\times 2 \\div 2$',
            translatedStr: 'simplifyz $2 \\cdot 2 \\mathbin{:} 2$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $4 \\div 1 \\times 5$',
            translatedStr: '',
        }];
        // The translated template contained mathbin and cdot, so we will
        // translate accordingly
        const translatedStrs = ['simplifyz $4 \\mathbin{:} 1 \\cdot 5$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, lang);

        // Here the translator translated div as mathbin,
        // but left times as multiplication operator.
        const allItems2 = [{
            englishStr: 'simplify $2 \\times 2 \\div 2$',
            translatedStr: 'simplifyz $2 \\times 2 \\mathbin{:} 2$',
        }];

        // Notice times instead of cdot
        const translatedStrs2 = ['simplifyz $4 \\mathbin{:} 1 \\times 5$'];

        assertSuggestions(allItems2, itemsToTranslate, translatedStrs2, lang);
    });

    it('should handle maybeTranslateMath together with \\text', function() {
        const lang = 'id';

        const allItems = [{
            englishStr: 'simplify $2\\text{to} 2\\times\\div2 \\textbf{equal}$',
            translatedStr: 'simplifyz $2\\text{t} 2\\cdot\\div2 \\textbf{eq}$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $4\\text{to} 4\\times\\div1 \\textbf{equal}$',
            translatedStr: '',
        }];
        const translatedStrs =
            ['simplifyz $4\\text{t} 4\\cdot\\div1 \\textbf{eq}$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, lang);
    });

    it('should return the same math without a template', function() {
        const lang = MATH_RULES_LOCALES.MAYBE_TIMES_AS_CDOT[0];
        const allItems = [];
        const itemsToTranslate = [
            {englishStr: '$3 \\times x = 2$', translatedStr: ''},
            {englishStr: 'hello', translatedStr: ''},
        ];
        const translatedStrs = ['$3 \\times x = 2$', null];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, lang);
    });

    it('should NOT translate if template contains conflicting notation',
    function() {
        const lang = MATH_RULES_LOCALES.MAYBE_TIMES_AS_CDOT[0];
        const allItems = [
            {englishStr: 'Simplify $3 \\times x \\times y$',
            translatedStr: 'Simplifyz $3 \\cdot x \\times y$'},
        ];
        const itemsToTranslate = [
            {englishStr: 'Simplify $6 \\times y$', translatedStr: ''},
        ];
        const translatedStrs = [null];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, lang);
    });

    it('should translate only math present in the template', function() {
        const lang = 'id';
        assert(MATH_RULES_LOCALES.MAYBE_TIMES_AS_CDOT.includes(lang));
        assert(MATH_RULES_LOCALES.MAYBE_DIV_AS_COLON.includes(lang));

        const allItems = [
            {englishStr: '$6 \\div 3$',
             translatedStr: '$6 \\mathbin{:} 3$',
            },
        ];
        const itemsToTranslate = [
            // Because the template does not contatain \\times, we do not know
            // how the translator wants to handle it. So we will do nothing
            // and keep the original \\times
            {englishStr: '$6 \\times y$', translatedStr: ''},
            {englishStr: '$6 \\div y$', translatedStr: ''},
            {englishStr: 'hello', translatedStr: ''},
        ];
        const translatedStrs = ['$6 \\times y$', '$6 \\mathbin{:} y$', null];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, lang);
    });

    // In this test, we have multiple different math operators in a single
    // template string so we know how the translator translated them and we can
    // apply maybeMathTranslate to strings containing these notations
    it('should translate multiple notations in math-only strings', function() {
        // Lang 'id' is in both MAYBE_TIMES_AS_CDOT and MAYBE_DIV_AS_COLON
        const lang = 'id';
        const allItems = [
            {englishStr: '$6 \\div 3 \\times y$',
             translatedStr: '$6 \\mathbin{:} 3 \\cdot y$',
            },
        ];
        const itemsToTranslate = [
            // Notice these are separate strings with different math operators!
            // This works because the template contained both \\div and \\times
            {englishStr: '$6 \\times y$', translatedStr: ''},
            {englishStr: '$6 \\div y$', translatedStr: ''},
            {englishStr: 'hello', translatedStr: ''},
        ];
        const translatedStrs = ['$6 \\cdot y$', '$6 \\mathbin{:} y$', null];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, lang);
    });

    // TODO(danielhollas): Make this work
    /* For strings containing only math, it's very plausible that different
     * strings will contain different math notation within a single exercise.
     * In such a case, it would be nice if a translator could translate a couple
     * of such strings, and the code would detect how he translated the math
     * notation in all of them and apply the rules to the rest of the
     * untranslated strings. However, this is currently not possible, because
     * the code in `getSuggestionGroups()` creates the template from the first
     * translatedStr and skips the rest.
     */
    /*
    it('should translate math-only strings from multiple templates',
        function() {
        // Lang 'id' is in both MAYBE_TIMES_AS_CDOT and MAYBE_DIV_AS_COLON
        const lang = 'id';
        const allItems = [
            {englishStr: '$6 \\div y$', translatedStr: '$6 \\mathbin{:} y$'},
            {englishStr: '$3 \\times x$', translatedStr: '$3 \\cdot x$'},
        ];
        const itemsToTranslate = [
            {englishStr: '$6 \\times y \\div 3$', translatedStr: ''},
            {englishStr: 'hello', translatedStr: ''},
        ];
        const translatedStrs = ['$6 \\cdot y \\mathbin{:} 3$', null];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, lang);
    });
    */

    it('should translate closed intervals in math-only strings', function() {
        const lang = 'fr';
        assert(MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS.includes(lang));
        assert(MATH_RULES_LOCALES.DECIMAL_COMMA.includes(lang));

        const allItems = [];
        const itemsToTranslate = [
            {englishStr: '$(1,2) [2,b] [a,c) (1.2,5]$', translatedStr: ''},
        ];
        const translatedStrs = ['$]1;2[ [2;b] [a;c[ ]1{,}2;5]$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, lang);
    });

    it('should detect and translate coordinates in math-only strings',
    function() {
        const lang = 'cs';
        assert(MATH_RULES_LOCALES.COORDS_AS_BRACKETS.includes(lang));
        assert(MATH_RULES_LOCALES.DECIMAL_COMMA.includes(lang));

        const allItems = [];
        const itemsToTranslate = [
            {englishStr: '$(2,1) (x,y) (\\green4,1.5)$', translatedStr: ''},
        ];
        const translatedStrs = ['$[2;1] [x;y] [\\green4;1{,}5]$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, lang);
    });

    it('should handle superflous spaces in English coordinates', function() {
        const lang = 'cs';
        assert(MATH_RULES_LOCALES.COORDS_AS_BRACKETS.includes(lang));
        assert(MATH_RULES_LOCALES.DECIMAL_COMMA.includes(lang));

        const allItems = [
            {englishStr: 'coordinates $( 0,1)$',
             translatedStr: 'souradnice $[0;1]$'},
        ];
        const itemsToTranslate = [
            {englishStr: 'coordinates $( 2, 1)$', translatedStr: ''},
        ];
        const translatedStrs = ['souradnice $[2;1]$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, lang);
    });

    it('should handle superflous spaces in translated coordinates', function() {
        const lang = 'cs';
        assert(MATH_RULES_LOCALES.COORDS_AS_BRACKETS.includes(lang));
        assert(MATH_RULES_LOCALES.DECIMAL_COMMA.includes(lang));

        const allItems = [
            {englishStr: 'coordinates $(0,1 )$',
             translatedStr: 'souradnice $[0; 1 ]$'},
        ];
        const itemsToTranslate = [
            {englishStr: 'coordinates $(2,1)$', translatedStr: ''},
        ];
        const translatedStrs = ['souradnice $[2; 1]$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, lang);
    });

    it('should translate both coordinates and intervals in separate math bits',
    function() {
        const lang = 'cs';
        assert(MATH_RULES_LOCALES.COORDS_AS_BRACKETS.includes(lang));
        assert(MATH_RULES_LOCALES.CLOSED_INT_AS_ANGLE_BRACKETS.includes(lang));
        assert(MATH_RULES_LOCALES.DECIMAL_COMMA.includes(lang));

        const allItems = [
            {englishStr: 'Intervals $[0,3] (-1,3)$ coordinates $(0,0)$',
            translatedStr: 'Ints $⟨0;3⟩ (-1;3)$ coords $[0;0]$'},
        ];
        const itemsToTranslate = [
            {englishStr: 'Intervals $[0,3) (-5,\\red3]$ coordinates $(-1,-1)$',
            translatedStr: ''},
        ];
        const translatedStrs = ['Ints $⟨0;3) (-5;\\red3⟩$ coords $[-1;-1]$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, lang);
    });

    it('should translate open intervals according to a template', function() {
        const lang = 'fr';
        assert(MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS.includes(lang));

        const allItems = [
            {englishStr: 'Open intervals $(0,3) (\\blueD{-1},0)$',
            translatedStr: 'Ints $]0~;3[ ]\\blueD{-1}~;0[$'},
        ];
        const itemsToTranslate = [
            {englishStr: 'Open intervals $(0,3)$',
            translatedStr: ''},
        ];
        const translatedStrs = ['Ints $]0~;3[$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, lang);
    });

    it('should translate coordinates according to a template', function() {
        const lang = 'cs';
        assert(MATH_RULES_LOCALES.COORDS_AS_BRACKETS.includes(lang));
        assert(MATH_RULES_LOCALES.DECIMAL_COMMA.includes(lang));

        const allItems = [
            {englishStr: 'Coordinates $(0,3.\\overline{3}) (\\blueD{-1},0)$',
            translatedStr: 'Coords $[0;3{,}\\overline{3}] [\\blueD{-1};0]$'},
        ];
        const itemsToTranslate = [
            {englishStr: 'Coordinates $(0,3)$',
            translatedStr: ''},
        ];
        const translatedStrs = ['Coords $[0;3]$'];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs, lang);
    });
});

describe('TranslationAssistant (graphie)', function() {
    // NOTE(danielhollas): This test is flaky, not sure why
    it('should handle multiple graphies on multiple lines', function() {
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
            `hintz: ${graphie6}`,
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
            `answerz ${graphie4}, simplifyz ${graphie3}`,
        ]);
    });

    it('should handle strings that are only graphies', function() {
        const allItems = [{
            englishStr: graphie1,
            translatedStr: graphie1,
        }];
        const itemsToTranslate = [{
            englishStr: graphie2,
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [graphie2]);
    });
});

describe('TranslationAssistant (image and graphie links)', function() {
    it('should handle multiple image links on multiple lines', function() {
        const allItems = [{
            englishStr: `simplify ${image1}, answer ${image2}\n\n` +
                `hints: ${image3}`,
            translatedStr: `simplifyz ${image1}, answerz ${image2}\n\n` +
                `hintz: ${image3}`,
        }];
        const itemsToTranslate = [{
            englishStr: `simplify ${image4}, answer ${image5}\n\n` +
                `hints: ${image6}`,
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            `simplifyz ${image4}, answerz ${image5}\n\n` +
            `hintz: ${image6}`,
        ]);
    });

    it('should handle translations that re-order image links', function() {
        const allItems = [{
            englishStr: `simplify ${image1}, answer ${image2}`,
            translatedStr: `answerz ${image2}, simplifyz ${image1}`,
        }];
        const itemsToTranslate = [{
            englishStr: `simplify ${image3}, answer ${image4}`,
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            `answerz ${image4}, simplifyz ${image3}`,
        ]);
    });

    it('should handle strings that are only image links', function() {
        const allItems = [{
            englishStr: image1,
            translatedStr: image1,
        }];
        const itemsToTranslate = [{
            englishStr: image2,
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [image2]);
    });

    it('should handle multiple graphie links on multiple lines', function() {
        const allItems = [{
            englishStr: `simplify ${graphieLink1} to ${graphieLink2}\n\n` +
                `hints: ${graphieLink3}`,
            translatedStr: `simplifyz ${graphieLink1} toz ${graphieLink2}\n\n` +
                `hintz: ${graphieLink3}`,
        }];
        const itemsToTranslate = [{
            englishStr: `simplify ${graphieLink4} to ${graphieLink5}\n\n` +
                `hints: ${graphieLink6}`,
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            `simplifyz ${graphieLink4} toz ${graphieLink5}\n\n` +
            `hintz: ${graphieLink6}`,
        ]);
    });

    it('should handle translations that re-order graphie links', function() {
        const allItems = [{
            englishStr: `simplify ${graphieLink1}, answer ${graphieLink2}`,
            translatedStr: `answerz ${graphieLink2}, simplifyz ${graphieLink1}`,
        }];
        const itemsToTranslate = [{
            englishStr: `simplify ${graphieLink3}, answer ${graphieLink4}`,
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            `answerz ${graphieLink4}, simplifyz ${graphieLink3}`,
        ]);
    });

    it('should handle strings that are only graphie links', function() {
        const allItems = [{
            englishStr: graphieLink1,
            translatedStr: graphieLink1,
        }];
        const itemsToTranslate = [{
            englishStr: graphieLink2,
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [graphieLink2]);
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
            'hintz: [[☃ Expression 3]]',
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
            'answerz [[☃ Expression 2]], simplifyz [[☃ Expression 1]]',
        ]);
    });

    it('should handle strings that are only widgets', function() {
        const allItems = [{
            englishStr: '[[☃ Expression 1]]',
            translatedStr: '[[☃ Expression 1]]',
        }];
        const itemsToTranslate = [{
            englishStr: '[[☃ Expression 1]]',
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, ['[[☃ Expression 1]]']);
    });
});

describe('TranslationAssistant (\\text{}, \\textbf{})', function() {
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
            'simplifyz $3 * \\text{roja} = 20$',
        ]);
    });

    it('should handle a single \\texbf{}', function() {
        const allItems = [{
            englishStr: 'simplify $\\textbf{red} = 5$',
            translatedStr: 'simplifyz $\\textbf{roja} = 5$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3 * \\textbf{red} = 20$',
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            'simplifyz $3 * \\textbf{roja} = 20$',
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
            'simplifyz $14 = \\text{azul} - 9$',
        ]);
    });

    it('should handle multiple items with one per item \\textbf{}', function() {
        const allItems = [{
            englishStr: 'simplify $\\textbf{red} = 5$',
            translatedStr: 'simplifyz $\\textbf{roja} = 5$',
        }, {
            englishStr: 'simplify $\\textbf{blue} = 10$',
            translatedStr: 'simplifyz $\\textbf{azul} = 10$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3 * \\textbf{red} = 20$',
            translatedStr: '',
        }, {
            englishStr: 'simplify $14 = \\textbf{blue} - 9$',
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            'simplifyz $3 * \\textbf{roja} = 20$',
            'simplifyz $14 = \\textbf{azul} - 9$',
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
            'simplifyz $3 * \\text{azul} = 20 - \\text{roja}$',
        ]);
    });

    it('should handle an item with multiple \\textbf{}', function() {
        const allItems = [{
            englishStr: 'simplify $\\textbf{red} = 5 * \\textbf{blue}$',
            translatedStr: 'simplifyz $\\textbf{azul} = 5 * \\textbf{roja}$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3 * \\textbf{red} = 20 - \\textbf{blue}$',
            translatedStr: '',
        }];

        // Even though "red" in Spanish should be "roja", smart translations
        // doesn't know that.  The template built from allItems will contain a
        // mathDictionary which maps "red" to "azul" and "blue" to "roja".
        assertSuggestions(allItems, itemsToTranslate, [
            'simplifyz $3 * \\textbf{azul} = 20 - \\textbf{roja}$',
        ]);
    });

    it('should not handle an item with different order of \\text{} and ' +
            '\\textbf{}', function() {
        const allItems = [{
            englishStr: 'simplify $\\text{red} = 5 * \\textbf{blue}$',
            translatedStr: 'simplifyz $\\textbf{azul} = 5 * \\text{roja}$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3 * \\text{blue} = 20 - \\textbf{red}$',
            translatedStr: '',
        }, {
            englishStr: 'simplify $3 * \\textbf{blue} = 20 - \\text{red}$',
            translatedStr: '',
        }];

        // Since the order of \\text and \\textbf is different between English
        // and translated strings, the mathDictionary template built from
        // allItems cannot find a match between the English (input) and the
        // translated (output).
        const translatedStrs = [null];

        assertSuggestions(allItems, itemsToTranslate, translatedStrs);
    });

    it('should handle an item with \\text{} and \\textbf{}', function() {
        const allItems = [{
            englishStr: 'simplify $\\text{red} = 5 * \\textbf{blue}$',
            translatedStr: 'simplifyz $\\text{azul} = 5 * \\textbf{roja}$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3 * \\text{red} = 20 - \\textbf{blue}$',
            translatedStr: '',
        }, {
            englishStr: 'simplify $3 * \\textbf{red} = 20 - \\text{blue}$',
            translatedStr: '',
        }];

        // Even though "red" in Spanish should be "roja", smart translations
        // doesn't know that.  The template built from allItems will contain a
        // mathDictionary which maps "red" to "azul" and "blue" to "roja".
        assertSuggestions(allItems, itemsToTranslate, [
            'simplifyz $3 * \\text{azul} = 20 - \\textbf{roja}$',
            'simplifyz $3 * \\textbf{azul} = 20 - \\text{roja}$',
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

    it('should handle multiple items with multiple \\textbf{}', function() {
        const allItems = [{
            englishStr: 'simplify $\\textbf{red} = 5 * \\textbf{blue}$',
            translatedStr: 'simplifyz $\\textbf{azul} = 5 * \\textbf{roja}$',
        }, {
            englishStr: 'simplify $\\textbf{red} + \\textbf{yellow} = 42$',
            translatedStr: 'simplifyz $\\textbf{roja} + ' +
                '\\textbf{amarillo} = 42$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3 * \\textbf{red} = 20 - \\textbf{blue}$',
            translatedStr: '',
        }, {
            englishStr: 'simplify $x - \\textbf{yellow} = \\textbf{red}$',
            translatedStr: '',
        }];

        // The group keys are different for the items in allItems.  The first
        // is {str:"simplify __MATH__",texts:[["red","blue"]]}.  The second is
        // {str:"simplify __MATH__",texts:[["red","yellow"]]}.  Because the
        // group keys are different there ends up being two different groups,
        // each with their own template with its own mathDictionary.  The first
        // template translates \\textbf{red} to \\textbf{azul} while the second
        // template translates \\textbf{red} to \\textbf{roja}.
        assertSuggestions(allItems, itemsToTranslate, [
            'simplifyz $3 * \\textbf{azul} = 20 - \\textbf{roja}$',
            'simplifyz $x - \\textbf{amarillo} = \\textbf{roja}$',
        ]);
    });

    it('should handle multiple items with \\text{} and \\textbf{}', function() {
        const allItems = [{
            englishStr: 'simplify $\\textbf{red} = 5 * \\text{blue}$',
            translatedStr: 'simplifyz $\\textbf{azul} = 5 * \\text{roja}$',
        }, {
            englishStr: 'simplify $\\text{red} + \\textbf{yellow} = 42$',
            translatedStr: 'simplifyz $\\text{roja} + \\textbf{amarillo} = 42$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $3 * \\textbf{red} = 20 - \\text{blue}$',
            translatedStr: '',
        }, {
            englishStr: 'simplify $3 * \\text{red} = 20 - \\textbf{blue}$',
            translatedStr: '',
        }, {
            englishStr: 'simplify $x - \\text{yellow} = \\textbf{red}$',
            translatedStr: '',
        }, {
            englishStr: 'simplify $x - \\textbf{yellow} = \\text{red}$',
            translatedStr: '',
        }];

        // The group keys are different for the items in allItems.  The first
        // is {str:"simplify __MATH__",texts:[["red","blue"]]}.  The second is
        // {str:"simplify __MATH__",texts:[["red","yellow"]]}.  Because the
        // group keys are different there ends up being two different groups,
        // each with their own template with its own mathDictionary.  The first
        // template translates \\textbf{red} to \\textbf{azul} while the second
        // template translates \\text{red} to \\text{roja}.
        assertSuggestions(allItems, itemsToTranslate, [
            'simplifyz $3 * \\textbf{azul} = 20 - \\text{roja}$',
            'simplifyz $3 * \\text{azul} = 20 - \\textbf{roja}$',
            'simplifyz $x - \\text{amarillo} = \\textbf{roja}$',
            'simplifyz $x - \\textbf{amarillo} = \\text{roja}$',
        ]);
    });

    it('should not translate items with unknown text', function() {
        const allItems = [{
            englishStr: 'simplify $\\text{red} = 5$',
            translatedStr: 'simplifyz $\\text{roja} = 5$',
        }, {
            englishStr: 'simplify $\\textbf{red} = 5$',
            translatedStr: 'simplifyz $\\textbf{roja} = 5$',
        }];
        const itemsToTranslate = [{
            englishStr: 'simplify $\\text{blue}$',
            translatedStr: '',
        }, {
            englishStr: 'simplify $\\textbf{blue}$',
            translatedStr: '',
        }];

        const assistant = new TranslationAssistant(
            allItems, getEnglishStr, getTranslation);

        const translation = assistant.suggest(itemsToTranslate);
        assert.equal(translation[0][1], null);
        assert.equal(translation[1][1], null);
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
        }, {
            englishStr: '$\\textbf{red} = 15$',
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            '$\\text{roja} = 15$',
            '$\\textbf{roja} = 15$',
        ]);
    });

    it('should work with spaces between \\text and {', function() {
        assertSuggestions([{
            englishStr: '$\\text{Area}} = 6 \\text { square cm}$',
            translatedStr: '$\\text{Fläche}} = 6 \\text { Quadratzentimeter}$',
        }], [{
            englishStr: '$\\text{Area}} = 12 \\text { square cm}$',
            translated: '',
        }], ['$\\text{Fläche}} = 12 \\text { Quadratzentimeter}$']);
    });

    it('should work with spaces between \\textbf and {', function() {
        assertSuggestions([{
            englishStr: '$\\textbf{Area}} = 6 \\textbf { square cm}$',
            translatedStr: '$\\textbf{Fläche}} = 6 ' +
                '\\textbf { Quadratzentimeter}$',
        }], [{
            englishStr: '$\\textbf{Area}} = 12 \\textbf { square cm}$',
            translated: '',
        }], ['$\\textbf{Fläche}} = 12 \\textbf { Quadratzentimeter}$']);
    });

    it('should handle special characters inside \\text', function() {
        const allItems = [{
            englishStr: '$6 \\text{( . )}$',
            translatedStr: '$6 \\text{)}$',
        }];

        const itemsToTranslate = [{
            englishStr: '$5 \\text{( . )}$',
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            '$5 \\text{)}$',
        ]);
    });

    it('should handle special characters inside \\textbf', function() {
        const allItems = [{
            englishStr: '$6 \\textbf{( . )}$',
            translatedStr: '$6 \\textbf{)}$',
        }];

        const itemsToTranslate = [{
            englishStr: '$5 \\textbf{( . )}$',
            translatedStr: '',
        }];

        assertSuggestions(allItems, itemsToTranslate, [
            '$5 \\textbf{)}$',
        ]);
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
            'Solvez $2x - 5 = 10$',
        ]);
    });

    it('should not translate non-bold from bold', function() {
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
            stringToGroupKey('simplify ${\\textbf{red} = 5$'),
            '{"str":"simplify __MATH__","texts":[["red"]]}');

        assert.equal(
            stringToGroupKey('${\\text{red}, \\textbf{green}, \\text{blue}$'),
            '{"str":"__MATH__","texts":[["blue","green","red"]]}');

        assert.equal(
            stringToGroupKey('${\\text{red}$ and $\\textbf{blue}$'),
            '{"str":"__MATH__ and __MATH__","texts":[["red"],["blue"]]}');

        assert.equal(
            stringToGroupKey('${\\text {red} + \\textbf {blue}$ and $1 + 2$'),
            '{"str":"__MATH__ and __MATH__","texts":[["blue","red"],[]]}');
    });
});

describe('populateTemplate where englishStr contains \\text{} and ' +
        '\\textbf{}', function() {
    const englishStr = '$x = 1$, $\\text{red} = 5$, $\\text{yellow} = 10$, ' +
        '$\\text{blue} = 10$, $\\textbf{red} = 5$';
    const translatedStr = '$\\text{azul} = 10$, $x = 1$, ' +
        '$\\textbf{roja} = 5$, $\\text{amarillo} = 10$, $\\text{roja} = 5$, ' +
        '$x = 1$, $\\text{azul} = 10$';
    const lang = 'es';

    it('should translate the string used to create the template', function() {
        const template = createTemplate(englishStr, translatedStr, lang);
        const actual = populateTemplate(template, englishStr, lang);

        assert.equal(actual, translatedStr);
    });

    it('should translate other similar strings', function() {
        const template = createTemplate(englishStr, translatedStr, lang);

        const newEnglishStr = '$x = 21$, $\\text{red} = 25$, ' +
            '$\\text{yellow} = 210$, $\\text{blue} = 210$, ' +
            '$\\textbf{red} = 25$';
        const newTranslatedStr =
            populateTemplate(template, newEnglishStr, lang);

        assert.equal(newTranslatedStr,
            '$\\text{azul} = 210$, $x = 21$, $\\textbf{roja} = 25$, ' +
            '$\\text{amarillo} = 210$, $\\text{roja} = 25$, $x = 21$, ' +
            '$\\text{azul} = 210$');
    });
});
