/**
 * This file contains functions for translating math notation
 * as well as a list of locales that these functions should be applied to.
 */

/**
 * Locale lists for different math notations, taken from this table:
 * https://docs.google.com/spreadsheets/d/1qgi-KjumcZ6yru19U5weqZK9TosRlTdLZqbXbABBJoQ/edit#gid=0
 * TODO(danielhollas): Need to update this when new langs join translations.
 */
const MATH_RULES_LOCALES = {
    // Number formats
    THOUSAND_SEP_AS_THIN_SPACE: ['az', 'bg', 'cs', 'de', 'fr', 'hu', 'it', 'ka',
        'km', 'ky', 'lt', 'lv', 'nb', 'nl', 'pl', 'pt-pt', 'ro', 'sq', 'sv',
        'uk', 'uz'],
    THOUSAND_SEP_AS_DOT: ['da', 'el', 'id', 'is', 'mk', 'pt', 'rw', 'sl', 'sr',
        'tr', 'vi'],
    NO_THOUSAND_SEP: ['hy', 'kk', 'ko', 'ru', 'zh-hans'],
    DECIMAL_COMMA: ['az', 'bg', 'cs', 'da', 'de', 'el', 'fr', 'hu', 'hy', 'id',
        'is', 'it', 'ka', 'kk', 'ky', 'lt', 'lv', 'mk', 'nb', 'nl', 'pl', 'pt',
        'pt-pt', 'ro', 'ru', 'rw', 'sl', 'sq', 'sr', 'sv', 'tr', 'uz', 'vi'],
    // Pashto team would like to use both perso-arabic numerals for Early Math
    // and western digits for more advanced math courses.
    // Unfortunately, we don't support this at the moment,
    // since strings are often shared between different exercises.
    // For the time being, Pashto will use the western digits
    // NOTE(danielhollas): I did not want to delete the whole code
    // in case it's usefuly in the future so I simply removed 'ps'
    // from the locale lists.
    //PERSO_ARABIC_NUMERALS: ['ps'],
    //ARABIC_COMMA: ['ps'],
    ARABIC_COMMA: ['fake-lang'],
    PERSO_ARABIC_NUMERALS: ['fake-lang'],
    // Notations for repeating decimals
    // 1 / 3 = 0.\overline{3} -> 0.\dot{3}
    // 1 / 7 = 0.\overline{142857} -> 0.\dot{1}4285\dot{7}
    OVERLINE_AS_DOT: ['bn', 'hu', 'ja', 'ko', 'my'],
    // 1 / 3 = 0.\overline{3} -> 0.(3)
    // 1 / 7 = 0.\overline{142857} -> 0.(142857)
    OVERLINE_AS_PARENS: ['az', 'bg', 'hy', 'ka', 'kk', 'ky', 'lt', 'lv', 'pl',
        'pt-pt', 'ro', 'ru', 'uz', 'vi'],

    // Intervals and cartesian coordinates
    // (a,b) - US open interval or coordinates
    // [a,b] - US closed interval
    // [a,b), (a, b] - US half open interval
    //
    // Inverted brackets notation for open intervals
    // (a,b) -> ]a,b[
    OPEN_INT_AS_BRACKETS: ['da', 'fr', 'hu', 'pt-pt'],
    CLOSED_INT_AS_ANGLE_BRACKETS: ['cs'],
    COORDS_AS_BRACKETS: ['cs'],
    // Binary operators
    // TODO(danielhollas):remove 'bg' from TIMES_AS_CDOT
    // when \mathbin{.} becomes available for them (currently blocked by linter)
    TIMES_AS_CDOT: ['az', 'bg', 'cs', 'da', 'de', 'hu', 'hy', 'lt', 'lv', 'nb',
        'pl', 'ro', 'sr', 'sv', 'uz'],
    CDOT_AS_TIMES: [ 'fr', 'ps', 'pt-pt'],
    DIV_AS_COLON: ['az', 'bg', 'cs', 'da', 'de', 'hu', 'hy', 'it', 'ky', 'lt',
        'lv', 'nb', 'nl', 'pl', 'pt-pt', 'ro', 'ru', 'sv', 'uk'],
    // Trig functions
    SIN_AS_SEN: ['it', 'pt', 'pt-pt'],
    TAN_AS_TG: ['az', 'bg', 'cs', 'hu', 'hy', 'kk', 'km', 'ky', 'lt', 'lv',
        'pl', 'pt', 'pt-pt', 'ro', 'ru', 'uz'],
    COT_AS_COTG: ['cs', 'pt', 'pt-pt'],
    COT_AS_CTG: ['az', 'bg', 'hu', 'hy', 'kk', 'km', 'ky', 'lt', 'lv', 'pl',
        'ro', 'ru', 'uz'],
    CSC_AS_COSEC: ['as', 'az', 'bg', 'bn', 'cs', 'gu', 'hi', 'id', 'ja', 'kn',
        'ky', 'lt', 'lv', 'mr', 'my', 'nl', 'pa', 'pl', 'ro', 'ru', 'sv', 'ta',
        'te', 'tr', 'uk'],
    CSC_AS_COSSEC: ['pt', 'pt-pt'],
    // Rules conditional on the translated template
    MAYBE_DIV_AS_COLON: ['id', 'lol'],
    MAYBE_TIMES_AS_CDOT: ['bn', 'el', 'gu', 'hi', 'id', 'it', 'ja', 'ka', 'kk',
        'km', 'kn', 'ko', 'mr', 'my', 'nl', 'pa', 'pt', 'ru', 'ta', 'te', 'th',
        'uk', 'vi', 'zh-hans'],
    MAYBE_CDOT_AS_TIMES: ['bn', 'el', 'gu', 'hi', 'id', 'it', 'ja', 'ka', 'kk',
        'km', 'kn', 'ko', 'mr', 'my', 'nl', 'pa', 'pt', 'ru', 'ta', 'te', 'th',
        'uk', 'vi', 'zh-hans'],
};


