(function(ns, w, d) {

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
        offline: false,
        offline_queue: false,
    },
    queue: {}, // Queue Manager
    loading: {
        wrapper: null,
        spinner: null,
    },
    api: {
        account: {},
        task: {},
        twitter: {}
    },
    sortable: {}
});

app.addEvents('setup');        // application setup
app.addEvents('reset');        // memory and dom clear
app.addEvents('reload');       // reset => setup
app.addEvents('resize');       // window resize
app.addEvents('alert');        // trouble
app.addEvents('selectTab');    // tag component
app.addEvents('receiveSign');  // receive sign from api
app.addEvents('receiveToken'); // receive token from api

$(d).ready(function(){
    app.run();
});

app.run = function(){
    if ("applicationCache" in w) {
        d.body.addEventListener("online", function() {
            app.api.token();
            applicationCache.update();
            applicationCache.addEventListener("updateready", function() {
                applicationCache.swapCache();
            }, false);
        }, false);
    }
    app.init();
    app.dom.setup();
    app.fireEvent('setup');
    $(w).resize(app.func.debounce(function(e){
        app.fireEvent('resize', e);
    }));
}

app.execute = function(ele, type){
    var methods = ele.data(type).split(',');
    for (var i = 0, max_i = methods.length; i < max_i; i++) {
        app[type][methods[i]].call(app, ele);
    }
}
app.ajax = function(option){
    if ("data" in option && "type" in option && option.type.toLowerCase() === 'post') {
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
        app.env.token = data.token;
        app.fireEvent('receiveToken');
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
            app.dom.show($('#notice-succeeded-salvage'));
            app.fireEvent('reload');
            app.state.offline = false;
            app.state.offline_queue = false;
        }
    });
}

app.dom.setup = function(context){
    $('[data-setup]', context).each(function(){
        var ele = $(this);
        var methods = ele.data('setup').split(',');
        for (var i = 0, max_i = methods.length; i < max_i; i++) {
            if (!(methods[i] in app.setup)) {
                console.log(methods[i]);
                continue;
            }
            app.setup[methods[i]].call(app, $(this));
        }
    });
}
app.dom.show = function(target){
    if (target.is(':visible')) {
        return;
    }
    var effect    = target.data('show-effect')   || 'drop';
    var option    = target.data('show-option')   || {};
    var speed     = target.data('show-speed')    || null;
    var callback  = target.data('show-callback') || null;
    var autoClose = target.data('show-auto-close') || null;
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
    if (autoClose) {
        setTimeout(function(){
            app.dom.hide(target);
        }, autoClose);
    }
    return target.show(effect, option, speed, callback);
}
app.dom.hide = function(target){
    var effect = target.data('hide-effect') || 'drop';
    var option = target.data('hide-option') || {};
    var speed  = target.data('hide-speed')  || null;
    var callback = target.data('hide-callback') || null;
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
        app.dom.show(target);
    } else {
        app.dom.hide(target);
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
    var padding = ele.data('stretch-padding') || 0;
    var offset = ele.data('stretch-offset') || ele.offset().top;
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
        var option = ele.data('ui-' + ui);
        if (ui in ele) {
            ele[ui].call(ele, option);
        }
    }
}
app.setup.escclose = function(ele){
    ele.keydown(function(e){
        if (e.keyCode === 27) {
            app.dom.hide(ele);
        }
    });
}
app.setup.shortcut = function(ele){
    $(d).keydown(function(e){
        if (document.activeElement.tagName === 'BODY'
            && !e.shiftKey
            && !e.ctrlKey
            && !e.altKey
            && !e.metaKey
            && e.keyCode === ele.data('shortcut-code')) {
            ele.click();
        }
    });
}
app.setup.tabMenu = function(ele){
    var my_id = ele.data('tab-id'),
        my_group = ele.data('tab-group');

    ele.click(function(){
        app.fireEvent('selectTab', my_group, my_id);
    });

    app.addListener('selectTab', function(group, id){
        if (group !== my_group) {
            return;
        }
        if (id === my_id) {
            ele.parent().addClass('active');
        } else {
            ele.parent().removeClass('active');
        }
    });
}
app.setup.tabContent = function(ele){
    var my_id = ele.data('tab-id'),
        my_group = ele.data('tab-group');

    app.addListener('selectTab', function(group, id){
        if (group !== my_group) {
            return;
        }
        if (id === my_id) {
            ele.show();
        } else {
            ele.hide();
        }
    });
}
app.setup.sortable = function(ele){
    var update = ele.data('sortable-update');
    ele.sortable({
        cancel: '.nosortable',
        cursor: 'move',
        start: function (e, ui) {
        },
        stop: function (e, ui) {
        },
        update: function(e, ui) {
            (app.obj.get(app, update))(ele);
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
app.setup.guide = function(ele){
    var id = ele.data('guide-id');
    var option = ele.data('guide-option');
    var guide = $('#' + id);
    app.dom.hover(ele, function(){
        var offset = ele.offset();
        guide.css('top', offset.top + option.top + 'px');
        guide.css('left', offset.left + option.left + 'px');
        app.dom.show(guide);
    }, function(){
        app.dom.hide(guide);
    }, 500);
}
app.setup.form = function(form){
    app.addListener('online', function(){
        $('<input type="hidden"/>')
            .attr('name', app.CSRF_TOKEN_NAME)
            .val(app.env.token)
            .appendTo(form);
    });
}

app.click.show = function(ele){
    var id = ele.data('show-id');
    var target = $('#' + id);
    app.dom.show(target);
}
app.click.hide = function(ele){
    var id = ele.data('hide-id');
    var target = $('#' + id);
    app.dom.hide(target);
}
app.click.toggle = function(ele){
    app.dom.toggle(ele);
}

})(this, this, document);