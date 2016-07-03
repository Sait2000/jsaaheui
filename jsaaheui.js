// constants

// var initialConsonants = [
//     'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ',
//     'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
// ];

// var vowels = [
//     'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ',
//     'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ',
//     'ㅡ', 'ㅢ', 'ㅣ',
// ];

// var finalConsonants = [
//     ' ', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ',
//     'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ',
//     'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
// ];

// stroke counts of final consonants
var finalcStroke = [
    0, 2, 4, 4, 2, 5, 5, 3,
    5, 7, 9, 9, 7, 9, 9, 8, 4, 4, 6, 2, 4,
    1, 3, 4, 3, 4, 4, 3,
];

// required storage item counts for each command (initial consonant)
var requiredElem = [0, 0, 2, 2, 2, 2, 1, 0, 1, 0, 1, 0, 2, 0, 1, 0, 2, 2, 0];

// variables
var storages = [];
var storageIndex = 0;

var inputBuffer = '';

var cursor = null;

var timer = null;
// var debug = true;
var paused = true;
var stopped = true;

// functions

// storage start
function initStorage() {
    // Reset storage index
    storageIndex = 0;
    // Reset storages
    for (var i = 0; i < 28; ++i) {
        storages[i] = [];
    }
}

function push(i, n) {
    switch (i) {
    case 27: // ㅎ
        break;
    default:
        storages[i].push(n);
        break;
    }
}