/**
 * Translates math notation in English strings to match
 * notation for a given language, such as thousand separators,
 * decimal commas, math operators etc.
 *
 * This function serves as an interface to all the other functions
 * in this file.
 *
 * @param {string} math math expression to translate
 * @param {string} template User-translated template
 * @param {string} lang KA locale of the translation language.
 * @returns {string} translated math expression.
 */
function translateMath(math, template, lang) {

    if (lang === 'en') {
        return math;
    }

    // Need to call this one first, because the regexes
    // rely on US number formats
    math = maybeTranslateMath(math, template, lang);

    math = translateMathOperators(math, lang);

    math = translateNumbers(math, lang);
    // This one needs to be last
    math = translateNumerals(math, lang);

    // Special notation for numbers not handled above
    if (lang === 'hi') {
        math = translateHindiNumbers(math);
    }

    return math;
}

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
        math = math.replace(/1/g, '۱')
            .replace(/2/g, '۲')
            .replace(/3/g, '۳')
            .replace(/4/g, '۴')
            .replace(/5/g, '۵')
            .replace(/6/g, '۶')
            .replace(/7/g, '۷')
            .replace(/8/g, '۸')
            .replace(/9/g, '۹')
            .replace(/0/g, '۰');
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
    const placeholder = 'THSEP';
    const thousandSeparatorRegex =
        new RegExp(`([0-9])${placeholder}([0-9])(?=[0-9]{2})`, 'g');
    const thousandSeparatorLocales = [].concat(
        MATH_RULES_LOCALES.THOUSAND_SEP_AS_THIN_SPACE,
        MATH_RULES_LOCALES.THOUSAND_SEP_AS_DOT,
        MATH_RULES_LOCALES.NO_THOUSAND_SEP);

    const decimalNumberRegex = new RegExp(getDecNumberRegexString('en'), 'g');

    const mathTranslations = [
        // IMPORTANT NOTE: This MUST be the first regex
        // Convert thousand separators to a placeholder
        // to prevent interactions with decimal commas
        {langs: thousandSeparatorLocales,
            regex: /([0-9])\{,\}([0-9])(?=[0-9]{2})/g,
            replace: `$1${placeholder}$2`},

        // Decimal comma
        {langs: MATH_RULES_LOCALES.DECIMAL_COMMA,
            regex: decimalNumberRegex, replace: '$1{,}$2'},

        // Arabic decimal comma, see https://en.wikipedia.org/wiki/Comma
        // NOTE: At least in MathJax, this comma does not need braces,
        // but it feels safer to have them here.
        {langs: MATH_RULES_LOCALES.ARABIC_COMMA,
            regex: decimalNumberRegex, replace: '$1{،}$2'},

        // Notations for repeating decimals
        {langs: MATH_RULES_LOCALES.OVERLINE_AS_PARENS,
            regex: /\\overline\{(\d+)\}/g, replace: '($1)'},

        {langs: MATH_RULES_LOCALES.OVERLINE_AS_DOT,
            regex: /\\overline\{(\d)\}/g, replace: '\\dot{$1}'},

        {langs: MATH_RULES_LOCALES.OVERLINE_AS_DOT,
            regex: /\\overline\{(\d)(\d*)(\d)\}/g,
            replace: '\\dot{$1}$2\\dot{$3}'},

        // Thousand separator notations

        // No thousand separator
        {langs: MATH_RULES_LOCALES.NO_THOUSAND_SEP,
            regex: thousandSeparatorRegex, replace: '$1$2'},

        // Thousand separator as a dot
        {langs: MATH_RULES_LOCALES.THOUSAND_SEP_AS_DOT,
            regex: thousandSeparatorRegex, replace: '$1.$2'},

        // Thousand separator as a thin space (\, in Tex)
        {langs: MATH_RULES_LOCALES.THOUSAND_SEP_AS_THIN_SPACE,
            regex: thousandSeparatorRegex, replace: '$1\\,$2'},
    ];

    mathTranslations.forEach(function(element) {
        if (element.langs.includes(lang)) {
            math = math.replace(element.regex, element.replace);
        }
    });

    return math;
}

