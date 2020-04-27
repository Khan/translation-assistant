/*global describe, it*/

const assert = require('assert');
const {
    translateMath,
    normalizeTranslatedMath,
    MATH_RULES_LOCALES,
} = require('../lib/math-translator');

describe('MathTranslator (translateMath)', function() {
    it('should return the same string for en locale', function() {
        const englishStr = '1{,}000{,}000 \\times 9{,}000.400 \\div 2 = \\sin';
        const outputStr = translateMath(englishStr, 'en');
        assert.equal(outputStr, englishStr);
    });

    it('should translate thousand separator as thin space', function() {
        const englishStr = '1{,}000{,}000 + 9{,}000';
        const translatedStr = '1\\,000\\,000 + 9\\,000';

        MATH_RULES_LOCALES.THOUSAND_SEP_AS_THIN_SPACE.forEach(function(locale) {
            const outputStr = translateMath(englishStr, locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate thousand separator as a dot', function() {
        const englishStr = '1{,}000{,}000 + 9{,}000';
        const translatedStr = '1.000.000 + 9.000';

        MATH_RULES_LOCALES.THOUSAND_SEP_AS_DOT.forEach(function(locale) {
            const outputStr = translateMath(englishStr, locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate thousand separator for none', function() {
        const englishStr = '1{,}000{,}000 + 9{,}000';
        const translatedStr = '1000000 + 9000';

        const outputStr = translateMath(englishStr, 'ko');
        assert.equal(outputStr, translatedStr);
    });

    it('should not translate thousand separator for en locale', function() {
        const englishStr = '1{,}000{,}000 + 9{,}000';
        const outputStr = translateMath(englishStr, 'en');
        assert.equal(outputStr, englishStr);
    });

    it('should translate decimal point to decimal comma', function() {
        const englishStr = '1000.000 + 9.4 + 45.0';
        const translatedStr = '1000{,}000 + 9{,}4 + 45{,}0';

        MATH_RULES_LOCALES.DECIMAL_COMMA.forEach(function(locale) {
            const outputStr = translateMath(englishStr, locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate both thousand sep. and decimal point for cs locale',
    function() {
        const englishStr = '1{,}000{,}000.700 + 9{,}000.000';
        const translatedStr = '1\\,000\\,000{,}700 + 9\\,000{,}000';
        const outputStr = translateMath(englishStr, 'cs');
        assert.equal(outputStr, translatedStr);
    });

    it('should translate notation for multiplication', function() {
        MATH_RULES_LOCALES.TIMES_AS_CDOT.forEach(function(locale) {
            const englishStr = '2 \\times 2 = 4';
            const translatedStr = '2 \\cdot 2 = 4';
            const outputStr = translateMath(englishStr, locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate notation for division', function() {
        MATH_RULES_LOCALES.DIV_AS_COLON.forEach(function(locale) {
            const englishStr = '8 \\div 2 = 4';
            const translatedStr = '8 \\mathbin{:} 2 = 4';
            const outputStr = translateMath(englishStr, locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate different math notations simultaneously', function() {
        const englishStr = '8\\div 2=2 \\times 2, 1{,}000{,}000.874';
        const translatedStr = '8\\mathbin{:} 2=2 \\cdot 2, 1\\,000\\,000{,}874';
        const outputStr = translateMath(englishStr, 'cs');
        assert.equal(outputStr, translatedStr);
    });

    it('should translate notation for sinus for certain locales',
    function() {
        MATH_RULES_LOCALES.SIN_AS_SEN.forEach(function(locale) {
            const englishStr = '\\sin \\theta';
            const translatedStr = '\\operatorname{sen} \\theta';
            const outputStr = translateMath(englishStr, locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate western- to perso-arabic numerals', function() {
        MATH_RULES_LOCALES.PERSO_ARABIC_NUMERALS.forEach(function(locale) {
            const englishStr = '1234567890';
            const translatedStr = '۱۲۳۴۵۶۷۸۹۰';
            const outputStr = translateMath(englishStr, locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should use arabic decimal comma and no thousand separator for pashto',
    function() {
        const englishStr = '1{,}234{,}567.890';
        const translatedStr = '۱۲۳۴۵۶۷{،}۸۹۰';
        const outputStr = translateMath(englishStr, 'ps');
        assert.equal(outputStr, translatedStr);
    });

    it('should translate repeating decimal numbers', function() {
        const englishStr = '1.\\overline{3} + 9.\\overline{44}';
        let translatedStr = '1{,}\\overline{3} + 9{,}\\overline{44}';

        MATH_RULES_LOCALES.DECIMAL_COMMA.forEach(function(locale) {
            const outputStr = translateMath(englishStr, locale);
            assert.equal(outputStr, translatedStr);
        });

        translatedStr = '۱{،}\\overline{۳} + ۹{،}\\overline{۴۴}';
        MATH_RULES_LOCALES.ARABIC_COMMA.forEach(function(locale) {
            const outputStr = translateMath(englishStr, locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should translate decimals wrapped in color commands', function() {
        const englishStr =
           '\\blue{13}.\\tealE{3} \\tealE{9}.\\blue{4} \\redA{0}.\\red{33}';
        let translatedStr =
         '\\blue{13}{,}\\tealE{3} \\tealE{9}{,}\\blue{4} \\redA{0}{,}\\red{33}';

        MATH_RULES_LOCALES.DECIMAL_COMMA.forEach(function(locale) {
            const outputStr = translateMath(englishStr, locale);
            assert.equal(outputStr, translatedStr);
        });

        translatedStr =
         '\\blue{۱۳}{،}\\tealE{۳} \\tealE{۹}{،}\\blue{۴} \\redA{۰}{،}\\red{۳۳}';
        MATH_RULES_LOCALES.ARABIC_COMMA.forEach(function(locale) {
            const outputStr = translateMath(englishStr, locale);
            assert.equal(outputStr, translatedStr);
        });
    });

    it('should NOT translate decimals wrapped in any tex commands', function() {
        const englishStr = '\\hat{1}.\\tealE{3} \\tealE{9}.\\hat{4}';
        let translatedStr = englishStr;

        MATH_RULES_LOCALES.DECIMAL_COMMA.forEach(function(locale) {
            const outputStr = translateMath(englishStr, locale);
            assert.equal(outputStr, translatedStr);
        });

        translatedStr = '\\hat{۱}.\\tealE{۳} \\tealE{۹}.\\hat{۴}';
        MATH_RULES_LOCALES.ARABIC_COMMA.forEach(function(locale) {
            const outputStr = translateMath(englishStr, locale);
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
});

