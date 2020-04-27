/**
 * This file contains functions for translating math notation
 * as well as a list of locales that these functions should be applied to
 */

/**
 * Locale lists for different math notations, taken from this table:
 * https://docs.google.com/spreadsheets/d/1qgi-KjumcZ6yru19U5weqZK9TosRlTdLZqbXbABBJoQ/edit#gid=0
 * TODO(danielhollas): Need to update this when new langs join translations
 */
'use strict';

var MATH_RULES_LOCALES = {
    THOUSAND_SEP_AS_THIN_SPACE: ['cs', 'fr', 'de', 'lol', 'pt-pt', 'nb', 'bg', 'pl', 'ro', 'nl', 'az', 'sv', 'it', 'hu', 'uk'],
    THOUSAND_SEP_AS_DOT: ['pt', 'tr', 'da', 'sr', 'el', 'id'],
    NO_THOUSAND_SEP: ['ko', 'ps', 'ka'],
    DECIMAL_COMMA: ['cs', 'fr', 'de', 'pl', 'bg', 'nb', 'tr', 'da', 'sr', 'lol', 'ro', 'nl', 'hu', 'az', 'it', 'pt', 'pt-pt', 'sv', 'el', 'id', 'ka', 'ru'],
    // TODO(danielhollas):remove 'bg' from TIMES_AS_CDOT
    // when \mathbin{.} becomes available for them
    TIMES_AS_CDOT: ['cs', 'pl', 'de', 'nb', 'sr', 'ro', 'hu', 'sv', 'da', 'bg', 'lol'],
    DIV_AS_COLON: ['cs', 'de', 'bg', 'hu', 'uk', 'da', 'hy', 'pl', 'lol', 'id', 'pt-pt', 'ru', 'nb'],
    SIN_AS_SEN: ['it', 'pt', 'pt-pt'],
    ARABIC_COMMA: ['ps'],
    PERSO_ARABIC_NUMERALS: ['ps']
};

/**
 * Translates western-arabic numerals to others, see:
 * https://en.wikipedia.org/wiki/Eastern_Arabic_numerals
 *
 * @param {string} math A math expression to translate
 * @param {string} lang The KA locale of the translation language.
 * @returns {string} The math expression with translated numerals.
 */
function translateNumerals(math, lang) {
    // Perso-Arabic numerals (Used by Pashto)
    if (MATH_RULES_LOCALES.PERSO_ARABIC_NUMERALS.includes(lang)) {
        math = math.replace(/1/g, '۱').replace(/2/g, '۲').replace(/3/g, '۳').replace(/4/g, '۴').replace(/5/g, '۵').replace(/6/g, '۶').replace(/7/g, '۷').replace(/8/g, '۸').replace(/9/g, '۹').replace(/0/g, '۰');
    }
    // TODO(danielhollas): Implement Eastern-Arabic numerals
    // (currently not in use by any team)
    // Unicode code-points for these are different from the Perso-Arabic,
    // even though some of the numbers look the same!

    return math;
}

/**
 * Translates notation for numbers, such as decimal dots or thousand separators.
 * Essentially implements `number.toLocaleString`,
 * but uses KA locale and LaTeX notation.
 * Translation of numerals is handled separately in translateNumerals.
 *
 * @param {string} math A math expression to translate
 * @param {string} lang The KA locale of the translation language.
 * @returns {string} The math expression with translated numbers.
 */
function translateNumbers(math, lang) {

    // These consts are used only here for manipulating thousand separator
    var placeholder = 'THSEP';
    var USThousandSeparatorRegex = new RegExp('([0-9])' + placeholder + '([0-9])(?=[0-9]{2})', 'g');
    var thousandSeparatorLocales = MATH_RULES_LOCALES.THOUSAND_SEP_AS_THIN_SPACE.concat(MATH_RULES_LOCALES.THOUSAND_SEP_AS_DOT, MATH_RULES_LOCALES.NO_THOUSAND_SEP);

    // Definition of regex for decimal numbers
    // We need to allow for strings like '\\greenD{3}.\\blue{1}' or
    // repeating decimals like '1/3 = 0.\\overline{3}'
    //
    // Colors currently used in KA strings taken from KaTeX definitions, see:
    // https://github.com/KaTeX/KaTeX/blob/master/src/macros.js
    //
    // \\overline is handled elsewhere since it appears only
    // on the right side of the decimal point
    //
    // These colors are appended by optional [A-Z]? to match all definitions
    // from KaTeX. This will form a superset of actually defined colors,
    // but that hardly matters here and is more future-proof if new colors
    // were defined at some point
    var katexColorMacros = ['blue', 'gold', 'gray', 'mint', 'green', 'red', 'maroon', 'orange', 'pink', 'purple', 'teal', 'kaBlue', 'kaGreen'].join('|');

    var integerPart = '[0-9]+|\\\\(?:' + katexColorMacros + ')[A-Z]?\\{[0-9]+\\}';
    var decPart = '[0-9]+|\\\\(?:overline|' + katexColorMacros + ')[A-Z]?\\{[0-9]+\\}';
    var decimalNumberRegex = new RegExp('(' + integerPart + ')\\.(' + decPart + ')', 'g');

    var mathTranslations = [
    // IMPORTANT NOTE: This MUST be the first regex
    // Convert thousand separators to a placeholder
    // to prevent interactions with decimal commas
    { langs: thousandSeparatorLocales,
        regex: /([0-9])\{,\}([0-9])(?=[0-9]{2})/g,
        replace: '$1' + placeholder + '$2' },

    // Decimal comma
    { langs: MATH_RULES_LOCALES.DECIMAL_COMMA,
        regex: decimalNumberRegex, replace: '$1{,}$2' },

    // Arabic decimal comma, see https://en.wikipedia.org/wiki/Comma
    // NOTE: At least in MathJax, this comma does not need braces,
    // but it feels safer to have them here.
    { langs: MATH_RULES_LOCALES.ARABIC_COMMA,
        regex: decimalNumberRegex, replace: '$1{،}$2' },

    // Thousand separator notations

    // No thousand separator
    { langs: MATH_RULES_LOCALES.NO_THOUSAND_SEP,
        regex: USThousandSeparatorRegex, replace: '$1$2' },

    // Thousand separator as a dot
    { langs: MATH_RULES_LOCALES.THOUSAND_SEP_AS_DOT,
        regex: USThousandSeparatorRegex, replace: '$1.$2' },

    // Thousand separator as a thin space (\, in Tex)
    { langs: MATH_RULES_LOCALES.THOUSAND_SEP_AS_THIN_SPACE,
        regex: USThousandSeparatorRegex, replace: '$1\\,$2' }];

    mathTranslations.forEach(function (element) {
        if (element.langs.includes(lang)) {
            math = math.replace(element.regex, element.replace);
        }
    });

    return math;
}

