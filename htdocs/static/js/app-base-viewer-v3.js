"use strict";
(function(ns, w, d, $) {

var app = ns.app;

app.data.listli_map = {};
app.data.taskli_map = {};
app.data.listtr_map = {};

app.addEvents('registerSubAccount');
app.addEvents('registerFriends');

app.addEvents('registerList');
app.addEvents('openList');
app.addEvents('openNextList');
app.addEvents('openPrevList');
app.addEvents('createList');
app.addEvents('editList');
app.addEvents('deleteListBegin');
app.addEvents('deleteList');
app.addEvents('clearList');
app.addEvents('publicListBegin');
app.addEvents('publicList');
app.addEvents('privateList');

app.addEvents('registerTask'); // サーバーから取得又は登録フォームから登録した場合発火
app.addEvents('openTask');
app.addEvents('openTaskInHome');
app.addEvents('openNextTask');
app.addEvents('openPrevTask');
app.addEvents('openTopTask');
app.addEvents('openBottomTask');
app.addEvents('missingTask');
app.addEvents('createTask');    // 登録フォーム表示(新規モード)
app.addEvents('createSubTask'); // 登録フォーム表示(新規モード)
app.addEvents('editTask');      // 登録フォーム表示(編集モード)
app.addEvents('clearTask');
app.addEvents('sortTask');
app.addEvents('filterTask');
app.addEvents('toggleTag');
app.addEvents('resetTag');

app.addEvents('checkStar');
app.addEvents('checkMute');
app.addEvents('checkTag');
app.addEvents('resetCounter');

app.addEvents('clickNotification');

app.addEvents('receiveMe'); // receive me from api
app.addEvents('receiveNotice');

app.addListener('registerList', function(list){
    app.data.list_map[list.id] = list;
});
app.addListener('deleteList', function(list){
    delete app.data.list_map[list.id];
});
app.addListener('clearList', function(list){
});
app.addListener('openTask', function(task){
    w.location.hash = task.list.id + '-' + task.id;
});
app.addListener('openTaskInHome', function(task){
    app.fireEvent('selectTab', 'viewer', 'task');
    app.fireEvent('selectTab', 'homemenu', 'task');
    if (task.closed) {
        app.fireEvent('filterTask', { closed: 1 });
    }
    app.fireEvent('openTask', task);
});
app.addListener('missingTask', function(){
});
app.addListener('registerTask', function(task, list){
    // リスト
    task.list = list;

    // 期日
    if (task.due) {
        task.due_date = app.date.parse(task.due);
        task.due_epoch = task.due_date.getTime();
    } else {
        task.due_epoch = 0;
    }

    task.status = Number(task.status);
    task.closed = Number(task.closed);

    // 直近の履歴・コメント
    $.each(task.actions.concat().reverse(), function(i, action){
        if (!app.util.findMe([action.code])) {
            task.recent = action;
            return false;
        }
    });

    // 更新前の状態
    if (task.id in app.data.task_map) {
        task.before = $.extend({}, app.data.task_map[task.id]);
    }

    // 責任者
    if (task.status === 2) {
        task.person = task.requester;
    }
    else if (task.assign.length) {
        task.person = task.assign.join(',');
    }
    else {
        task.person = task.requester;
    }

    $.extend(app.data.task_map[task.id], task);

    app.data.task_map[task.id] = task;

    // if (app.data.current_task && task.id === app.data.current_task.id) {
    //     app.data.current_task = task;
    // }
});
app.addListener('registerFriends', function(friends, owner){
    for (var i = 0, max_i = friends.length; i < max_i; i++) {
        var friend = friends[i];
        var icon = friend.icon ? friend.icon.replace(/^http:\/\/a/, 'https://si')
                 : /^tw-[0-9]+$/.test(friend.code) ?
                     '/api/1/profile_image/'
                     + friend.screen_name
                 : /^fb-[0-9]+$/.test(friend.code) ?
                    'https://graph.facebook.com/'
                    + friend.code.substring(3)
                    + '/picture'
                 : '/static/img/address24.png';
        var value = friend.screen_name ? friend.screen_name + ' (' + friend.name + ')'
                  : friend.name;
        var label = '<img class="sq16" src="' + icon + '"><span>' + value + '</span>';
        app.data.users[friend.code] = {
            code: friend.code,
            name: friend.name,
            screen_name: friend.screen_name,
            icon: icon
        };
        if (owner) {
            app.data.assigns.push({
                owner: owner,
                code: friend.code,
                value: value,
                label: label
            });
        }
    }
});
app.addListener('registerSubAccount', function(sub_account){
    var icon = ( sub_account.data && sub_account.data.icon ) ?
                 sub_account.data.icon.replace(/^http:\/\/a/, 'https://si')
             : /^tw-[0-9]+$/.test(sub_account.code) ?
                 '/api/1/profile_image/'
                 + sub_account.name
             : /^fb-[0-9]+$/.test(sub_account.code) ?
                'https://graph.facebook.com/'
                + sub_account.code.substring(3)
                + '/picture'
             : '/static/img/address24.png';
    app.data.users[sub_account.code] = {
        code: sub_account.code,
        name: sub_account.name,
        icon: icon
    };
});
app.addListener('clickNotification', function(option){
    app.fireEvent('selectTab', 'viewer', 'task');
    app.api.account.me(option);
});
app.addListener('createTask', function(){
    app.dom.hide(app.dom.get('showable', 'welcome'));
});
app.addListener('filterTask', function(){
    app.fireEvent('resetTag');
});

// セットアップ
app.addListener('ready', function(){
    // ネスト解除エリア
    document.body.addEventListener('dragover', function(e){
        if (!app.data.dragtask.parent_id) {
            return true;
        }
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
    document.body.addEventListener('dragleave', function(e){
    });
    document.body.addEventListener('drop', function(e){
        app.api.task.update({
            list_id: app.data.dragtask.list.id,
            task_id: app.data.dragtask.id,
            registrant: app.util.getRegistrant(app.data.dragtask.list),
            parent_id: ''
        });
    }, false);
});
app.addListener('clear', function(){
    app.data.list_map = {};
    app.data.task_map = {};
    app.data.users = {};
    app.data.assigns = [];
});
app.addListener('reload', function(){
    // app.api.account.me({ reset: true });
    app.api.account.me({
        data: {
            if_modified_since: app.data.if_modified_since,
            if_modified_lists: app.data.if_modified_lists
        }
    });
});
app.addListener('setup', function(option){
    var option = { setup: true };
    var hash = w.location.hash;
    if (!hash.length) {
        hash = localStorage.getItem('hash');
        if (hash) {
            w.location.hash = hash;
            localStorage.removeItem('hash');
        }
    }
    if (hash) {
        var str = hash.match(/^#(\d+)-(\d+:\d+)$/);
        if (str) {
            option.list_id = str[1];
            option.task_id = str[2];
        }
    }
    if (navigator.onLine){
        app.api.account.me(option);
    } else {
        var data = localStorage.getItem("me");
        if (data) {
            app.util.buildMe(option, JSON.parse(data));
        }
    }
});
app.addListener('receiveSign', function(){
    if (app.state.signin) return;
    app.state.signin = true;
    setInterval(function(){
        app.api.account.me({
            data: {
                if_modified_since: app.data.if_modified_since,
                if_modified_lists: app.data.if_modified_lists
            }
        });
    }, 300000);
});

app.util.getIconUrl = function(code, size){
    var src;
    if (!navigator.onLine) {
        return '/static/img/address.png';
    }
    var user = app.data.users[code];
    if (user) {
        return user.icon;
    }
    if (/^tw-[0-9]+$/.test(code)) {
        src = '/static/img/address.png';
    }
    else if (/^fb-[0-9]+$/.test(code)) {
        src = 'https://graph.facebook.com/' + code.substring(3) + '/picture';
    }
    else {
        src = size === 16 ? '/static/img/address.png' : '/static/img/address24.png';
    }
    return src;
}
app.util.getIcon = function(code, size){
    var src = app.util.getIconUrl(code, size);
    if (!src) {
        src = '/static/img/address.png';
    }
    return $('<img/>').attr('src', src).addClass('sq' + size);
}
app.util.getName = function(code){
    var user = app.data.users[code];
    if (user) {
        return user.screen_name || user.name;
    } else {
        return code;
    }
}
app.util.findMe = function(codes){
    for (var i = 0, max_i = app.data.sub_accounts.length; i < max_i; i++) {
        var sub_account = app.data.sub_accounts[i];
        for (var ii = 0, max_ii = codes.length; ii < max_ii; ii++) {
            if (sub_account.code === codes[ii]) {
                return sub_account.code;
            }
        }
    }
    return false;
}
app.util.findMeList = function(codes){
    var me_list = [];
    for (var i = 0, max_i = app.data.sub_accounts.length; i < max_i; i++) {
        var sub_account = app.data.sub_accounts[i];
        for (var ii = 0, max_ii = codes.length; ii < max_ii; ii++) {
            if (sub_account.code === codes[ii]) {
                me_list.push(sub_account.code);
            }
        }
    }
    return me_list;
}
app.util.findOthers = function(codes){
    for (var i = 0, max_i = app.data.sub_accounts.length; i < max_i; i++) {
        var sub_account = app.data.sub_accounts[i];
        for (var ii = 0, max_ii = codes.length; ii < max_ii; ii++) {
            if (sub_account.code !== codes[ii]) {
                return codes[ii];
            }
        }
    }
    return false;
}
app.util.getRegistrant = function(list){
    for (var i = 0, max_i = app.data.sub_accounts.length; i < max_i; i++) {
        var sub_account = app.data.sub_accounts[i];
        if (sub_account.code === list.owner) {
            return sub_account.code;
        }
        for (var ii = 0, max_ii = list.members.length; ii < max_ii; ii++) {
            var member = list.members[ii];
            if (sub_account.code === member) {
                return sub_account.code;
            }
        }
    }
}
app.util.taskFilter = function(task, condition){
    if (!condition) {
        return true;
    }
    if (condition.none) {
        return false;
    }
    if (condition.closed) {
        if (!app.util.isCloseTask(task)) {
            return false;
        }
    } else {
        if (app.util.isCloseTask(task)) {
            return false;
        }
    }
    // if (condition.list_id) {
    //     if (condition.list_id !== task.list.id) {
    //         return false;
    //     }
    // }
    if (condition.todo) {
        if (task.list.id in app.data.state.mute) {
            return false;
        }
        if (task.pending) {
            return false;
        }
        if (task.status === 2) {
            return false;
        }
        if (task.assign.length) {
            if (!app.util.findMe(task.assign)) {
                return false;
            }
        } else {
            if (!app.util.findMe([task.requester])) {
                return false;
            }
        }
        if (task.due_epoch && task.due_epoch > (new Date()).getTime()) {
            return false;
        }
    }
    if (condition.verify) {
        if (!app.util.findMe([task.requester])) {
            return false;
        }
        if (!app.util.findOthers(task.assign)) {
            return false;
        }
        if (task.status !== 2) {
            return false;
        }
    }
    if (condition.request) {
        if (!app.util.findMe([task.requester])) {
            return false;
        }
        if (!app.util.findOthers(task.assign)) {
            return false;
        }
        if (task.status === 2) {
            return false;
        }
    }
    if (condition.star) {
        if (!(task.id in app.data.state.star)) {
            return false;
        }
    }
    return true;
}
app.util.buildMe = function(option, data){
    var friends
        , friends_data
        , sub_account
        , reload
        , user_id
        , diff
        , status;

    if (data.list_ids !== app.data.if_modified_lists) {
        option.reset = true;
    }

    if (option.reset) {
        app.fireEvent('clear');
    }

    app.fireEvent('receiveToken', data.token);

    app.data.sign = data.sign;
    app.data.state = data.account.state;
    app.data.sub_accounts = data.sub_accounts;
    app.data.if_modified_lists = data.list_ids;

    app.fireEvent('receiveSign', app.data.sign);

    if (data.notice) {
        app.fireEvent('notice', data.notice);
    }

    if (!('mute' in app.data.state)) {
        app.data.state.mute = {};
    }
    if (!('tags' in app.data.state)) {
        app.data.state.tags = {};
    }
    if (!('star' in app.data.state)) {
        app.data.state.star = {};
    }

    $.each(data.lists, function(i, list){
        app.fireEvent('registerFriends', list.users);
    });

    // localStorageのfriendsリストを更新
    for (var i = 0, max_i = data.sub_accounts.length; i < max_i; i++) {
        sub_account = data.sub_accounts[i];

        app.fireEvent('registerSubAccount', sub_account);

        // Twitter
        if (/^tw-[0-9]+$/.test(sub_account.code)) {
            if ("friends" in sub_account.data) {
                app.fireEvent('registerFriends', sub_account.data.friends,
                    sub_account.code);
            }
            if (option.setup
                && data.sign.code === sub_account.code
                && app.option.auto_sync_friends) {
                if (! app.env.development) {
                        app.api.twitter.friends(sub_account.code.substring(3), '-1', []);
                }
            }
        }

        // Facebook
        else if (/^fb-[0-9]+$/.test(sub_account.code)) {
            app.fireEvent('registerFriends', sub_account.data.friends, sub_account.code);
        }

        // E-mail
        else {

        }
    }

    data.lists.sort(function(a, b){
        return app.data.state.sort.list[a.id] - app.data.state.sort.list[b.id];
    });

    app.state.animation = false;

    var tasks = 0;
    $.each(data.lists, function(i, list){
        if (list.actioned_on > app.data.if_modified_since) {
            app.data.if_modified_since = list.actioned_on;
        }
        app.fireEvent('registerList', list);
        $.each(list.tasks, function(i, task){
            tasks++;
            app.fireEvent('registerTask', task, list);
        });
    });

    app.state.animation = true;

    //
    // var last_list_id = localStorage.getItem('last_list_id');
    // else if (option.setup || option.reset) {
    //     if (last_list_id && (last_list_id in app.data.list_map)) {
    //         app.fireEvent('openList', app.data.list_map[last_list_id]);
    //     } else if (data.lists.length) {
    //         app.fireEvent('openList', data.lists[0]);
    //     }
    //     if (option.setup && !tasks) {
    //         app.dom.show(app.dom.get('showable', 'welcome'));
    //     }
    // }

    if (option.setup && !tasks) {
        setTimeout(function(){
            app.dom.show(app.dom.get('showable', 'welcome'));
        }, 600);
    }

    if (option.setup || option.reset) {
        app.fireEvent('sortTask', 'updated_on', true);
    }

    if (option.task_id in app.data.task_map) {
        app.fireEvent('openTaskInHome', app.data.task_map[option.task_id]);
    }

    app.fireEvent('receiveMe', data);
}
app.util.findChildTasks = function(task, callback, tasks){
    if (!tasks) {
        tasks = [];
    }
    for (var id in app.data.task_map) {
        if (app.data.task_map[id].parent_id === task.id) {
            var child = app.data.task_map[id];
            tasks.push(child);
            if (callback) {
                callback(child);
            }
            app.util.findChildTasks(child, callback, tasks);
        }
    }
    return tasks;
}
app.util.isChildTask = function(task, child){
    var childs = app.util.findChildTasks(task);
    for (var i = 0, max_i = childs.length; i < max_i; i++) {
        if (childs[i].id === child.id) {
            return true;
        }
    }
    return false;
}
app.util.findParentTask = function(task){
    return app.data.task_map[task.parent_id];
}
app.util.findParentTasks = function(task){
    var parents = [], current = task;
    while (current.parent_id && current.parent_id.length && app.data.task_map[current.parent_id]) {
        var parent = app.data.task_map[current.parent_id];
        parents.push(parent);
        current = parent;
    }
    return parents;
}
app.util.hasChildTask = function(task){
    for (var task_id in app.data.task_map) {
        if (app.data.task_map[task_id].parent_id === task.id) {
            return true;
        }
    }
    return false;
}
app.util.isCloseTask = function(task){
    if (task.closed) {
        return true;
    };
    var parents = app.util.findParentTasks(task);
    for (var i = 0, max_i = parents.length; i < max_i; i++) {
        if (parents[i].closed) {
            return true;
        }
    }
    return false;
}
app.util.sortTask = function(tasks, column, reverse){
    var compareAttribute;
    if (column === 'name') {
        compareAttribute = function(a, b){
            return a.name.localeCompare(b.name);
        };
    } else if (column === 'person') {
        compareAttribute = function(a, b){
            if (a.person === b.person) {
                return (Number(a['updated_on']) || 0) - (Number(b['updated_on']) || 0);
            }
            return a.person.localeCompare(b.person);
        };
    } else {
        compareAttribute = function(a, b){
            if (a[column] === b[column]) {
                return (Number(a['updated_on']) || 0) - (Number(b['updated_on']) || 0);
            }
            return (Number(a[column]) || 0) - (Number(b[column]) || 0);
        };
    }
    var compareTask = function(a, b){
        // root直下同士
        if (!a.parent_id && !b.parent_id) {
            return compareAttribute(a, b);
        }
        // 兄弟
        else if (a.parent_id === b.parent_id) {
            return compareAttribute(a, b);
        }
        // A親 - B子
        else if (a.id === b.parent_id) {
            return reverse ? 1 : -1;
        }
        // B親 - A子
        else if (a.parent_id === b.id) {
            return reverse ? -1 : 1;
        }
        else {
            var parentsA = [a].concat(app.util.findParentTasks(a)),
                parentsB = [b].concat(app.util.findParentTasks(b)),
                compareTaskA = parentsA.pop(),
                compareTaskB = parentsB.pop();

            // 共通の親から離れるまでドリルダウン
            while (compareTaskA.id === compareTaskB.id) {
                // A親 - B子
                if (!parentsA.length) {
                    return reverse ? 1 : -1;
                }
                // B親 - A子
                else if (!parentsB.length) {
                    return reverse ? -1 : 1;
                }
                compareTaskA = parentsA.pop();
                compareTaskB = parentsB.pop();
            }

            // 兄弟
            return compareAttribute(compareTaskA, compareTaskB);
        }
    };
    tasks.sort(function(a, b){
        return compareTask(a, b);
    });
    if (reverse) {
        tasks.reverse();
    }
    return tasks;
}

app.dom.scrollTopFix = function(wrapper, target, forceTop){
    if (target.is(':first-child') || forceTop) {
        target = target.parent().parent();
    }
    var top           = wrapper.scrollTop();
    var bottom        = top + wrapper.height();
    var target_top    = top + target.offset().top - wrapper.offset().top;
    var target_bottom = target_top + target.height();
    if (target_top < top || target_bottom > bottom || forceTop) {
        wrapper.scrollTop(target_top);
    }
}

app.api.account.me = function(option){
    if (!navigator.onLine) {
        console.log('offline');
        return;
    }
    return app.ajax({
        url: '/api/1/account/me',
        data: option.data,
        dataType: 'json',
        loading: false,
        setup: option.setup
    })
    .done(function(data){
        if (data) {
            localStorage.setItem("me", JSON.stringify(data));
            app.util.buildMe(option, data);
        }
    });
}
app.api.account.update = function(params){
    return app.ajax({
        type: 'post',
        url: '/api/1/account/update',
        data: params,
        dataType: 'json',
        salvage: true,
        loading: false
    })
    .fail(function(jqXHR, textStatus, errorThrown){
        if (!jqXHR.status) {
            app.queue.push({
                api: 'account.update',
                req: params
            });
        }
    });
}
app.api.task.update = function(params){
    var list = app.data.list_map[params.list_id];
    if (!list) {
        alert('unknown list ' + params.list_id);
        return;
    }
    if (!(params.task_id in app.data.task_map)) {
        // FIXME
        return;
    }
    var action;
    var status_map = {
        0: 'reopen-task',
        1: 'start-task',
        2: 'fix-task'
    };
    if ("status" in params) {
        action = status_map[params.status];
    }
    if ("closed" in params) {
        action = params.closed ? 'close-task' : 're' +
            status_map[app.data.task_map[params.task_id].status];
    }
    if (action) {
        var time = (new Date()).getTime();
        app.data.task_map[params.task_id].actions.push({
            code: params.registrant,
            action: action,
            time: time
        });
        app.data.task_map[params.task_id].updated_on = time;
    }
    var task = $.extend({}, app.data.task_map[params.task_id], params);
    app.fireEvent('registerTask', task, list);
    app.ajax({
        type: 'POST',
        url: '/api/1/task/update',
        data: params,
        dataType: 'json',
        salvage: true,
        loading: false
    })
    .done(function(data){
        if (data.success === 1) {
            $.extend(app.data.task_map[params.task_id], data.task);
            if ("parent_id" in params) {
                app.fireEvent('sortTask');
            }
            // app.data.task_map[params.task_id].updated_on = data.task.updated_on;
            // app.fireEvent('registerTask', data.task, list); // update updated_on
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    })
    .fail(function(jqXHR, textStatus, errorThrown){
        if (!jqXHR.status) {
            app.queue.push({
                api: 'task.update',
                req: params,
                updated_on: task.updated_on
            });
            task.salvage = true;
            app.fireEvent('registerTask', task, list);
        }
    });
}
app.api.task.move = function(src_list_id, task_id, dst_list_id){
    if (src_list_id === dst_list_id) {
        alert("Can't be moved to the same list.");
        return;
    }
    return app.ajax({
        type: 'post',
        url: '/api/1/task/move',
        data: {
            task_id: task_id,
            src_list_id: src_list_id,
            dst_list_id: dst_list_id
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success === 1) {
            $.each(data.tasks, function(i, task){
                app.fireEvent('registerTask', task, app.data.list_map[dst_list_id]);
                // if (app.data.current_task && app.data.current_task.id === task.id) {
                //     app.fireEvent('openTask', task);
                // }
            });
        }
    });
}
app.api.twitter.friends = function(user_id, cursor, cache){
    var timer = setTimeout(function(){
        app.dom.show(app.dom.get('showable', 'notice-failed-sync-twitter'));
    }, 5000);
    app.ajax({
        url: 'https://api.twitter.com/1/statuses/friends.json',
        data: {
            cursor: cursor,
            user_id: user_id
        },
        dataType: 'jsonp'
    })
    .done(function(data){
        clearTimeout(timer);
        for (var i = 0, max_i = data.users.length; i < max_i; i++) {
            cache.push({
                name: data.users[i].name,
                screen_name: data.users[i].screen_name,
                code: 'tw-' + data.users[i].id_str,
                icon: data.users[i].profile_image_url
            });
        }

        // next
        if (data.next_cursor) {
            app.api.twitter.friends(user_id, data.next_cursor_str, cache);
        }

        // last
        else {
            app.fireEvent('registerFriends', cache, 'tw-' + user_id);
            app.ajax({
                url: '/api/1/twitter/update_friends',
                type: 'post',
                data: {
                    friends: JSON.stringify(cache)
                },
                dataType: 'json'
            })
            .done(function(data){
                // FIXME:
                app.dom.show(app.dom.get('showable', 'notice-succeeded-sync-twitter'));
            })
            .fail(function(){
                app.dom.show(app.dom.get('showable', 'notice-failed-sync-twitter'));
            });
        }
    });
}

app.setup.tooltip = function(ele){
    var tooltip = $('#ui-tooltip');
    var text = app.dom.text(ele);
    var show = function(){
        if (!ele.is(':visible')) {
            return;
        }
        tooltip
            .find('.tooltip-inner').text(text);
        tooltip
            .remove()
            .css({ top: 0, left: 0, display: 'block' })
            .appendTo(d.body);
        var pos = ele.offset();
        pos.width = ele.get(0).offsetWidth;
        pos.height = ele.get(0).offsetHeight;
        var left = pos.left + pos.width / 2 - tooltip.get(0).offsetWidth / 2;
        var css = {
            top: pos.top + pos.height,
            left: (left > 0 ? left : 0)
        };
        tooltip.css(css);
    };
    var timer;
    ele.hover(function(){
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(function(){
            show();
            timer = null;
        }, 800);
    }, function(){
        if (timer) {
            clearTimeout(timer);
            timer = null;
            tooltip.hide();
        } else {
            tooltip.hide();
        }
    });
}
app.setup.messages = function(ele){
    app.data.messages = ele;
}
app.setup.profile = function(ele){
    var img = ele.find('img');
    var span = ele.find('span');
    app.addListener('receiveSign', function(sign){
        img.attr('src', sign.icon.replace(/^http:\/\/a/, 'https://si'));
        span.text(sign.name);
    });
}
app.setup.switchClosed = function(ele){
    app.addListener('filterTask', function(){
        ele.removeClass('active');
    });
    ele.click(function(){
        var val = ele.hasClass('active') ? 0 : 1;
        app.fireEvent('filterTask', { closed: val });
        if (val) {
            ele.addClass('active');
        } else {
            ele.removeClass('active');
        }
    });
    app.addListener('openTaskInHome', function(task){
        if (Boolean(task.closed) !== Boolean(ele.hasClass('active'))) {
            ele.click();
        }
    });
}
app.setup.taskCounter = function(ele){
    var count = 0;
    var condition = ele.data('counter-condition');
    app.addListener('registerTask', function(task){
        if (app.util.hasChildTask(task)) {
            count = 0;
            for (var task_id in app.data.task_map) {
                if (app.util.taskFilter(app.data.task_map[task_id], condition)) {
                    count++;
                }
            }
            ele.text(count);
        } else {
            var before = (task.before && app.util.taskFilter(task.before, condition)) ? 1 : 0;
            var after = app.util.taskFilter(task, condition) ? 1 : 0;
            var add = after - before;
            if (add) {
                count+= add;
                ele.text(count);
            }
        }
    });
    app.addListener('checkMute', function(){
        count = 0;
        for (var task_id in app.data.task_map) {
            if (app.util.taskFilter(app.data.task_map[task_id], condition)) {
                count++;
            }
        }
        ele.text(count);
    });
    app.addListener('resetCounter', function(list){
        count = 0;
        for (var task_id in app.data.task_map) {
            if (app.util.taskFilter(app.data.task_map[task_id], condition)) {
                count++;
            }
        }
        ele.text(count);
    });
    app.addListener('clear', function(){
        count = 0;
        ele.text(count);
    });
}
app.setup.starCounter = function(ele){
    var count = 0;
    app.addListener('registerTask', function(task){
        if (app.util.hasChildTask(task)) {
            count = 0;
            for (var task_id in app.data.task_map) {
                if (app.util.taskFilter(app.data.task_map[task_id], {star: 1})) {
                    count++;
                }
            }
            ele.text(count);
        }
        // 初回かつOn
        else if ((!task.before || !app.util.taskFilter(task.before, {star: 1}))
            && app.util.taskFilter(task, {star: 1})) {
            count++;
            ele.text(count);
        }
        else if (task.before
            && app.util.taskFilter(task.before, {star: 1})
            && !app.util.taskFilter(task, {star: 1})) {
            count--;
            ele.text(count);
        }
    });
    app.addListener('checkStar', function(checked){
        count+= checked ? 1 : -1;
        ele.text(count);
    });
    app.addListener('clear', function(){
        count = 0;
        ele.text(count);
    });
}
app.setup.filterTask = function(ele){
    app.addListener('filterTask', function(condition){
        if (ele.is(':visible')) {
            ele.removeClass('active');
        }
    });
    // app.addListener('openList', function(){
    //     if (ele.is(':visible')) {
    //         ele.parent().removeClass('active');
    //     }
    // });
    app.addListener('clear', function(){
        ele.removeClass('active');
    });
}
app.setup.tags = function(ul){
    ul.find('a[data-tag]').each(function(i, element){
        var ele = $(element);
        var tag = ele.data('tag');
        if (tag) {
            ele.click(function(e){
                if (ele.hasClass('active')) {
                    app.fireEvent('resetTag');
                } else {
                    app.fireEvent('toggleTag', tag);
                }
                return false;
            });
        }
    });
    app.addListener('toggleTag', function(tag){
        ul.find('a[data-tag]').each(function(i, element){
            var ele = $(element);
            ele.toggleClass('active', tag === ele.data('tag'));
        });
    });
    app.addListener('resetTag', function(){
        ul.find('a[data-tag]').removeClass('active');
    });
}
app.setup.resetTag = function(ele){
    ele.click(function(){
        app.fireEvent('resetTag');
    });
}
app.setup.rightColumn = function(ele){
    var list_id_input    = ele.find('input[name=list_id]');
    var task_id_input    = ele.find('input[name=task_id]');
    var registrant_input = ele.find('input[name=registrant]');
    var status_input     = ele.find('input[name=status]');
    var closed_input     = ele.find('input[name=closed]');
    var button           = ele.find('button:first');
    var buttons          = ele.find('button:[data-plus]');
    var feelings         = ele.find('button:[data-feelings]');
    var textarea         = ele.find('textarea');
    var list_name        = ele.find('.list_name');
    var task_name        = ele.find('.task_name');
    var ul               = ele.find('ul.comments');
    var counter          = ele.find('.ui-counter');
    var template         = ul.html();


    // 初期化処理
    ul.empty();
    button.attr('disabled', true);
    buttons.attr('disabled', true);
    feelings.attr('disabled', false);

    var textarea_watch = function(){
        button.attr('disabled', !textarea.val().length);
        feelings.attr('disabled', Boolean(textarea.val().length));
        counter.text(400 - textarea.val().length);
    };
    textarea
        .change(textarea_watch)
        .keydown(textarea_watch)
        .keyup(textarea_watch)
        .bind('paste', textarea_watch);

    // Shortcut
    $(d).keydown(function(e){
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }
        if (e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }
        // if (e.shiftKey) {
        //     if (!app.data.current_task) {
        //         return;
        //     }
        //     if (!ele.is(':visible')) {
        //         return;
        //     }
        //     if (e.keyCode === 39) { // right
        //         e.preventDefault();
        //         ele.find('textarea:first').focus();
        //     }
        //     return;
        // }
        if (e.keyCode === 191) { // h
            e.preventDefault();
            if ($('#shotcut-key').is(':visible')) {
                app.fireEvent('selectTab', 'rightColumn', 'comments');
            } else {
                app.fireEvent('selectTab', 'rightColumn', 'shortcut-key');
            }
        }
    });

    buttons.click(function(e){
        var plus = $(this).data('plus');
        if (plus === 'fix') {
            status_input.val(2);
        } else if (plus === 'revert') {
            status_input.val(0);
        } else if (plus === 'close') {
            closed_input.val(1);
        }
    });
    feelings.click(function(e){
        var feelings = $(this).data('feelings');
        if (feelings) {
            textarea.val(feelings);
        }
    });

    var current_task;
    var render = function(task){
        current_task = task;
        list_id_input.val(task.list.id);
        task_id_input.val(task.id);
        registrant_input.val(app.util.getRegistrant(task.list));
        status_input.val('');
        closed_input.val('');
        list_name.text(task.list.name);
        task_name.text(task.name);
        textarea.val('');
        textarea.attr('disabled', false);
        button.attr('disabled', true);
        feelings.attr('disabled', false);
        counter.text(400);
        buttons.each(function(i, element){
            var ele = $(element);
            var plus = ele.data('plus');
            if (plus === 'fix') {
                ele.attr('disabled', !(!task.closed && task.status !== 2));
            } else if (plus === 'revert') {
                ele.attr('disabled', !(!task.closed && task.status === 2));
            } else if (plus === 'close') {
                ele.attr('disabled', Boolean(task.closed));
            }
        });
        ul.empty();
        var li = $(template);
        li.find('.icon:first').append(app.util.getIcon(task.registrant, 32));
        li.find('.icon:last').remove();
        li.find('.name').text(app.util.getName(task.registrant));
        li.find('.status').text(app.data.messages.data('text-create-task-' + app.env.lang));
        li.find('.message').remove();
        li.find('.date').text(app.date.relative(task.created_on));
        li.prependTo(ul);
        $.each(task.actions, function(i, comment){
            var li = $(template);
            li.find('.icon:first').append(app.util.getIcon(comment.code, 32));
            li.find('.name').text(app.util.getName(comment.code));
            if (comment.salvage) {
                li.addClass('salvage');
                li.find('.icon:last').remove();
            }
            if (comment.action === 'comment') {
                li.find('.status').remove();
            } else {
                li.find('.status').text(
                    app.data.messages.data('text-' + comment.action + '-' + app.env.lang));
                if (comment.action === 'start-task' || comment.action === 'fix-task') {
                    li.find('.status').addClass('label-success');
                } else if (comment.action === 'close-task') {
                    li.find('.status').addClass('closed');
                } else if (comment.action === 'reopen-task') {
                    li.find('.status').addClass('label-important');
                }
            }
            if (!comment.message) {
                li.find('.message').remove();
                li.find('.icon:last').remove();
            } else {
                if (comment.message === '[like]') {
                    li.find('.message').html('<i class="icon-heart"></i>');
                } else {
                    li.find('.message').html(
                        app.util.autolink(comment.message).replace(/\r?\n/g, '<br />'));
                }
                li.find('.icon:last').click(function(){
                    app.ajax({
                        type: 'POST',
                        url: '/api/1/comment/delete',
                        data: {
                            list_id: task.list.id,
                            task_id: task.id,
                            comment_id: comment.id
                        },
                        dataType: 'json'
                    })
                    .done(function(data){
                        if (data.success === 1) {
                            li.hide('fade');
                            app.fireEvent('registerTask', data.task, task.list);
                        } else {
                            // 現在 ステータスコード 200 の例外ケースは無い
                        }
                    });
                    return false;
                });
            }
            li.find('.date').text(app.date.relative(comment.time));
            li.prependTo(ul);
        });
    };

    app.addListener('openTask', render);
    app.addListener('registerTask', function(task){
        if (current_task &&
            current_task.id === task.id) {
            render(task);
        }
    });

    app.addListener('missingTask', function(){
        ul.empty();
        textarea.val('');
        textarea.attr('disabled', true);
        list_name.text('-');
        task_name.text('-');
        counter.text(400);
    });

    app.addListener('clear', function(){
        ul.empty();
        textarea.val('');
        textarea.attr('disabled', true);
        list_name.text('-');
        task_name.text('-');
        counter.text(400);
    });
}

app.setup.publicListWindow = function(ele){
    ele.find('input').each(function(){
        var input = $(this);
        input.click(function(e){
            e.preventDefault();
            input.select();
        });
    });
    app.addListener('publicListBegin', function(list){
        if (list.public_code) {
            app.fireEvent('publicList', list);
        } else {
            app.fireEvent('privateList', list);
        }
        ele.data('id', list.id);
        ele.find('.ui-listname').text(list.name);
        app.dom.show(ele);
    });
    app.addListener('publicList', function(list){
        ele.find('input').each(function(){
            var input = $(this);
            if (input.attr('name') === 'rss' && app.env.lang === 'ja') {
                input.val(location.protocol + '//' + location.host + '/public/'
                    + list.public_code + '/rss?lang=ja');
            } else {
                input.val(location.protocol + '//' + location.host + '/public/'
                    + list.public_code + '/' + input.attr('name'));
            }
        });
        
    });
    app.addListener('privateList', function(list){
        ele.find('input').val('');
    });
}
app.setup.publicListButton = function(ele){
    ele.click(function(e){
        e.preventDefault();
        var id = ele.parents('form').data('id');
        app.ajax({
            type: 'POST',
            url: '/api/1/list/public',
            data: {
                list_id: id
            },
            dataType: 'json'
        }).done(function(data){
            app.data.list_map[id].public_code = data.public_code;
            app.fireEvent('publicList', app.data.list_map[id]);
        });
    });
    app.addListener('publicList', function(list){
        ele.addClass('active');
    });
    app.addListener('privateList', function(list){
        ele.removeClass('active');
    });
}
app.setup.privateListButton = function(ele){
    ele.click(function(e){
        e.preventDefault();
        var id = ele.parents('form').data('id');
        app.ajax({
            type: 'POST',
            url: '/api/1/list/private',
            data: {
                list_id: id
            },
            dataType: 'json'
        }).done(function(data){
            app.data.list_map[id].public_code = null;
            app.fireEvent('privateList', app.data.list_map[id]);
        });
    });
    app.addListener('publicList', function(list){
        ele.removeClass('active');
    });
    app.addListener('privateList', function(list){
        ele.addClass('active');
    });
}

app.setup.tasksheet = function(ul){
    var list_template = ul.html();
    var task_template = ul.find('> li > ul').html();
    ul.empty();
    var current_filter = {};
    var current_task;

    var updateSort = function(){
        var sort = {};
        var lists = ul.children();
        var count = lists.length;
        lists.each(function(i, element) {
            var li = $(element);
            if (li.data('id')) {
                sort[li.data('id')] = count;
                count--;
            }
        });
        app.api.account.update({
            ns: 'state.sort',
            method: 'set',
            type: 'json',
            key: 'list',
            val: JSON.stringify(sort)
        });
    };

    app.addListener('toggleTag', function(tag){
        ul.children().each(function(i, element){
            var li = $(element);
            var id = li.data('id');
            li.toggle(Boolean((tag in app.data.state.tags) && (id in app.data.state.tags[tag])));
        });
    });

    app.addListener('resetTag', function(){
        ul.children().show();
    });

    app.addListener('registerList', function(list){
        var li = $(list_template);
        li.data('id', list.id);
        li.find('> header .name').text(list.name);
        li.find('> ul').empty();

        app.dom.setup(li);

        li.get(0).addEventListener('dragover', function(e){
            e.stopPropagation();
            if (list.id === app.data.dragtask.list.id) {
                return true;
            }
            e.preventDefault();
            // li.addClass('active');
            return false;
        });
        li.get(0).addEventListener('dragleave', function(e){
            // li.removeClass('active');
        });
        li.get(0).addEventListener('drop', function(e){
            e.stopPropagation();
            // ul.children().removeClass('active');
            // ul.slideUp('fast');
            app.api.task.move(app.data.dragtask.list.id, app.data.dragtask.id, list.id);
        }, false);

        var mute = li.find('.ui-listmenu .icon-pause').parent();
        if (list.id in app.data.state.mute) {
            mute.addClass('active');
        }
        mute.click(function(){
            var method = mute.hasClass('active') ? 'off' : 'on';
            app.api.account.update({
                ns: 'state',
                method: method,
                key: 'mute',
                val: list.id
            })
            .done(function(data){
                if (data.success === 1) {
                    app.data.state.mute = data.account.state.mute;
                    app.fireEvent('checkMute', list, mute.hasClass('active'));
                    mute[ mute.hasClass('active') ? 'removeClass' : 'addClass' ]('active');
                } else {
                    // 現在 ステータスコード 200 の例外ケースは無い
                }
            });
        });
        li.find('.symbol').addClass('symbol-clear');
        li.find('.ui-tags a').each(function(i, element){
            var ele = $(element);
            var tag = ele.data('tag');
            if (tag) {
                if (tag in app.data.state.tags &&
                    list.id in app.data.state.tags[tag]) {
                    ele.addClass('active');
                    li.find('.symbol-' + tag).removeClass('symbol-clear');
                }
                ele.click(function(e){
                    app.api.account.update({
                        ns: 'state.tags',
                        method: (ele.hasClass('active') ? 'off' : 'on'),
                        key: tag,
                        val: list.id
                    })
                    .done(function(data){
                        if (data.success === 1) {
                            app.data.state.tags = data.account.state.tags;
                            ele.toggleClass('active');
                            li.find('.symbol-' + tag)
                                .toggleClass('symbol-clear', !ele.hasClass('active'));
                            app.fireEvent('checkTag', list, tag, ele.hasClass('active'));
                        } else {
                            // 現在 ステータスコード 200 の例外ケースは無い
                        }
                    });
                });
            }
        });
        li.find('.ui-listmenu .icon-chevron-up').parent().click(function(e){
            var prev = li.prevAll(':first');
            if (prev.length) {
                prev.before(li);
                updateSort();
            }
        });
        li.find('.ui-listmenu .icon-chevron-down').parent().click(function(e){
            var next = li.nextAll(':first');
            if (next.length) {
                next.after(li);
                updateSort();
            }
        });
        li.find('.ui-listmenu .icon-signal').parent().click(function(e){
            app.fireEvent('publicListBegin', list);
        });
        if (list.public_code) {
            li.find('.ui-listmenu .icon-signal').parent().addClass('active');
        }
        li.find('.ui-listmenu .icon-edit').parent().click(function(e){
            app.fireEvent('editList', list);
        });
        li.find('.ui-normal .ui-edit').click(function(e){
            if (current_task) {
                app.fireEvent('editTask', current_task);
            }
        });
        li.find('.ui-normal .ui-sub').click(function(e){
            if (current_task) {
                app.fireEvent('createSubTask', current_task);
            }
        });
        if (list.original) {
            li.find('.ui-listmenu .icon-remove-sign').parent().attr('disabled', true);
        } else {
            li.find('.ui-listmenu .icon-remove-sign').parent().click(function(e){
                app.fireEvent('deleteListBegin', list);
            });
        }
        var dropdown = li.find('.ui-submenu');
        dropdown.find('> a').click(function(e){
            dropdown.toggleClass('open');
            return false;
        });
        $('html').on('click', function(){
            dropdown.removeClass('open');
        });
        if (list.description) {
            li.find('.ui-description').html(app.util.autolink(list.description).replace(/\r?\n/g, '<br />'));
            li.find('> header .name')
                .css('cursor', 'pointer')
                .append($('<i class="icon-info-sign"/>'))
                .click(function(e){
                    li.find('.ui-description').slideToggle();
                });
        }

        if (list.members.length) {
            var members = [list.owner].concat(list.members);
            for (var i = 0, max_i = members.length; i < max_i; i++) {
                var code = members[i];
                var friend = app.data.users[code];
                var icon = app.util.getIcon(code, 24);
                icon.data('code', code);
                icon.click(function(){
                    app.fireEvent('createTask', list, $(this).data('code'));
                });
                $('<li/>')
                    .append(icon)
                    .addClass('member sq24')
                    .appendTo(li.find('ul.members'));
            }
        }

        if (list.id in app.data.listli_map) {
            li.find('> ul.tasks').append(
                app.data.listli_map[list.id].find('> ul.tasks').children());
            li.css('display', app.data.listli_map[list.id].css('display'));
            app.data.listli_map[list.id].after(li);
            app.data.listli_map[list.id].remove();
        } else {
            li.prependTo(ul);
        }
        app.data.listli_map[list.id] = li;
    });

    app.addListener('deleteList', function(list){
        app.data.listli_map[list.id].remove();
        delete app.data.listli_map[list.id];
    });

    app.addListener('publicList', function(list){
        app.data.listli_map[list.id].find('.icon-signal').parent().addClass('active');
    });

    app.addListener('privateList', function(list){
        app.data.listli_map[list.id].find('.icon-signal').parent().removeClass('active');
    });

    app.addListener('registerTask', function(task, list, slide){
        var ul = app.data.listli_map[task.list.id].find('> ul');
        var li = $(task_template);
        li.data('id', task.id);
        app.dom.setup(li, task);
        app.setup.task(li, task);
        if (task.id in app.data.taskli_map) {
            var li_before = app.data.taskli_map[task.id];
            if (!li_before.data('visible')) {
                li.data('visible', false);
                li.hide();
            } else {
                li.data('visible', true);
            }
            if (li_before.hasClass('selected')) {
                li.addClass('selected');
            }
            // 置き換え元との高さ合わせ
            var paddingLeft = parseInt(li_before.css('paddingLeft'), 10);
            if (paddingLeft) {
                li.css('paddingLeft', paddingLeft + 'px');
            } else {
                li.css('paddingLeft', '4px');
            }
            // 置き換え
            if (task.before &&
                task.before.list.id !== task.list.id) {
                ul.append(li);
            } else {
                li_before.after(li);
            }
            li_before.remove();
            app.data.taskli_map[task.id] = li;
            if (app.util.taskFilter(task, current_filter)) {
                if (!li.data('visible')) {
                    li.data('visible', true);
                    app.dom.slideDown(li);
                    app.util.findChildTasks(task, function(child){
                        if (child.id && app.data.taskli_map[child.id]) {
                            var child_li = app.data.taskli_map[child.id];
                            if (!app.util.taskFilter(child, current_filter)) {
                                return ;
                            }
                            if (!child_li.data('visible')) {
                                child_li.data('visible', true);
                                app.dom.slideDown(child_li);
                            }
                        }
                    });
                }
                if (current_task &&
                    current_task.id === task.id) {
                    app.fireEvent('openTask', task);
                }
            } else {
                if (li.data('visible')) {
                    li.data('visible', false);
                    app.dom.slideUp(li);
                    app.util.findChildTasks(task, function(child){
                        if (child.id && app.data.taskli_map[child.id]) {
                            if (app.util.taskFilter(child, current_filter)) {
                                return ;
                            }
                            if (app.data.taskli_map[child.id].data('visible')) {
                                app.data.taskli_map[child.id].data('visible', false);
                                app.dom.slideUp(app.data.taskli_map[child.id]);
                            }
                        }
                    });
                }
                if (current_task &&
                    current_task.id === task.id) {
                    var next = li.nextAll(':visible:first');
                    if (!next.length) {
                        next = li.prevAll(':visible:first');
                    }
                    if (next.length) {
                        app.fireEvent('openTask', app.data.task_map[next.data('id')]);
                    } else {
                        app.fireEvent('missingTask');
                    }
                }
            }
        } else {
            li.hide();
            if (task.parent_id in app.data.taskli_map) {
                app.data.taskli_map[task.parent_id].after(li);
                var paddingLeft = parseInt(app.data.taskli_map[task.parent_id].css('paddingLeft'), 10);
                if (paddingLeft) {
                    li.css('paddingLeft', (paddingLeft + 18) + 'px');
                }
            } else {
                li.prependTo(ul);
            }
            if ((!current_filter && !task.closed) ||
                (current_filter &&
                 app.util.taskFilter(task, current_filter))) {
                li.data('visible', true);
                app.dom.slideDown(li);
            } else {
                li.data('visible', false);
            }
        }
        app.data.taskli_map[task.id] = li;
    });

    app.addListener('openTask', function(task, forceTop){
        if (!ul.is(':visible')) { return }

        ul.find('> li > ul > li').removeClass('selected');
        ul.find('> li > header .ui-edit, > li > header .ui-sub').attr('disabled', true);
        if (task.id in app.data.taskli_map) {
            app.data.taskli_map[task.id].addClass('selected');
            app.data.taskli_map[task.id].parent().parent()
                .find('> header .ui-edit, > header .ui-sub').attr('disabled', false);
            app.dom.scrollTopFix(ul.parent(), app.data.taskli_map[task.id], forceTop);
        }
        current_task = task;
    });

    app.addListener('selectTab', function(group, id){
        if (group === 'viewer' && id === 'task') {
            var hash = w.location.hash;
            if (hash) {
                var str = hash.match(/^#(\d+)-(\d+:\d+)$/);
                if (str) {
                    var task = app.data.task_map[str[2]];
                    if (task) {
                        app.fireEvent('openTask', task);
                    }
                }
            }
        }
    });

    app.addListener('openNextTask', function(skip){
        if (!ul.is(':visible')) {
            return;
        }
        var next;
        if (current_task) {
            if (!skip) {
                next = app.data.taskli_map[current_task.id].nextAll(':visible:first');
            }
            if (!next || !next.length) {
                app.data.listli_map[current_task.list.id]
                    .nextAll(':visible')
                    .each(function(i, li){
                        next = $(li).find('> ul > li:visible:first');
                        if (next.length) {
                            return false;
                        }
                    });
            }
        }
        if (!next || !next.length) {
            next = ul.find('> li > ul > li:visible:first');
        }
        if (next && next.length) {
            var next_id = next.data('id');
            if (!(next_id in app.data.task_map)) {
                return;
            }
            app.fireEvent('openTask', app.data.task_map[next_id], skip);
        }
    });

    app.addListener('openPrevTask', function(skip){
        if (!ul.is(':visible')) {
            return;
        }
        var next;
        if (current_task) {
            if (!skip) {
                next = app.data.taskli_map[current_task.id].prevAll(':visible:first');
            }
            if (!next || !next.length) {
                app.data.listli_map[current_task.list.id]
                    .prevAll(':visible')
                    .each(function(i, li){
                        next = skip
                             ? $(li).find('> ul > li:visible:first')
                             : $(li).find('> ul > li:visible:last');
                        if (next.length) {
                            return false;
                        }
                    });
            }
        }
        if (!next || !next.length) {
            next = ul.find('> li > ul > li:visible:last');
            if (next && next.length && skip) {
                var top = next.prevAll(':visible:last');
                if (top) {
                    next = top;
                }
            }
        }
        if (next && next.length) {
            var next_id = next.data('id');
            if (!(next_id in app.data.task_map)) {
                return;
            }
            app.fireEvent('openTask', app.data.task_map[next_id], skip);
        }
    });
    
    app.addListener('sortTask', function(column, reverse){
        var tasks = [],
            resort = false;
        for (var task_id in app.data.task_map) {
            tasks.push(app.data.task_map[task_id]);
        }
        if (!column) {
            column = app.data.current_sort.column;
            reverse = app.data.current_sort.reverse;
            resort = true;
        }
        if (!resort
            && app.data.current_sort.column === column
            && app.data.current_sort.reverse === reverse) {
            reverse = reverse ? false : true;
        }
        app.util.sortTask(tasks, column, reverse);
        for (var i = 0, max_i = tasks.length; i < max_i; i++) {
            var li = app.data.taskli_map[tasks[i].id];
            var parents = app.util.findParentTasks(tasks[i]);
            if (parents.length) {
                li.css('paddingLeft', ((parents.length * 18) + 4) + 'px');
            } else {
                li.css('paddingLeft', '4px');
            }
            app.data.listli_map[tasks[i].list.id].find('> ul').append(li);
        }
        app.data.current_sort.column = column;
        app.data.current_sort.reverse = reverse;
    });
    
    app.addListener('filterTask', function(condition){
        if (!ul.is(':visible')) {
            return;
        }
        current_filter = condition;
        var hasVisible = {};
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            var li = app.data.taskli_map[task_id];
            if (app.util.taskFilter(task, condition)) {
                hasVisible[task.list.id] = true;
                li.show();
                if (!li.data('visible')) {
                    li.data('visible', true);
                    if (!task.parent_id) {
                        li.css('paddingLeft', '4px');
                    }
                }
            } else {
                if (li.data('visible')) {
                    li.data('visible', false);
                    li.hide();
                }
                if (current_task &&
                    current_task.id === task.id) {
                    app.fireEvent('missingTask');
                }
            }
        }
        
        if (condition.closed) {
            ul.find('> li > header li.ui-normal, > li > header ul.members, > li > header li.ui-submenu').hide();
            ul.find('> li > header li.ui-clear').show();
        } else {
            ul.find('> li > header li.ui-clear').hide();
            ul.find('> li > header li.ui-normal, > li > header ul.members, > li > header li.ui-submenu').show();
        }

        ul.children().each(function(){
            var li = $(this);
            if (li.data('id') in hasVisible) {
                li.show();
            } else {
                li.hide();
            }
        });
    });
    
    app.addListener('clearList', function(list){
        var is_remove = function(task){
            if (list.id !== task.list.id) {
                return false;
            }
            if (task.closed) {
                return true;
            }
            if (task.parent_id) {
                var parent = app.data.task_map[task.parent_id];
                if (!parent || parent.closed) {
                    return true;
                }
            }
            return false;
        };
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            var parentTask = app.util.findParentTask(task);
            if (is_remove(task)) {
                if (task_id in app.data.taskli_map) {
                    if (current_task &&
                        current_task.id === task_id) {
                        app.fireEvent('missingTask');
                    }
                    app.data.taskli_map[task_id].remove();
                    delete app.data.taskli_map[task_id];
                }
                delete app.data.task_map[task_id];
            }
        }
    });
    
    app.addListener('missingTask', function(){
        // if (current_task &&
        //     current_task.id in app.data.taskli_map) {
        //     app.data.taskli_map[current_task.id].removeClass('selected');
        // }
        ul.find('> li > ul > li').removeClass('selected');
        ul.find('> li > header .ui-edit, > li > header .ui-sub').attr('disabled', true);
        current_task = null;
    });

    app.addListener('clear', function(){
        ul.empty();
        app.data.listli_map = {};
        app.data.taskli_map = {};
    });

    app.addListener('openNextList', function(){
        if (!ul.is(':visible')) {
            return;
        }
        app.fireEvent('openNextTask', true);
    });

    app.addListener('openPrevList', function(){
        if (!ul.is(':visible')) {
            return;
        }
        app.fireEvent('openPrevTask', true);
    });
    
    app.addListener('checkStar', function(on, task){
        var li = app.data.taskli_map[task.id];
        var i = li.find('.icon-star');
        if (on) {
            i.removeClass('icon-gray');
        } else {
            i.addClass('icon-gray');
        }
    });

    $(d).keydown(function(e){
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }
        if (e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }
        if (app.state.tab.viewer &&
            app.state.tab.viewer !== 'task') {
            return;
        }
        e.preventDefault();
        if (e.shiftKey) {
            if (e.keyCode === 67) { // C
                if (current_task) {
                    var form = app.dom.get('showable', 'clear-list-window');
                    form.data('id', current_task.list.id);
                    app.dom.show(form);
                }
            } else if (e.keyCode === 78) { // N
                if (current_task) {
                    app.fireEvent('createSubTask', current_task);
                }
            }
            return;
        }
        if (e.keyCode === 78) { // N
            var list = current_task
                     ? current_task.list
                     : app.data.list_map[ul.find('> li:first').data('id')];
            app.fireEvent('createTask', list);
        } else if (e.keyCode === 37 || e.keyCode === 72) { // Left / H
            var task = current_task;
            var today = new Date();
            var due;
            if (task.due_date && task.due_date.getTime() > today.getTime()) {
                due = app.date.mdy(new Date(task.due_date.getTime() - (24 * 60 * 60 * 1000)));
            } else {
                due = '';
            }
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                due: due
            });
        } else if (e.keyCode === 39 || e.keyCode === 76) { // Right / L
            var task = current_task;
            var today = new Date();
            var date;
            if (task.due_date && task.due_date.getTime() > today.getTime()) {
                date = new Date(task.due_date.getTime() + (24 * 60 * 60 * 1000));
            } else {
                date = new Date(today.getTime() + (24 * 60 * 60 * 1000));
            }
            var due = app.date.mdy(date);
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                due: due
            });
        } else if (e.keyCode === 32) { // Space
            var task = current_task;
            var status = task.status >= 2 ? 0 : task.status + 1;
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                status: status
            });
        } else if (e.keyCode === 13) { // Enter
            var task = current_task;
            var closed = task.closed ? 0 : 1;
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                closed: closed
            });
        } else if (e.keyCode === 59 || e.keyCode === 186) { // :;*
            var task = current_task;
            var method = 'on';
            if (task.id in app.data.state.star) {
                method = 'off';
                delete app.data.state.star[task.id];
            } else {
                app.data.state.star[task.id] = 1;
            }
            app.api.account.update({
                ns: 'state',
                method: method,
                key: 'star',
                val: task.id
            });
            app.fireEvent('checkStar', method === 'on', task);
        } else if (e.keyCode === 80) { // P
            var task = current_task;
            var pending = task.pending ? 0 : 1;
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                pending: pending
            });
        } else if (e.keyCode === 69) { // E
            var task = current_task;
            app.fireEvent('editTask', task);
        }
    });
}
app.setup.task = function(ele, task){
    if (!task) return;
    if (task.salvage) {
        ele.addClass('salvage');
    }
    if (task.pending) {
        ele.addClass('pending');
    }
    // draggable
    ele.get(0).addEventListener('dragstart', function(e){
        ele.addClass('dragging');
        app.data.dragtask = task;
        app.fireEvent('moveTask', task);
        e.dataTransfer.setData("text", task.id);
    }, false);
    ele.get(0).addEventListener('dragend', function(e){
        ele.removeClass('dragging');
        app.data.dragtask = null;
        app.fireEvent('moveTaskCancel');
        e.dataTransfer.clearData();
    }, false);
    // droppable
    ele.get(0).addEventListener('dragover', function(e){
        e.stopPropagation();
        if (task.id === app.data.dragtask.id) {
            return true;
        }
        if (task.list.id !== app.data.dragtask.list.id) {
            return true;
        }
        if (app.util.isChildTask(app.data.dragtask, task)) {
            return true;
        }
        if (task.id === app.data.dragtask.parent_id) {
            return true;
        }
        // ele.addClass('active');
        e.preventDefault();
        return false;
    });
    ele.get(0).addEventListener('dragleave', function(e){
        // ele.removeClass('active');
    });
    ele.get(0).addEventListener('drop', function(e){
        e.preventDefault();
        e.stopPropagation();
        // 念の為
        if (task.id === app.data.dragtask.id) {
            return true;
        }
        app.api.task.update({
            list_id: app.data.dragtask.list.id,
            task_id: app.data.dragtask.id,
            registrant: app.util.getRegistrant(app.data.dragtask.list),
            parent_id: task.id
        });
    }, false);
    ele.click(function(e){
        e.stopPropagation();
        app.fireEvent('openTask', task);
    });
    ele.dblclick(function(e){
        e.stopPropagation();
        app.fireEvent('editTask', task);
    });
}
app.setup.status = function(ele, task){
    if (!task) return;
    if (task.status > 0) {
        ele.removeClass('icon-tasks-off')
    }
    if (task.status === 1) {
        ele.addClass('icon-tasks-half');
    } else if (task.status === 2) {
        ele.addClass('icon-tasks');
    }
    var status = task.status === 2 ? 0 : task.status + 1;
    ele.click(function(e){
        e.stopPropagation();
        app.api.task.update({
            list_id: task.list.id,
            task_id: task.id,
            registrant: app.util.getRegistrant(task.list),
            status: status
        });
    });
}
app.setup.star = function(ele, task){
    if (!task) return;
    var i = ele.find('i');
    if (!(task.id in app.data.state.star)) {
        i.addClass('icon-gray');
    }
    ele.click(function(e){
        e.stopPropagation();
        var method = 'on';
        if (task.id in app.data.state.star) {
            method = 'off';
            delete app.data.state.star[task.id];
        } else {
            app.data.state.star[task.id] = 1;
        }
        app.api.account.update({
            ns: 'state',
            method: method,
            key: 'star',
            val: task.id
        });
        app.fireEvent('checkStar', method === 'on', task);
    });
}
app.setup.human = function(ele, task){
    if (!task) return;
    var size = ele.data('human-size') || 16;
    ele.prepend(app.util.getIcon(task.requester, size));
    if (task.assign.length) {
        ele.prepend($('<span class="icon"><i class="icon-chevron-left"></i></span>'));
        $.each(task.assign, function(i, assign){
            ele.prepend(app.util.getIcon(assign, size));
        });
    }
    if (task.status == 2 && task.assign.length) {
        ele.prepend($('<span class="icon"><i class="icon-chevron-left"></i></span>'));
        ele.prepend(app.util.getIcon(task.requester, size));
    }
}
app.setup.name = function(ele, task){
    if (!task) return;
    ele.text(task.name);
}
app.setup.close = function(ele, task){
    if (!task) return;
    if (task.closed) {
        ele.parent().addClass('closed');
        ele.find('i').removeClass('icon-remove').addClass('icon-plus');
    } else {
        ele.find('i').removeClass('icon-plus').addClass('icon-remove');
    }
    ele.click(function(e){
        e.stopPropagation();
        app.api.task.update({
            list_id: task.list.id,
            task_id: task.id,
            registrant: app.util.getRegistrant(task.list),
            closed: (task.closed ? 0 : 1)
        });
    });
}
app.setup.pending = function(ele, task){
    if (!task) return;
    if (task.pending) {
        ele.parent().addClass('pending');
        ele.find('i').removeClass('icon-gray');
    } else {
        ele.find('i').addClass('icon-gray');
    }
    ele.click(function(e){
        e.preventDefault();
        e.stopPropagation();
        app.api.task.update({
            list_id: task.list.id,
            task_id: task.id,
            registrant: app.util.getRegistrant(task.list),
            pending: (task.pending ? 0 : 1)
        });
    });
}
app.setup.due = function(ele, task){
    if (!task) return;
    if (task.due) {
        var week = app.env.lang === 'ja'
            ? app.WEEK_NAMES_JA[task.due_date.getDay()]
            : app.WEEK_NAMES[task.due_date.getDay()];
        var label = (task.due_date.getMonth() + 1) + '/' + task.due_date.getDate();
        var now = new Date();
        if (now.getFullYear() !== task.due_date.getFullYear()) {
            if (app.env.lang === 'ja') {
                label = task.due_date.getFullYear() + '/' + label;
            } else {
                label = label + '/' + task.due_date.getFullYear();
            }
        }
        // if (app.env.lang === 'ja') {
        //     ele.text(label + ' (' + week + ')');
        // } else {
        // }
        ele.text(label);
        ele.append($('<span/>').text('(' + week + ')'));
        if (now.getTime() > task.due_date.getTime()) {
            ele.addClass('over');
        }
    } else {
        ele.text('');
    }
}
app.setup.recent = function(ele, task){
    if (!task) return;
    if (task.recent) {
        var size = ele.find('.icon').data('human-size') || 16;
        ele.find('.icon').append(app.util.getIcon(task.recent.code, size));
        var date = app.date.relative(task.recent.time);
        if (task.recent.message) {
            if (task.recent.message === '[like]') {
                ele.find('.message i').attr('class', 'icon-heart');
                ele.find('.message span').text(date);
            } else {
                ele.find('.message span').text(task.recent.message + ' ' + date);
            }
        } else {
            ele.find('.message i').attr('class', 'icon-info-sign');
            ele.find('.message span').text(
                app.data.messages.data('text-'
                    + task.recent.action + '-' + app.env.lang)
                + ' ' + date);
        }
    } else {
        ele.hide();
    }
}
app.setup.registerTaskWindow = function(form){

    //
    var h3 = form.find('.modal-header > h3');
    var assign_input = form.find('input[name=assign]');
    var assign_list = form.find('ul.assign');
    var assign_template = assign_list.html();
    var name_input = form.find('input[name=name]');
    var due_input = form.find('input[name=due]');
    var requester_select = form.find('select[name=requester]');
    var registrant_input = form.find('input[name=registrant]');
    var task_id_input = form.find('input[name=task_id]');
    var list_id_input = form.find('input[name=list_id]');
    var parent_id_input = form.find('input[name=parent_id]');

    var due_week = form.find('.week');
    var due_wrap = due_input.parent().parent();
    var due_check = function(e){
        var val = due_input.val();
        var date;
        if (val === 'today' || val === '今日') {
            date = new Date();
        } else if (val === 'tomorrow' || val === '明日') {
            date = new Date();
            date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
        } else if (val === 'next week' || val === '来週') {
            date = new Date();
            date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
        }
        if (date && e && e.type === 'change') {
            due_input.val(app.date.ymd(date));
        }
        if (!val || /^\d{4}-\d{1,2}-\d{1,2}$/.test(val) || date) {
            due_wrap.removeClass('error');
            if (val) {
                if (!date) {
                    date = app.date.parse(String(val));
                }
                due_week.text(
                    app.env.lang === 'ja'
                        ? app.WEEK_NAMES_JA[date.getDay()]
                        : app.WEEK_NAMES[date.getDay()]
                );
            } else {
                due_week.text('');
            }
        } else {
            due_wrap.addClass('error');
            due_week.text('');
        }
    };
    due_input
        .change(due_check)
        .keydown(due_check)
        .keyup(due_check)
        .bind('paste', due_check);

    form.find('a.due-plus').click(function(e){
        e.preventDefault();
        var due = due_input.val();
        var date = due ? app.date.parse(String(due)) : (new Date());
        if (!date || isNaN(date)) {
            date = new Date();
        }
        date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
        due_input.val(app.date.ymd(date));
        due_check();
    });

    form.find('a.due-minus').click(function(e){
        e.preventDefault();
        var due = due_input.val();
        var date = due ? app.date.parse(String(due)) : (new Date());
        if (!date || isNaN(date)) {
            date = new Date();
        }
        date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
        due_input.val(app.date.ymd(date));
        due_wrap.removeClass('error');
        due_check();
    });

    var setup = function(list, parentTask, assignMember){
        form.find('.ui-listname').text(list.name);
        assign_list.empty();
        requester_select.empty();
        due_week.text('');

        var registrant = app.util.getRegistrant(list);
        if (list.members.length) {
            form.find('.team').show();
            var assigns = [list.owner].concat(list.members);
            for (var i = 0, max_i = assigns.length; i < max_i; i++) {
                var assign = assigns[i];
                var friend = app.data.users[assign];
                var li = $(assign_template);
                if (friend && friend.icon) {
                    li.find('img').attr('src', friend.icon);
                } else {
                    li.find('img').attr('src', '/static/img/address.png');
                }
                var name = friend ? friend.name : assign;
                li.find('div.name').text(name);
                li.find('input').val(assign);
                li.find('input[type="checkbox"]')
                    .focus(function(){$(this).parent().addClass('focused')})
                    .blur(function(){$(this).parent().removeClass('focused')})
                    .attr('checked', friend.code === assignMember);
                li.appendTo(assign_list);

                $('<option/>')
                    .attr('value', assign)
                    .text(name)
                    .appendTo(requester_select);
            }
            // 依頼者のデフォルトは自分
            requester_select.val(registrant);
        } else {
            form.find('.team').hide();
        }
        
        registrant_input.val(registrant);
        task_id_input.val('');
        list_id_input.val(list.id);
        if (parentTask) {
            h3.text(app.dom.text(h3, 'sub'));
            form.find('.parent-task span').text(parentTask.name);
            form.find('.parent-task').show();
            parent_id_input.val(parentTask.id);
        } else {
            h3.text(app.dom.text(h3));
            form.find('.parent-task').hide();
            parent_id_input.val('');
        }
    };

    app.addListener('createTask', function(list, assignMember){
        app.dom.reset(form);
        if (!list) {
            alert('missing current_list');
            return;
        }
        setup(list, null, assignMember);
        app.dom.show(form);
    });

    app.addListener('createSubTask', function(parentTask){
        app.dom.reset(form);
        // if (!app.data.current_list) {
        //     alert('missing current_list');
        //     return;
        // }
        // if (parentTask.parent_id) {
        //     app.fireEvent('alert', 'task-nest-limit');
        //     return;
        // }
        setup(parentTask.list, parentTask);
        app.dom.show(form);
    });

    app.addListener('editTask', function(task){
        app.dom.reset(form);
        // if (!app.data.current_list) {
        //     alert('missing current_list');
        //     return;
        // }
        // console.log(task.list);
        setup(task.list, app.data.task_map[task.parent_id]);
        name_input.val(task.name);
        if (task.due) {
            due_input.val(app.date.ymd(task.due_date));
            due_check();
        }
        requester_select.val(task.requester);
        task_id_input.val(task.id);
        form.find('input[name=assign]').val(task.assign);
        if (task.due) {
            due_input.val(app.date.ymd(task.due_date));
        }
        app.dom.show(form);
    });
}
app.setup.timeline = function(ul){
    var is_me = ul.data('timeline') === 'me' ? true : false;
    var template = ul.html();
    ul.empty();
    app.addListener('receiveMe', function(data){
        ul.empty();
        var actions = [];
        $.each(data.lists, function(i, list){
            $.each(list.tasks, function(ii, task){
                task.list = list;
                if (task.due) {
                    var degits = task.due.match(/[0-9]+/g);
                    task.due_epoch = (new Date(degits[2], degits[0] - 1, degits[1])).getTime();
                }
                if (Boolean(app.util.findMe([task.registrant])) === is_me) {
                    actions.push({
                        task: task,
                        action: 'create-task',
                        code: task.registrant,
                        time: task.created_on
                    });
                }
                $.each(task.actions, function(iii, action){
                    action.task = task;
                    if (Boolean(app.util.findMe([action.code])) === is_me) {
                        actions.push(action);
                    }
                });
            });
        });
        actions.sort(function(a, b){
            return b.time - a.time;
        });
        if (!actions.length) {
            ul.append($('<li/>').text(ul.data('text-empty-' + app.env.lang)));
        }
        $.each(actions, function(i, action){
            var li = $(template);
            li.find('.icon').append(app.util.getIcon(action.code, 32));
            li.find('.listname').text(action.task.list.name);
            li.find('.taskname').text(action.task.name);
            li.find('.name').text(app.util.getName(action.code));
            if (action.message) {
                if (action.message === '[like]') {
                    li.find('.message').html('<i class="icon-heart"></i>');
                } else {
                    li.find('.message').html(
                        app.util.autolink(action.message).replace(/\r?\n/g, '<br />'));
                }
            } else {
                li.find('.message').remove();
            }
            li.find('.date').text(app.date.relative(action.time));
            li.find('.status').text(
                app.data.messages.data('text-' + action.action + '-' + app.env.lang));
            if (action.action === 'start-task' || action.action === 'fix-task') {
                li.find('.status').addClass('label-success');
            } else if (action.action === 'close-task') {
                li.find('.status').addClass('closed');
            } else if (action.action === 'reopen-task') {
                li.find('.status').addClass('label-important');
            }
            li.click(function(e){
                e.preventDefault();
                app.fireEvent('openTaskInHome', action.task);
            });
            li.appendTo(ul);
            if (i > 100) {
                return false;
            }
        });
    });
}

