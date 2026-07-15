var TestRunner, MISC, Notify;

TestRunner.add("misc_format_get", function() {
	// request running under Lesekennung if needed
	if (!TestRunner.runWithKennung('6098', '\\ZOE tit cinema', 'misc_format_get')) return;
	MISC._format = null;
	var globalP3GPR = activeWindow.getVariable('P3GPR');
	var res = MISC.format();
	TestRunner.assertEqual(res.toUpperCase(), globalP3GPR.toUpperCase(), 'format sollte den gleichen Wert wie P3GPR haben');
});

/**
 * This test might fail because its call a asynchronous command to set the format, and the test might continue before the command is finished.
 */
TestRunner.add("misc_format_set", function() {
	if (!TestRunner.runWithKennung('6098', '\\ZOE tit cinema', 'misc_format_set')) return;
	MISC._format = null;
	MISC.format('P');
	Notify.info('MISC.format set to P');
	var globalP3GPR = activeWindow.getVariable('P3GPR');
	TestRunner.assertEqual(globalP3GPR.toUpperCase(), MISC.format().toUpperCase(), 'P3GPR sollte den gleichen Wert wie format haben');
	MISC.format('D');
});

TestRunner.add("misc_unescapeHtml_named", function() {
	var s = MISC.unescapeHtml("&amp;&lt;&gt;&quot;&#039;&nbsp;");
	TestRunner.assert(s == "&<>\"' ", "MISC.unescapeHtml named entities mismatch");
});

TestRunner.add("misc_unescapeHtml_numeric", function() {
	// basic ASCII via decimal and hex
	TestRunner.assert(MISC.unescapeHtml("&#65;") == "A", "decimal numeric entity failed");
	TestRunner.assert(MISC.unescapeHtml("&#x41;") == "A", "hex numeric entity failed");

	// high codepoint (emoji) - ensure surrogate pair or correct codepoint produced
	var smile = MISC.unescapeHtml("&#x1F60A;");
	var ok = false;
	if (smile) {
		if (typeof smile.codePointAt === 'function') {
			ok = (smile.codePointAt(0) === 0x1F60A);
		} else {
			ok = (smile.length >= 2);
		}
	}
	TestRunner.assert(ok, "high codepoint numeric entity failed");
});

TestRunner.add("misc_checkScreen_positive", function() {
	if (!TestRunner.runWithKennung('6098', '\\ZOE tit cinema', 'misc_checkScreen_positive')) return;
	var res = MISC.checkScreen(['8A','7A','MT']);
	TestRunner.assert(res !== false, 'MISC.checkScreen should return screen code when it matches options');
});

TestRunner.add("misc_checkScreen_negative", function() {
	if (!TestRunner.runWithKennung('6098', '\\ZOE tit cinema', 'misc_checkScreen_negative')) return;
	var res = MISC.checkScreen(['00'], 'misc_checkScreen_negative', 'should only run on login screen');
	TestRunner.assert(res === false, 'MISC.checkScreen should return false for non-matching screens');
});

/**
 * Simple test wrapper to demonstrate usage. Adjust the command and options
 * when calling in real scripts.
 */
TestRunner.add("misc_wait", function() {
    var cmd = '\\ZOE tit cine*'; // replace with real command
    var ok = MISC.wait(cmd, { timeout: 60000, pollInterval: 250 });
    try {
        if (ok) application.activeWindow.appendMessage('misc.wait: finished', 3);
        else application.activeWindow.appendMessage('misc.wait: timeout/failure', 1);
    } catch (e) {}
    return ok;
});

// Test for MISC.arrayDiff: removes elements of a2 from a1 in-place
TestRunner.add("misc_arrayDiff", function() {
	var a1 = [1,2,3,4];
	MISC.arrayDiff(a1, [2,4]);
	TestRunner.assert(MISC.arrayEqual(a1, [1,3]), 'arrayDiff should remove matching elements');

	var a2 = [1,2,2,3,2];
	MISC.arrayDiff(a2, [2]);
	TestRunner.assert(MISC.arrayEqual(a2, [1,3]), 'arrayDiff should remove all duplicates of value');

	var a3 = ['a','b','c'];
	MISC.arrayDiff(a3, ['x','y']);
	TestRunner.assert(MISC.arrayEqual(a3, ['a','b','c']), 'arrayDiff should leave array unchanged when no matches');

	var a4 = [5,5,5];
	MISC.arrayDiff(a4, [5]);
	TestRunner.assert(MISC.arrayEqual(a4, []), 'arrayDiff should remove all matching elements');
});

// Test for MISC.arrayEqual: equality checks
TestRunner.add("misc_arrayEqual", function() {
	TestRunner.assert(MISC.arrayEqual([1,2,3], [1,2,3]), 'arrayEqual should return true for identical arrays');
	TestRunner.assert(!MISC.arrayEqual([1,2], [1,2,3]), 'arrayEqual should return false for different lengths');
	TestRunner.assert(!MISC.arrayEqual([1,2,3], [3,2,1]), 'arrayEqual should consider order');
	TestRunner.assert(!MISC.arrayEqual(null, [1]), 'arrayEqual should return false when first arg is null');
	TestRunner.assert(!MISC.arrayEqual([1], null), 'arrayEqual should return false when second arg is null');
	return true;
});

// Test for MISC.arrayUnique: returns new array with first-occurrence unique values
TestRunner.add("misc_arrayUnique", function() {
	var u1 = MISC.arrayUnique([1,2,2,3,1]);
	TestRunner.assert(MISC.arrayEqual(u1, [1,2,3]), 'arrayUnique should return [1,2,3] for [1,2,2,3,1]');

	var u2 = MISC.arrayUnique(['a','b','a','c']);
	TestRunner.assert(MISC.arrayEqual(u2, ['a','b','c']), 'arrayUnique should preserve first-occurrence order for strings');

	var u3 = MISC.arrayUnique([]);
	TestRunner.assert(MISC.arrayEqual(u3, []), 'arrayUnique should return [] for empty input');

	var u4 = MISC.arrayUnique([5,5,5]);
	TestRunner.assert(MISC.arrayEqual(u4, [5]), 'arrayUnique should collapse duplicates to single element');
	return true;
});

