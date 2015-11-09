/**
 * This file contains functions generating suggested translations.  See the
 * jsdocs for the 'suggest' function for more details.
 */

// Matches math delimited by $, e.g.
// $x^2 + 2x + 1 = 0$
// $\text{cost} = \$4$
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var MATH_REGEX = /\$(\\\$|[^\$])+\$/g;

// Matches graphie strings,
// e.g. ![](web+graphie://ka-perseus-graphie.s3.amazonaws.com/542f2b4e297910eed545a5c29c3866918655bab4)
var GRAPHIE_REGEX = /\!\[\]\([^)]+\)/g;

// Matches widget strings, e.g. [[☃ Expression 1]]
var WIDGET_REGEX = /\[\[[\u2603][^\]]+\]\]/g;

// Matches bold strings in markdown syntax, e.g. "This is **bold**"
var BOLD_REGEX = /\*\*.*\*\*/g;

// Use two line feeds to split lines because this is how Markdown delineates
// paragraphs.
var LINE_BREAK = '\n\n';

/**
 * Normalizes a string.  This is used when determining groups so that we don't
 * create groups based on non natural language text differences.
 *
 * We replace math, graphies, and widgets with placehodlers and remove
 * unimportant whitespace differences on the item so that we can group
 * strings with similar natural language text.  We also disregard bold
 * markup when determining a match.  This means that translators may
 * have to add bold markkup to the suggestion in some cases.
 *
 * @param {string} str The string to normalize.
 * @returns {string} The normalized string.
 */
function normalizeString(str) {
    return str.replace(MATH_REGEX, '__MATH__').replace(GRAPHIE_REGEX, '__GRAPHIE__').replace(WIDGET_REGEX, '__WIDGET__').replace(/__MATH__[\t ]*__WIDGET__/g, '__MATH__ __WIDGET__').replace(BOLD_REGEX, function (match) {
        return match.substring(2, match.length - 2);
    }).split(LINE_BREAK).map(function (line) {
        return line.trim();
    }).join(LINE_BREAK);
}

/**
 * Returns a mapping between the order of special substrings such as math
 * strings in translatedStr and their order in englishStr.
 *
 * Example:
 * let mapping = getMapping(
 *    "simplify $2/4$\n\nhint: the denominator is $2$",
 *    "hintz: da denom $2$ iz $2$\n\nsimplifz $2/4$",
 *    "es",
 *    MATH_REGEX
 * );
 *
 * // mapping = [1,1,0];
 *
 * This mapping array indicates that the first two __MATH__ placeholders in the
 * translated string template should be replaced with the second math block
 * from the English string we're translating.  The third __MATH__ placeholder
 * should be replaced by the first math block from the English string we're
 * translating.
 *
 * @param {String} englishStr The English source string.
 * @param {String} translatedStr The translation of the englishStr.
 * @param {String} lang ka_locale of translatedStr.
 * @param {RegExp} findRegex A regex that matches math, graphies, or widgets.
 *        Use one of MATH_REGEX, GRAPHIE_REGEX, or WIDGET_REGEX.
 * @returns {Array} An array representing the mapping.
 */
function getMapping(englishStr, translatedStr, lang, findRegex) {
    var inputs = englishStr.match(findRegex) || [];
    var outputs = translatedStr.match(findRegex) || [];

    var mapping = [];

    outputs.forEach(function (output, outputIndex) {
        output = translateMath(output, lang);
        var inputIndex = inputs.indexOf(output);
        if (inputIndex === -1) {
            if (findRegex === MATH_REGEX) {
                throw new Error('math doesn\'t match');
            } else if (findRegex === GRAPHIE_REGEX) {
                throw new Error('graphies don\'t match');
            } else if (findRegex === WIDGET_REGEX) {
                throw new Error('widgets don\'t match');
            } else {
                throw new Error('the only acceptable values for getFunc are ' + 'getMaths, getGraphies, and getWdigets');
            }
        }
        mapping[outputIndex] = inputIndex;
    });

    return mapping;
}

