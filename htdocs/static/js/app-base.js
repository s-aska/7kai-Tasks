(function(ns, w, d) {

var app = ns.app = {
    
    data: {
        friends: {},
        assigns: {},
        current_list: null,
        last_list_id: null,
        list_map: {},
        sub_accounts: []
    },
    
    // DOM methods
    dom: {
        
    },
    
    // DOM initialize methods
    // data-init="hoge" => app.init.hoge(element)
    init: {
        
    },
    
    // DOM click methods
    // data-init="click" data-click="hoge" => app.click.hoge(element)
    click: {
        
    },
    
    submit: {
        
    },
    
    // 
    callback: {
        
    }
};

c.addEvents('resize');
c.addEvents('init');

$(d).ready(function(){
    app.run();
    $(w).resize(c.func.debounce(function(e){
        c.fireEvent('resize', e);
    }));
});

app.run = function(){
    c.init();
    app.dom.init();
    c.fireEvent('init');
}

app.handleEvent = function(e){
    var ele = $(e.currentTarget);
    if (ele.data(e.type)) {
        e.preventDefault(); // form submit を止められない
        e.stopPropagation();
    }
    var methods = ele.data(e.type).split(',');
    for (var i = 0, max_i = methods.length; i < max_i; i++) {
        app[e.type][methods[i]].call(app, ele, e);
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

        // Collision
        if (jqXHR.status === 403 || jqXHR.status === 404) {
            // soft reload
            console.log('permission or not found.');
        }

        // Internal Server Error
        else if (jqXHR.status === 500) {
            // しばらくして...
            console.log('error.');
        }
    });
}

app.dom.init = function(context){
    $('*[data-init]', context).each(function(){
        var ele = $(this);
        var methods = ele.data('init').split(',');
        for (var i = 0, max_i = methods.length; i < max_i; i++) {
            if (!(methods[i] in app.init)) {
                console.log(methods[i]);
                continue;
            }
            app.init[methods[i]].call(app, $(this));
        }
    });
}
app.dom.show = function(target){
    var effect   = target.data('show-effect')   || 'drop';
    var option   = target.data('show-option')   || {};
    var speed    = target.data('show-speed')    || null;
    var callback = target.data('show-callback') || null;
    if (callback) {
        callback = (function(func){
            return function(){
                func.call(app, target);
            }
        })(c.obj.get(app, target.data('show-callback')));
    }
    return target.show(effect, option, speed, callback);
}
app.dom.hide = function(target){
    var effect = target.data('hide-effect') || 'drop';
    var option = target.data('hide-option') || {};
    var speed  = target.data('hide-speed')  || null;
    return target.hide(effect, option, speed);
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

app.init.localize = function(ele){
    ele.text(ele.data('text-' + c.lang));
}
app.init.click = function(ele){
    ele.get(0).addEventListener("click", app, false);
}
app.init.submit = function(ele) {
    ele.get(0).addEventListener("submit", app, false);
}
app.init.menu = function(ele){
    var ul = ele.find('> ul');
    ele.hover(function(){
        ul.slideDown('fast');
    }, function(){
        ul.slideUp('fast');
    });
}
app.init.stretch = function(ele){
    var callback = function(){
        ele.height(
            $(w).height()
            - ele.offset().top
            - parseInt(ele.css('paddingTop'), 10)
            - parseInt(ele.css('paddingBottom'), 10)
        );
    };
    c.addListener('resize', callback);
    callback.call();
}
app.init.ui = function(ele){
    var uis = ele.data('ui').split(',');
    for (var i = 0, max_i = uis.length; i < max_i; i++) {
        var ui = uis[i];
        var option = ele.data('ui-' + ui);
        ele[ui].call(ele, option);
    }
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