TestRunner.add("misc_format_get", function() {
	// request running under Lesekennung if needed
	if (!TestRunner.runWithKennung('6098', '\\ZOE tit cinema', 'misc_format_get')) return;
	MISC._format = null;
	var globalP3GPR = activeWindow.getVariable('P3GPR');
	var res = MISC.format();
	TestRunner.assertEqual(res.toUpperCase(), globalP3GPR.toUpperCase(), 'format sollte den gleichen Wert wie P3GPR haben');
});

TestRunner.add("misc_format_set", function() {
	if (!TestRunner.runWithKennung('6098', '\\ZOE tit cinema', 'misc_format_set')) return;
	MISC._format = null;
	MISC.format('P');
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