function pop(i) {
    switch (i) {
    case 21: // ㅇ
        return storages[21].shift();
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

function generateStorageDebugInfo() {
    var lines = [];
    for (var i = 0; i < 28; ++i) {
        var line = String.fromCharCode(0xC544 + i) + ': ' + storages[i];
        if (i === storageIndex) {
            line = '>' + line;
        }
        lines.push(line);
    }
    return lines.join('\n');
}
// storage end

// io start
function outputNumber(n) {
    document.getElementById('output').value += String(n);
}

function outputChar(n) {
    document.getElementById('output').value += String.fromCharCode(n);
}

function inputNumber() {
    for (;;) {
        var inp = prompt(msg_input_number);
        if (inp != null) {
            if (inp === '!!!') {
                return null;
            }
            var res = parseInt(inp, 10);
            if (res === res) { // !Number.isNaN(res) // i.e. valid integer
                return res;
            }
        }
    }
}

function inputChar() {
    if (inputBuffer === '') {
        var inp = prompt(msg_input_character);
        if (inp == null) {
            return null;
        }
        inputBuffer += inp;
    }
    if (inputBuffer !== '') {
        var res = inputBuffer.charCodeAt(0);
        inputBuffer = inputBuffer.substring(1);
        return res;
    }
    return -1; // TODO: reverse direction
}
// io end

// parse
function parseCodeSpace(source) {
    var planes = source.split(/(?:^)ㅡ+(?:\n|$)/m);
    var space = [];
    for (var i = 0; i < planes.length; ++i) {
        var plane = planes[i].split('\n');
        while (plane.length && !plane[plane.length - 1]) {
            plane.pop();
        }
        space.push(plane);
    }
    while (space.length && space[space.length - 1].length === 0) {
        space.pop();
    }
    return space;
}

// cursor start
function Cursor(codeSpace) {
    this.codeSpace = codeSpace;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.dx = 0;
    this.dy = 1;
    this.dz = 0;
    this.updateVelocity();
}

Cursor.prototype.move = function (backward) {
    var codeSpace = this.codeSpace;
    var dx = this.dx;
    var dy = this.dy;
    var dz = this.dz;
    if (backward) {
        this.dx = dx = -dx;
        this.dy = dy = -dy;
        this.dz = dz = -dz;
    }

    var x = this.x;
    var y = this.y;
    var z = this.z;
    x += dx;
    y += dy;
    z += dz;

    // FIXME: Implement correct algorithm
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

    this.x = x;
    this.y = y;
    this.z = z;

    this.updateVelocity();
};

Cursor.prototype.updateVelocity = function () {
    var vowelCode = this.getVowelCode();
    if (vowelCode == null) {
        return;
    }
    var ndx = this.dx;
    var ndy = this.dy;
    var ndz = this.dz;
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

    // case 9: // ㅘ
    // case 10: // ㅙ
    // case 11: // ㅚ
    // case 14: // ㅝ
    // case 15: // ㅞ
    // case 16: // ㅟ

    default:
        break;
    }

    this.dx = ndx;
    this.dy = ndy;
    this.dz = ndz;
};

Cursor.prototype.getVowelCode = function () {
    var c = this.getChar();
    var ch = haechae(c);
    if (ch == null) {
        return undefined;
    }
    return ch[1];
};

Cursor.prototype.getCommand = function () {
    var c = this.getChar();
    var ch = haechae(c);
    if (ch == null) {
        return undefined;
    }
    return [ch[0], ch[2]];
};

Cursor.prototype.getChar = function () {
    var codeSpace = this.codeSpace;
    var x = this.x;
    var y = this.y;
    var z = this.z;
    if (y >= codeSpace[z].length) {
        return undefined;
    }
    if (x >= codeSpace[z][y].length) {
        return undefined;
    }
    var c = codeSpace[z][y].charAt(x);
    if (c === '') {
        return undefined;
    }
    return c;
};

Cursor.prototype.generateDebugInfo = function () {
    var c = this.getChar();
    if (c == null) {
        c = '';
    }
    return [
        msg_coordinate + '(' + [this.x, this.y, this.z].join(', ') + ')',
        msg_character + c,
    ].join('\n');
};

function initCursor(codeSpace) {
    cursor = new Cursor(codeSpace);
}

// disassembles a Hangul character into parts
function haechae(c) {
    if (c) { // typeof c === 'string' && c !== ''
        var cc = c.charCodeAt(0);
        if (0xAC00 <= cc && cc <= 0xD7A3) {
            cc -= 0xAC00;
            return [Math.floor(cc / 588), Math.floor(cc / 28) % 21, cc % 28];
        }
    }
    return undefined;
}

// cursor end

// engine??
function runCode(singleStep) {
    if (stopped) {
        init();
    }
    document.getElementById('aaheui').disabled = true;
    if (singleStep) {
        if (!paused) {
            pause();
        }
        document.getElementById('status').innerHTML = txt_paused;
    } else {
        document.getElementById('btn-run').value = txt_pause;
        paused = false;
        if (timer != null) {
            clearTimeout(timer);
            timer = null;
        }
        document.getElementById('status').innerHTML = txt_running;
    }

    if (cursor == null) {
        clearAll();

        // load code
        var source = document.getElementById('aaheui').value;
        var codeSpace = parseCodeSpace(source);
        initCursor(codeSpace);

        initStorage();
    }

    var execResult = doSteps(singleStep ? 1 : 100);
    var pauseExec = execResult.pauseExec;
    var stopExec = execResult.stopExec;

    if (stopExec) {
        terminate();
    } else if (pauseExec) {
        pause();
    } else if (!singleStep) {
        timer = setTimeout(runCode, 0);
    }
}

function doSteps(k) {
    var pauseExec = false;
    var stopExec = false;
    for (; k > 0 && !pauseExec && !stopExec; --k) {
        var command = cursor.getCommand();

        var a;
        var b;
        var inp;
        var reverseDirection = false;
        if (command == null) {
            ; // noop
        } else if (storages[storageIndex].length < requiredElem[command[0]]) {
            reverseDirection = true;
        } else {
            switch (command[0]) {
            case 2: // ㄴ
                a = pop(storageIndex);
                b = pop(storageIndex);
                if (a === 0) {
                    reverseDirection = true;
                } else {
                    push(storageIndex, (b - b % a) / a);
                }
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
                if (a === 0) {
                    reverseDirection = true;
                } else {
                    push(storageIndex, b % a);
                }
                break;
            case 6: // ㅁ
                a = pop(storageIndex);
                switch (command[1]) {
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
                switch (command[1]) {
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
                    push(storageIndex, finalcStroke[command[1]]);
                    break;
                }
                break;
            case 8: // ㅃ
                duplicate(storageIndex);
                break;
            case 9: // ㅅ
                storageIndex = command[1];
                break;
            case 10: // ㅆ
                push(command[1], pop(storageIndex));
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
            cursor.move(reverseDirection);
        }
    }

    return {
        pauseExec: pauseExec,
        stopExec: stopExec,
    };
}

function writeDebugInfo() {
    if (!document.getElementById('debug').checked) {
        return;
    }
    var cursorState = cursor.generateDebugInfo();
    var storageState = generateStorageDebugInfo();
    document.getElementById('dumps-cursor').value = cursorState;
    document.getElementById('dumps-storage').value = storageState;
}

function clearDebugInfo() {
    document.getElementById('dumps-cursor').value = '';
    document.getElementById('dumps-storage').value = '';
}

function terminate() {
    paused = true;
    stopped = true;

    // Stop running code
    if (timer != null) {
        clearTimeout(timer);
        timer = null;
    }

    // Flush input buffer
    inputBuffer = '';

    // Unload code
    cursor = null;

    document.getElementById('aaheui').disabled = false; // Make code editable
    document.getElementById('btn-run').value = txt_run; // Reset the label to its original state.
    document.getElementById('status').innerHTML = txt_stopped;
}

function pause() {
    paused = true;
    if (timer != null) {
        clearTimeout(timer);
        timer = null;
    }

    document.getElementById('btn-run').value = txt_continue;

    if (codeSpace != null) {
        document.getElementById('status').innerHTML = txt_paused;
    }
}

function init() {
    terminate();
    clearAll();
    stopped = false;
}

function clearAll() {
    clearOutput();
    clearDebugInfo();
}

function clearOutput() {
    document.getElementById('output').value = '';
}
