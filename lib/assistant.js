/**
 * This file contains functions generating suggested translations.  See the
 * jsdocs for the 'suggest' function for more details.
 */

// Matches math delimited by $, e.g.
// $x^2 + 2x + 1 = 0$
// $\text{cost} = \$4$
'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

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
 * Group similar strings ignoring math, graphie, and widget substrings.
 *
 * Example:
 * let englishStrs = [
 *    "simplify $2/4$\n\nhint: the denominator is $2$",
 *    "simplify $3/12$\n\nhint: the denominator is $4$"
 * ];
 *
 * let { lineMatches, stringMatches } = groupStrings(englishStrings);
 *
 * The result is:
 * lineMatches = {
 *    "simplify __MATH__": [
 *        "simplify $2/4$\n\nhint: the denominator is $2$",
 *        "simplify $3/12$\n\nhint: the denominator is $4$"
 *    ],
 *    "hint: denominator is __MATH__": [
 *        "simplify $2/4$\n\nhint: the denominator is $2$",
 *        "simplify $3/12$\n\nhint: the denominator is $4$"
 *    ]
 * }
 * stringMatches = {
 *    "simplify __MATH__\n\\nhint: denominator is __MATH__": [
 *        "simplify $2/4$\n\nhint: the denominator is $2$",
 *        "simplify $3/12$\n\nhint: the denominator is $4$"
 *    ]
 * }
 *
 * @param {Array<String>} englishStrs An array of English strings.
 * @returns {Object} An object containing partialStrings and completeStrings.
 *          properties which are both dictionaries where the values are strings
 *          that belong in the same group according to our grouping algorithm.
 */
function groupStrings(englishStrs) {
    // lineMatches contains entries where an individual line within a string
    // matches other individual lines within other strings ignoring math,
    // graphies, and widgets.  The key is the line after math, graphies, and
    // widgets have been replaced with placeholders.  The values are arrays
    // containing the origin strings.
    var lineMatches = {};

    // stringMatches contains entries where one string matches another string
    // ignoring math, graphie, and widgets.  The key is the string after math,
    // graphies, and widgets had been replaced with placeholders
    var stringMatches = {};

    englishStrs.forEach(function (originalStr) {
        var str = normalizeString(originalStr);

        // We iterate over the lines to determine if any lines match or if
        // the entire string matches.  We don't compare the strings directly
        // because we tolerate certain differences within each line when
        // matching, e.g. different punctuation at the end of lines.

        var isStringMatch = true;

        str.split(LINE_BREAK).forEach(function (line) {
            var lastChar = line[line.length - 1];

            // ignore minor punctuation changes
            if (/\,\.\:/.test(lastChar)) {
                line = line.substring(0, line.length - 1);
            }

            // TODO(kevinb): save original lines instead of original strings
            if (lineMatches[line]) {
                lineMatches[line].push(originalStr);
            } else {
                isStringMatch = false;
                lineMatches[line] = [originalStr];
            }
        });

        if (isStringMatch) {
            if (stringMatches[str]) {
                stringMatches[str].push(originalStr);
            } else {
                stringMatches[str] = [originalStr];
            }
        }
    });

    return {
        lineMatches: lineMatches,
        stringMatches: stringMatches
    };
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
        // TODO(kevinb): handle \text{} inside math
        if (lang === 'pt') {
            output = output.replace(/\\operatorname\{sen\}/g, '\\sin');
        }
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

    if (lang === 'pt') {
        maths = maths.map(function (math) {
            return math.replace(/\\sin/g, '\\operatorname\{sen\}');
        });
    }

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
 * Returns the first valid English/translated pair.
 *
 * @param {Array} translationPairs An array of [englishStr, translatedStr]
 *        pairs, at least one should contain non empty, non-null strings.
 * @returns {Array|Error} An array containing an English/translated string
 *          pair.  It returns an Error if no pair exists.
 */
function findTranslationPair(translationPairs) {
    for (var i = 0; i < translationPairs.length; i++) {
        var pair = translationPairs[i];
        if (pair[0] && pair[1]) {
            return pair;
        }
    }
    return new Error('couldn\'t find translation pair');
}

/**
 * Returns an Array of suggested translations.
 *
 * @param {Array} translationPairs An array of [englishStr, translatedStr]
 *        pairs, at least one should contain non empty, non-null string.
 * @param {Array} englishStrs An array of English strings to translate.
 * @param {string} lang The ka_locale of the translated strings in
 *        translationPairs.
 * @returns {Array|Error} An array of pairs containing the englishStrs passed
 *          in along with the accompanying translations.
 */
function suggest(translationPairs, englishStrs, lang) {
    var pair = findTranslationPair(translationPairs);
    if (pair instanceof Error) {
        return pair;
    }

    var _pair = _slicedToArray(pair, 2);

    var englishStr = _pair[0];
    var translatedStr = _pair[1];

    var template = createTemplate(englishStr, translatedStr, lang);

    if (template instanceof Error) {
        return template;
    }

    return englishStrs.map(function (englishStr) {
        return [englishStr, populateTemplate(template, englishStr, lang)];
    });
}

module.exports = {
    createTemplate: createTemplate,
    populateTemplate: populateTemplate,
    groupStrings: groupStrings,
    suggest: suggest
};
