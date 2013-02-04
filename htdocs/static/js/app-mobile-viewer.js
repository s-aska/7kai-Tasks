"use strict";
(function(ns, w, d) {

var app = ns.app;

app.option.auto_sync_friends = false;
app.option.show_loading = true;

app.addEvents('domresize');
app.addEvents('orientationchange');

app.addListener('ready', function(){
    w.addEventListener('online', function(){
        app.api.token();
    });
    w.addEventListener('orientationchange', function(){
        app.fireEvent('orientationchange');
    });
});
app.addListener('setup', function(){
    if (navigator.onLine){
        app.api.token();
    }
});
app.addListener('orientationchange', function(){
    $('head meta[name=viewport]').remove();
    $('head').prepend('<meta name="viewport" content="width=device-width,'
        + ' user-scalable=no, initial-scale=1,'
        + ' minimum-scale=1, maximum-scale=1"/>');
});

// ----------------------------------------------------------------------
app.setup.bottommenu = function(ul){
    var center = ul.find('li.center');
    var width = $(w).width();
    var li_width = Number((width - center.width()) / 4);
    ul.find('li').not('.center').width(li_width);
    app.addListener('orientationchange', function(){
        var width = $(w).width();
        var li_width = Number((width - center.width()) / 4);
        ul.find('li').not('.center').width(li_width);
    });
}
app.setup.menu = function(ele){
    var ul = ele.find('> ul');
    ele.click(function(){
        ul.slideToggle('fast');
    });
}
app.setup.more = function(ele){
    var option = ele.data('more')
    ele.click(function(){
        var target = app.dom.get('showable', option.id);
        target.slideToggle('fast', function(){
            app.fireEvent('domresize');
        });
    });
}
app.setup.comments = function(ele){
    app.addListener('openTask', function(){
        app.fireEvent('selectTab', 'main', 'comments');
    });
}
app.setup.requester = function(ul){
    var template = ul.html();
    var setup = function(task){
        ul.empty();
        var list = app.data.current_list;
        var assigns = [list.owner].concat(list.members);
        for (var i = 0, max_i = assigns.length; i < max_i; i++) {
            var assign = assigns[i];
            var friend = app.data.users[assign];
            var name = friend ? friend.name : assign;
            var requester = $(template);
            requester.find('div.name').text(name);
            requester.find('input').val(assign);
            requester.find('img').attr('src', app.util.getIconUrl(assign));
            requester.appendTo(ul);
        }
        if (task) {
            ul.find('input[name=requester]').val([task.requester]);
        } else {
            ul.find('input[name=requester]').val([app.data.sign.account_id]);
        }
    };
    app.addListener('createTask', setup);
    app.addListener('editTask', setup);
}

})(this, this, document);