/**
 * Creates a template object based on englishStr and translatedStr strings.
 *
 * All math, graphie, and widget sub-strings are replaced by placeholders and
 * the mappings for which sub-string goes where in the translatedStr.  The
 * englishStr is split into lines.  While this isn't particular useful right
 * now, the plan is to eventually use the lines creating suggestions for
 * partial matches.
 *
 * @param {string} englishStr An English string.
 * @param {string} translatedStr The translation of the englishStr.
 * @param {string} lang The ka_locale of the translatedStr.
 * @returns {Object|Error} A template object which is passed to
 *          populateTemplate to generate suggestions for strings that haven't
 *          been translated yet.
 */
function createTemplate(englishStr, translatedStr, lang) {
    var translatedLines = translatedStr.split(LINE_BREAK);
    try {
        return {
            lines: translatedLines.map(function (line) {
                return line.replace(MATH_REGEX, '__MATH__').replace(GRAPHIE_REGEX, '__GRAPHIE__').replace(WIDGET_REGEX, '__WIDGET__');
            }),
            mathMapping: getMapping(englishStr, translatedStr, lang, MATH_REGEX),
            graphieMapping: getMapping(englishStr, translatedStr, lang, GRAPHIE_REGEX),
            widgetMapping: getMapping(englishStr, translatedStr, lang, WIDGET_REGEX)
        };
    } catch (e) {
        return e;
    }
}

/**
 * Handles any per language special case translations, e.g. Portuguese uses
 * `sen` instead of `sin`.
 *
 * @param {string} math
 * @param {string} lang
 * @returns {string}
 */
// TODO(kevinb): handle \text{} inside math
function translateMath(math, lang) {
    if (lang === 'pt') {
        return math.replace(/\\sin/g, '\\operatorname\{sen\}');
    } else {
        return math;
    }
}

/**
 * Returns a translations suggestion based the given template and englishStr.
 *
 * @param {Object} template A template object return by createTemplate.
 * @param {string} englishStr The English string to be translated.
 * @param {string} lang The ka_locale that was used when creating the template.
 * @returns {string} The suggested translation.
 */
function populateTemplate(template, englishStr, lang) {
    var englishLines = englishStr.split(LINE_BREAK);

    var maths = englishStr.match(MATH_REGEX) || [];
    var graphies = englishStr.match(GRAPHIE_REGEX) || [];
    var widgets = englishStr.match(WIDGET_REGEX) || [];

    var mathIndex = 0;
    var graphieIndex = 0;
    var widgetIndex = 0;

    maths = maths.map(function (math) {
        return translateMath(math, lang);
    });

    return englishLines.map(function (englishLine, index) {
        var templateLine = template.lines[index];

        return templateLine.replace(/__MATH__/g, function () {
            return maths[template.mathMapping[mathIndex++]];
        }).replace(/__GRAPHIE__/g, function () {
            return graphies[template.graphieMapping[graphieIndex++]];
        }).replace(/__WIDGET__/g, function () {
            return widgets[template.widgetMapping[widgetIndex++]];
        });
    }).join(LINE_BREAK);
}

/**
 * Provides suggestions for one or more strings from one or more groups of
 * similar strings.
 */

