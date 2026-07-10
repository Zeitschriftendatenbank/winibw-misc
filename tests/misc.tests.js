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