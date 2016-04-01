// constants

// // initial consonants
// var initc = [
//     'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ',
//     'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
// ];

// // vowels
// var vowel = [
//     'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ',
//     'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ',
//     'ㅡ', 'ㅢ', 'ㅣ',
// ];

// // final consonants
// var finalc = [
//     ' ', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ',
//     'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ',
//     'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
// ];

// stroke counts of final consonants
var finalc_stro = [
    0, 2, 4, 4, 2, 5, 5, 3,
    5, 7, 9, 9, 7, 9, 9, 8, 4, 4, 6, 2, 4,
    1, 3, 4, 3, 4, 4, 3,
];

// required storage item counts for each commands (initc)
var required_elem = [0, 0, 2, 2, 2, 2, 1, 0, 1, 0, 1, 0, 2, 0, 1, 0, 2, 2, 0];

// variables
var codeSpace = null;
var storages = []; // Array(28)
var storageIndex = 0;

var x = 0;
var y = 0;
var z = 0;
var dx = 0;
var dy = 0;
var dz = 0;
var timer = null;
// var debug = true;
var paused = true;
var halted = true;
var inputBuffer = '';

// functions

// disassembles a Hangul character into parts
function haechae(c) {
    if (c < 0xAC00 || c > 0xD7A3) {
        return null;
    }
    c -= 0xAC00;
    return [Math.floor(c / 588), Math.floor(c / 28) % 21, c % 28];
}

function push(i, n) {
    switch (i) {
    case 27: // ㅎ
        // storages[i].push(0); //s Fake value
        break;
    default:
        storages[i].push(n);
        break;
    }
}

function pop(i) {
    switch (i) {
    case 21: // ㅇ
        return storages[i].shift();
    case 27: // ㅎ
        return 0; // Fake value
    default:
        return storages[i].pop();
    }
}

function swap(i) {
    var a;
    var b;
    switch (i) {
    case 21: // ㅇ
        a = storages[21][0];
        storages[21][0] = storages[21][1];
        storages[21][1] = a;
        break;
    case 27: // ㅎ
        break;
    default:
        a = pop(i);
        b = pop(i);
        push(i, a);
        push(i, b);
        break;
    }
}

function duplicate(i) {
    switch (i) {
    case 21: // ㅇ
        storages[21].unshift(storages[21][0]);
        break;
    case 27: // ㅎ
        break;
    default:
        storages[i].push(storages[i][storages[i].length - 1]);
        break;
    }
}

function outputNumber(n) {
    document.forms[0].output.value += String(n);
}

function outputChar(n) {
    document.forms[0].output.value += String.fromCharCode(n);
}

function inputNumber() {
    for (;;) {
        var inp = prompt(msg_input_number);
        if (inp != null) {
            if (inp === '!!!') {
                return null;
            }
            var res = parseInt(inp, 10);
            if (res === res) {
                return res;
            }
        }
    }
}

function inputChar() {
    if (!inputBuffer) {
        var inp = prompt(msg_input_character);
        if (inp == null) {
            return null;
        }
        inputBuffer += inp;
    }
    if (inputBuffer) {
        var res = inputBuffer.charCodeAt(0);
        inputBuffer = inputBuffer.substring(1);
        return res;
    }
    return -1;
}

function writeDebugInfo() {
    if (!document.forms[0].debug.checked) {
        return;
    }
    var cursorStateLines = [];
    cursorStateLines.push(msg_coordinate + '(' + [x, y, z].join(', ') + ')');
    cursorStateLines.push(msg_character + codeSpace[z][y].charAt(x));
    var cursorState = cursorStateLines.join('\n');
    var storageStateLines = [];
    for (var i = 0; i < 28; ++i) {
        var line = String.fromCharCode(0xC544 + i) + ': ' + storages[i];
        if (i === storageIndex) {
            line = '>' + line;
        }
        storageStateLines.push(line);
    }
    var storageState = storageStateLines.join('\n');
    document.forms[0].dumps_cursor.value = cursorState;
    document.forms[0].dumps_storage.value = storageState;
}

// clear debug info
function clearDebugInfo() {
    document.forms[0].dumps_cursor.value = '';
    document.forms[0].dumps_storage.value = '';
}

