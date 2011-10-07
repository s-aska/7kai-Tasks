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
app.setup.listname = function(ele){
    app.addListener('openList', function(list){
        ele.text(list.name);
    });
}
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
    var myScroll = new iScroll(ele.get(0), { hScrollbar: true });
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

// ----------------------------------------------------------------------
// app.setup.tasks = function(ul){
//     var template = ul.html();
//     ul.empty();
//     var taskli_map = {};
//     app.addListener('registerTask', function(task){
//         var li = $(template);
//         
//         app.dom.setup(li, task);
// 
//         app.setup.task(li, task);
//         
//         // FIXME: 表示条件との照合
//         if (task.id in taskli_map) {
//             if (!taskli_map[task.id].data('visible')) {
//                 li.data('visible', false);
//                 li.hide();
//             } else {
//                 li.data('visible', true);
//             }
//             if (taskli_map[task.id].hasClass('selected')) {
//                 li.addClass('selected');
//             }
//             taskli_map[task.id].after(li);
//             taskli_map[task.id].remove();
//             taskli_map[task.id] = li;
//             if (app.data.current_filter &&
//                 app.util.taskFilter(task, app.data.current_filter)) {
//                 if (!li.data('visible')) {
//                     li.data('visible', true);
//                     li.show();
//                 }
//             } else {
//                 if (li.data('visible')) {
//                     li.data('visible', false);
//                     li.hide();
//                 }
//             }
//         } else {
//             if (!(app.data.current_filter &&
//                 app.util.taskFilter(task, app.data.current_filter))) {
//                 li.data('visible', false);
//                 li.hide();
//             } else {
//                 li.data('visible', true);
//             }
//             li.prependTo(ul);
//         }
//         taskli_map[task.id] = li;
//     });
//     
//     app.addListener('filterTask', function(condition){
//         app.fireEvent('selectTab', 'main', 'tasks');
//         for (var task_id in app.data.task_map) {
//             var task = app.data.task_map[task_id];
//             var li = taskli_map[task_id];
//             if (app.util.taskFilter(task, condition)) {
//                 if (!li.data('visible')) {
//                     li.data('visible', true);
//                     li.show();
//                 }
//             } else {
//                 if (li.data('visible')) {
//                     li.data('visible', false);
//                     li.hide('');
//                 }
//                 if (app.data.current_task && app.data.current_task.id === task.id) {
//                     app.fireEvent('missingTask');
//                 }
//             }
//         }
//     });
//     
//     app.addListener('clearList', function(list){
//         for (var task_id in app.data.task_map) {
//             var task = app.data.task_map[task_id];
//             if (list.id === task.list.id && task.closed) {
//                 if (task_id in taskli_map) {
//                     if (app.data.current_task && app.data.current_task.id === task_id) {
//                         app.fireEvent('missingTask');
//                     }
//                     taskli_map[task_id].remove();
//                     delete taskli_map[task_id];
//                 }
//                 delete app.data.task_map[task_id];
//             }
//         }
//     });
//     
//     app.addListener('clear', function(){
//         ul.empty();
//         taskli_map = {};
//     });
// }