/**
 * Translate US numbers to Hindi.
 *
 * Hindi uses decimal point, so here we only translate
 * thousand separators, which are a bit peculiar in Hindi.
 *
 * 100{,}000{,}000 -> 10{,}00{,}00{,}000
 *
 * @param {string} math A math expression to translate
 * @param {string} lang The KA locale of the translation language.
 * @returns {string} The translated math expression.
 */
function translateHindiNumbers(math) {
    const USNumber = /([0-9]+(?:\{,\}[0-9]{3})+)/g;
    return math.replace(USNumber, function(number) {
        // Remove US thousand separators
        number = number.replace(/\{,\}/g, '');

        // Start with last three digits.
        // We're guaranteed they exist by the USNumber regex above
        let translatedNumber = number.slice(-3);
        let i = 4;
        while (i <= number.length) {
            if (i % 2 === 0) {
                translatedNumber = `{,}${translatedNumber}`;
            }
            translatedNumber = number.slice(-i, -i + 1) + translatedNumber;
            i++;
        }
        return translatedNumber;
    });
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

    const mathTranslations = [
        // BINARY OPERATORS
        // division sign as a colon
        {langs: MATH_RULES_LOCALES.DIV_AS_COLON,
            regex: /\\div/g, replace: '\\mathbin{:}'},

        // multiplication sign as a centered dot
        {langs: MATH_RULES_LOCALES.TIMES_AS_CDOT,
            regex: /\\times/g, replace: '\\cdot'},

        // multiplication sign as x
        {langs: MATH_RULES_LOCALES.CDOT_AS_TIMES,
            regex: /\\cdot/g, replace: '\\times'},

        // multiplication sign as a simple dot, a Bulgarian specialty
        // TODO(danielhollas): not yet allowed by the linter
        // TODO(danielhollas): add a test for this case
        //{langs: ['bg'],
        //   regex: /\\times/g, replace: '\\mathbin{.}'},

        // TRIG FUNCTIONS
        // NOTE(danielhollas): In principle, some might want to use
        // e.g. sin^{-1} instead of arcsin, but we'll keep it simple
        // and that notation is confusing anyway (1/sin or arcsin?)
        {langs: MATH_RULES_LOCALES.SIN_AS_SEN,
            regex: /\\(arc)?sin/g, replace: '\\operatorname{$1sen}'},

        {langs: MATH_RULES_LOCALES.TAN_AS_TG,
            regex: /\\(arc)?tan/g, replace: '\\operatorname{$1tg}'},

        {langs: MATH_RULES_LOCALES.COT_AS_COTG,
            regex: /\\(arc)?cot/g, replace: '\\operatorname{$1cotg}'},

        {langs: MATH_RULES_LOCALES.COT_AS_CTG,
            regex: /\\(arc)?cot/g, replace: '\\operatorname{$1ctg}'},

        {langs: MATH_RULES_LOCALES.CSC_AS_COSEC,
            regex: /\\(arc)?csc/g, replace: '\\operatorname{$1cosec}'},

        {langs: MATH_RULES_LOCALES.CSC_AS_COSSEC,
            regex: /\\(arc)?csc/g, replace: '\\operatorname{$1cossec}'},
    ];

    mathTranslations.forEach(function(element) {
        if (element.langs.includes(lang)) {
            math = math.replace(element.regex, element.replace);
        }
    });

    return math;
}

/**
 * Perform regex substitutions on user-translated math strings
 * for math notations where we permit variations
 * so that it matches math translations done in translateMath().
 * Needed only for comparing translated and original strings in getMapping(),
 * it does not change the emitted ST suggestions.
 *
 * @param {string} math A user-translated math expression.
 * @param {string} lang The locale of the translation language.
 * @returns {string} The translated math expression.
 */
