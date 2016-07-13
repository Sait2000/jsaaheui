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

function init() {
    terminate();
    clearAll();
}

function runCode(singleStep) {
    document.getElementById('source').disabled = true;
    if (singleStep) {
        if (!paused) {
            pause();
        }
        document.getElementById('status').innerHTML = strings.txtPaused;
    } else {
        stopTimer();
        paused = false;
        document.getElementById('btn-run').value = strings.txtPause;
        document.getElementById('status').innerHTML = strings.txtRunning;
    }

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
            in: new PromptInput(),
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
    } else if (!singleStep) {
        timer = setTimeout(runCode, 0);
    }
}

function writeDebugInfo() {
    if (!document.getElementById('debug').checked) {
        return;
    }
    var cursorState = machine.cursor.generateDebugInfo();
    var storageState = machine.storage.generateDebugInfo();
    document.getElementById('dumps-cursor').value = cursorState;
    document.getElementById('dumps-storage').value = storageState;
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

    document.getElementById('source').disabled = false; // Make code editable
    document.getElementById('btn-run').value = strings.txtRun; // Reset the label to its original state.
    document.getElementById('status').innerHTML = strings.txtStopped;
}

function pause() {
    paused = true;
    stopTimer();

    document.getElementById('btn-run').value = strings.txtContinue;

    if (machine != null) {
        document.getElementById('status').innerHTML = strings.txtPaused;
    }
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
        init();
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

    init();
});