app.click.reload = function(){
    app.fireEvent('reload');
}
app.click.createTask = function(ele){
    app.fireEvent('createTask', app.data.list_map[ele.parents('li.list:first').data('id')]);
}
app.click.filterTask = function(ele){
    if (ele.hasClass('active')) {
        app.fireEvent('filterTask', {});
        ele.removeClass('active');
    } else {
        app.fireEvent('filterTask', ele.data('filter-condition'));
        ele.addClass('active');
    }
}
app.click.clearList = function(ele){
    var list = app.data.list_map[ele.parents('li.list:first').data('id')];
    var form = app.dom.get('showable', 'clear-list-window');
    form.data('id', list.id);
    app.dom.show(form);
}

app.submit.clearList = function(form){
    app.ajax({
        type: 'POST',
        url: '/api/1/list/clear',
        data: {
            list_id: form.data('id')
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success === 1) {
            app.fireEvent('clearList', data.list);
            app.fireEvent('resetCounter');
            app.dom.hide(app.dom.get('showable', 'clear-list-window'));
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    });
}
app.submit.registerTask = function(form){
    var task_id = form.find('input[name=task_id]').val();
    var list_id = form.find('input[name=list_id]').val();
    var assign = form.find('input[name="assign"]:checked')
                     .map(function(){return $(this).val()}).get();
    var requester = form.find('select[name="requester"]').val();
    var registrant = form.find('input[name="registrant"]').val();
    var name = form.find('input[name="name"]').val();
    var due = form.find('input[name="due"]').datepicker("getDate");
    if (due) {
        due = app.date.mdy(due);
    }
    if (typeof assign !== 'object') {
        assign = assign ? [assign] : [];
    }
    var list = app.data.list_map[list_id];
    if (!list) {
        alert('unknown list ' + list_id);
        return;
    }
    var api = task_id ? 'task.update' : 'task.create';
    var url = task_id ? '/api/1/task/update' : '/api/1/task/create';
    app.ajax({
        type: 'POST',
        url: url,
        data: form.serialize(),
        dataType: 'json',
        salvage: true
    })
    .done(function(data){
        if (data.success === 1) {
            app.fireEvent('registerTask', data.task, list, !task_id);
            app.fireEvent('openTask', data.task);
            app.dom.reset(form);
            if (task_id) {
                app.dom.hide(form);
            } else {
                var twipsy = app.dom.get('showable', 'create-task-twipsy');
                var li = app.data.taskli_map[data.task.id];
                twipsy.css('top',
                    li.offset().top
                    - twipsy.height()
                    - twipsy.parent().offset().top
                    + 'px');
                app.dom.show(twipsy);
            }
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    })
    .fail(function(jqXHR, textStatus, errorThrown){
        if (!jqXHR.status) {
            app.queue.push({
                api: api,
                req: form.serializeArray()
            });
            app.dom.reset(form);
            var time = (new Date()).getTime();
            var task = {
                id: (task_id || (list.id + ':' + time)),
                requester: requester,
                registrant: registrant,
                assign: assign,
                name: name,
                due: due,
                status: 0,
                closed: 0,
                actions: [],
                created_on: time,
                updated_on: time,
                salvage: true
            };
            app.fireEvent('registerTask', task, list);
            app.fireEvent('openTask', task);
            app.dom.reset(form);
            if (task_id) {
                app.dom.hide(form);
            } else {
                app.dom.show(app.dom.get('showable', 'create-task-twipsy'));
            }
        }
    });
}
app.submit.registerComment = function(form){
    var task_id = form.find('input[name=task_id]').val();
    var list_id = form.find('input[name=list_id]').val();
    var registrant = form.find('input[name=registrant]').val();
    var list = app.data.list_map[list_id];
    if (!list) {
        alert('unknown list ' + list_id);
        return false;
    }
    var textarea = form.find('textarea:first');
    var message = textarea.val();
    var url = '/api/1/comment/create';
    if (!message.length) {
        if (form.find('input[name=status]').val() ||
            form.find('input[name=closed]').val()) {
            url = '/api/1/task/update';
        } else {
            return false;
        }
    }
    if (message.length > 400) {
        alert('400 over.');
        return false;
    }
    app.ajax({
        type: 'POST',
        url: url,
        data: form.serialize(),
        dataType: 'json',
        salvage: true
    })
    .done(function(data){
        if (data.success === 1) {
            app.dom.reset(form);
            app.fireEvent('registerTask', data.task, list);
            app.fireEvent('openTask', data.task);
            textarea.focus();
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    })
    .fail(function(jqXHR, textStatus, errorThrown){
        if (!jqXHR.status) {
            app.queue.push({
                api: 'comment.create',
                req: form.serializeArray()
            });
            app.dom.reset(form);
            var task = app.data.task_map[task_id];
            if (task) {
                task.actions.push({
                    action: 'comment',
                    code: registrant,
                    message: message,
                    time: (new Date()).getTime(),
                    salvage: true
                });
                app.fireEvent('registerTask', task, list);
                app.fireEvent('openTask', task);
            }
            document.activeElement.blur();
        }
    });
}

$(d).keydown(function(e){
    if (document.activeElement.tagName !== 'BODY') {
        return;
    }
    if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
    }
    if (e.shiftKey) {
        if (e.keyCode === 37 || e.keyCode === 72) { // Left
            var id = {
                "task":"timeline",
                "gantt":"task",
                "timeline":"gantt"
            }[app.state.tab.viewer || 'task'];
            app.fireEvent('selectTab', 'viewer', id);
        } else if (e.keyCode === 39 || e.keyCode === 76) { // Right
            var id = {
                "task":"gantt",
                "gantt":"timeline",
                "timeline":"task"
            }[app.state.tab.viewer || 'task'];
            app.fireEvent('selectTab', 'viewer', id);
        }
    }
    if (app.state.tab.viewer &&
        app.state.tab.viewer !== 'task') {
        return;
    }
    e.preventDefault();
    if (e.shiftKey) {
        if (e.keyCode === 38) { // Up
            app.fireEvent('openPrevList');
        } else if (e.keyCode === 40) { // Down
            app.fireEvent('openNextList');
        }
        return;
    }
    if (e.keyCode === 38 || e.keyCode === 75) { // Up / K
        app.fireEvent('openPrevTask');
    } else if (e.keyCode === 40 || e.keyCode === 74) { // Down / J
        app.fireEvent('openNextTask');
    }
});

})(this, window, document, jQuery);