/**
 * Handles translations of LaTeX commands (\func{}) and other math notation
 * e.g. binary operators, trig functions etc
 *
 * @param {string} math A math expression to translate
 * @param {string} lang The KA locale of the translation language.
 * @returns {string} The translated math expression.
 */
function translateMathOperators(math, lang) {

    var mathTranslations = [
    // division sign as a colon
    { langs: MATH_RULES_LOCALES.DIV_AS_COLON,
        regex: /\\div/g, replace: '\\mathbin{:}' },

    // TODO(danielhollas): Add all trig functions
    // latin trig functions
    { langs: MATH_RULES_LOCALES.SIN_AS_SEN,
        regex: /\\sin/g, replace: '\\operatorname{sen}' },

    // multiplication sign as a centered dot
    { langs: MATH_RULES_LOCALES.TIMES_AS_CDOT,
        regex: /\\times/g, replace: '\\cdot' }];

    // multiplication sign as a simple dot, a Bulgarian specialty
    // TODO(danielhollas): not yet allowed by the linter
    // TODO(danielhollas): add a test for this case
    //{langs: ['bg'],
    //   regex: /\\times/g, replace: '\\mathbin{.}'},
    mathTranslations.forEach(function (element) {
        if (element.langs.includes(lang)) {
            math = math.replace(element.regex, element.replace);
        }
    });

    return math;
}

/**
 * Handles any per language special case translations
 * e.g. thousand separators, decimal commas, math operators etc.
 *
 * @param {string} math A math expression to translate
 * @param {string} lang The KA locale of the translation language.
 * @returns {string} The translated math expression.
 */
function translateMath(math, lang) {
    // The order here should not matter
    math = translateMathOperators(math, lang);
    math = translateNumbers(math, lang);
    math = translateNumerals(math, lang);
    return math;
}

/**
 * Perform regex substitutions on translated math strings
 * so that it matches math translations that we do in translateMath()
 *
 * @param {string} math A user-translated math expression.
 * @param {string} lang The locale of the translation language.
 * @returns {string} The translated math expression.
 */
function normalizeTranslatedMath(math, lang) {

    var mathNormalizations = [
    // Strip superfluous curly braces around \\,
    // which is used as thousand separator in some locales
    // i.e. 10{,}200 can be translated as 10{\\,}200, but the curly
    // braces are not really needed.
    // To understand why braces are needed around comma, see:
    // https://tex.stackexchange.com/questions/303110/avoid-space-after-thousands-separator-in-math-mode#303127
    { langs: MATH_RULES_LOCALES.THOUSAND_SEP_AS_THIN_SPACE,
        regex: /([0-9])\{\\,\}([0-9])(?=[0-9]{2})/g, replace: '$1\\,$2' },

    // Strip extra braces around a dot as a thousand separator
    { langs: MATH_RULES_LOCALES.THOUSAND_SEP_AS_DOT,
        regex: /([0-9])\{\.\}([0-9])(?=[0-9]{2})/g, replace: '$1.$2' },

    // Allow translators to use a full space (~ in LaTeX)
    // (but TA will always suggest thin space \,)
    // We cannot allow a literal space here, cause Tex would ignore it
    { langs: MATH_RULES_LOCALES.THOUSAND_SEP_AS_THIN_SPACE,
        regex: /([0-9])\{?~\}?([0-9])(?=[0-9]{2})/g, replace: '$1\\,$2' }];

    mathNormalizations.forEach(function (element) {
        if (element.langs.includes(lang)) {
            math = math.replace(element.regex, element.replace);
        }
    });

    return math;
}

var MathTranslator = {};

MathTranslator.translateMath = translateMath;
MathTranslator.normalizeTranslatedMath = normalizeTranslatedMath;
MathTranslator.MATH_RULES_LOCALES = MATH_RULES_LOCALES;

module.exports = {
    translateMath: translateMath,
    normalizeTranslatedMath: normalizeTranslatedMath,
    MATH_RULES_LOCALES: MATH_RULES_LOCALES
};