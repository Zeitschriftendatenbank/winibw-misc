// Define Array.isArray and Array.prototype.indexOf
if(typeof Array.isArray!=='function'){Array.isArray=function(e){return"[object Array]"===Object.prototype.toString.call(e)};}if(!Array.prototype.indexOf){Array.prototype.indexOf=function(e,r){var t;if(null==this)throw new TypeError('"this" is null or not defined');var n=Object(this),o=n.length>>>0;if(0===o)return-1;var i=0|r;if(i>=o)return-1;for(t=Math.max(i>=0?i:o-Math.abs(i),0);t<o;){if(t in n&&n[t]===e)return t;t++;}return-1;};}

var MISC = {
    _format: null
};
var Notify;

/**
 * Gets or sets the current record format
 * @param {string} f - Format to set (optional). If not provided, retrieves current format
 * @return {string} Current format in uppercase
 */
MISC.format = function (f) {
    if (typeof f === 'undefined' || f === null) {
        if (this._format) return this._format;
        var v = activeWindow.getVariable('P3GPR');
        if (v) {
            v = v.toUpperCase();
        } else {
            v = activeWindow.getVariable('P3GDB');
            if (v) v = v.toUpperCase();
        }
        this._format = v;
        return this._format;
    }
    MISC.wait('s ' + f, false);
    this._format = f.toUpperCase();
    return this._format;
}


/**
 * Replaces HTML escaped chars to unescaped
 * @param {string} text with html escaped chars
 * @return {string} text with unescaped chars
 */
MISC.unescapeHtml = function (text) {
    if (!text) return text;
    var map = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'",
        '&nbsp;': " "
    };

    function codePointToString(code) {
        if (String.fromCodePoint) return String.fromCodePoint(code);
        // fallback for environments without fromCodePoint
        if (code <= 0xFFFF) return String.fromCharCode(code);
        // surrogate pair
        code -= 0x10000;
        var high = 0xD800 + (code >> 10);
        var low = 0xDC00 + (code & 0x3FF);
        return String.fromCharCode(high, low);
    }

    // Replace named entities we know
    text = text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&nbsp;/g, function (m) { return map[m]; });

    // Replace decimal numeric entities: &#1234;
    text = text.replace(/&#(\d+);/g, function (_, n) {
        var code = parseInt(n, 10);
        return isNaN(code) ? '' : codePointToString(code);
    });

    // Replace hex numeric entities: &#x1F60A; (case-insensitive)
    text = text.replace(/&#x([0-9a-fA-F]+);/g, function (_, h) {
        var code = parseInt(h, 16);
        return isNaN(code) ? '' : codePointToString(code);
    });

    return text;
}


/**
* Checks weather screen variable is one of options
* pops up alert with message if not
*
* @param {array} options possible screen variables
* @param {string} header of popup
* @param {string} message optional
* @return {string}|{bool} screen variable or false
*/
MISC.checkScreen = function (options, header, message) {
    var map = {
        '8A': 'Vollanzeige',
        '7A': 'Trefferliste',
        'MT': 'Editiermodus',
        'IT': 'Titelneuaufnahme',
        'IE': 'Exemplarneuaufnahme',
        '00': 'Loginmaske',
        'GN': 'Setansicht',
        'SC': 'Indexansicht',
        'FI': 'Datenbankinfo',
        'FS': 'Bestandsauswahl',
        'MI': 'Norm-Korrekturmodus'
    };
    var strScreen = activeWindow.getVariable('scr');
    if(!strScreen) {
        strScreen = 'XX'; // assume login screen if scr is empty
    }
    var opt = options.join('#');
    if (opt.indexOf(strScreen) < 0) {
        var arr = [];
        for (var e in map) {
            if (!map.hasOwnProperty(e)) { continue; }
            if (opt.indexOf(e) > -1) arr.push(map[e]);
        }
        var list = arr.join(', ');
        if (typeof header !== 'undefined') {
            message = message || 'Die Funktion kann nur aus ' + list + ' aufgerufen werden.';
            Notify.error(message);
        }
        return false;
    }
    return strScreen;
}


/**
 * Executes a command that starts an asynchronous process and waits until
 * the process appears to have changed the window/context.
 *
 * Strategy: build a snapshot string from a set of variables (P3GPP, scr,
 * P3GPR, P3GSE, P3GUK, plus optional extra variables and windowID) and
 * optionally messages/status. Poll until the snapshot changes or timeout.
 *
 * @param {string} cmd - command string to send to the active window (e.g. "\\do-something")
 * @param {boolean} newWindow - whether to open the command in a new window (optional, default false)
 * @param {object} options - optional parameters:
 *    timeout (ms, default 30000),
 *    pollInterval (ms, default 200),
 *    useMessages (bool, default true),
 *    extraVars (array of variable names to include in snapshot)
 * @return {boolean} true if snapshot changed before timeout, false otherwise
 */
MISC.wait = function (cmd, newWindow, options) {
    options = options || {};
    var timeout = (options.timeout !== undefined) ? options.timeout : 30000;
    var pollInterval = (options.pollInterval !== undefined) ? options.pollInterval : 200;
    var useMessages = (options.useMessages !== undefined) ? options.useMessages : true;
    var extraVars = Array.isArray(options.extraVars) ? options.extraVars : [];

    var aw = activeWindow;
    var windowID = '';
    try { windowID = (aw.windowID || ''); } catch (e) { windowID = ''; }

    function snapshot() {
        var parts = [];
        parts.push(aw.getVariable('P3GPP'));
        parts.push(aw.getVariable('scr'));
        parts.push(aw.getVariable('P3GPR'));
        parts.push(aw.getVariable('P3GSE'));
        parts.push(aw.getVariable('P3GUK'));
        for (var i = 0; i < extraVars.length; i++) parts.push(aw.getVariable(extraVars[i]));
        parts.push(windowID);
        try {
            var msgs = utility.messages();
            parts.push(String(msgs.count));
            if (msgs.count > 0) {
                var lastMsg = msgs.item(msgs.count - 1);
                parts.push(String(lastMsg.text || ''));
            }
        } catch (e) {}
        try { parts.push((aw.status || '')); } catch (e) {}
        try { parts.push(String(aw.getLastCommand())); } catch (e) {}
        return parts.join('|');
    }

    var before = snapshot();
    try {
        var useNewWindow = !!newWindow;
        aw.command(cmd, useNewWindow);
    } catch (e) {
        return false;
    }

    var start = (new Date()).getTime();
    while (true) {
        var now = (new Date()).getTime();
        if (now - start > timeout) return false;
        var after = snapshot();
        if (after !== before) return true;
        // WinIBW does not provide WScript; use a short busy-wait instead
        var t0 = (new Date()).getTime();
        while ((new Date()).getTime() - t0 < pollInterval) {}
    }
};