function terminate() {
    paused = true;
    halted = true;

    // Stop running code
    if (timer != null) {
        clearTimeout(timer);
        timer = null;
    }

    // Flush input buffer
    inputBuffer = '';

    // Reset cursor
    x = 0;
    y = 0;
    z = 0;
    dx = 0;
    dy = 1;
    dz = 0;

    // Unload code
    codeSpace = null;

    // Reset storage index
    storageIndex = 0;
    // Reset storages
    for (var i = 0; i < 28; ++i) {
        storages[i] = [];
    }

    document.forms[0].aaheui.disabled = false; // Make code editable
    document.all.btn_run.value = txt_run; // Return the label to its original state.
    document.all.status.innerHTML = txt_stopped; // Change status message.
}

function pause() {
    paused = true;
    if (timer != null) {
        clearTimeout(timer);
        timer = null;
    }

    document.all.btn_run.value = txt_continue;

    if (codeSpace != null) {
        document.all.status.innerHTML = txt_loaded;
    }
}

function clearAll() {
    document.forms[0].output.value = '';
    clearDebugInfo();
}

function init() {
    terminate();
    clearAll();
    halted = false;
}

function moveCursor() {
    x += dx;
    y += dy;
    z += dz;

    // TODO: Implement correct algorithm
    if (dz !== 0) {
        if (z < 0) {
            z = codeSpace.length - 1;
        } else if (z >= codeSpace.length) {
            z = 0;
        }
    } else if (dy !== 0) {
        if (y < 0) {
            y = codeSpace[z].length - 1;
        } else if (y >= codeSpace[z].length) {
            y = 0;
        }
    } else if (dx !== 0) {
        if (x < 0) {
            x = codeSpace[z][y].length - 1;
        } else if (x >= codeSpace[z][y].length) {
            x = 0;
        }
    }
}

function updateCursorVelocity(vowelCode, reverseDirection) {
    var ndx = dx;
    var ndy = dy;
    var ndz = dz;
    switch (vowelCode) {
    case 0: // ㅏ
        ndx = 1;
        ndy = 0;
        ndz = 0;
        break;
    case 1: // ㅐ
        ndx = 0;
        ndy = 0;
        ndz = 1;
        break;
    case 3: // ㅒ
        ndx = 0;
        ndy = 0;
        ndz = 2;
        break;
    case 2: // ㅑ
        ndx = 2;
        ndy = 0;
        ndz = 0;
        break;
    case 4: // ㅓ
        ndx = -1;
        ndy = 0;
        ndz = 0;
        break;
    case 5: // ㅔ
        ndx = 0;
        ndy = 0;
        ndz = -1;
        break;
    case 6: // ㅕ
        ndx = -2;
        ndy = 0;
        ndz = 0;
        break;
    case 7: // ㅖ
        ndx = 0;
        ndy = 0;
        ndz = -2;
        break;
    case 8: // ㅗ
        ndx = 0;
        ndy = -1;
        ndz = 0;
        break;
    case 12: // ㅛ
        ndx = 0;
        ndy = -2;
        ndz = 0;
        break;
    case 13: // ㅜ
        ndx = 0;
        ndy = 1;
        ndz = 0;
        break;
    case 17: // ㅠ
        ndx = 0;
        ndy = 2;
        ndz = 0;
        break;

    case 18: // ㅡ
        ndy = -ndy;
        ndz = -ndz;
        break;
    case 19: // ㅢ
        ndx = -ndx;
        ndy = -ndy;
        break;
    case 20: // ㅣ
        ndx = -ndx;
        ndz = -ndz;
        break;

    /*
    case 9: // ㅘ
    case 10: // ㅙ
    case 11: // ㅚ
    case 14: // ㅝ
    case 15: // ㅞ
    case 16: // ㅟ
    */

    default:
        break;
    }

    if (reverseDirection) {
        ndx = -ndx;
        ndy = -ndy;
        ndz = -ndz;
    }
    dx = ndx;
    dy = ndy;
    dz = ndz;
}

function loadCodeSpace() {
    var source = document.forms[0].aaheui.value;
    var planes = source.split(/(?:^)ㅡ+(?:\n|$)/m);
    codeSpace = [];
    for (var i = 0; i < planes.length; ++i) {
        var plane = planes[i].split('\n');
        while (plane.length && !plane[plane.length - 1]) {
            plane.pop();
        }
        codeSpace.push(plane);
    }
}