function normalizeTranslatedMath(math, lang) {

    if (lang === 'en') return math;

    const mathNormalizations = [
        // Strip superfluous curly braces around \\,
        // which is used as thousand separator in some locales
        // i.e. 10{,}200 can be translated as 10{\\,}200, but the curly
        // braces are not really needed.
        // To understand why braces are needed around comma, see:
        // https://tex.stackexchange.com/questions/303110/avoid-space-after-thousands-separator-in-math-mode#303127
        {langs: MATH_RULES_LOCALES.THOUSAND_SEP_AS_THIN_SPACE,
            regex: /([0-9])\{\\,\}([0-9])(?=[0-9]{2})/g, replace: '$1\\,$2'},

        // Strip extra braces around a dot as a thousand separator
        {langs: MATH_RULES_LOCALES.THOUSAND_SEP_AS_DOT,
            regex: /([0-9])\{\.\}([0-9])(?=[0-9]{2})/g, replace: '$1.$2'},

        // Allow translators to use a full space (~ in LaTeX)
        // (but TA will always suggest thin space \,)
        // We cannot allow a literal space here, cause Tex would ignore it
        {langs: MATH_RULES_LOCALES.THOUSAND_SEP_AS_THIN_SPACE,
            regex: /([0-9])\{?~\}?([0-9])(?=[0-9]{2})/g, replace: '$1\\,$2'},

        // KaTeX supports more trig functions then default LaTeX
        // (\tg, \arctg, \cotg \ctg, \cosec)
        // but we're using \operatorname for them as well in translateMath()
        // In principle, they cannot be used by translators at the moment
        // because they are blocked by linter. But we will permit them here
        // in case the linter limitation is lifted in the future.
        // https://katex.org/?data=%7B%22displayMode%22%3Atrue%2C%22leqno%22%3Afalse%2C%22fleqn%22%3Afalse%2C%22throwOnError%22%3Atrue%2C%22errorColor%22%3A%22%23cc0000%22%2C%22strict%22%3A%22warn%22%2C%22trust%22%3Afalse%2C%22macros%22%3A%7B%22%5C%5Cf%22%3A%22f(%231)%22%7D%2C%22code%22%3A%22%25%20%5C%5Cf%20is%20defined%20as%20f(%231)%20using%20the%20macro%5Cn%5C%5Csin%20%5C%5Carcsin%20%5C%5Ccos%20%5C%5Carccos%20%5C%5C%5C%5C%20%5C%5Ctan%20%5C%5Carctan%20%5C%5Ctg%20%5C%5Carctg%20%5C%5C%5C%5C%5Cn%5C%5Ccot%20%5C%5Ccotg%20%5C%5Cctg%20%5C%5Coperatorname%7Barccot%7D%20%5C%5C%5C%5C%5Cn%5C%5Ccsc%20%5C%5Ccosec%20%5C%5Coperatorname%7Barccsc%7D%20%5C%5C%5C%5C%5Cn%5C%5Coperatorname%7Bsen%7D%7Bx%7D%20%5C%5Csin%7Bx%7D%20%5C%5Csin%20x%22%7D
        {langs: Array.from(new Set([].concat(
            MATH_RULES_LOCALES.TAN_AS_TG,
            MATH_RULES_LOCALES.COT_AS_COTG,
            MATH_RULES_LOCALES.COT_AS_CTG,
            MATH_RULES_LOCALES.CSC_AS_COSEC))),
        regex: /\\(tg|arctg|cotg|ctg|cosec)/g,
        replace: '\\operatorname{$1}'},
    ];

    mathNormalizations.forEach(function(element) {
        if (element.langs.includes(lang)) {
            math = math.replace(element.regex, element.replace);
        }
    });

    // Remove whitespace in coordinates/intervals
    // Applied to all langs because all langs can be affected by
    // translatedCoordinates/translateIntervals/translateCoordinatesOrIntervals
    const orderedPair = getOrderedPairRegexString(lang);
    const coordsAndIntervals =
        new RegExp(`([[⟨(\\]])${orderedPair}([[)⟩\\]])`, 'g');
    math = math.replace(coordsAndIntervals, '$1$2$3$4$5');

    return math;
}

/**
 * Maybe translate certain math notation to match the notation
 * that the translator used in the template string.
 *
 * This is needed for cases where two or more translations are valid,
 * e.g. \cdot versus \times, or where there's not a unique mapping from
 * US notation (intervals and cartesian coordinates have the same notation
 * in the US but different in many countries).
 *
 * The assumption here is that different math notations will not mingle
 * in a single string, even though in principle a single string can very well
 * contain both an interval (0,10) and cartesian point (0, 0) for example.
 * Presumably, such cases are rare.
 *
 * Example: String '\\times' will be translated to '\\cdot' if and only if:
 * 1. lang is in MAYBE_TIMES_AS_CDOT_LOCALES
 * 2. the 'template' contains '\\cdot' at least once
 * 3. the 'template' does NOT contain '\\times'
 *
 * @param {string} math A math expression to be translated
 * @param {string} template User-translated template
 * @param {string} lang The KA locale of the translation language.
 * @returns {string} translated math expression.
 */
