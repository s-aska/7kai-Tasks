"use strict";
(function(ns, w, d) {

var app = ns.app;

app.addListener('setup', function(){
    if (w.location.hash.length > 0) {
        localStorage.setItem('hash', w.location.hash);
    } else {
        localStorage.removeItem('hash');
    }
    // setTimeout(function(){
    //     $('header .container').animate({opacity: 1}, 3000);
    // }, 2000);
    $('article ul li').each(function(){
        var li = $(this);
        li.find('a').click(function(){
            li.slideUp({ duration: 650, easing: 'easeOutQuart'});
        });
    });
    // $('#navbar').scrollspy();
});

})(this, window, document, jQuery);