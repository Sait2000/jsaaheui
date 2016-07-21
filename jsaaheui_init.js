/* global
    strings
    Storage
    Stack
    Queue
    PromptInput
    TextareaOutput
    NullPassage
    parseAaheuiCode
    Cursor
    Machine
*/

// variables
var machine = null;

var timer = null;
// var debug = true;
var paused = true;

function setUIPaused() {
    document.getElementById('source').disabled = true;
    document.getElementById('btn-run').value = strings.txtContinue;
    document.getElementById('status').innerHTML = strings.txtPaused;
}

function setUIRunning() {
    document.getElementById('source').disabled = true;
    document.getElementById('btn-run').value = strings.txtPause;
    document.getElementById('status').innerHTML = strings.txtRunning;
}

function setUIStopped() {
    document.getElementById('source').disabled = false;
    document.getElementById('btn-run').value = strings.txtRun;
    document.getElementById('status').innerHTML = strings.txtStopped;
}

function runCode(singleStep) {
    stopTimer();
    paused = false;
    setUIRunning();

    if (machine == null) {
        clearAll();

        // load code
        var source = document.getElementById('source').value;
        var codeSpace = parseAaheuiCode(source);
        var cursor = new Cursor(codeSpace);

        var storage = new Storage(Stack, Queue, NullPassage);

        machine = new Machine({
            cursor: cursor,
            storage: storage,
            in: new PromptInput({
                number: strings.msgInputNumber,
                character: strings.msgInputCharacter,
            }),
            out: new TextareaOutput(document.getElementById('output')),
            debugCallback: writeDebugInfo,
        });
    }

    var k = singleStep ? 1 : 100;
    var pauseExec = false;
    var stopExec = false;
    for (var i = 0; i < k && !pauseExec && !stopExec; ++i) {
        var stepResult = machine.step();
        pauseExec = stepResult;
        stopExec = machine.stopped;
    }

    if (stopExec) {
        terminate();
    } else if (pauseExec) {
        pause();
    } else {
        if (singleStep) {
            pause();
        } else {
            timer = setTimeout(runCode, 0);
        }
    }
}

function writeDebugInfo(machine) {
    if (!document.getElementById('debug').checked) {
        return;
    }
    var cursorState = generateCursorDebugInfo(machine.cursor);
    var storageState = generateStorageDebugInfo(machine.storage);
    document.getElementById('dumps-cursor').value = cursorState;
    document.getElementById('dumps-storage').value = storageState;
}

function generateStorageDebugInfo(storage) {
    var lines = [];
    var currentStorageIndex = storage.currentStorageIndex;
    for (var i = 0; i < 28; ++i) {
        var c = String.fromCharCode(0xC544 + i);
        var line = c + ': ' + storage[i].toArray().join();
        if (i === currentStorageIndex) {
            line = '>' + line;
        }
        lines.push(line);
    }
    return lines.join('\n');
}

function generateCursorDebugInfo(cursor) {
    var c = cursor.getChar();
    if (c == null) {
        c = '';
    }
    var coordinate = [cursor.x, cursor.y, cursor.z];
    return [
        strings.msgCoordinate + '(' + coordinate.join(', ') + ')',
        strings.msgCharacter + c,
    ].join('\n');
}

function clearDebugInfo() {
    document.getElementById('dumps-cursor').value = '';
    document.getElementById('dumps-storage').value = '';
}

function terminate() {
    paused = true;

    // Stop running code
    stopTimer();

    // Unload code
    machine = null;

    setUIStopped();
}

function pause() {
    paused = true;
    stopTimer();

    setUIPaused();
}

function stopTimer() {
    if (timer != null) {
        clearTimeout(timer);
        timer = null;
    }
}

function clearAll() {
    clearOutput();
    clearDebugInfo();
}

function clearOutput() {
    document.getElementById('output').value = '';
}


(function (f) {
    if (document.readyState !== 'loading'){
        f();
    } else {
        document.addEventListener('DOMContentLoaded', f);
    }
})(function () {
    document.getElementById('btn-init').addEventListener('click', function () {
        terminate();
        clearAll();
    });
    document.getElementById('btn-run').addEventListener('click', function () {
        if (paused) {
            runCode(false);
        } else {
            pause();
        }
    });
    document.getElementById('btn-stop').addEventListener('click', function () {
        terminate();
    });
    document.getElementById('btn-single-step').addEventListener('click', function () {
        runCode(true);
    });
    document.getElementById('btn-clear').addEventListener('click', function () {
        clearOutput();
    });

    setUIStopped();
});
