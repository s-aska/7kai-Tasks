(function(ns, w, d) {

var app = ns.app = {
    
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
        offline: false,
        offline_queue: false,
        animation: true
    },


    // Utility
    util: {
        
    },
    
    // API Call
    api: {
        account: {},
        task: {},
        twitter: {}
        
    },

    // DOM methods
    dom: {
        
    },
    
    // DOM setup methods
    // data-setup="hoge" => app.setup.hoge(element)
    setup: {
        
    },
    
    // DOM click methods
    // data-setup="click" data-click="hoge" => app.click.hoge(element)
    click: {
        
    },
    
    submit: {
        
    },
    
    // 
    callback: {
        
    },
    
    sortable: {
        
    },

    queue: {
        
    }
};

c.addEvents('setup');
c.addEvents('resetup');
c.addEvents('reset');
c.addEvents('online');

c.addEvents('alert');

c.addEvents('resize');    // window resize
c.addEvents('selectTab'); // tag component

c.addEvents('registerAccount');
c.addEvents('sign');
c.addEvents('signin');
c.addEvents('signup');

c.addListener('setup', function(option){
    if (navigator.onLine){
        app.api.token()
        .done(function(data){
            app.data.token = data.token;
            c.fireEvent('online');
        });
    }
});

$(d).ready(function(){
    
    document.body.addEventListener("online", function() {
        applicationCache.update();
        applicationCache.addEventListener("updateready", function() {
            applicationCache.swapCache();
        }, false);
    }, false);

    app.run();
    $(w).resize(c.func.debounce(function(e){
        c.fireEvent('resize', e);
    }));
});

app.run = function(){
    c.init();
    app.dom.setup();
    c.fireEvent('setup');
}

app.calls = function(ele, type){
    var methods = ele.data(type).split(',');
    for (var i = 0, max_i = methods.length; i < max_i; i++) {
        app[type][methods[i]].call(app, ele);
    }
}
app.ajax = function(option){
    if ("data" in option && "type" in option && option.type.toLowerCase() === 'post') {
        if (typeof option.data === 'object') {
            option.data[c.CSRF_TOKEN_NAME] = c.csrf_token;
        } else {
            option.data = option.data + '&' + c.CSRF_TOKEN_NAME + '=' + c.csrf_token;
        }
    }
    if (app.option.show_loading && option.loading !== false) {
        if (!app.data.loading) {
            app.data.loading = $('<div id="loading"></div>');
            app.data.loading.appendTo($('body'));
            var spinner = new Spinner({
                color: '#fff'
            }).spin(app.data.loading.get(0));
            app.data.loading.data().spinner = spinner;
        } else {
            app.data.loading.data().spinner.spin(app.data.loading.get(0));
        }
        app.data.loading.show();
    }
    return $.ajax(option)
    .fail(function(jqXHR, textStatus, errorThrown){
        console.log(option.url);
        console.log(jqXHR.status);

        if (!jqXHR.status) {
            if (option.salvage) {
                if (!app.data.offline_queue) {
                    c.fireEvent('alert', 'offline-queue');
                    app.data.offline_queue = true;
                }
            } else {
                if (!app.data.offline) {
                    c.fireEvent('alert', 'offline');
                    app.data.offline = true;
                }
            }
        }

        // Unauthorized
        else if (jqXHR.status === 401) {
            if (option.setup) {
                app.dom.show($('#signin'));
            } else {
                c.fireEvent('alert', jqXHR.status);
                app.dom.show($('#signin'));
            }
        }

        // Collision
        else if (jqXHR.status === 403 || jqXHR.status === 404) {
            c.fireEvent('alert', jqXHR.status);
            setTimeout(function(){
                c.fireEvent('resetup');
            }, 3000);
        }

        // Internal Server Error
        else if (jqXHR.status >= 500) {
            c.fireEvent('alert', jqXHR.status);
        }
    })
    .done(function(){
        if (option.url !== '/api/1/account/salvage') {
            app.util.salvage();
        }
    })
    .always(function(){
        if (app.option.show_loading && option.loading !== false) {
            app.data.loading.data().spinner.stop();
            app.data.loading.hide();
        }
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
app.util.salvage = function(){
    var queues = app.queue.load();
    if (!queues) {
        return;
    }
    
    return app.ajax({
        url: '/api/1/account/salvage',
        type: 'post',
        data: {queues: JSON.stringify(queues)},
        dataType: 'json'
    })
    .done(function(data){
        if (data.success === 1) {
            app.queue.clear();
            app.dom.show($('#notice-succeeded-salvage'));
            c.fireEvent('resetup');
            app.data.offline = false;
            app.data.offline_queue = false;
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
        })(c.obj.get(app, callback));
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
        })(c.obj.get(app, callback));
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
    ele.text(ele.data('text-' + c.lang));
}
app.setup.click = function(ele){
    ele.click(function(e){
        e.preventDefault();
        app.calls(ele, 'click');
    });
}
app.setup.submit = function(ele) {
    ele.submit(function(e){
        e.preventDefault(); // stop submit
        app.calls(ele, 'submit');
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
    c.addListener('resize', callback);
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
app.setup.dateplus = function(ele){
    ele.keydown(function(e){
        if (e.keyCode === 37) {
            var date = ele.val() ? c.string.toDate(ele.val()) : new Date();
            date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
            ele.val(c.date.ymd(date));
        } else if (e.keyCode === 38) {
            var date = ele.val() ? c.string.toDate(ele.val()) : new Date();
            date.setTime(date.getTime() - (7 * 24 * 60 * 60 * 1000));
            ele.val(c.date.ymd(date));
        } else if (e.keyCode === 39) {
            var date = ele.val() ? c.string.toDate(ele.val()) : new Date();
            date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
            ele.val(c.date.ymd(date));
        } else if (e.keyCode === 40) {
            var date = ele.val() ? c.string.toDate(ele.val()) : new Date();
            date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
            ele.val(c.date.ymd(date));
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
        c.fireEvent('selectTab', my_group, my_id);
    });

    c.addListener('selectTab', function(group, id){
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

    c.addListener('selectTab', function(group, id){
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
        cursor: 'url(/static/img/openhand.cur), move',
        start: function (e, ui) {
        },
        stop: function (e, ui) {
        },
        update: function(e, ui) {
            (c.obj.get(app, update))(ele);
        }
    });
}
app.setup.alert = function(ele){
    var p = ele.find('p:first');
    c.addListener('alert', function(status){
        p.text(p.data('text-error-' + status + '-' + c.lang));
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
    c.addListener('online', function(){
        $('<input type="hidden"/>')
            .attr('name', c.CSRF_TOKEN_NAME)
            .val(app.data.token)
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

app.setup.signup = function(form){

    c.addListener('signup', function(){
        app.ajax({
            url: '/signin/email/signup',
            type: 'post',
            data: form.serialize(),
            dataType: 'json'
        })
        .done(function(data){
            if (data.success) {
                c.fireEvent('registerAccount', data.account);
            } else {
                // FIXME: 
                alert('Sign Up failure, please check E-mail and password.');
            }
        })
        .fail(function(){
            alert('Sign Up failure, please check E-mail and password.');
        });
    });

    c.addListener('signin', function(){
        app.ajax({
            url: '/signin/email/signin',
            type: 'post',
            data: form.serialize(),
            dataType: 'json'
        })
        .done(function(data){
            if (data.success) {
                location.href = '/';
            } else {
                // FIXME: 
                alert('Sign In failure, please check E-mail and password.');
            }
        })
        .fail(function(){
            alert('Sign In failure, please check E-mail and password.');
        });
    });
}
app.click.signin = function(ele){
    c.fireEvent('signin');
}
app.click.signup = function(ele){
    c.fireEvent('signup');
}
app.setup.verify = function(form){
    c.addListener('registerAccount', function(){
        app.dom.show(form);
    });
}
app.submit.verify = function(form){
    app.ajax({
        url: '/signin/email/verify',
        type: 'post',
        data: form.serialize(),
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            location.href = '/';
        } else {
            // FIXME: 
            alert('Verify failure, please check code.');
        }
    })
    .fail(function(){
        alert('Verify failure, please check code.');
    });
}

app.api.token = function(){
    return app.ajax({
        url: '/token',
        dataType: 'json',
        loading: false
    });
}

})(this, this, document);