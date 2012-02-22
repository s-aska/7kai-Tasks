"use strict";
(function(ns, w, d) {

var app = ns.app;

app.addListener('setup', function(){
    if (w.location.hash.length > 0) {
        localStorage.setItem('hash', w.location.hash);
    } else {
        localStorage.removeItem('hash');
    }
    // $('.carousel').carousel();
    // setTimeout(function(){
    //     $('header h1').animate({opacity: 1}, 3000);
    // }, 2000);
    setTimeout(function(){
        $('header .container').animate({opacity: 1}, 3000);
    }, 2000);
    $('article ul li a img').click(function(){
        var img = $(this);
        var li = img.parents('li:first');
        li.slideUp('slow');
    });
});

})(this, window, document, jQuery);