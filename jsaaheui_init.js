(function (f) {
    if (document.readyState !== 'loading'){
        f();
    } else {
        document.addEventListener('DOMContentLoaded', f);
    }
})(function () {
    init();
});
