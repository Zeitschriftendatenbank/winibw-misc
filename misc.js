// Define Array.isArray and Array.prototype.indexOf
if (typeof Array.isArray !== 'function') { Array.isArray = function (e) { return "[object Array]" === Object.prototype.toString.call(e) }; } if (!Array.prototype.indexOf) { Array.prototype.indexOf = function (e, r) { var t; if (null == this) throw new TypeError('"this" is null or not defined'); var n = Object(this), o = n.length >>> 0; if (0 === o) return -1; var i = 0 | r; if (i >= o) return -1; for (t = Math.max(i >= 0 ? i : o - Math.abs(i), 0); t < o;) { if (t in n && n[t] === e) return t; t++; } return -1; }; }

// ES3-safe helper: add Array.prototype.unique if not present
if (!Array.prototype.unique) {
    Array.prototype.unique = function () {
        var r = [];
        o: for (var i = 0, n = this.length; i < n; i++) {
            for (var x = 0, y = r.length; x < y; x++) {
                if (r[x] == this[i]) continue o;
            }
            r[r.length] = this[i];
        }
        return r;
    };
}

var MISC = {};
var Notify;

/**
 * Gets or sets the current record format
 * @param {string} f - Format to set (optional). If not provided, retrieves current format
 * @return {string} Current format in uppercase
 */
MISC.format = function (f) {
    if (typeof f === 'string' && f !== '') {
        f = f.toUpperCase();
        if (-1 !== 'P|D|PA|DA'.indexOf(f)) {
            if (activeWindow.getVariable('P3GPR') === f) {
                return f;
            } else {
                activeWindow.setVariable('P3GPR', f);
                //MISC.wait('\\TOO ' + f);
                activeWindow.command('\\TOO ' + f);
                //MISC.wait('\\TOO ' + f);
                //alert('Format changed to ' + f + ', current P3GPR=' + activeWindow.getVariable('P3GPR'));
                return true;
            }
        } else {
            Notify.error('MISC.format: invalid format "' + f + '"');
        }
    } else {
        return activeWindow.getVariable('P3GPR').toUpperCase();
    }
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
        'MI': 'Norm-Korrekturmodus',
        'Z3': 'Suchschirm',
        'HK': 'Hilfe',
        'XX': 'Unbekannte Maske'
    };
    var strScreen = activeWindow.variable('scr') || activeWindow.getVariable('scr') || '';
    //alert('checkScreen: strScreen=' + strScreen + ', options=' + (options ? options.join(', ') : 'none'));
    if ('' == strScreen) {
        strScreen = 'XX'; // z.B. vor dem LogIn
    }
    if (typeof options === 'undefined' || options === null) {
        return strScreen;
    } else if (!Array.isArray(options)) {
        return (map[options]) ? map[options] : false;
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
            message = message || 'Die Funktion kann nur aus ' + list + ' aufgerufen werden. Aktueller Screen: ' + strScreen + ' (' + (map[strScreen] || 'Unbekannte Maske') + ')';
            Notify.popup(message, 'checkScreen', 'error');
        }
        return false;
    }
    return strScreen;
}



/**
 * Display an object's own properties to the user in an ES3-safe way.
 *
 * This function enumerates an object's own properties and presents them
 * to the user via the application's `utility.newPrompter()`. If the user selects a property
 * whose value is itself an object, the function recurses to show that
 * object's properties.
 *
 * Notes:
 * - Designed to be compatible with the Microsoft JScript/WinIBW script
 *   environment (ES3). Avoids modern features and uses `Object.prototype`
 *   checks when enumerating properties.
 * - Safe against missing host APIs: will fallback to `Notify` if `utility`
 *   is not present, and will catch and report errors when reading values.
 *
 * Usage examples:
 *  - `MISC.zeigeEigenschaften(activeWindow)` — list properties of the active window
 *  - `MISC.zeigeEigenschaften(someObject)` — inspect any object
 *
 * @param {object} object - The object to inspect. If not an object, the
 *   function shows an error and returns false.
 * @return {void|boolean} Returns false when called with a non-object,
 *   otherwise nothing (presentation is interactive).
 */
