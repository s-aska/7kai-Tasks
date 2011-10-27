(function(ns, w, d) {

var app = ns.app;

app.option.auto_sync_friends = false;
app.option.show_loading = true;

app.addEvents('domresize');
app.addEvents('orientationchange');

app.addListener('ready', function(){
    d.addEventListener('touchmove', function(e){
        e.preventDefault();
    });
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
app.setup.listmenu = function(ul){
    var li_cache = {};
    ul.empty();
    app.addListener('registerList', function(list){
        var li = $('<li/>')
            .data('id', list.id)
            .append(
                $('<a/>').text(list.name).click(function(){
                    app.fireEvent('openList', list);
                })
            );
        if (list.id in li_cache) {
            li_cache[list.id].after(li);
            li_cache[list.id].remove();
        } else {
            li.prependTo(ul);
        }
        li_cache[list.id] = li;
    });
    app.addListener('clear', function(){
        ul.empty();
        li_cache = {};
    });
}
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
app.setup.scroller = function(ele){ 
    var headerH = document.getElementById('header').offsetHeight,
		footerH = document.getElementById('footer').offsetHeight,
		wrapperH = window.innerHeight - headerH - footerH;
	document.getElementById('wrapper').style.height = wrapperH + 'px';
    var myScroll = new iScroll(ele.get(0), {
        hScrollbar: true,
        onBeforeScrollStart: function(e){
            var target = e.target;
            while (target.nodeType != 1) {
                target = target.parentNode;
            }
            if (target.tagName != 'SELECT'
                && target.tagName != 'INPUT'
                && target.tagName != 'TEXTAREA') {
                e.preventDefault();
            }
        }
    });
    app.addListener('domresize', function(){
        setTimeout(function(){ myScroll.refresh() }, 0);
    });
    app.addListener('selectTab', function(){
        setTimeout(function(){ myScroll.refresh() }, 500);
    });
    app.addListener('filterTask', function(){
        setTimeout(function(){ myScroll.refresh() }, 500);
    });
    window.onorientationchange = function(){
        setTimeout(function(){ myScroll.refresh() }, 0);
    }
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
            var registrant = app.util.getRegistrant(list);
            ul.find('input[name=requester]').val([registrant]);
        }
    };
    app.addListener('createTask', setup);
    app.addListener('editTask', setup);
}

})(this, this, document);