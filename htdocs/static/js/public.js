(function(ns, w, d, $) {

if (typeof w.console !== 'object') {
    console = {
        log: function(){}
    };
}

var app = ns.app = {
    // Environment
    env: {
        lang: (/^ja/.test(navigator.language) ? 'ja' : 'en')
    },
    data: {},
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
    
    loading: {},
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
app.date.parse = function(str){
    var degits = str.match(/[0-9]+/g);
    if (degits[0].length === 4) {
        return new Date(degits[0], degits[1] - 1, degits[2]);
    } else {
        return new Date(degits[2], degits[0] - 1, degits[1]);
    }
}
app.date.ymd = function(date){
    var now = new Date();
    var label = (date.getMonth() + 1) + '/' + date.getDate();
    if (now.getFullYear() !== date.getFullYear()) {
        if (app.env.lang === 'ja') {
            label = date.getFullYear() + '/' + label;
        } else {
            label = label + '/' + date.getFullYear();
        }
    }
    return label;
}
app.date.ymdhm = function(date){
    return app.date.ymd(date)
        + ' '
        + ('0'+date.getHours()).slice(-2)
        + ':'
        + ('0'+date.getMinutes()).slice(-2);
}
app.dom.text = function(ele, key){
    if (key) {
        return ele.data('text-' + key + '-' + app.env.lang);
    } else {
        return ele.data('text-' + app.env.lang);
    }
}
app.dom.setup = function(){
    var args = $.makeArray(arguments);
    var context = args.shift();
    $('[data-setup]', context).each(function(){
        var ele = $(this);
        var methods = ele.data('setup').split(',');
        for (var i = 0, max_i = methods.length; i < max_i; i++) {
            app.obj.get(app.setup, methods[i]).apply(app, [$(this)].concat(args));
        }
    });
}

app.ajax = function(option){
    if ("data" in option
        && "type" in option
        && option.type.toLowerCase() === 'post'
        && app.env.token) {
        if (typeof option.data === 'object') {
            option.data[app.CSRF_TOKEN_NAME] = app.env.token;
        } else {
            option.data = option.data + '&' + app.CSRF_TOKEN_NAME + '=' + app.env.token;
        }
    }
    if (option.loading) {
        app.loading.start();
    }
    return $.ajax(option)
    .fail(function(jqXHR, textStatus, errorThrown){
        console.log(option.url);
        console.log(jqXHR.status);

        if (!jqXHR.status) {
            // if (option.salvage) {
            //     if (!app.state.offline_queue) {
            //         app.fireEvent('alert', 'offline-queue');
            //         app.state.offline_queue = true;
            //     }
            // } else {
            //     if (!app.state.offline) {
            //         app.fireEvent('alert', 'offline');
            //         app.state.offline = true;
            //     }
            // }
        }

        // Unauthorized
        else if (jqXHR.status === 401) {
            // if (option.setup) {
            //     app.dom.show($('#signin'));
            // } else {
            //     app.fireEvent('alert', jqXHR.status);
            //     setTimeout(function(){
            //         location.href = '/';
            //     }, 3000);
            // }
        }

        // Collision
        else if (jqXHR.status === 403 || jqXHR.status === 404) {
            // app.fireEvent('alert', jqXHR.status);
            // setTimeout(function(){
            //     app.fireEvent('reload');
            // }, 3000);
        }

        // Internal Server Error
        else if (jqXHR.status >= 500) {
            // app.fireEvent('alert', jqXHR.status);
        }
    })
    .done(function(){
    })
    .always(function(){
        if (option.loading) {
            app.loading.stop();
        }
    });
}

app.loading.start = function(){
    if (!app.loading.wrapper) {
        app.loading.wrapper = $('<div id="loading"></div>');
        app.loading.wrapper.appendTo($('body'));
        app.loading.spinner = new Spinner({
            color: '#fff'
        }).spin(app.loading.wrapper.get(0));
    }
    app.loading.spinner.spin(app.loading.wrapper.get(0));
    app.loading.wrapper.show();
}
app.loading.stop = function(){
    app.loading.spinner.stop();
    app.loading.wrapper.hide();
}

// --------------------------------------------------

app.addEvents('registerList'); // document ready
app.addEvents('openList'); // document ready

app.setup.localize = function(ele){
    ele.text(ele.data('text-' + app.env.lang));
}
app.setup.listname = function(ele){
    app.addListener('registerList', function(list){
        ele.text(list.name);
    });
}
app.setup.tasks = function(tbody){
    var table = tbody.parent();
    var closed = table.hasClass('closed') ? true : false;
    var template = tbody.html();
    tbody.empty();
    app.addListener('registerList', function(list){
        var users = list.users;
        var tasks = list.tasks;
        for (var i = 0, max_i = tasks.length; i < max_i; i++) {
            var task = tasks[i];
            var tr = $(template);
            tr.find('.name').text(task.name);
            if (Boolean(task.closed) !== closed) {
                continue;
            }
            var now = new Date();
            if (task.due) {
                var date = app.date.parse(task.due);
                var label = app.date.ymd(date);
                tr.find('.due')
                    .text(label)
                    .data('sort', date.getTime().toString());
            } else {
                tr.find('.due')
                    .text('-')
                    .data('sort', '0');
            }
            
            var created = new Date(task.created_on);
            tr.find('.created')
                .text(app.date.ymdhm(created))
                .data('sort', created.getTime().toString());
            
            var fixed = null;
            if (task.status === 2) {
                for (var ii = 0, max_ii = task.actions.length; ii < max_ii; ii++) {
                    var action = task.actions[ii];
                    if (action.action === 'fix-task') {
                        fixed = new Date(action.time);
                    }
                }
            }
            
            if (fixed) {
                tr.find('.fixed')
                    .text(app.date.ymdhm(fixed))
                    .data('sort', fixed.getTime().toString());
            } else {
                tr.find('.fixed')
                    .text('-')
                    .data('sort', '0');
            }
            
            var progress = task.closed       ? 'closed'
                         : task.status === 0 ? 'open'
                         : task.status === 1 ? 'progress'
                         : task.status === 2 ? 'fixed' : 'open';
            tr.find('.status')
                .text(
                    app.dom.text(tr.find('.status'), progress)
                )
                .data('sort', task.status.toString());
            if (task.assign && task.assign.length) {
                var ul = tr.find('.assign ul');
                var li_template = ul.html();
                ul.empty();
                var sort = '';
                for (var ii = 0, max_ii = task.assign.length; ii < max_ii; ii++) {
                    var account_id = task.assign[ii];
                    var user = users[account_id];
                    var li = $(li_template);
                    li.find('img').attr('src', user.icon);
                    li.find('span').text(user.name);
                    li.appendTo(ul);
                    sort = sort + account_id + '-';
                }
                tr.find('.assign').data('sort', sort);
            } else {
                tr.find('.assign').text('-');
                tr.find('.assign').data('sort', '0');
            }
            tr.appendTo(tbody);
        }
        var table = tbody.parent();
        table.tablesorter({textExtraction: function(node){
            return $(node).data('sort') || $(node).text();
        }});
    });
}

app.run = function(){
    app.dom.setup();
    app.ajax({
        url: w.location.href.replace(/html$/, 'jsonp'),
        dataType: 'jsonp',
        loading: true
    })
    .done(function(data){
        app.fireEvent('registerList', data);
    });
    var table = $('table');
    var li = $('.nav-tabs li');
    $('.nav-tabs a').click(function(){
        table.toggle();
        li.toggleClass('active');
    });
}

$(d).ready(function(){
    app.run();
});

})(this, window, document, jQuery);