MISC.zeigeEigenschaften = function (object) {
    var Namen = [];
    var namen = "";
    var name;

    function _showMessage(title, msg) {
        try {
            if (typeof application !== 'undefined' && typeof application.messageBox === 'function') {
                application.messageBox(title || '', msg || '', '');
                return;
            }
        } catch (e) { }
        try {
            var p = utility.newPrompter();
            if (p && typeof p.alert === 'function') { p.alert(title || '', msg || ''); return; }
        } catch (e) { }
        try { if (typeof Notify !== 'undefined' && Notify && typeof Notify.info === 'function') { Notify.info(title || '', msg || '', false); return; } } catch (e) { }
        activeWindow.appendMessage((title ? title + ': ' : '') + msg, 3);
    }

    if (typeof object !== 'object' || object === null) {
        _showMessage('zeigeEigenschaften', 'Kein Objekt übergeben.');
        return false;
    }

    // build property list (ES3 compatible)
    for (name in object) {
        if (Object.prototype.hasOwnProperty && !Object.prototype.hasOwnProperty.call(object, name)) continue;
        Namen.push(name);
    }

    if (Namen.length == 0) {
        _showMessage('Länge des Objekts', 'Das Objekt hat ' + Namen.length + ' Eigenschaften.');
        return false;
    }

    Namen.sort();
    namen = Namen.join('\n');

    var thePrompter = utility.newPrompter();
    try { thePrompter.setDebug(false); } catch (ex) { }
    var theAnswer = thePrompter.select('Eigenschaften von ' + (typeof object), 'Zeige Eigenschaften von', namen);
    if (!theAnswer) return;

    var propName = theAnswer.split(' (')[0];
    var selected = object[propName];
    var type = typeof selected;
    _showMessage('Typ des Objekts', type);

    if (type === 'object' && selected !== null) {
        // recurse into object
        MISC.zeigeEigenschaften(selected);
        return;
    }

    try {
        if (type === 'function') {
            // show function source and offer to inspect
            _showMessage('Eigenschaften', String(selected.toString()) + '\nWeitere Eigenschaften anzeigen?');
            try { MISC.zeigeEigenschaften(selected); } catch (e) { }
            return;
        } else {
            // final primitive/string value: show it
            _showMessage('Eigenschaften', String(selected));
            return;
        }
    } catch (e) {
        _showMessage('Fehler', String(e));
        return;
    }
}


/**
 * Removes all elements from the first array (`a1`) that are present in the second array (`a2`).
 * Modifies the original `a1` array and returns it.
 *
 * @param {Array} a1 - The array to remove elements from.
 * @param {Array} a2 - The array containing elements to remove from `a1`.
 * @returns {Array} The modified `a1` array with elements removed.
 */
MISC.arrayDiff = function (a1, a2) {
    for (var i = 0; i < a2.length; i++) {
        // iterate a1 backwards so splicing doesn't skip subsequent elements
        for (var y = a1.length - 1; y >= 0; y--) {
            if (a2[i] === a1[y]) {
                a1.splice(y, 1);
            }
        }
    }
    return a1;
}

/**
 * @param {Array} x - The first array to compare.
 * @param {Array} y - The second array to compare.
 * @returns {boolean} True if the arrays are equal, false otherwise.
 */
MISC.arrayEqual = function (x, y) {
    if (!x || !y) return false;
    if (x.length !== y.length) return false;
    for (var i = 0; i < x.length; i++) {
        if (x[i] !== y[i]) return false;
    }
    return true;
}

/**
 * Returns a new array containing only the unique elements from the input array.
 * Preserves the order of the first occurrence of each element.
 *
 * @param {Array} arr - The array to filter for unique values.
 * @returns {Array} A new array with duplicate values removed.
 */
MISC.arrayUnique = function (arr) {
    return arr.unique();
}


/**
 * Extracts and processes the expansion data from the 'P3VTX' variable in the active application window.
 * The function performs a series of string replacements and cleanups to format the data.
 *
 * @param {string} [p3vtx] - Optional string input to process. If not provided, the function retrieves the 'P3VTX' variable from the active window.
 * @returns {string} The processed and unescaped expansion data.
 */
MISC.getExpansionFromP3VTX = function (p3vtx) {
    var satz = p3vtx || activeWindow.getVariable('P3VTX')
        .replace('<ISBD><TABLE>', '')
        .replace('<\/TABLE>', '')
        .replace(/<BR>/g, "\n")
        .replace(/^$/gm, '')
        .replace(/^Eingabe:.*$/gm, '')
        .replace(/^Mailbox:.*$/gm, '')
        .replace(/<a[^<]*>/g, '')
        .replace(/<\/a>/g, '')
        .replace(/\r/g, "\n")
        .replace(/\u001b./g, ''); // replace /n (Zeilenumbruch) entfernt,
    // weil hier die $8 Expansion durch Zeilenbruch abgetrennt wurde
    return MISC.unescapeHtml(satz);
}

// ES3-safe helper: add String.prototype.trim if not present
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}