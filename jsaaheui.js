/* global
    msg_coordinate
    msg_character
    msg_input_number
    msg_input_character
    txt_stopped
    txt_running
    txt_paused
    txt_run
    txt_pause
    txt_continue
*/

// constants

// var initcTable = [
//     'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ',
//     'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
// ];

// var vowelTable = [
//     'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ',
//     'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ',
//     'ㅡ', 'ㅢ', 'ㅣ',
// ];

// var finalcTable = [
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

// number of storage items required for each command (initial consonant)
var commandArity = [
    0, 0, 2, 2, 2, 2, 1, 0, 1, 0, 1,
    0, 2, 0, 1, 0, 2, 2, 0,
];

// variables
var storage = null;

var inputBuffer = '';

var cursor = null;

var timer = null;
// var debug = true;
var paused = true;
var stopped = true;

// functions

// storage start
function Storage(stackConstructor, queueConstructor, passageConstructor) {
    for (var i = 0; i < 28; ++i) {
        var storage;
        switch (i) {
        case 21: // ㅇ
            storage = new queueConstructor();
            break;
        case 27: // ㅎ
            storage = new passageConstructor();
            break;
        default:
            storage = new stackConstructor();
            break;
        }
        this[i] = storage;
    }
    this.currentStorageIndex = 0;
}

Storage.prototype.checkSize = function (n) {
    return this[this.currentStorageIndex].checkSize(n);
};

Storage.prototype.push = function (n) {
    this[this.currentStorageIndex].push(n);
};

Storage.prototype.pop = function () {
    return this[this.currentStorageIndex].pop();
};

Storage.prototype.swap = function () {
    this[this.currentStorageIndex].swap();
};

Storage.prototype.duplicate = function () {
    this[this.currentStorageIndex].duplicate();
};

Storage.prototype.select = function (n) {
    this.currentStorageIndex = n;
};

Storage.prototype.sendTo = function (n) {
    this[n].push(this[this.currentStorageIndex].pop());
};

Storage.prototype.generateDebugInfo = function () {
    var lines = [];
    var currentStorageIndex = this.currentStorageIndex;
    for (var i = 0; i < 28; ++i) {
        var c = String.fromCharCode(0xC544 + i);
        var line = c + ': ' + storage[i].generateDebugInfo();
        if (i === currentStorageIndex) {
            line = '>' + line;
        }
        lines.push(line);
    }
    return lines.join('\n');
};

function Stack() {
    this.base = [];
}

Stack.prototype.checkSize = function (n) {
    return this.base.length >= n;
};

Stack.prototype.push = function (n) {
    this.base.push(n);
};

Stack.prototype.pop = function () {
    return this.base.pop();
};

Stack.prototype.swap = function () {
    var base = this.base;
    var a = base.pop();
    var b = base.pop();
    base.push(a);
    base.push(b);
};

Stack.prototype.duplicate = function () {
    var base = this.base;
    base.push(base[base.length - 1]);
};

Stack.prototype.generateDebugInfo = function () {
    return this.base.join();
};

function Queue() {
    this.base = [];
}

Queue.prototype.checkSize = function (n) {
    return this.base.length >= n;
};

Queue.prototype.push = function (n) {
    this.base.push(n);
};

Queue.prototype.pop = function () {
    return this.base.shift();
};

Queue.prototype.swap = function () {
    var base = this.base;
    var a = base[0];
    var b = base[1];
    base[1] = a;
    base[0] = b;
};

Queue.prototype.duplicate = function () {
    var base = this.base;
    base.unshift(base[0]);
};

Queue.prototype.generateDebugInfo = function () {
    return this.base.join();
};

function NullPassage() {
}

NullPassage.prototype.checkSize = function (/* n */) {
    return true;
};

NullPassage.prototype.push = function (/* n */) {
};

NullPassage.prototype.pop = function () {
    return 0;
};

NullPassage.prototype.swap = function () {
};

NullPassage.prototype.duplicate = function () {
};

NullPassage.prototype.generateDebugInfo = function () {
    return '';
};
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
function runCode(singleStep) { // eslint-disable-line no-unused-vars
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
        stopTimer();
        document.getElementById('status').innerHTML = txt_running;
    }

    if (cursor == null) {
        clearAll();

        // load code
        var source = document.getElementById('aaheui').value;
        var codeSpace = parseCodeSpace(source);
        cursor = new Cursor(codeSpace);

        storage = new Storage(Stack, Queue, NullPassage);
    }

    var k = singleStep ? 1 : 100;
    var pauseExec = false;
    var stopExec = false;
    for (var i = 0; i < k && !pauseExec && !stopExec; ++i) {
        var stepResult = step();
        pauseExec = stepResult.pauseExec;
        stopExec = stepResult.stopExec;
    }

    if (stopExec) {
        terminate();
    } else if (pauseExec) {
        pause();
    } else if (!singleStep) {
        timer = setTimeout(runCode, 0);
    }
}

function step() {
    var pauseExec = false;
    var stopExec = false;

    var command = cursor.getCommand();

    var a;
    var b;
    var inp;
    var reverseDirection = false;
    if (command != null) {
        var initc = command[0];
        var finalc = command[1];
        if (!storage.checkSize(commandArity[initc])) {
            reverseDirection = true;
        } else {
            switch (initc) {
            case 2: // ㄴ
                a = storage.pop();
                b = storage.pop();
                if (a === 0) {
                    reverseDirection = true;
                } else {
                    storage.push((b - b % a) / a);
                }
                break;
            case 3: // ㄷ
                a = storage.pop();
                b = storage.pop();
                storage.push(b + a);
                break;
            case 4: // ㄸ
                a = storage.pop();
                b = storage.pop();
                storage.push(b * a);
                break;
            case 5: // ㄹ
                a = storage.pop();
                b = storage.pop();
                if (a === 0) {
                    reverseDirection = true;
                } else {
                    storage.push(b % a);
                }
                break;
            case 6: // ㅁ
                a = storage.pop();
                switch (finalc) {
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
                switch (finalc) {
                case 21: // ㅇ
                    writeDebugInfo();
                    inp = inputNumber();
                    if (inp == null) {
                        pauseExec = true;
                    } else {
                        storage.push(inp);
                    }
                    break;
                case 27: // ㅎ
                    writeDebugInfo();
                    inp = inputChar();
                    if (inp == null) {
                        pauseExec = true;
                    } else {
                        storage.push(inp);
                    }
                    break;
                default:
                    storage.push(finalcStroke[finalc]);
                    break;
                }
                break;
            case 8: // ㅃ
                storage.duplicate();
                break;
            case 9: // ㅅ
                storage.select(finalc);
                break;
            case 10: // ㅆ
                storage.sendTo(finalc);
                break;
            case 12: // ㅈ
                a = storage.pop();
                b = storage.pop();
                storage.push(b >= a ? 1 : 0);
                break;
            case 14: // ㅊ
                if (storage.pop() === 0) {
                    reverseDirection = true;
                }
                break;
            case 16: // ㅌ
                a = storage.pop();
                b = storage.pop();
                storage.push(b - a);
                break;
            case 17: // ㅍ
                storage.swap();
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
    }

    writeDebugInfo();
    if (!pauseExec && !stopExec) {
        cursor.move(reverseDirection);
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
    var storageState = storage.generateDebugInfo();
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
    stopTimer();

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
    stopTimer();

    document.getElementById('btn-run').value = txt_continue;

    if (cursor != null) {
        document.getElementById('status').innerHTML = txt_paused;
    }
}

function stopTimer() {
    if (timer != null) {
        clearTimeout(timer);
        timer = null;
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
