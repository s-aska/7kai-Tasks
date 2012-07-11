"use strict";
(function(ns, w, d, $) {

var app = ns.app;

$.extend(app, {
    option: {
        friends_reload_threshold: 24 * 60 * 60 * 1000,
        auto_sync_friends: true,
        show_loading: false
    },
    data: {
        if_modified_since: 0,
        if_modified_lists: '',
        users: {},
        assigns: [],
        current_list: null,
        current_task: null,
        current_sort: {
            column: null,
            reverse: null
        },
        current_filter: null,
        last_list_id: null,
        list_map: {},
        task_map: {},
        taskli_map: {},
        sub_accounts: [],
        messages: null,
        animation: true
    },
    state: {
        signin: false,
        offline: false,
        offline_queue: false,
        tab: {},
        animation: true
    },
    queue: {}, // Queue Manager
    loading: {
        wrapper: null,
        spinner: null,
    },
    api: {
        account: {},
        task: {},
        list: {},
        twitter: {}
    },
    sortable: {}
});

app.addEvents('ready');        // document ready
app.addEvents('setup');        // application setup
app.addEvents('clear');        // memory and dom clear
app.addEvents('reload');       // reset => setup
app.addEvents('resize');       // window resize
app.addEvents('alert');        // trouble
app.addEvents('notice');       // notice
app.addEvents('selectTab');    // tag component
app.addEvents('receiveSign');  // receive sign from api
app.addEvents('receiveToken'); // receive token from api

app.addListener('ready', function(){
    if (location.search.indexOf('lang=en') !== -1) {
        app.env.lang = 'en';
    }
    app.dom.disableSelection($('a'));
    app.dom.setup();
    $(w).resize(app.func.debounce(function(e){
        app.fireEvent('resize', e);
    }));
});
app.addListener('receiveToken', function(token){
    app.env.token = token;
});

$(d).ready(function(){
    app.run();
});

app.run = function(){
    app.fireEvent('ready');
    app.fireEvent('setup');
}
app.execute = function(ele, type){
    var methods = ele.data(type).split(',');
    for (var i = 0, max_i = methods.length; i < max_i; i++) {
        if (!(methods[i] in app[type])) {
            console.log({
                message: "missing method.",
                ele: ele,
                type: type,
                key: methods[i]
            });
        }
        app[type][methods[i]].call(app, ele);
    }
}
app.ajax = function(option){
    if ("data" in option && "type" in option && option.type.toLowerCase() === 'post' && app.env.token) {
        if (typeof option.data === 'object') {
            option.data[app.CSRF_TOKEN_NAME] = app.env.token;
        } else {
            option.data = option.data + '&' + app.CSRF_TOKEN_NAME + '=' + app.env.token;
        }
    }
    if (app.option.show_loading && option.loading !== false) {
        app.loading.start();
    }
    return $.ajax(option)
    .fail(function(jqXHR, textStatus, errorThrown){
        console.log(option.url);
        console.log(jqXHR.status);

        if (!jqXHR.status) {
            if (option.salvage) {
                if (!app.state.offline_queue) {
                    app.fireEvent('alert', 'offline-queue');
                    app.state.offline_queue = true;
                }
            } else {
                if (!app.state.offline) {
                    app.fireEvent('alert', 'offline');
                    app.state.offline = true;
                }
            }
        }

        // Unauthorized
        else if (jqXHR.status === 401) {
            if (option.setup) {
                app.dom.show($('#signin'));
            } else {
                app.fireEvent('alert', jqXHR.status);
                setTimeout(function(){
                    location.href = '/';
                }, 3000);
            }
        }

        // Collision
        else if (jqXHR.status === 403 || jqXHR.status === 404) {
            app.fireEvent('alert', jqXHR.status);
            setTimeout(function(){
                app.fireEvent('reload');
            }, 3000);
        }

        // Internal Server Error
        else if (jqXHR.status >= 500) {
            app.fireEvent('alert', jqXHR.status);
        }
    })
    .done(function(){
        if (option.url !== '/api/1/account/salvage'
            && option.url !== '/token') {
            app.util.salvage();
        }
    })
    .always(function(){
        if (app.option.show_loading && option.loading !== false) {
            app.loading.stop();
        }
    });
}

app.api.token = function(){
    return app.ajax({
        url: '/token',
        dataType: 'json',
        loading: false
    })
    .done(function(data){
        app.fireEvent('receiveToken', data.token);
    });
}

app.queue.push = function(queue){
    var queues = app.queue.load() || [];
    queues.push(queue);
    localStorage.setItem('queues', JSON.stringify(queues));
}
app.queue.load = function(){
    var queues = localStorage.getItem('queues');
    if (queues) {
        return JSON.parse(queues);
    } else {
        return null;
    }
}
app.queue.clear = function(){
    localStorage.removeItem('queues');
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

app.util.salvage = function(){
    var queues = app.queue.load();
    if (!queues) {
        return;
    }

    return app.ajax({
        url: '/api/1/account/salvage',
        type: 'post',
        data: { queues: JSON.stringify(queues) },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success === 1) {
            app.queue.clear();
            app.dom.show(app.dom.get('showable', 'notice-succeeded-salvage'));
            app.fireEvent('reload');
            app.state.offline = false;
            app.state.offline_queue = false;
        }
    });
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
app.dom.show = function(target){
    if (!target || target.is(':visible')) {
        return;
    }
    var data     = target.data('showable');
    var show     = data.show     || {};
    var effect   = show.effect   || 'drop';
    var option   = show.option   || {};
    var speed    = show.speed    || null;
    var callback = show.callback || null;
    var timeout  = show.timeout  || null;
    if (target.hasClass('modal')) {
        var height = target.height();
        target.css('marginTop', Number(height / 2) * -1 + 'px');
    }
    if (callback) {
        callback = (function(func){
            return function(){
                func.call(app, target);
            }
        })(app.obj.get(app, callback));
    }
    if (timeout) {
        setTimeout(function(){
            app.dom.hide(target);
        }, timeout);
    }
    if (effect === 'none') {
        target.show();
    }
    target.show(effect, option, speed, callback);
    target.trigger('app.dom.show');
    return target;
}
app.dom.hide = function(target){
    if (!target) {
        return;
    }
    var data     = target.data('showable');
    var hide     = data.hide     || {};
    var effect   = hide.effect   || 'drop';
    var option   = hide.option   || {};
    var speed    = hide.speed    || null;
    var callback = hide.callback || null;
    if (callback) {
        callback = (function(func){
            return function(){
                func.call(app, target);
            }
        })(app.obj.get(app, callback));
    }
    if (effect === 'none') {
        target.hide();
    }
    return target.hide(effect, option, speed, callback);
}
app.dom.toggle = function(target){
    if (target.is(':visible')) {
        app.dom.hide(target);
    } else {
        app.dom.show(target);
    }
}
app.dom.reset = function(form){
    form.get(0).reset();
}
app.dom.autofocus = function(form){
    form.find('[data-autofocus]').focus();
}
app.dom.blur = function(form){
    document.activeElement.blur();
}
app.dom.hover = function(ele, over, out, delay){
    var timer;
    ele.hover(function(){
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
app.dom.get = function(type, id){
    if (!(type in app.dom.cache)) {
        console.log('missing app.dom.cache.' + type);
        return;
    }
    if (!(id in app.dom.cache[type])) {
        console.log('missing app.dom.cache.' + type + '.' + id);
        return;
    }
    return app.dom.cache[type][id];
}
app.dom.set = function(type, id, ele){
    if (!(type in app.dom.cache)) {
        app.dom.cache[type] = {};
    }
    app.dom.cache[type][id] = ele;
}
app.dom.disableSelection = function(ele){
    ele.bind($.support.selectstart ? 'selectstart' : 'mousedown', function(e){
        e.preventDefault();
    });
};

app.setup.localize = function(ele){
    ele.text(ele.data('text-' + app.env.lang));
}
app.setup.click = function(ele){
    ele.click(function(e){
        e.preventDefault();
        app.execute(ele, 'click');
    });
}
app.setup.submit = function(ele) {
    ele.submit(function(e){
        e.preventDefault(); // stop submit
        app.execute(ele, 'submit');
    });
}
app.setup.menu = function(ele){
    var ul = ele.find('> ul');
    app.dom.hover(ele, function(){
        ul.slideDown('fast');
    }, function(){
        ul.slideUp('fast');
    }, 500);
}
app.setup.stretch = function(ele){
    var option   = ele.data('stretch') || {};
    var padding  = option.padding || 0;
    var offset   = option.offset  || ele.offset().top;
    var callback = function(){
        ele.height(
            $(w).height()
            - offset
            - parseInt(ele.css('paddingTop'), 10)
            - parseInt(ele.css('paddingBottom'), 10)
            - padding
        );
    };
    app.addListener('resize', callback);
    callback.call();
}
app.setup.ui = function(ele){
    var uis = ele.data('ui').split(',');
    for (var i = 0, max_i = uis.length; i < max_i; i++) {
        var ui = uis[i];
        if (ui in ele) {
            ele[ui].call(ele);
        }
    }
}
app.setup.escclose = function(ele){
    ele.on('keydown', function(e){
        if (e.keyCode === 27) {
            app.dom.hide(ele);
        }
    });
}
app.setup.shortcut = function(ele){
    var option = ele.data('shortcut');
    $(d).keydown(function(e){
        if (document.activeElement.tagName === 'BODY'
            && !e.shiftKey
            && !e.ctrlKey
            && !e.altKey
            && !e.metaKey
            && e.keyCode === option.code
            && ele.is(':visible')) {
            ele.click();
        }
    });
}
app.setup.tab = {};
app.setup.tab.menu = function(ele){
    var option = ele.data('tab');
    ele.click(function(){
        if (ele.hasClass('active') &&
            option.toggle) {
                app.fireEvent('selectTab', option.group, option.toggle);
                app.state.tab[option.group] = option.toggle;
        } else {
            app.fireEvent('selectTab', option.group, option.id);
            app.state.tab[option.group] = option.id;
        }
    });
    app.addListener('selectTab', function(group, id){
        if (group !== option.group) {
            return;
        }
        if (id === option.id) {
            if (ele.hasClass('btn')) {
                ele.addClass('active');
            } else {
                ele.parent().addClass('active');
            }
            app.state.tab[group] = id;
        } else {
            if (ele.hasClass('btn')) {
                ele.removeClass('active');
            } else {
                ele.parent().removeClass('active');
            }
        }
    });
}
app.setup.tab.content = function(ele){
    var option = ele.data('tab');
    app.addListener('selectTab', function(group, id){
        if (group !== option.group) {
            return;
        }
        if (id === option.id) {
            if (option.effect) {
                ele.show(option.effect, 'fast');
            } else {
                ele.show();
            }
        } else {
            if (option.effect) {
                ele.hide();
                // ele.hide(option.effect, 'fast');
            } else {
                ele.hide();
            }
        }
    });
    if (option.group in app.state.tab) {
        if (app.state.tab[option.group] !== option.id) {
            ele.hide();
        } else {
            ele.show();
        }
    }
}
app.setup.uiSortable = function(ele){
    var option = ele.data('ui-sortable');
    ele.sortable({
        cancel: '.nosortable',
        cursor: 'move',
        start: function (e, ui) {
        },
        stop: function (e, ui) {
        },
        update: function(e, ui) {
            (app.obj.get(app, option.update))(ele);
        }
    });
}
app.setup.alert = function(ele){
    var p = ele.find('p:first');
    app.addListener('alert', function(status){
        p.text(p.data('text-error-' + status + '-' + app.env.lang));
        app.dom.show(ele);
    });
}
app.setup.notice = function(ele){
    var p = ele.find('p:first');
    app.addListener('notice', function(status){
        var text = p.data('text-' + status + '-' + app.env.lang);
        if (text) {
            p.text(text);
            app.dom.show(ele);
        }
    });
}
app.setup.form = function(form){
    app.addListener('receiveToken', function(token){
        $('<input type="hidden"/>')
            .attr('name', app.CSRF_TOKEN_NAME)
            .val(token)
            .appendTo(form);
    });
}
app.setup.showable = function(ele){
    var val = ele.attr('data-showable'), option;
    if (val) {
        var json = val.replace(/\s|\n/g, '');
        option = JSON.parse(json);
        ele.attr('data-showable', json);
    }
    app.dom.set('showable', option.id, ele);
}
app.setup.show = function(ele){
    var option = ele.data('show');
    ele.click(function(e){
        e.preventDefault();
        app.dom.show(app.dom.get('showable', option.id));
    });
}
app.setup.hide = function(ele){
    var option = ele.data('hide');
    ele.click(function(e){
        e.preventDefault();
        app.dom.hide(app.dom.get('showable', option.id));
    });
}
app.setup.toggle = function(ele){
    var option = ele.data('toggle');
    ele.click(function(e){
        e.preventDefault();
        app.dom.toggle(app.dom.get('showable', option.id));
    });
}
app.setup.guide = function(ele){
    var option = ele.data('guide');
    app.dom.hover(ele, function(){
        var guide = app.dom.get('showable', option.id);
        var offset = ele.offset();
        if (option.top) {
            guide.css('top', offset.top + option.top + 'px');
        }
        if (option.left) {
            guide.css('left', offset.left + option.left + 'px');
        }
        app.dom.show(guide);
    }, function(){
        app.dom.hide(app.dom.get('showable', option.id));
    }, 500);
}

})(this, window, document, jQuery);