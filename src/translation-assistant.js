/**
 * This file contains functions generating suggested translations.  See the
 * jsdocs for the 'suggest' function for more details.
 */
const {translateMath, normalizeTranslatedMath} = require('./math-translator');

// Matches math delimited by $, e.g.
// $x^2 + 2x + 1 = 0$
// $\text{cost} = \$4$
const MATH_REGEX = /\$(\\\$|[^\$])+\$/g;

// Matches graphie strings,
// e.g. ![](web+graphie://ka-perseus-graphie.s3.amazonaws.com/542f2b4e297910eed545a5c29c3866918655bab4)
const GRAPHIE_REGEX = /\!\[\]\([^)]+\)/g;

// Matches pure image and graphie link strings,
// e.g. https://ka-perseus-graphie.s3.amazonaws.com/e75c49cb5753492629016169933ab63af3b9f122.png
// or web+graphie://ka-perseus-graphie.s3.amazonaws.com/542f2b4e297910eed545a5c29c3866918655bab4
const IMAGE_REGEX = /https:[^\s]+\.png|web\+graphie:[a-z0-9\.\-/]+(?=[\s,]|$)/g;

// Matches widget strings, e.g. [[☃ Expression 1]]
const WIDGET_REGEX = /\[\[[\u2603][^\]]+\]\]/g;

// TODO(michaelpolyak): Add support for other \text commands:
// https://github.com/Khan/KaTeX/blob/3280652bd68973ad9edd73273137049324c5cab9/src/functions.js#L50
// NOTE(danhollas): Those other commands are rare/non-existent in KA corpus
const TEXT_REGEX = /\\text\s*{([^}]*)}/g;
const TEXTBF_REGEX = /\\textbf\s*{([^}]*)}/g;

// Use two line feeds to split lines because this is how Markdown delineates
// paragraphs.
const LINE_BREAK = '\n\n';


/**
 * Returns a key string for strings that should be in the same group.
 *
 * The key is used as a key for suggestionGroups.
 *
 * The key string is a JSON string that looks like:
 * '{str:"Is __MATH__ equal to __MATH__",texts:[["red", "blue"],[]]}'
 *
 * The `str` property is the `str` parameter with math, graphies, images, and
 * widgets replaced with placeholders.  Also, we remove unimportant whitespace
 * differences on the item so that we can group strings with similar natural
 * language text.  We also disregard bold markup when determining a match.
 * This means that translators may have to add bold markup to the suggestion
 * in some cases.
 *
 * `texts` is an array of arrays. Each entry in the outer array corresponds to
 * one `$` delineated formula in the original text. Each entry consists of all
 * of the strings within `\text{}` and `\textbf{}` blocks within its
 * corresponding formula.
 *
 * The example output above could've been generated from the following string:
 * "Is $\text{red} + \textbf{blue}$ equal to $7$?"
 *
 * @param {string} str The string to convert to a key.
 * @returns {string} The normalized string.
 */
