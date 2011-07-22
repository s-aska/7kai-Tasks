(function(ns, w, d) {

if (typeof w.console !== 'object') {
    console = {
        log: function(){}
    };
}

var c = ns.c = {
    
    // constant
    CSRF_TOKEN_NAME: 'csrf_token',
    REGEXP: {
        URL: new RegExp('(?:https?://[\\x21-\\x7e]+)', 'g')
    },
    SPEED: 'fast',
    
    // data
    csrf_token: '',
    lang: '', // en, ja ...
    events: {},
    
    // method
    init: init,
    
    // Event Manager
    addEvents: addEvents,
    addListener: addListener,
    fireEvent: fireEvent,
    
    // Localizer
    localize: localize,
    lcText: lcText,
    
    // UI
    delayHover: delayHover,
    
    // Utility
    autoLink: autoLink,
    timestamp: timestamp,
    capitalize: capitalize
    
};

// Method
function init() {
    c.lang = $('html').attr('lang');
    c.csrf_token = $('input[name=' + c.CSRF_TOKEN_NAME + ']:first').val();
}

// Event Manager
function addEvents(name) {
    c.events[name] = [];
}
function addListener(name, fh) {
    c.events[name].push(fh);
}
function fireEvent() {
    var args = $.makeArray(arguments);
    var name = args.shift();
    for (var i = 0, max_i = c.events[name].length; i < max_i; i++) {
        c.events[name][i].apply(c, args);
    }
}

// Localizer
function localize(context) {
    $('*[data-text-' + c.lang + ']', context).each(function(){
        var ele = $(this);
        ele.text(ele.data('text-' + c.lang));
    });
    $('*[data-text-placeholder-' + c.lang + ']', context).each(function(){
        var ele = $(this);
        ele.attr('placeholder', ele.data('text-placeholder-' + c.lang));
    });
}
function lcText(ele, key) {
    if (key) {
        return ele.data('text-' + key + '-' + c.lang);
    } else {
        return ele.data('text-' + c.lang);
    }
}


// UI
function delayHover(element, over, out, delay) {
    var timer;
    $(element).hover(function(){
        if (timer) {
            clearTimeout(timer);
            timer = null;
        } else {
            over.apply(this, arguments);
        }
    }, function(){
        var that = this,
            args = $.makeArray(arguments);
        timer = setTimeout(function(){
            out.apply(that, args);
            timer = null;
        }, delay);
    });
}

// Utility
function autoLink(text) {
    return text.replace(c.REGEXP.URL, function(url){
        var a = d.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.appendChild(d.createTextNode(url));
        var div = d.createElement('div');
        div.appendChild(a);
        return div.innerHTML;
    });
}
function timestamp(epoch) {
    var now = new Date();
    var now_epoch = parseInt(now.getTime() / 1000);
    if (epoch > now_epoch) {
        epoch = parseInt(epoch / 1000);
    }
    var diff = now_epoch - epoch;
    if (diff < 60) {
        var s = diff > 1 ? 's' : '';
        return diff + ' sec' + s + ' ago';
    } else if (diff < 3600) {
        var min = parseInt(diff / 60);
        var s = min > 1 ? 's' : '';
        return min + ' minute' + s + ' ago';
    } else if (diff < (3600 * 24)) {
        var hour = parseInt(diff / 3600);
        var s = hour > 1 ? 's' : '';
        return hour + ' hour' + s + ' ago';
    } else {
        var day = parseInt(diff / (3600 * 24));
        var s = day > 1 ? 's' : '';
        return day + ' day' + s + ' ago';
    }
}
function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.substr(1);
}

})(this, this, document);