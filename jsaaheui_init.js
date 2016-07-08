/* global
    clearAll
    runCode
    pause
    terminate
    clearOutput
    paused
*/
(function (f) {
    if (document.readyState !== 'loading'){
        f();
    } else {
        document.addEventListener('DOMContentLoaded', f);
    }
})(function () {
    function init() {
        terminate();
        clearAll();
    }
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