// ----------------------------------------------------------------------
// app.setup.registerTaskWindow = function(form){
// 
//     //
//     var assign_label = form.find('label.assign');
//     var assign_field = form.find('div.assign-field');
//     var assign_input = form.find('input[name=assign]');
//     var assign_list = form.find('ul.assign');
//     var assign_template = assign_list.html();
//     var name_input = form.find('input[name=name]');
//     var due_input = form.find('input[name=due]');
//     var requester_list = form.find('ul.requester');
//     var requester_input = form.find('input[name=requester]');
//     var requester_template = requester_list.html();
//     var registrant_input = form.find('input[name=registrant]');
//     var task_id_input = form.find('input[name=task_id]');
//     var list_id_input = form.find('input[name=list_id]');
// 
//     form.find('a.due-plus').click(function(e){
//         e.preventDefault();
//         var due = due_input.val();
//         var date = due ? app.date.parse(due) : (new Date());
//         date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
//         due_input.val(app.date.ymd(date));
//     });
// 
//     form.find('a.due-minus').click(function(e){
//         e.preventDefault();
//         var due = due_input.val();
//         var date = due ? app.date.parse(due) : (new Date());
//         var date = app.date.parse(due);
//         date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
//         due_input.val(app.date.ymd(date));
//     });
// 
//     var setup = function(list){
//         assign_list.empty();
//         requester_list.empty();
//         var assigns = [list.owner].concat(list.members);
//         for (var i = 0, max_i = assigns.length; i < max_i; i++) {
//             var assign = assigns[i];
//             var friend = app.data.users[assign];
//             var li = $(assign_template);
//             if (friend && friend.icon) {
//                 li.find('img').attr('src', friend.icon);
//             } else if (/@/.test(assign)) {
//                 li.find('img').attr('src', '/static/img/email.png');
//             } else {
//                 li.find('img').attr('src', '/static/img/address.png');
//             }
//             var name = friend ? friend.name : assign;
//             li.find('div.name').text(name);
//             li.find('input').val(assign);
//             li.find('input[type="checkbox"]')
//                 .focus(function(){$(this).parent().addClass('focused')})
//                 .blur(function(){$(this).parent().removeClass('focused')});
//             li.appendTo(assign_list);
// 
//             var requester = $(requester_template);
//             requester.find('div.name').text(name);
//             requester.find('input').val(assign);
//             requester.find('img').attr('src', app.util.getIconUrl(assign));
//             requester.appendTo(requester_list);
//         }
// 
//         // 依頼者のデフォルトは自分
//         var registrant = app.util.getRegistrant(list);
//         form.find('input[name=requester]').val([registrant]);
//         registrant_input.val(registrant);
//         task_id_input.val('');
//         list_id_input.val(list.id);
//     };
// 
//     app.addListener('createTask', function(){
//         app.dom.reset(form);
//         if (!app.data.current_list) {
//             alert('missing current_list');
//             return;
//         }
//         setup(app.data.current_list);
// 
//         //
//         app.fireEvent('selectTab', 'main', 'registerTask');
//         form.find('input[name="name"]').focus();
//     });
// 
//     app.addListener('editTask', function(task){
//         app.dom.reset(form);
//         if (!app.data.current_list) {
//             alert('missing current_list');
//             return;
//         }
//         setup(task.list);
// 
//         name_input.val(task.name);
//         if (task.due) {
//             due_input.val(app.date.ymd(task.due_date));
//         } else {
//             due_input.val('');
//         }
//         form.find('input[name=requester]').val([task.requester]);
//         task_id_input.val(task.id);
//         form.find('input[name=assign]').val(task.assign);
// 
//         app.fireEvent('selectTab', 'main', 'registerTask');
// 
//     });
// }
// app.submit.registerTask = function(form){
//     var task_id = form.find('input[name="task_id"]').val();
//     var list_id = form.find('input[name="list_id"]').val();
//     var assign = form.find('input[name="assign"]:checked')
//                     .map(function(){return $(this).val()}).get();
//     var requester = form.find('input[name="requester"]').val();
//     var registrant = form.find('input[name="registrant"]').val();
//     var name = form.find('input[name="name"]').val();
//     var due = form.find('input[name="due"]').val();
//     var create = task_id ? false : true;
//     
//     if (!name.length) {
//         alert('please input task title.');
//         return false;
//     }
// 
//     if (due) {
//         due = app.date.mdy(app.date.parse(due));
//     }
// 
//     if (typeof assign !== 'object') {
//         assign = assign ? [assign] : [];
//     }
// 
//     var list = app.data.list_map[list_id];
//     if (!list) {
//         alert('unknown list ' + list_id);
//         return false;
//     }
//     
//     var time = (new Date()).getTime();
//     var task;
//     if (task_id) {
//         task = $.extend({}, app.data.task_map[task_id]);
//         task.name = name;
//         task.requester = requester;
//         task.assign = assign;
//         task.due = due;
//         task.updated_on = time;
//     } else {
//         var id = list.id + ':' + time;
//         form.find('input[name="task_id"]').val(id);
//         task = {
//             id: id,
//             requester: requester,
//             registrant: registrant,
//             assign: assign,
//             name: name,
//             due: due,
//             status: 0,
//             closed: 0,
//             comments: [],
//             history: [],
//             created_on: time,
//             updated_on: time
//         };
//     }
// 
//     app.fireEvent('registerTask', task, list);
//     
//     var data = form.serialize();
//     var dataArray = form.serializeArray();
// 
//     app.dom.reset(form);
//     form.find('input[name="task_id"]').val('');
//     form.find('input[name=requester]').val([registrant]);
// 
//     if (task_id) {
//         app.fireEvent('selectTab', 'main', 'tasks');
//     } else {
//         form.find('input[name="name"]').focus();
//         app.dom.show(app.dom.get('showable', 'notice-succeeded-create-task'));
//     }
//     
//     var api = create ? 'task.create' : 'task.update';
//     var url = create ? '/api/1/task/create' : '/api/1/task/update';
//     app.ajax({
//         type: 'POST',
//         url: url,
//         data: data,
//         dataType: 'json',
//         salvage: true,
//         loading: false
//     })
//     .done(function(data){
//         if (data.success === 1) {
//             app.fireEvent('registerTask', data.task, list);
//         } else {
//             // 現在 ステータスコード 200 の例外ケースは無い
//         }
//     })
//     .fail(function(jqXHR, textStatus, errorThrown){
//         if (!jqXHR.status) {
//             app.queue.push({
//                 api: api,
//                 req: dataArray,
//                 updated_on: task.updated_on
//             });
//             task.salvage = true;
//             app.fireEvent('registerTask', task, list);
//         }
//     });
// }

// ----------------------------------------------------------------------


})(this, this, document);