function maybeTranslateMath(math, template, lang) {

    // A heuristic for intervals and coordinates:
    // We assume that a single string will not mix intervals and coordinates
    // 1. Try to find closed/half-closed intervals
    // 2. If not found, try to detect coordinates
    // (for details, see comment for detectCoordinates())
    // 3. For certain strings such as (1,2), we cannot differentiate
    // between coordinates and intervals so we will extract the notation
    // from the translated template.
    if (detectClosedInterval(math)) {
        math = translateIntervals(math, template, lang);
    } else if (detectCoordinates(math)) {
        math = translateCoordinates(math, template, lang);
    } else {
        math = translateCoordinatesOrOpenIntervals(math, template, lang);
    }

    // The rest of the rules can be applied only
    // when we have the translated template.
    if (!template) {
        return math;
    }

    const maybeMathTranslations = [
        // multiplication sign as a centered dot
        {langs: MATH_RULES_LOCALES.MAYBE_TIMES_AS_CDOT,
            regex: /\\times/g, replace: '\\cdot'},
        // multiplication sign as x
        {langs: MATH_RULES_LOCALES.MAYBE_CDOT_AS_TIMES,
            regex: /\\cdot/g, replace: '\\times'},
        // division sign as a colon
        {langs: MATH_RULES_LOCALES.MAYBE_DIV_AS_COLON,
            regex: /\\div/g, replace: '\\mathbin{:}'},
    ];

    maybeMathTranslations.forEach(function(el) {
        if (el.langs.includes(lang) &&
            template.includes(el.replace) &&
            !template.match(el.regex)) {

            math = math.replace(el.regex, el.replace);

        }
    });

    return math;
}


/**
 * Base colors currently used in KA strings taken from KaTeX definitions, see:
 * https://github.com/KaTeX/KaTeX/blob/master/src/macros.js
 * There can be different variants of a single color, such as \redA or \blueD,
 * but that's handled elsewhere.
 */
const KATEX_BASE_COLORS = ['blue', 'gold', 'gray', 'mint', 'green', 'red',
    'maroon', 'orange', 'pink', 'purple', 'teal', 'kaBlue', 'kaGreen'];

/**
 * Return regex string matching numerals for a given languages
 *
 * @param {string} lang The KA locale
 * @returns {string} String to be passed into RegExp constructor.
 */
function getDigitsRegexString(lang) {
    if (MATH_RULES_LOCALES.PERSO_ARABIC_NUMERALS.includes(lang)) {
        return '[۱۲۳۴۵۶۷۸۹۰]';
    } else {
        return '[0-9]';
    }
}

/**
 * Construct regular expression to match decimal numbers for a given lang,
 * possibly wrapped in TeX commands.
 *
 * We do not return the RegExp object, only the string
 * so that it can be combined into more complicated expressions.
 *
 * By default, the regex contains two capturing groups:
 * 1. integer part
 * 2. decimal part
 * This can be changed by passing capture=false,
 * this variant is used to construct regexes for coordinates and intervals.
 *
 * @param {string} lang The KA locale
 * @param {bool} capture whether to include capturing groups in regex
 * @returns {string} String to be passed into RegExp constructor.
 */
function getDecNumberRegexString(lang, capture = true) {
    // Definition of regex for decimal numbers
    // We need to allow for strings like '\\greenD{3}.\\blue{1}' or
    // repeating decimals like '1/3 = 0.\\overline{3}'
    //
    // These colors are appended by optional [A-Z]? to match all definitions
    // from KaTeX. This will form a superset of actually defined colors,
    // but that hardly matters here and is more future-proof if new colors
    // were defined at some point
    const katexColorMacros = KATEX_BASE_COLORS.join('|');

    // returns '[0-9]' for most languages
    const dig = getDigitsRegexString(lang);

    const integerPart =
        `-?${dig}+|-?\\\\(?:${katexColorMacros})[A-Z]?\\{-?${dig}+\\}`;
    // Decimal part is different from integer part
    // because it can contain \\overline
    // TODO: Some langs do not use \\overline, but \\dot
    const decPart =
       `${dig}+|\\\\(?:overline|${katexColorMacros})[A-Z]?\\{${dig}+\\}`;

    const sep = getEscapedDecimalSeparator(lang);

    // This part matches strings like `\\green{1.2}`
    const wrappedDecimal =
        `\\\\(?:${katexColorMacros})[A-Z]?\\{-?${dig}+${sep}${dig}+\\}`;

    // Wrapped decimal is not needed if we capture integer and decimal part
    // because in that case we do not care that the decimal number
    // is wrapped as a whole
    return capture ?
        `(${integerPart})${sep}(${decPart})` :
        `(?:(?:${integerPart})${sep}(?:${decPart}))|(?:${wrappedDecimal})`;
}

/**
 * Return decimal separator for a given language.
 * The separator is used in regex so it needs to be escaped.
 *
 * @param {string} lang KA locale
 * @returns {string} Decimal separator to be passed into RegExp constructor.
 */
