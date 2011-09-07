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
    
    // data
    csrf_token: '',
    lang: '', // en, ja ...
    events: {},
    
    // Utility for jQuery UI
    ui: {
        
    },
    
    // Utility for native objects
    obj: {
        
    },
    string: {
        
    },
    date: {
        
    },
    func: {
        
    },
    dom: {
        
    }
};

// Method
c.init = function(){
    c.lang = navigator.language === 'ja' ? 'ja' : 'en';
    c.csrf_token = $('input[name=' + c.CSRF_TOKEN_NAME + ']:first').val();
}

// Event Manager
c.addEvents = function(name){
    c.events[name] = [];
}
c.addListener = function(name, fh, context){
    c.events[name].push([fh, context]);
}
c.fireEvent = function() {
    var args = $.makeArray(arguments);
    var name = args.shift();
    for (var i = 0, max_i = c.events[name].length; i < max_i; i++) {
        c.events[name][i][0].apply(c.events[name][i][1] || c, args);
    }
}

// Utility for jQuery UI
c.ui.hover = function(element, over, out, delay){
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

// Utility for native objects
c.string.autolink = function(text){
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
c.string.capitalize = function(text){
    return text.charAt(0).toUpperCase() + text.substr(1);
}
c.string.toDate = function(str){
    var degits = str.match(/[0-9]+/g);
    var date = new Date(degits[0], degits[1] - 1, degits[2], degits[3], degits[4], degits[5]);
    return date;
}
c.date.relative = function(epoch){
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
c.dom.text = function(ele, key){
    if (key) {
        return ele.data('text-' + key + '-' + c.lang);
    } else {
        return ele.data('text-' + c.lang);
    }
}

c.func.debounce = function(f, threshold){
    var timeout;

    return function(){
    	var self = this;
    	var args = arguments;

    	if(timeout)
    		clearTimeout(timeout);

    	timeout = setTimeout(function(){
    		f.apply(self, args);
    		timeout = null; 
    	}, threshold || 100); 
    };
}
c.obj.get = function(obj, keys){
    var f = obj;
    var ns = keys.split('.');
    for (var i = 0, max_i = ns.length; i < max_i; i++) {
        f = f[ns[i]];
    }
    return f;
}

})(this, this, document);