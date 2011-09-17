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
        messages: null
    },


    // Utility
    util: {
        
    },
    
    // API Call
    api: {
        
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
        
    }
};

c.addEvents('setup');
c.addEvents('resetup');
c.addEvents('reset');

c.addEvents('alert');

c.addEvents('resize');    // window resize
c.addEvents('selectTab'); // tag component

$(d).ready(function(){
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
        option.data[c.CSRF_TOKEN_NAME] = c.csrf_token;
        option.data["request_time"] = (new Date()).getTime();
    }
    return $.ajax(option)
    .fail(function(jqXHR, textStatus, errorThrown){
        console.log({
            status: jqXHR.status,
            thrown: errorThrown,
            textStatus: textStatus
        });

        // Unauthorized
        if (jqXHR.status === 401) {
            c.fireEvent('alert', jqXHR.status);
            setTimeout(function(){
                location.reload();
            }, 3000);
        }

        // Collision
        else if (jqXHR.status === 403 || jqXHR.status === 404) {
            c.fireEvent('alert', jqXHR.status);
            c.fireEvent('resetup');
        }

        // Internal Server Error
        else if (jqXHR.status >= 500) {
            c.fireEvnet('alert', jqXHR.status);
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
        ele[ui].call(ele, option);
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
            var date = ele.datepicker("getDate") || new Date();
            date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
            ele.datepicker("setDate", date);
        } else if (e.keyCode === 38) {
            var date = ele.datepicker("getDate") || new Date();
            date.setTime(date.getTime() - (7 * 24 * 60 * 60 * 1000));
            ele.datepicker("setDate", date);
        } else if (e.keyCode === 39) {
            var date = ele.datepicker("getDate") || new Date();
            date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
            ele.datepicker("setDate", date);
        } else if (e.keyCode === 40) {
            var date = ele.datepicker("getDate") || new Date();
            date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
            ele.datepicker("setDate", date);
        }
    });
}
app.setup.shortcut = function(ele){
    $(d).keydown(function(e){
        if (document.activeElement.tagName === 'BODY'
            && !e.shiftKey
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