function stringToGroupKey(str) {
    const maths = str.match(MATH_REGEX) || [];

    // This maps formula to an array which may contain 0 or more
    // strings which were found inside the \text{} and \textbf{} blocks
    const texts = maths.map((math) => {
        const result = [];

        const regex = new RegExp(
            `${TEXT_REGEX.source}|${TEXTBF_REGEX.source}`, 'g');

        allMatches(math, regex,
            (matches) => result.push(
                // TEXT_REGEX capture group is at index 1 and TEXTBF_REGEX at
                // index 2. One of the groups is expected to be `undefined`.
                matches[1] || matches[2]));

        // The natural language text is sorted so that even if the formula is
        // different and the natural language text is in a different order
        // we'll end up with the same key.
        result.sort();

        return result;
    });

    str = str
        .replace(MATH_REGEX, '__MATH__')
        .replace(GRAPHIE_REGEX, '__GRAPHIE__')
        .replace(IMAGE_REGEX, '__IMAGE__')
        .replace(WIDGET_REGEX, '__WIDGET__')
        .replace(/__MATH__[\t ]*__WIDGET__/g, '__MATH__ __WIDGET__')
        .split(LINE_BREAK).map((line) => line.trim()).join(LINE_BREAK);

    return JSON.stringify({str, texts});
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
 * translated string template should be replaced with the second formula
 * from the English string we're translating.  The third __MATH__ placeholder
 * should be replaced by the first formula from the English string we're
 * translating.
 *
 * @param {String} englishStr The English source string.
 * @param {String} translatedStr The translation of the englishStr.
 * @param {String} lang ka_locale of translatedStr.
 * @param {RegExp} findRegex A regex that matches math, graphies, images, or
 *        widgets. Use one of MATH_REGEX, GRAPHIE_REGEX, IMAGE_REGEX, or
 *        WIDGET_REGEX.
 * @param {Object} [mathDictionary] English to translated string mapping for
 *        for strings inside \text{} and \textbf{} blocks.
 * @returns {Array} An array representing the mapping.
 */
function getMapping(
    englishStr,
    translatedStr,
    lang,
    findRegex,
    // TODO(kevinb): change mathDictionary to mathDictionaries
    mathDictionary
) {
    let inputs = englishStr.match(findRegex) || [];
    const outputs = translatedStr.match(findRegex) || [];

    if (findRegex === MATH_REGEX) {
        inputs = inputs
            .map((input) => translateMath(input, lang))
            .map((input) => replaceTextInMath(input, mathDictionary));
    }

    const mapping = [];

    outputs.forEach((output, outputIndex) => {

        // NOTE(danielhollas): Currently, we will not offer smart translations
        // if the user did not translate math according to our locale rules,
        // normalizeTranslatedMath only handles some special cases.
        if (findRegex === MATH_REGEX) {
            output = normalizeTranslatedMath(output, lang);
        }

        const inputIndex = inputs.indexOf(output);
        if (inputIndex === -1) {
            if (findRegex === MATH_REGEX) {
                throw new Error('math doesn\'t match');
            } else if (findRegex === GRAPHIE_REGEX) {
                throw new Error('graphies don\'t match');
            } else if (findRegex === IMAGE_REGEX) {
                throw new Error('image links don\'t match');
            } else if (findRegex === WIDGET_REGEX) {
                throw new Error('widgets don\'t match');
            } else {
                throw new Error('the only acceptable values for getFunc are ' +
                    'getMaths, getGraphies, getImages, and getWdigets');
            }
        }
        mapping[outputIndex] = inputIndex;
    });

    return mapping;
}

/**
 * Helper for getting all subgroup matches from a string.  The callback is
 * passed the matches array for each match in `text`.
 *
 * @param {String} text The string to find matches in.
 * @param {RegExp} regex A regular expression to match subgroups in text.
 * @param {Function} callback A callback function to pass found matches in text.
 * @returns {void}
 */
function allMatches(text, regex, callback) {
    let matches = regex.exec(text);
    while (matches != null) {
        callback(matches);
        matches = regex.exec(text);
    }
}

/**
 * Returns a dictionary with English strings within \text{} and \textbf{} blocks
 * map to translated strings within \text{} and \textbf{} blocks.
 *
 * This becomes part of the template and is used by populateTemplate to
 * automatically translate any natural language text contained with \text{} and
 * \textbf{} blocks.
 *
 * The following call:
 * getMathDictionary(
 *     "$\\text{red}$, $\\textbf{blue} + \\text{yellow}$",
 *     "$\\text{roja}$, $\\textbf{azul} + \\text{amarillo}$"
 * );
 *
 * will return the following output:
 * {
 *     "red": "roja",
 *     "blue": "azul",
 *     "yellow": "amarillo"
 * }
 *
 * @param {String} englishStr The English source string.
 * @param {String} translatedStr The translation of the englishStr.
 * @param {String} lang Locale, needed for Math translation.
 * @returns {Object} The English to translated string mapping for strings inside
 *          \text{} and \textbf{} blocks.
 *
 * TODO(kevinb): automatically handle \text{} blocks containing numbers only.
 */
function getMathDictionary(englishStr, translatedStr, lang) {
    let inputs = englishStr.match(MATH_REGEX) || [];
    const outputs = translatedStr.match(MATH_REGEX) || [];

    const inputMap = {};
    const outputMap = {};

    const replaceRegexes = [
        [TEXT_REGEX, '__TEXT__'],
        [TEXTBF_REGEX, '__TEXTBF__'],
    ];

    inputs = inputs.map(
        (input) => translateMath(input, lang));

    inputs.forEach((input) => {
        let normalized = input;

        replaceRegexes.forEach(([regex, str]) => {
            normalized = normalized.replace(regex, str);
        });

        if (!inputMap[normalized]) {
            inputMap[normalized] = [];
        }
        inputMap[normalized].push(input);
    });

    outputs.forEach((output) => {
        output = normalizeTranslatedMath(output, lang);
        let normalized = output;

        replaceRegexes.forEach(([regex, str]) => {
            normalized = normalized.replace(regex, str);
        });

        if (!outputMap[normalized]) {
            outputMap[normalized] = [];
        }
        outputMap[normalized].push(output);
    });

    const dict = {};

    const matchRegexes = [
        [/__TEXT__/, TEXT_REGEX],
        [/__TEXTBF__/, TEXTBF_REGEX],
    ];

    Object.keys(inputMap).forEach((key) => {
        matchRegexes.forEach(([match, regex]) => {
            if (match.test(key)) {
                const input = inputMap[key];

                if (!outputMap.hasOwnProperty(key)) {
                    // If outputMap is missing a key that exists in inputMap it
                    // means that the math differs between the input and output
                    // and getMapping will throw and error in that case.
                    return;
                }
                const output = outputMap[key];

                // Compute the set of all natural language text within \text{}
                // and \textbf{} blocks from the current English formula.
                const inputTexts = {};
                allMatches(input, regex,
                    (matches) => inputTexts[matches[1]] = true);

                // Compute the set of all natural language text within \text{}
                // and \textbf{} blocks from the current translated formula.
                const outputTexts = {};
                allMatches(output, regex,
                    (matches) => outputTexts[matches[1]] = true);

                const inputKeys = Object.keys(inputTexts);
                const outputKeys = Object.keys(outputTexts);

                // We assume that the order of \text{} and \textbf{} blocks will
                // not change within a math formula being translated.
                for (let i = 0; i < inputKeys.length; i++) {
                    dict[inputKeys[i]] = outputKeys[i];
                }
            }
        });
    });

    // contains the math dictionary
    return dict;
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
    englishStr = rtrim(englishStr);
    translatedStr = rtrim(translatedStr);
    const translatedLines = translatedStr.split(LINE_BREAK);
    const englishDictionary = getMathDictionary(englishStr, englishStr, lang);
    const translatedDictionary = getMathDictionary(
        englishStr, translatedStr, lang);

    try {
        return {
            lines: translatedLines.map(
                (line) => line.replace(MATH_REGEX, '__MATH__')
                    .replace(GRAPHIE_REGEX, '__GRAPHIE__')
                    .replace(IMAGE_REGEX, '__IMAGE__')
                    .replace(WIDGET_REGEX, '__WIDGET__')),
            mathMapping: {
                englishToTranslated:
                    getMapping(englishStr, translatedStr, lang, MATH_REGEX,
                        translatedDictionary),
                // This will be used by populateTemplate to validate that the
                // translation mapping in this template can be used to suggest
                // a translation for another English string.
                englishToEnglish:
                    getMapping(englishStr, englishStr, 'en', MATH_REGEX,
                        englishDictionary),
            },
            graphieMapping:
                getMapping(englishStr, translatedStr, lang, GRAPHIE_REGEX),
            imageMapping:
                getMapping(englishStr, translatedStr, lang, IMAGE_REGEX),
            widgetMapping:
                getMapping(englishStr, translatedStr, lang, WIDGET_REGEX),
            mathDictionary: translatedDictionary,
        };
    } catch(e) {
        return e;
    }
}

/**
 * Trim trailing whitespace at the end of string.
 *
 * @param {String} str A string to trim trailing whitespace in.
 * @returns {String} The string with no trailing whitespace.
 */
function rtrim(str) {
    return str.replace(/\s+$/g, '');
}

/**
 * Escape any string to create regular expression
 *
 * See: https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/
 *
 * @param {String} str A string to be matched in regular expr
 * @returns {String} The string with escaped characters
 */
function escapeForRegex(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Translate the text inside \\text{} and \\textbf blocks.
 *
 * @param {string} englishMath The math string to translate.  If a English
 *      string from CrowdIn is "Solve $3\\text{nickles} = x\\textbf{pennies}$"
 *      then englishMath would be "3\\text{nickles} = x\\textbf{pennies}"
 * @param {Object} dict A mapping from english words to translated words that
 *      appear inside \\text{} and \\textbf{} blocks.
 * @returns {string} translated math.
 */
function replaceTextInMath(englishMath, dict) {
    let translatedMath = englishMath;

    const textCommands = [
        'text',
        'textbf',
    ];

    for (const [englishText, translatedText] of Object.entries(dict)) {
        textCommands.forEach((cmd) => {
            const escapedEnglishText = escapeForRegex(englishText);
            const regex = new RegExp(`\\\\${cmd}(\\s*){${escapedEnglishText}}`,
                  'g');
            // make sure the spacing matches in the replacement
            const replacement = `\\${cmd}$1{${translatedText}}`;
            translatedMath = translatedMath.replace(regex, replacement);
        });
    }
    return translatedMath;
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
    englishStr = rtrim(englishStr);
    const englishLines = englishStr.split(LINE_BREAK);

    if (template.lines.length !== englishLines.length) {
        // The English string has a different number of lines than the
        // suggestion template, let's just throw this out as we won't be able
        // to give a good suggestion.
        return undefined;
    }

    // We wish to validate that the math mapping in the template is appropriate
    // to use for suggesting a translation for this English string.
    if (template.mathMapping.englishToTranslated.length) {
        // To that end we create an English to English math mapping for this
        // string.
        const englishDictionary = getMathDictionary(
            englishStr, englishStr, lang);
        const englishMapping = getMapping(
            englishStr, englishStr, 'en', MATH_REGEX, englishDictionary);
        // And verify that the math mapping is identical to the one in the
        // template.
        if (JSON.stringify(englishMapping) !== JSON.stringify(
                template.mathMapping.englishToEnglish)) {
            // Inappropriate mapping can result in math being altered between
            // the English string and the suggested translation string.
            // For example a template created from string '$4$ x $4$ y $5$'
            // would have math mapping of [0, 0, 2], while the English string
            // '$3$ x $8$ y $3$' would have [0, 1, 0], resulting in the invalid
            // translation suggestion of '$3$ x $3$ y $3$'. To prevent this from
            // happening we simply reject providing a translation suggestion.
            return undefined;
        }
    }

    let maths = englishStr.match(MATH_REGEX) || [];
    const graphies = englishStr.match(GRAPHIE_REGEX) || [];
    const images = englishStr.match(IMAGE_REGEX) || [];
    const widgets = englishStr.match(WIDGET_REGEX) || [];

    let mathIndex = 0;
    let graphieIndex = 0;
    let imageIndex = 0;
    let widgetIndex = 0;

    maths = maths.map((math) => {
        const result = translateMath(math, lang);
        return replaceTextInMath(result, template.mathDictionary);
    });

    return englishLines.map((englishLine, index) => {
        const templateLine = template.lines[index];

        return templateLine.replace(/__MATH__/g, () =>
            maths[template.mathMapping.englishToTranslated[mathIndex++]]
        ).replace(/__GRAPHIE__/g, () =>
            graphies[template.graphieMapping[graphieIndex++]]
        ).replace(/__IMAGE__/g, () =>
            images[template.imageMapping[imageIndex++]]
        ).replace(/__WIDGET__/g, () =>
            widgets[template.widgetMapping[widgetIndex++]]
        );
    }).join(LINE_BREAK);
}

/**
 * Provides suggestions for one or more strings from one or more groups of
 * similar strings.
 */
class TranslationAssistant {
    /**
     * Create a new TranslationAssistant instance.
     *
     * @param {Array<Object>} allItems - The items to be grouped and used to
     *        for generating suggestions, see getSuggestionGroups.
     * @param {Function} getEnglishStr - Function to extract English strings
     *        from items.
     * @param {Function} getTranslation - Function to get a translated string
     *        for an item.
     * @param {String} lang - ka_locale, used for language specific
     *        translations, e.g. in Portuguese, `\sin` should be
     *        `\operatorname\{sen\}`.
     * @returns {void}
     */
    constructor(allItems, getEnglishStr, getTranslation, lang) {
        this.lang = lang;
        this.getEnglishStr = getEnglishStr;
        this.getTranslation = getTranslation;
        this.suggestionGroups = this.getSuggestionGroups(allItems);
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
     * @param {Array<Object>} itemsToTranslate – same type of objects as the
     *        `allItems` argument that was passed to the constructor.
     * @returns {Array<[Object, String]>} An array of items and their translated
     *          suggestions.
     *
     * Note: the items given in the example have `englishStr` and `jiptStr`
     * properties, but they could have any shape as long as the `getEnglishStr`
     * function that was passed to the constructor returns an English string
     * when passed one of the items.
     */
    suggest(itemsToTranslate) {
        const {suggestionGroups, lang} = this;

        return itemsToTranslate.map((item) => {
            const englishStr = rtrim(this.getEnglishStr(item));
            const normalStr = stringToGroupKey(englishStr);
            const normalObj = JSON.parse(normalStr);

            // Translate items that are only math, a graphie, an image, or a
            // widget.
            // TODO(kevinb) handle multiple non-nl_text items
            if (/^(__MATH__|__GRAPHIE__|__IMAGE__|__WIDGET__)$/
                    .test(normalObj.str)) {
                if (normalObj.str === '__MATH__') {
                    // Only translate the math if it doesn't include any
                    // natural language text in \text and \textbf commands.
                    if (englishStr.indexOf('\\text') === -1) {
                        return [item, translateMath(englishStr, lang)];
                    }
                } else {
                    return [item, englishStr];
                }
            }

            if (suggestionGroups.hasOwnProperty(normalStr)) {
                const {template} = suggestionGroups[normalStr];

                // This error is probably due to math being different between
                // the English string and the translated string.
                if (template instanceof Error) {
                    return [item, null];
                }

                if (template) {
                    const translatedStr = populateTemplate(
                        template, englishStr, lang);
                    return [item, translatedStr];
                }
            }

            // The item doesn't belong in any of the suggestion groups.
            return [item, null];
        });
    }

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
     *        englishStr: "simplify $2/4$",
     *        id: 1001,
     *    }, {
     *        englishStr: "simplify $3/12$",
     *        id: 1002,
     *    }
     * ];
     *
     * Output:
     * {
     *    '{str:"simplify __MATH__",text:[[]]}': {
     *        items: [{
     *            englishStr: "simplify $2/4$",
     *            id: 1001,
     *        }, {
     *            englishStr: "simplify $3/12$",
     *            id: 1002,
     *        }],
     *        template: { ... }
     *    },
     *    ...
     * }
     *
     * @param {Array<Object>} items The items with English strings to group.
     * @returns {Object} A mapping of groups to items and translation template.
     */
    getSuggestionGroups(items) {
        const suggestionGroups = {};

        items.forEach((obj) => {
            const key = stringToGroupKey(rtrim(this.getEnglishStr(obj)));

            if (suggestionGroups[key]) {
                suggestionGroups[key].push(obj);
            } else {
                suggestionGroups[key] = [obj];
            }
        });

        Object.keys(suggestionGroups).forEach((key) => {
            const items = suggestionGroups[key];

            for (const item of items) {
                const englishStr = this.getEnglishStr(item);
                const translatedStr = this.getTranslation(item);

                if (translatedStr) {
                    const template =
                        createTemplate(englishStr, translatedStr, this.lang);
                    suggestionGroups[key] = {items, template};
                    return;
                }
            }
            suggestionGroups[key] = {items, template: null};
        });

        return suggestionGroups;
    }
}

TranslationAssistant.stringToGroupKey = stringToGroupKey;
TranslationAssistant.createTemplate = createTemplate;
TranslationAssistant.populateTemplate = populateTemplate;

module.exports = TranslationAssistant;
