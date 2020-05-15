/*global describe, it*/

const assert = require('assert');
const {
    translateMath,
    maybeTranslateMath,
    normalizeTranslatedMath,
    detectClosedInterval,
    detectCoordinates,
    MATH_RULES_LOCALES,
} = require('../lib/math-translator');

describe('MathTranslator (translateMath)', function() {
    it('should return the same string for en locale', function() {
        const englishStr = '1{,}000{,}000 \\times 9{,}000.400 \\div 2 = \\sin';
        const outputStr = translateMath(englishStr, '', 'en');
        assert.equal(outputStr, englishStr);
    });

    it('should translate thousand separator as thin space', function() {
        const englishStr = '1{,}000{,}000 + 9{,}000';
        const translatedStr = '1\\,000\\,000 + 9\\,000';

        MATH_RULES_LOCALES.THOUSAND_SEP_AS_THIN_SPACE.forEach(function(locale) {
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate thousand separator as a dot', function() {
        const englishStr = '1{,}000{,}000 + 9{,}000';
        const translatedStr = '1.000.000 + 9.000';

        MATH_RULES_LOCALES.THOUSAND_SEP_AS_DOT.forEach(function(locale) {
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate thousand separator for none', function() {
        const englishStr = '1{,}000{,}000 + 9{,}000';
        const translatedStr = '1000000 + 9000';

        const outputStr = translateMath(englishStr, '', 'ko');
        assert.equal(outputStr, translatedStr);
    });

    it('should not translate thousand separator for en locale', function() {
        const englishStr = '1{,}000{,}000 + 9{,}000';
        const outputStr = translateMath(englishStr, '', 'en');
        assert.equal(outputStr, englishStr);
    });

    it('should translate decimal point to decimal comma', function() {
        const englishStr = '1000.000 + 9.4 + 45.0';
        const translatedStr = '1000{,}000 + 9{,}4 + 45{,}0';

        MATH_RULES_LOCALES.DECIMAL_COMMA.forEach(function(locale) {
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate both thousand sep. and decimal point for cs locale',
    function() {
        const englishStr = '1{,}000{,}000.700 + 9{,}000.000';
        const translatedStr = '1\\,000\\,000{,}700 + 9\\,000{,}000';
        const outputStr = translateMath(englishStr, '', 'cs');
        assert.equal(outputStr, translatedStr);
    });

    it('should translate notation for multiplication', function() {
        MATH_RULES_LOCALES.TIMES_AS_CDOT.forEach(function(locale) {
            const englishStr = '2 \\times 2 = 4';
            const translatedStr = '2 \\cdot 2 = 4';
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });

        MATH_RULES_LOCALES.CDOT_AS_TIMES.forEach(function(locale) {
            // NOTE(danielhollas): Cannot use numbers here, because
            // CDOT_AS_TIMES includes Pashto which has different numerals
            const englishStr = 'a \\cdot b';
            const translatedStr = 'a \\times b';
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate notation for division', function() {
        MATH_RULES_LOCALES.DIV_AS_COLON.forEach(function(locale) {
            const englishStr = '8 \\div 2 = 4';
            const translatedStr = '8 \\mathbin{:} 2 = 4';
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate different math notations simultaneously', function() {
        const englishStr = '8\\div 2=2 \\times 2, 1{,}000{,}000.874';
        const translatedStr = '8\\mathbin{:} 2=2 \\cdot 2, 1\\,000\\,000{,}874';
        const outputStr = translateMath(englishStr, '', 'cs');
        assert.equal(outputStr, translatedStr);
    });

    // Trig functions
    it('should translate notation for sinus', function() {
        MATH_RULES_LOCALES.SIN_AS_SEN.forEach(function(locale) {
            const englishStr = '\\arcsin \\sin';
            const translatedStr = '\\operatorname{arcsen} \\operatorname{sen}';
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate notation for tangens', function() {
        MATH_RULES_LOCALES.TAN_AS_TG.forEach(function(locale) {
            const englishStr = '\\arctan\\tan';
            const translatedStr = '\\operatorname{arctg}\\operatorname{tg}';
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate notation for cotangens', function() {
        MATH_RULES_LOCALES.COT_AS_COTG.forEach(function(locale) {
            const englishStr = '\\arccot\\cot';
            const translatedStr = '\\operatorname{arccotg}\\operatorname{cotg}';
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });

        MATH_RULES_LOCALES.COT_AS_CTG.forEach(function(locale) {
            const englishStr = '\\arccot\\cot';
            const translatedStr = '\\operatorname{arcctg}\\operatorname{ctg}';
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate notation for cosecant', function() {
        MATH_RULES_LOCALES.CSC_AS_COSSEC.forEach(function(locale) {
            const englishStr = '\\csc \\theta';
            const translatedStr = '\\operatorname{cossec} \\theta';
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });

        MATH_RULES_LOCALES.CSC_AS_COSEC.forEach(function(locale) {
            const englishStr = '\\csc \\theta';
            const translatedStr = '\\operatorname{cosec} \\theta';
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate western- to perso-arabic numerals', function() {
        MATH_RULES_LOCALES.PERSO_ARABIC_NUMERALS.forEach(function(locale) {
            const englishStr = '1234567890';
            const translatedStr = '۱۲۳۴۵۶۷۸۹۰';
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should use arabic decimal comma and no thousand separator for pashto',
    function() {
        const englishStr = '1{,}234{,}567.890';
        const translatedStr = '۱۲۳۴۵۶۷{،}۸۹۰';
        const outputStr = translateMath(englishStr, '', 'ps');
        assert.equal(outputStr, translatedStr);
    });

    it('should translate repeating decimal numbers', function() {
        // We cannot iterate over all locales from DECIMAL_COMMA
        // because some of them have different notation for repeating decimals
        // So we choose just one particular
        const locale = 'cs';
        assert(MATH_RULES_LOCALES.DECIMAL_COMMA.includes(locale));

        const englishStr = '1.\\overline{3} + 9.\\overline{44}';
        let translatedStr = '1{,}\\overline{3} + 9{,}\\overline{44}';
        const outputStr = translateMath(englishStr, '', locale);
        assert.equal(outputStr, translatedStr);

        translatedStr = '۱{،}\\overline{۳} + ۹{،}\\overline{۴۴}';
        MATH_RULES_LOCALES.ARABIC_COMMA.forEach(function(locale) {
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate \\overline in repeating decimals as \\dot',
    function() {
        const locale = 'bn';
        assert(MATH_RULES_LOCALES.OVERLINE_AS_DOT.includes(locale));

        const englishStr = '1.\\overline{3} + 9.\\overline{44}';
        const translatedStr = '1.\\dot{3} + 9.\\dot{4}\\dot{4}';
        const outputStr = translateMath(englishStr, '', locale);
        assert.equal(outputStr, translatedStr);
    });

    it('should translate \\overline in repeating decimals as parentheses',
    function() {
        const locale = 'pt-pt';
        assert(MATH_RULES_LOCALES.OVERLINE_AS_PARENS.includes(locale));

        const englishStr = '1.\\overline{3} + 9.\\overline{44}';
        const translatedStr = '1{,}(3) + 9{,}(44)';
        const outputStr = translateMath(englishStr, '', locale);
        assert.equal(outputStr, translatedStr);
    });

    it('should translate decimals wrapped in color commands', function() {
        const englishStr =
           '\\blue{13}.\\tealE{3} \\tealE{9}.\\blue{4} \\redA{0}.\\red{33}';
        let translatedStr =
         '\\blue{13}{,}\\tealE{3} \\tealE{9}{,}\\blue{4} \\redA{0}{,}\\red{33}';

        MATH_RULES_LOCALES.DECIMAL_COMMA.forEach(function(locale) {
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });

        translatedStr =
         '\\blue{۱۳}{،}\\tealE{۳} \\tealE{۹}{،}\\blue{۴} \\redA{۰}{،}\\red{۳۳}';
        MATH_RULES_LOCALES.ARABIC_COMMA.forEach(function(locale) {
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should NOT translate decimals wrapped in any tex commands', function() {
        const englishStr = '\\hat{1}.\\tealE{3} \\tealE{9}.\\hat{4}';
        let translatedStr = englishStr;

        MATH_RULES_LOCALES.DECIMAL_COMMA.forEach(function(locale) {
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });

        translatedStr = '\\hat{۱}.\\tealE{۳} \\tealE{۹}.\\hat{۴}';
        MATH_RULES_LOCALES.ARABIC_COMMA.forEach(function(locale) {
            const outputStr = translateMath(englishStr, '', locale);
            assert.equal(outputStr, translatedStr);
        });
    });

});

describe('MathTranslator (normalizeTranslatedMath)', function() {
    it('should strip extra braces around thousand separator as thin space',
    function() {
        const translatedStr = '1{\\,}000{\\,}000 + 9\\,000';
        const normalizedStr = '1\\,000\\,000 + 9\\,000';

        MATH_RULES_LOCALES.THOUSAND_SEP_AS_THIN_SPACE.forEach(function(locale) {
            const outputStr = normalizeTranslatedMath(translatedStr, locale);
            assert.equal(outputStr, normalizedStr);
        });
    });

    it('should strip extra braces around thousand separator as a dot',
    function() {
        const translatedStr = '1{.}000{.}000 + 9.000 + 1{,}2';
        const normalizedStr = '1.000.000 + 9.000 + 1{,}2';

        MATH_RULES_LOCALES.THOUSAND_SEP_AS_DOT.forEach(function(locale) {
            const outputStr = normalizeTranslatedMath(translatedStr, locale);
            assert.equal(outputStr, normalizedStr);
        });
    });

    it('should not strip extra braces around thousand separator for en locale',
    function() {
        const translatedStr = '1{\\,}000{\\,}000 + 9\\,000';
        const normalizedStr = '1{\\,}000{\\,}000 + 9\\,000';
        const outputStr = normalizeTranslatedMath(translatedStr, 'en');
        assert.equal(outputStr, normalizedStr);
    });

    it('should convert ~ to thin space as thousand separator', function() {
        const translatedStr = '1~000~000 + 9~000';
        const normalizedStr = '1\\,000\\,000 + 9\\,000';

        MATH_RULES_LOCALES.THOUSAND_SEP_AS_THIN_SPACE.forEach(
        function(locale) {
            const outputStr = normalizeTranslatedMath(translatedStr, locale);
            assert.equal(outputStr, normalizedStr);
        });
    });

    it('should convert {~} to thin space as thousand separator', function() {
        const translatedStr = '1{~}000{~}000 + 9{~}000';
        const normalizedStr = '1\\,000\\,000 + 9\\,000';

        MATH_RULES_LOCALES.THOUSAND_SEP_AS_THIN_SPACE.forEach(function(locale) {
            const outputStr = normalizeTranslatedMath(translatedStr, locale);
            assert.equal(outputStr, normalizedStr);
        });
    });

    it('should NOT convert ~ to thin space for en locale', function() {
        const translatedStr = '1~000~000 + 9~000';
        const normalizedStr = '1~000~000 + 9~000';
        const outputStr = normalizeTranslatedMath(translatedStr, 'en');
        assert.equal(outputStr, normalizedStr);
    });

    it('use \\operatorname{} even for commands supported by KaTeX', function() {
        const translatedStr1 = '\\tg\\arctg\\cotg';
        const normalizedStr1 =  '\\operatorname{tg}\\operatorname{arctg}' +
            '\\operatorname{cotg}';
        const outputStr1 = normalizeTranslatedMath(translatedStr1, 'pt');
        assert.equal(outputStr1, normalizedStr1);

        const translatedStr2 = '\\ctg\\cosec';
        const normalizedStr2 =  '\\operatorname{ctg}\\operatorname{cosec}';
        const outputStr2 = normalizeTranslatedMath(translatedStr2, 'az');
        assert.equal(outputStr2, normalizedStr2);
    });
});

describe('MathTranslator (maybeTranslateMath)', function() {

    it('should return the same string if template is empty', function() {
        MATH_RULES_LOCALES.MAYBE_TIMES_AS_CDOT.forEach(function(locale) {
            const englishStr = '8 \\times 2 = 16';
            const template = null;
            const translatedStr = '8 \\times 2 = 16';
            const output = maybeTranslateMath(englishStr, template, locale);
            assert.equal(output, translatedStr);
        });
    });

    it('should maybe translate times to cdot based on template', function() {
        MATH_RULES_LOCALES.MAYBE_TIMES_AS_CDOT.forEach(function(locale) {
            const englishStr = '8 \\times 2 = 16';

            const template1 = '4 \\cdot 1 = 4';
            const translatedStr1 = '8 \\cdot 2 = 16';
            const output1 = maybeTranslateMath(englishStr, template1, locale);
            assert.equal(output1, translatedStr1);

            const template2 = '4 \\times 1 = 4';
            const translatedStr2 = '8 \\times 2 = 16';
            const output2 = maybeTranslateMath(englishStr, template2, locale);
            assert.equal(output2, translatedStr2);
        });
    });

    it('should maybe translate cdot to times based on template', function() {
        MATH_RULES_LOCALES.MAYBE_CDOT_AS_TIMES.forEach(function(locale) {
            const englishStr = '8 \\cdot 2 = 16';

            const template1 = '8 \\times 1 = 8';
            const translatedStr1 = '8 \\times 2 = 16';
            const output1 = maybeTranslateMath(englishStr, template1, locale);
            assert.equal(output1, translatedStr1);

            const template2 = '8 \\cdot 1 = 8';
            const translatedStr2 = '8 \\cdot 2 = 16';
            const output2 = maybeTranslateMath(englishStr, template2, locale);
            assert.equal(output2, translatedStr2);
        });
    });

    it('should maybe translate div to mathbin based on template', function() {
        MATH_RULES_LOCALES.MAYBE_DIV_AS_COLON.forEach(function(locale) {
            const englishStr = '8 \\div 2 = 4';

            const template1 = '4 \\mathbin{:} 2 = 2';
            const translatedStr1 = '8 \\mathbin{:} 2 = 4';
            const output1 = maybeTranslateMath(englishStr, template1, locale);
            assert.equal(output1, translatedStr1);

            const template2 = '4 \\div 2 = 2';
            const translatedStr2 = '8 \\div 2 = 4';
            const output2 = maybeTranslateMath(englishStr, template2, locale);
            assert.equal(output2, translatedStr2);
        });
    });

    it('should NOT translate if template has conflicting notation', function() {
        MATH_RULES_LOCALES.MAYBE_DIV_AS_COLON.forEach(function(locale) {
            const englishStr = '8 \\div 2 = 16 \\div 4';
            const template = '2 \\mathbin{:} 2 = 1 \\div 1';
            const translatedStr = englishStr;
            const output = maybeTranslateMath(englishStr, template, locale);
            assert.equal(output, translatedStr);
        });

        MATH_RULES_LOCALES.MAYBE_TIMES_AS_CDOT.forEach(function(locale) {
            const englishStr = '8 \\times 2 = 16 \\times 1';
            const template = '1 \\times 2 = 2 \\cdot 1';
            const translatedStr = englishStr;
            const output = maybeTranslateMath(englishStr, template, locale);
            assert.equal(output, translatedStr);
        });

        MATH_RULES_LOCALES.MAYBE_CDOT_AS_TIMES.forEach(function(locale) {
            const englishStr = '8 \\cdot 2 = 16 \\cdot 1';
            const template = '1 \\times 2 = 2 \\cdot 1';
            const translatedStr = englishStr;

            const output = maybeTranslateMath(englishStr, template, locale);
            assert.equal(output, translatedStr);
        });
    });

    it('should translate open intervals with inverted brackets', function() {
        MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS.forEach(function(locale) {
            const englishStr = '[a, b] [1 ,d) (e , 2] (1,2)';
            const template = ']a,b[';
            const translatedStr = '[a,b] [1,d[ ]e,2] ]1,2[';
            const output = maybeTranslateMath(englishStr, template, locale);
            assert.equal(output, translatedStr);
        });
    });

    it('should handle semicolon as a range separator', function() {
        MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS.forEach(function(locale) {
            const englishStr = '[a, b] [1 ,d) (e , 2] (1,2)';
            const template = ']a;b[';
            const translatedStr = '[a;b] [1;d[ ]e;2] ]1;2[';
            const output = maybeTranslateMath(englishStr, template, locale);
            assert.equal(output, translatedStr);
        });
    });

    it('should handle white space in coordinates/intervals', function() {
        MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS.forEach(function(locale) {
            const englishStr = '[a, b] [1 ,d) ( e , 2] (1,2 )';
            const template = ']a ; b[';
            const translatedStr = '[a ; b] [1 ; d[ ]e ; 2] ]1 ; 2[';
            const output = maybeTranslateMath(englishStr, template, locale);
            assert.equal(output, translatedStr);

            const template2 = ']a, b[';
            const translatedStr2 = '[a, b] [1, d[ ]e, 2] ]1, 2[';
            const output2 = maybeTranslateMath(englishStr, template2, locale);
            assert.equal(output2, translatedStr2);
        });
    });

    it('should support semicolon as separator for all langs', function() {
        const locale = 'cs';
        assert(!MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS.includes(locale));

        const englishStr = '[a, b] [1 ,d) (e , 2] (1,2)';
        const template = '(a; b]';
        const translatedStr = '[a; b] [1; d) (e; 2] (1; 2)';
        const output = maybeTranslateMath(englishStr, template, locale);
        assert.equal(output, translatedStr);
    });

    it('should support pipe as separator for german', function() {
        const locale = 'de';

        const englishStr = '(a, b) (1,2)';
        // This is a german notation for coordinates
        const template = '(2|4)';
        const translatedStr = '(a|b) (1|2)';
        const output = maybeTranslateMath(englishStr, template, locale);
        assert.equal(output, translatedStr);
    });

    it('should translate separator in closed intervals', function() {
        // Locales with identical notation for intervals
        // except that they use semicolon instead of a comma
        const locale = 'hy';
        assert(!MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS.includes(locale));

        const englishStr = '(a, b) [1,2]';
        const template = '(2; 4)';
        const translatedStr = '(a; b) [1; 2]';
        const output = maybeTranslateMath(englishStr, template, locale);
        assert.equal(output, translatedStr);
    });

    it('should support coordinates with brackets', function() {
        const locale = 'cs';
        assert(MATH_RULES_LOCALES.COORDS_AS_BRACKETS.includes(locale));

        let englishStr = '(a, b) (2,1)';
        let translatedStr = '[a,b] [2,1]';
        // In this case we now the string contains coordinates,
        // so we don't need a template
        let output = maybeTranslateMath(englishStr, null, locale);

        // When we have a template, we should extract the separator
        let template = '[a;b]';
        translatedStr = '[a;b] [2;1]';
        output = maybeTranslateMath(englishStr, template, locale);
        assert.equal(output, translatedStr);

        // Here we do not know whether it's an interval or a coordinate
        // so we need to have the template
        englishStr = '(a, b) (2,1)';
        template = '[1; 2]';
        translatedStr = '[a; b] [2; 1]';
        output = maybeTranslateMath(englishStr, template, locale);
        assert.equal(output, translatedStr);
    });

    it('should handle different decimal notation in template', function() {
        const locale = 'cs';
        assert(MATH_RULES_LOCALES.COORDS_AS_BRACKETS.includes(locale));
        assert(MATH_RULES_LOCALES.DECIMAL_COMMA.includes(locale));

        const englishStr = '(a, b) (2,4)';
        const template = '[1;2{,}5]';
        const translatedStr = '[a;b] [2;4]';
        const output = maybeTranslateMath(englishStr, template, locale);
        assert.equal(output, translatedStr);

        const englishStr2 = '(a, b) (\\blueD{-8} , \\goldD{6})';
        const translatedStr2 = '[a;b] [\\blueD{-8};\\goldD{6}]';
        const output2 = maybeTranslateMath(englishStr2, template, locale);
        assert.equal(output2, translatedStr2);

    });

    it('should only support coord/interval notation specific for given lang',
    function() {
        let locale = 'fr';
        assert(!MATH_RULES_LOCALES.COORDS_AS_BRACKETS.includes(locale));

        const englishStr = '(a, b) (1,2)';
        const translatedStr = englishStr;
        let template = '[1,2]';
        let output = maybeTranslateMath(englishStr, template, locale);
        assert.equal(output, translatedStr);

        locale = 'cs';
        assert(!MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS.includes(locale));
        template = ']1,2[';
        output = maybeTranslateMath(englishStr, template, locale);
        assert.equal(output, translatedStr);

        locale = 'bg';
        assert(!MATH_RULES_LOCALES.COORDS_AS_BRACKETS.includes(locale));
        template = '[1,2]';
        output = maybeTranslateMath(englishStr, template, locale);
        assert.equal(output, translatedStr);
    });

    it('should translate closed intervals without template', function() {
        const locale = 'fr';
        assert(MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS.includes(locale));
        assert(MATH_RULES_LOCALES.DECIMAL_COMMA.includes(locale));

        const englishStr = '[a,b] (c, d] (1,2)';
        const template = null;
        const translatedStr = '[a;b] ]c;d] ]1;2[';
        const output = maybeTranslateMath(englishStr, template, locale);
        assert.equal(output, translatedStr);
    });

    it('should support open intervals with inverted brackets', function() {
        const locale = 'fr';
        assert(MATH_RULES_LOCALES.OPEN_INT_AS_BRACKETS.includes(locale));

        const englishStr = '(a, b) (1,2)';
        const template = ']1,2[';
        const translatedStr = ']a,b[ ]1,2[';
        const output = maybeTranslateMath(englishStr, template, locale);
        assert.equal(output, translatedStr);
    });

    it('should support additional space in separator', function() {
        const locale = 'fr';
        assert(!MATH_RULES_LOCALES.COORDS_AS_BRACKETS.includes(locale));

        const englishStr = '( 2,1)';
        const template = '(3~; 4)';
        const translatedStr = '(2~; 1)';
        const output = maybeTranslateMath(englishStr, template, locale);
        assert.equal(output, translatedStr);

        const englishStr2 = '(1,2)';
        const template2 = '(3\\,;4)';
        const translatedStr2 = '(1\\,;2)';
        const output2 = maybeTranslateMath(englishStr2, template2, locale);
        assert.equal(output2, translatedStr2);
    });
});

describe('detectClosedIntervals', function() {

    it('should detect closed intervals with integers', function() {
        let englishMath = '[12 , 200]';
        assert(detectClosedInterval(englishMath));

        // Testing negative integers
        englishMath = '[-5,10]';
        assert(detectClosedInterval(englishMath));
    });

    it('should detect closed intervals with variables', function() {
        let englishMath = '[a,b]';
        assert(detectClosedInterval(englishMath));

        englishMath = '[1 ,b]';
        assert(detectClosedInterval(englishMath));

        englishMath = '[a, 2]';
        assert(detectClosedInterval(englishMath));

        englishMath = '[\\blue{a}, 2]';
        assert(detectClosedInterval(englishMath));
    });

    it('should detect intervals with decimals', function() {
        let englishMath = '[1,1.2]';
        assert(detectClosedInterval(englishMath));

        englishMath = '[\\red{1.2}, b]';
        assert(detectClosedInterval(englishMath));

        englishMath = '[\\blueD{1}.2 , a)';
        assert(detectClosedInterval(englishMath));

        englishMath = '[1, \\red{1}.\\overline{2}]';
        assert(detectClosedInterval(englishMath));
    });

    it('should detect half closed intervals', function() {
        let englishMath = '(a,b]';
        assert(detectClosedInterval(englishMath));

        englishMath = '[a,2)';
        assert(detectClosedInterval(englishMath));
    });
});

describe('detectCoordinates', function() {

    it('should detect coordinates', function() {
        let englishMath = '(4, 2.2)';
        assert(detectCoordinates(englishMath));

        englishMath = '(2, 3) (4,2)';
        assert(detectCoordinates(englishMath));

        englishMath = '(0,0)';
        assert(detectCoordinates(englishMath));
    });

    it('should detect coordinates wrapped in color commands', function() {
        let englishMath = '(\\redD{4}, -\\blueA{2})';
        assert(detectCoordinates(englishMath));

        englishMath = '(\\redD{4}, \\blueA{-2})';
        assert(detectCoordinates(englishMath));

        // https://crowdin.com/translate/khanacademy/26576/enus-lol#6546980
        englishMath = '(\\goldE4,\\maroonD0)';
        assert(detectCoordinates(englishMath));

        englishMath = '( \\blueD3, \\greenD1 )';
        assert(detectCoordinates(englishMath));
    });

    it('should detect coordinates with decimals', function() {
        let englishMath = '(\\redD{4}.2, \\blueA{2}.\\kaGreen{0})';
        assert(detectCoordinates(englishMath));

        englishMath = '(\\redD{4.2}, \\blueA{-2.0})';
        assert(detectCoordinates(englishMath));
    });

    it('should NOT detect coordinates that could also be open intervals',
    function() {
        let englishMath = '(2.1,4)';
        assert(!detectCoordinates(englishMath));

        englishMath = '(2,b)';
        assert(!detectCoordinates(englishMath));

        englishMath = '(a,b)';
        assert(!detectCoordinates(englishMath));
    });
});

describe('MATH_RULES_LOCALES', function() {

    it('should not have conflicting rules for multiplication', function() {
        MATH_RULES_LOCALES.CDOT_AS_TIMES.forEach(function(locale) {
            assert(! MATH_RULES_LOCALES.TIMES_AS_CDOT.includes(locale));
        });

        MATH_RULES_LOCALES.MAYBE_TIMES_AS_CDOT.forEach(function(locale) {
            assert(! MATH_RULES_LOCALES.TIMES_AS_CDOT.includes(locale));
        });

        MATH_RULES_LOCALES.MAYBE_CDOT_AS_TIMES.forEach(function(locale) {
            assert(! MATH_RULES_LOCALES.CDOT_AS_TIMES.includes(locale));
        });
    });

    it('should not have conflicting rules for multiplication', function() {
        MATH_RULES_LOCALES.CDOT_AS_TIMES.forEach(function(locale) {
            assert(! MATH_RULES_LOCALES.TIMES_AS_CDOT.includes(locale));
        });

        MATH_RULES_LOCALES.MAYBE_TIMES_AS_CDOT.forEach(function(locale) {
            assert(! MATH_RULES_LOCALES.TIMES_AS_CDOT.includes(locale));
        });

        MATH_RULES_LOCALES.MAYBE_CDOT_AS_TIMES.forEach(function(locale) {
            assert(! MATH_RULES_LOCALES.CDOT_AS_TIMES.includes(locale));
        });

        assert.deepEqual(
            MATH_RULES_LOCALES.MAYBE_CDOT_AS_TIMES,
            MATH_RULES_LOCALES.MAYBE_TIMES_AS_CDOT
        );
    });

    it('should not have conflicting rules for division', function() {
        MATH_RULES_LOCALES.DIV_AS_COLON.forEach(function(locale) {
            assert(! MATH_RULES_LOCALES.MAYBE_DIV_AS_COLON.includes(locale));
        });
    });

    it('should not have conflicting rules for trig functions', function() {
        MATH_RULES_LOCALES.COT_AS_COTG.forEach(function(locale) {
            assert(! MATH_RULES_LOCALES.COT_AS_CTG.includes(locale));
        });

        MATH_RULES_LOCALES.CSC_AS_COSSEC.forEach(function(locale) {
            assert(! MATH_RULES_LOCALES.CSC_AS_COSEC.includes(locale));
        });
    });

    it('should not have conflicting rules for repeating decimals', function() {
        MATH_RULES_LOCALES.OVERLINE_AS_DOT.forEach(function(locale) {
            assert(! MATH_RULES_LOCALES.OVERLINE_AS_PARENS.includes(locale));
        });
    });
});
