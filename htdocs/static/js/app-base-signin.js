"use strict";
(function(ns, w, d) {

var app = ns.app;

app.addListener('setup', function(){
    if (w.location.hash.length > 0) {
        localStorage.setItem('hash', w.location.hash);
    } else {
        localStorage.removeItem('hash');
    }
});

})(this, window, document, jQuery);