function getEscapedDecimalSeparator(lang) {
    if (MATH_RULES_LOCALES.DECIMAL_COMMA.includes(lang)) {
        return '\\{,\\}';
    } else if (MATH_RULES_LOCALES.ARABIC_COMMA.includes(lang)) {
        return '\\{،\\}';
    } else {
        return '\\.';
    }
}

/**
 * Build regex string for ranges (inside intervals)
 * or, equivalently, cartesian coordinates (without parentheses).
 *
 * Matches strings such as:
 * '-1,0'
 * '1.2;3'
 * '\greenD4, \blue{1{,}2}'
 * 'x,y'
 *
 * We pass in the language param, because we need to match
 * different notations for decimal numbers
 *
 * @param {string} lang KA locale
 * @returns {string} string to be passed to RegExp constructor
 */
function getOrderedPairRegexString(lang) {
    const katexColorMacros = `\\\\(?:${KATEX_BASE_COLORS.join('|')})[A-Z]?`;
    const dig = getDigitsRegexString(lang);
    // Assuming single-letter variables (or \pi) and numbers below 1000
    // (without thousand separator) or combinations, such as '2\\pi' or '2.1b'
    const integer =
        `-?(?:${dig}+|` +
        `${katexColorMacros}\\{-?${dig}+\\}|` +
        `${katexColorMacros}${dig})`;
    const variable = `-?(?:\\\\pi|[a-z]|${katexColorMacros}\\{[a-z]\\})`;
    const decimal = getDecNumberRegexString(lang,
        /* don't include capture groups */ false);

    // Match 'a', '2' or '2a'
    const fracArgument = `(?:${variable}|(?:${integer})(?:${variable})?)`;
    // Match '\\frac{1}{2}' or `\\frac{3\\pi}{2}
    let frac = `-?\\\\d?frac\\{${fracArgument}\\}\\{${fracArgument}\\}`;
    // Match '\frac{3}{4}\\pi'
    frac = `${frac}${fracArgument}?`;

    const numberAndOrLetter =
        `${frac}|${variable}|(?:${decimal}|${integer})(?:${variable})?`;

    // NOTE(danielhollas): We allow comma and semicolon for all langs
    // as separators, even though maybe some langs use only comma.
    // Since the US strings always have commas (I think),
    // it's not a big deal if we are more permissive.
    // If a translator bothered to change it to semicolon,
    // they probably had a reason.
    let separators = ',;';
    if (lang === 'de') {
        separators += '|'; // For German coordinates
    }
    // Support LaTeX spaces, e.g. '4~; 3' (used in e.g. French notation)
    const space = '(?:\\\\,|~|\\s)*';
    const sep = `${space}[${separators}]${space}`;
    return `\\s*(${numberAndOrLetter})(${sep})(${numberAndOrLetter})\\s*`;
}


/**
 * Detect closed or half-closed intervals in US math expression, such as
 * '[a,b]', '[1,2)' or '(0,5]'
 *
 * (the expression can contain numbers or single-letter variables,
 * see getOrderedpairRegexString)
 *
 * We cannot detect open intervals, because they have the same
 * notation as cartesian coordinates in the US.
 *
 * @param {string} math English math string
 * @returns {bool} true if math contains at least one interval
 */
function detectClosedInterval(math) {
    const lang = 'en';
    const interval = getOrderedPairRegexString(lang);

    const closedInterval = new RegExp(wrapParens(interval, '[', ']'), 'g');
    const leftClosedInterval = new RegExp(wrapParens(interval, '[', ')'), 'g');
    const rightClosedInterval = new RegExp(wrapParens(interval, '(', ']'), 'g');

    return closedInterval.test(math) ||
        leftClosedInterval.test(math) ||
        rightClosedInterval.test(math);
}

/**
 * A heuristic for detecting cartesian coordinates in US math expressions.
 *
 * Given `(a,b)`, an interval would always have a < b
 * (4, 2) is a coordinate
 * (2, 4) may be coordinate or open interval so we return false
 * (x, y) can also be coordinate or open interval so we return false
 *
 * @param {string} math English math string
 * @returns {bool} true if math definitely contains cartesian coordinates
 */
function detectCoordinates(math) {
    const lang = 'en';
    const coords = getOrderedPairRegexString(lang);
    const coordsRegex =
        new RegExp(wrapParens(coords, '(', ')'), 'g');
    let match;
    while ( (match = coordsRegex.exec(math)) !== null &&
        match.length === 4) {
        // Remove color commands around numbers
        const num1 = match[1].replace(/[a-zA-Z]|\{|\}|\\/g, '');
        const num2 = match[3].replace(/[a-zA-Z]|\{|\}|\\/g, '');
        const a = parseFloat(num1);
        const b = parseFloat(num2);
        if (a >= b) {
            return true;
        }
    }
    return false;
}