var TranslationAssistant = (function () {
    /**
     * Create a new TranslationAssistant instance.
     *
     * @param allItems - The items to be grouped and used to for generating
     *     suggestions, see getSuggestionGroups.
     * @param getEnglishStr - Function to extract English strings from items.
     * @param getTranslation - Function to get a translated string for an item.
     * @param lang - ka_locale, used for language specific translations, e.g.
     *     in Portuguese, `\sin` should be `\operatorname\{sen\}`.
     */

    function TranslationAssistant(allItems, getEnglishStr, getTranslation, lang) {
        _classCallCheck(this, TranslationAssistant);

        this.getEnglishStr = getEnglishStr;
        this.getTranslation = getTranslation;
        this.suggestionGroups = this.getSuggestionGroups(allItems);
        this.lang = lang;
    }

    /**
     * Return an array of translation suggestions.
     *
     * Each item in the array is a couple with the first element being the item
     * for which the translation was generated and the second being the
     * translated string, e.g.
     *  [
     *      [
     *          {
     *              englishStr: 'foo',
     *              jiptStr: 'crowdin:1:crowdin`
     *          },
     *          'foz'
     *      ],
     *      [
     *          {
     *              englishStr: 'bar',
     *              jiptStr: 'crowdin:1:crowdin`
     *          },
     *          'baz'
     *      ]
     *  ]
     *
     * @param itemsToTranslate – same type of objects as the `allItems`
     * argument that was passed to the constructor.
     *
     * Note: the items given in the example have `englishStr` and `jiptStr`
     * properties, but they could have any shape as long as the `getEnglishStr`
     * function that was passed to the constructor returns an English string
     * when passed one of the items.
     */

    TranslationAssistant.prototype.suggest = function suggest(itemsToTranslate) {
        var _this = this;

        var suggestionGroups = this.suggestionGroups;
        var lang = this.lang;

        return itemsToTranslate.map(function (item) {
            var englishStr = _this.getEnglishStr(item);
            var normalStr = normalizeString(englishStr);

            // Translate items that are only math, a graphie, or a widget.
            // TODO(kevinb) handle multiple non-nl_text items
            if (/^(__MATH__|__GRAPHIE__|__WIDGET__)$/.test(normalStr)) {
                if (normalStr === '__MATH__') {
                    // Only translate the math if it doesn't include any
                    // natural language text in a \text command.
                    if (englishStr.indexOf('\\text') === -1) {
                        return [item, translateMath(englishStr, lang)];
                    }
                } else {
                    return [item, englishStr];
                }
            }

            if (suggestionGroups.hasOwnProperty(normalStr)) {
                var template = suggestionGroups[normalStr].template;

                // This error is probably due to math being different between
                // the English string and the translated string.
                if (template instanceof Error) {
                    return [item, null];
                }

                if (template) {
                    var translatedStr = populateTemplate(template, _this.getEnglishStr(item), lang);
                    return [item, translatedStr];
                }
            }

            // The item doesn't belong in any of the suggestion groups.
            return [item, null];
        });
    };

    /**
     * Group objects that contain English strings to translate.
     *
     * Groups are determined by the similarity between the English strings
     * returned by `this.getEnglishStr` on each object in `items`.  In order to
     * find more matches we ignore math, graphie, and widget substrings.
     *
     * Each group contains an array of items that belong in that group and a
     * translation template if there was at least one item that had a
     * translation.  Translations are determined by passing each item to
     * `this.getTranslation`.
     *
     * Input:
     * [
     *    {
     *        englishStr: "simplify $2/4$\n\nhint: the denominator is $2$",
     *        id: 1001,
     *    }, {
     *        englishStr: "simplify $3/12$\n\nhint: the denominator is $4$",
     *        id: 1002,
     *    }
     * ];
     *
     * Output:
     * {
     *    "simplify __MATH__\n\\nhint: denominator is __MATH__": {
     *        items: [{
     *            englishStr: "simplify $2/4$\n\nhint: the denominator is $2$",
     *            id: 1001,
     *        }, {
     *            englishStr: "simplify $3/12$\n\nhint: the denominator is $4$",
     *            id: 1002,
     *        }],
     *        template: { ... }
     *    },
     *    ...
     * }
     */

    TranslationAssistant.prototype.getSuggestionGroups = function getSuggestionGroups(items) {
        var _this2 = this;

        var suggestionGroups = {};

        items.forEach(function (obj) {
            var str = normalizeString(_this2.getEnglishStr(obj));

            if (suggestionGroups[str]) {
                suggestionGroups[str].push(obj);
            } else {
                suggestionGroups[str] = [obj];
            }
        });

        Object.keys(suggestionGroups).forEach(function (key) {
            var items = suggestionGroups[key];

            for (var _iterator = items, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
                var _ref;

                if (_isArray) {
                    if (_i >= _iterator.length) break;
                    _ref = _iterator[_i++];
                } else {
                    _i = _iterator.next();
                    if (_i.done) break;
                    _ref = _i.value;
                }

                var item = _ref;

                var englishStr = _this2.getEnglishStr(item);
                var translatedStr = _this2.getTranslation(item);

                if (translatedStr) {
                    var template = createTemplate(englishStr, translatedStr, _this2.lang);
                    suggestionGroups[key] = { items: items, template: template };
                    return;
                }
            }
            suggestionGroups[key] = { items: items, template: null };
        });

        return suggestionGroups;
    };

    return TranslationAssistant;
})();

module.exports = TranslationAssistant;
