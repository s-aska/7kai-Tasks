(function(ns, w, d) {

if (typeof w.console !== 'object') {
    console = {
        log: function(){}
    };
}

var app = ns.app = {
    CSRF_TOKEN_NAME: 'csrf_token',
    REGEXP: {
        URL: new RegExp('(?:https?://[\\x21-\\x7e]+)', 'g')
    },
    // Environment
    env: {
        token: '',
        lang: (/^ja/.test(navigator.language) ? 'ja' : 'en')
    },
    events: {},
    // Utility for native objects
    obj: {},
    date: {},
    func: {},
    dom: {
        cache: {}
    },
    // Utility
    util: {},
    // API Call
    api: {},
    // <div data-setup="hoge"> => app.setup.hoge(element)
    setup: {},
    // <a data-setup="click" data-click="hoge"> => app.click.hoge(element)
    click: {},
    // <form data-setup="submit" data-submit="hoge"> => app.submit.submit(element)
    submit: {}
};

// Event Manager
app.addEvents = function(){
    var args = $.makeArray(arguments);
    for (var i = 0, max_i = args.length; i < max_i; i++) {
        app.events[args[i]] = [];
    }
}
app.addListener = function(name, fh, context){
    if (!(name in app.events)) {
        console.log('unknown event ' + name);
    }
    app.events[name].push([fh, context]);
}
app.fireEvent = function(){
    var args = $.makeArray(arguments);
    var name = args.shift();
    if (!(name in app.events)) {
        console.log('unknown event ' + name);
        return;
    }
    for (var i = 0, max_i = app.events[name].length; i < max_i; i++) {
        app.events[name][i][0].apply(app.events[name][i][1] || app, args);
    }
}

// Utility for native objects
app.obj.get = function(obj, keys){
    var f = obj;
    var ns = keys.split('.');
    for (var i = 0, max_i = ns.length; i < max_i; i++) {
        if (!(ns[i] in f)) {
            var error = {
                message: "missing key in obj.",
                obj :obj,
                keys: keys
            };
            console.log(error);
            throw error;
        }
        f = f[ns[i]];
    }
    return f;
}
app.func.debounce = function(f, threshold){
    var timeout;

    return function(){
    	var self = this;
    	var args = arguments;

    	if (timeout)
    		clearTimeout(timeout);

    	timeout = setTimeout(function(){
    		f.apply(self, args);
    		timeout = null; 
    	}, threshold || 100); 
    };
}
app.date.parse = function(str){
    var degits = str.match(/[0-9]+/g);
    if (degits[0].length === 4) {
        return new Date(degits[0], degits[1] - 1, degits[2]);
    } else {
        return new Date(degits[2], degits[0] - 1, degits[1]);
    }
}
app.date.relative = function(epoch){
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
app.date.ymd = function(date){
    var month = date.getMonth() + 1;
    var day   = date.getDate();
    if (month < 10) {
        month = '0' + month;
    }
    if (day < 10) {
        day = '0' + day;
    }
    return date.getFullYear() + '-' + month + '-' + day;
}
app.date.mdy = function(date){
    return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
}
app.dom.text = function(ele, key){
    if (key) {
        return ele.data('text-' + key + '-' + c.lang);
    } else {
        return ele.data('text-' + c.lang);
    }
}

// Utility
app.util.autolink = function(text){
    return text
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(app.REGEXP.URL, function(url){
        var a = d.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.appendChild(d.createTextNode(url));
        var div = d.createElement('div');
        div.appendChild(a);
        return div.innerHTML;
    });
}

})(this, this, document);