/**
 * Extract the separator from a translated template.
 * If empty, the default separator is used.
 *
 * Regular expression is passed in that matches coordinates/intervals
 * in a given language. The separator is captured in the second group.
 *
 * @param {string} template User-translated template (optional)
 * @param {string} regex Regular expression matching coordinates/intervals
 * @param {string} lang KA locale of the translation language.
 * @returns {string} Translated string
 */
function getSeparator(template, regex, lang) {
    let sepDefault = ',';
    // Languages with decimal comma typically use semicolon
    if (MATH_RULES_LOCALES.DECIMAL_COMMA.includes(lang)) {
        sepDefault = ';';
    }
    let match;
    // Return separator from the template if detected
    if (template &&
        (match = template.match(regex)) !== null &&
        match.length === 4) {
        return match[2];
    } else {
        return sepDefault;
    }
}

/**
 * A helper function for building coordinates/intervals regexes.
 *
 * The input regex string is wrapped in custom left and right
 * parentheses and the optional LaTeX \left and \right commands are added
 * (these are used by content creators so that the sizes of parentheses
 * respect the size of the expression that is inside them).
 *
 * @param {string} regex Regex string to be wrapped in parentheses
 * @param {string} left left parenthesis character
 * @param {string} right right parenthesis character
 * @param {bool} capture capture the \left|\right commands?
 * @returns {string} Regex string
 */
function wrapParens(regex, left, right, capture = false) {
    if (capture)
        return `(\\\\left)?\\${left}${regex}(\\\\right)?\\${right}`;
    else
        return `(?:\\\\left)?\\${left}${regex}(?:\\\\right)?\\${right}`;
}

/**
 * Translates notation for cartesian coordinates, such as:
 * (3,0) or (x,y)
 *
 * A translated template is used to determine the separator.
 * If empty, the default separator is used.
 *
 * @param {string} math A math expression to be translated
 * @param {string} template User-translated template (optional)
 * @param {string} lang The KA locale of the translation language.
 * @returns {string} Translated string
 */
function translateCoordinates(math, template, lang) {
    const coordsUS = getOrderedPairRegexString('en');

    const coords = getOrderedPairRegexString(lang);
    let coordsRegex;
    if (MATH_RULES_LOCALES.COORDS_AS_BRACKETS.includes(lang)) {
        coordsRegex = new RegExp(wrapParens(coords, '[', ']'));
    } else {
        coordsRegex = new RegExp(wrapParens(coords, '(', ')'));
    }

    const sep = getSeparator(template, coordsRegex, lang);

    const coordsRegexUS = new RegExp(wrapParens(coordsUS, '(', ')', true), 'g');
    const coordsTranslations = [
        {langs: MATH_RULES_LOCALES.COORDS_AS_BRACKETS,
            regex: coordsRegexUS, replace: `$1[$2${sep}$4$5]`},
    ];

    coordsTranslations.forEach(function(el) {
        if (el.langs.includes(lang)) {
            math = math.replace(el.regex, el.replace);
        } else {
            // For all other langs translate only the separator
            math = math.replace(el.regex, `$1($2${sep}$4$5)`);
        }
    });

    return math;
}

/**
 * Translate notation for intervals (opened, closed, half-closed)
 * e.g. '(-1,1)', '(0, a]' or '[\blue3,\red4]'
 *
 * @param {string} math A math expression to be translated
 * @param {string} template User-translated template
 * @param {string} lang The KA locale of the translation language.
 * @returns {string} Translated string
 */