function getCommand() {
    if (y >= codeSpace[z].length) {
        return undefined;
    }
    if (x >= codeSpace[z][y].length) {
        return undefined;
    }
    var c = codeSpace[z][y].charCodeAt(x);
    var ch = haechae(c);
    return ch;
}

// step; once means whether it executes a single step
function runCode(once) {
    document.forms[0].aaheui.disabled = true;
    if (halted) {
        init();
    }
    if (!once) {
        document.all.btn_run.value = txt_pause;
        paused = false;
        if (timer != null) {
            clearTimeout(timer);
            timer = null;
        }
        document.all.status.innerHTML = txt_running;
    } else {
        if (!paused) {
            pause();
        }
        document.all.status.innerHTML = txt_loaded;
    }

    if (codeSpace == null) { // Load code now
        clearAll();
        loadCodeSpace();
    }

    var k = once ? 1 : 100;
    var pauseExec = false;
    var stopExec = false;
    for (; k > 0 && !pauseExec && !stopExec; --k) {
        var ch = getCommand();
        if (ch == null) {
            moveCursor();
            continue;
        }

        var a;
        var b;
        var inp;
        var reverseDirection = false;
        if (storages[storageIndex].length < required_elem[ch[0]]) {
            reverseDirection = true;
        } else {
            switch (ch[0]) {
            case 2: // ㄴ
                a = pop(storageIndex);
                b = pop(storageIndex);
                push(storageIndex, b / a);
                break;
            case 3: // ㄷ
                a = pop(storageIndex);
                b = pop(storageIndex);
                push(storageIndex, b + a);
                break;
            case 4: // ㄸ
                a = pop(storageIndex);
                b = pop(storageIndex);
                push(storageIndex, b * a);
                break;
            case 5: // ㄹ
                a = pop(storageIndex);
                b = pop(storageIndex);
                push(storageIndex, b % a);
                break;
            case 6: // ㅁ
                a = pop(storageIndex);
                switch (ch[2]) {
                case 21: // ㅇ
                    outputNumber(a);
                    break;
                case 27: // ㅎ
                    outputChar(a);
                    break;
                default:
                    break;
                }
                break;
            case 7: // ㅂ
                switch (ch[2]) {
                case 21: // ㅇ
                    writeDebugInfo();
                    inp = inputNumber();
                    if (inp == null) {
                        pauseExec = true;
                    } else {
                        push(storageIndex, inp);
                    }
                    break;
                case 27: // ㅎ
                    writeDebugInfo();
                    inp = inputChar();
                    if (inp == null) {
                        pauseExec = true;
                    } else {
                        push(storageIndex, inp);
                    }
                    break;
                default:
                    push(storageIndex, finalc_stro[ch[2]]);
                    break;
                }
                break;
            case 8: // ㅃ
                duplicate(storageIndex);
                break;
            case 9: // ㅅ
                storageIndex = ch[2];
                break;
            case 10: // ㅆ
                push(ch[2], pop(storageIndex));
                break;
            case 12: // ㅈ
                a = pop(storageIndex);
                b = pop(storageIndex);
                push(storageIndex, b >= a ? 1 : 0);
                break;
            case 14: // ㅊ
                if (pop(storageIndex) === 0) {
                    reverseDirection = true;
                }
                break;
            case 16: // ㅌ
                a = pop(storageIndex);
                b = pop(storageIndex);
                push(storageIndex, b - a);
                break;
            case 17: // ㅍ
                swap(storageIndex);
                break;
            case 18: // ㅎ
                stopExec = true;
                break;

            // case 0: // ㄱ
            // case 1: // ㄲ
            // case 11: // ㅇ
            // case 13: // ㅉ
            // case 15: // ㅋ

            default:
                break;
            }
        }

        writeDebugInfo();
        if (!pauseExec && !stopExec) {
            updateCursorVelocity(ch[1], reverseDirection);
            moveCursor();
        }
    }

    if (stopExec) {
        terminate();
    } else if (pauseExec) {
        pause();
    } else if (!once) {
        timer = setTimeout(runCode, 0);
    }
}