function translateIntervals(math, template, lang) {
    const intervalUS = getOrderedPairRegexString('en');
    const closedInterval = new RegExp(
        wrapParens(intervalUS, '[', ']', true), 'g');
    const openInterval = new RegExp(
        wrapParens(intervalUS, '(', ')', true), 'g');
    const leftClosedInterval = new RegExp(
        wrapParens(intervalUS, '[', ')', true), 'g');
    const rightClosedInterval = new RegExp(
        wrapParens(intervalUS, '(', ']', true), 'g');

    // Detect range separator in the template, can be comma or semicolon
    // We expect that if template contains more intervals, they will have
    // the same separator. The can also include any whitespace chars.
    // Again, these need to be consistent in all intervals!
    const interval = getOrderedPairRegexString(lang);
    const generalInterval = new RegExp(
        `(?:\\\\left)?[[(\\]]${interval}(?:\\\\right)?[[)\\]]`);

    const sep = getSeparator(template, generalInterval, lang);

    const intervalTranslations = [
        // open intervals with inverted brackets
        {langs: MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS,
            regex: openInterval, replace: `$1]$2${sep}$4$5[`},
        {langs: MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS,
            regex: closedInterval, replace: `$1[$2${sep}$4$5]`},
        {langs: MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS,
            regex: leftClosedInterval, replace: `$1[$2${sep}$4$5[`},
        {langs: MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS,
            regex: rightClosedInterval, replace: `$1]$2${sep}$4$5]`},
        // closed intervals with angle brackets
        // We cannot use \langle|\rangle because of the linter
        // so we insert equivalent unicode chars directly.
        // U+27E8 | ⟨ | \xe2\x9f\xa8 | MATHEMATICAL LEFT ANGLE BRACKET
        // U+27E9 | ⟩ | \xe2\x9f\xa9 | MATHEMATICAL RIGHT ANGLE BRACKET
        {langs: MATH_RULES_LOCALES.CLOSED_INT_AS_ANGLE_BRACKETS,
            regex: openInterval, replace: `$1($2${sep}$4$5)`},
        {langs: MATH_RULES_LOCALES.CLOSED_INT_AS_ANGLE_BRACKETS,
            regex: closedInterval, replace: `$1⟨$2${sep}$4$5⟩`},
        {langs: MATH_RULES_LOCALES.CLOSED_INT_AS_ANGLE_BRACKETS,
            regex: leftClosedInterval, replace: `$1⟨$2${sep}$4$5)`},
        {langs: MATH_RULES_LOCALES.CLOSED_INT_AS_ANGLE_BRACKETS,
            regex: rightClosedInterval, replace: `$1($2${sep}$4$5⟩`},
    ];

    intervalTranslations.forEach(function(el) {
        if (el.langs.includes(lang)) {
            math = math.replace(el.regex, el.replace);
        }
    });

    // For all other languages not listed above,
    // translate only the separator
    if (MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS.includes(lang) ||
        MATH_RULES_LOCALES.CLOSED_INT_AS_ANGLE_BRACKETS.includes(lang) ) {
        return math;
    }

    // The only thing we translate here is the separator!
    const separatorTranslations = [
        {regex: openInterval, replace: `$1($2${sep}$4$5)`},
        {regex: closedInterval, replace: `$1[$2${sep}$4$5]`},
        {regex: leftClosedInterval, replace: `$1[$2${sep}$4$5)`},
        {regex: rightClosedInterval, replace: `$1($2${sep}$4$5]`},
    ];

    separatorTranslations.forEach(function(el) {
        math = math.replace(el.regex, el.replace);
    });

    return math;
}

/**
 * Translate notation of coordinates or open intervals.
 *
 * Since the US notation is the same, we cannot really distinguish
 * the two apart. So we will detect the notation from the user-translated
 * template and use it. Without the template, we return the same string.
 *
 * Example US strings:
 * '(0,1)', '(a,b)', '(1.4, \red{5.6})'
 *
 * @param {string} math A math expression to be translated
 * @param {string} template User-translated template
 * @param {string} lang Khan language
 * @returns {string} translated string
 */
function translateCoordinatesOrOpenIntervals(math, template, lang) {
    if (!template) {
        return math;
    }
    const orderedPairUS = getOrderedPairRegexString('en');
    const coordsOrOpenIntervalUS =
        new RegExp(wrapParens(orderedPairUS, '(', ')', true), 'g');

    // First look into the English string
    if (!coordsOrOpenIntervalUS.test(math)) {
        return math;
    }
    // Now we know that the English string contains coordinates or intervals
    // Let's detect them in the template.
    // If we fail, we return prematurely.
    const orderedPair = getOrderedPairRegexString(lang);
    const coordsOrOpenInterval = new RegExp(
        `(?:\\\\left)?([[(\\]])${orderedPair}(?:\\\\right)?([[)\\]])`
    );
    const match = template.match(coordsOrOpenInterval);
    if (!match || match.length !== 6) {
        return math;
    }

    const leftParen = match[1];
    const sep = match[3];
    const rightParen = match[5];

    // Verify that left and right parentheses|brackets make sense
    // for a given language
    switch (leftParen) {
    case '[':
        if (rightParen !== ']' ||
            !MATH_RULES_LOCALES.COORDS_AS_BRACKETS.includes(lang))
            return math;
        break;
    case ']':
        if (rightParen !== '[' ||
            !MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS.includes(lang))
            return math;
        break;
    case '(':
        if (rightParen !== ')')
            return math;
        break;
    default:
        return math;
    }

    // $1 and $4 refer to the optional \left and \right LaTeX commands
    const replace = `$1${leftParen}$2${sep}$4$5${rightParen}`;

    return math.replace(coordsOrOpenIntervalUS, replace);
}

module.exports = {
    translateMath: translateMath,
    // The following are exported only for testing
    maybeTranslateMath: maybeTranslateMath,
    normalizeTranslatedMath: normalizeTranslatedMath,
    MATH_RULES_LOCALES: MATH_RULES_LOCALES,
    detectClosedInterval: detectClosedInterval,
    detectCoordinates: detectCoordinates,
};
