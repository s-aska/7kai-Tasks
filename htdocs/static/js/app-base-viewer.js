(function(ns, w, d) {

var app = ns.app;

app.addEvents('registerSubAccount');
app.addEvents('registerFriends');

app.addEvents('registerList');
app.addEvents('openList');
app.addEvents('openNextList');
app.addEvents('openPrevList');
app.addEvents('createList');
app.addEvents('editList');
app.addEvents('deleteList');
app.addEvents('clearList');

app.addEvents('registerTask'); // サーバーから取得又は登録フォームから登録した場合発火
app.addEvents('openTask');
app.addEvents('openTopTask');
app.addEvents('openBottomTask');
app.addEvents('missingTask');
app.addEvents('createTask');   // 登録フォーム表示(新規モード)
app.addEvents('editTask');     // 登録フォーム表示(編集モード)
app.addEvents('clearTask');
app.addEvents('sortTask');
app.addEvents('filterTask');

app.addEvents('checkStar');
app.addEvents('checkMute');

app.addEvents('clickNotification');

// イベントのキャッシュコントロール
app.addListener('openList', function(list){
    app.data.current_list = list;
    localStorage.setItem('last_list_id', list.id);
    app.fireEvent('filterTask', {
        list_id: list.id
    });
});
app.addListener('registerList', function(list){
    app.data.list_map[list.id] = list;
});
app.addListener('deleteList', function(list){
    delete app.data.list_map[list.id];
});
app.addListener('clearList', function(list){
});
app.addListener('openTask', function(task){
    app.data.current_task = task;
});
app.addListener('missingTask', function(){
    app.data.current_task = null;
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

    // 履歴・コメント
    task.actions = [].concat(task.comments).concat(task.history).sort(function(a, b) {
        return (Number(a.time) || 0) - (Number(b.time) || 0);
    });

    // 直近の履歴・コメント
    $.each(task.actions, function(i, action){
        if (!app.util.findMe([action.code])) {
            task.recent = action;
            return false;
        }
    });

    // 更新前の状態
    if (task.id in app.data.task_map) {
        task.before = app.data.task_map[task.id];
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

    app.data.task_map[task.id] = task;
    if (app.data.current_task && task.id === app.data.current_task.id) {
        app.data.current_task = task;
    }
});
app.addListener('filterTask', function(filter){
    app.data.current_filter = filter;
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
                 : '/static/img/email24.png';
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
             : '/static/img/email24.png';
    app.data.users[sub_account.code] = {
        code: sub_account.code,
        name: sub_account.name,
        icon: icon
    };
});
app.addListener('clickNotification', function(option){
    app.data.current_filter = { list_id: option.list_id };
    app.api.account.me(option);
});

// セットアップ
app.addListener('clear', function(){
    app.data.list_map = {};
    app.data.task_map = {};
    app.data.users = {};
    app.data.assigns = [];
    app.data.current_list = null;
    app.data.current_task = null;
});
app.addListener('reload', function(){
    app.api.account.me({ reset: true });
});
app.addListener('setup', function(option){
    if (navigator.onLine){
        app.api.account.me({ setup: true });
    } else {
        var data = localStorage.getItem("me");
        if (data) {
            app.util.buildMe({ setup: true }, JSON.parse(data));
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
        // http://api.twitter.com/1/users/profile_image?name=&size=mini
    }
    else if (/^fb-[0-9]+$/.test(code)) {
        src = 'https://graph.facebook.com/' + code.substring(3) + '/picture';
    }
    else if (/@/.test(code)) {
        src = size === 16 ? '/static/img/email.png' : '/static/img/email24.png';
    }
    else {
        src = '/static/img/address.png';
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
        return user.name;
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
    if (condition.closed) {
        if (!task.closed) {
            return false;
        }
    } else {
        if (task.closed) {
            return false;
        }
    }
    if (condition.list_id) {
        if (condition.list_id !== task.list.id) {
            return false;
        }
    }

    if (condition.todo) {
        if (task.list.id in app.data.state.mute) {
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

    if (!('mute' in app.data.state)) {
        app.data.state.mute = {};
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
                app.api.twitter.friends(sub_account.code.substring(3), '-1', []);
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

    //
    var last_list_id = localStorage.getItem('last_list_id');
    if (option.list_id && (option.list_id in app.data.list_map)) {
        app.fireEvent('openList', app.data.list_map[option.list_id]);
        if (option.task_id in app.data.task_map) {
            app.fireEvent('openTask', app.data.task_map[option.task_id]);
        }
    } else if (option.setup || option.reset) {
        if (last_list_id && (last_list_id in app.data.list_map)) {
            app.fireEvent('openList', app.data.list_map[last_list_id]);
        } else if (data.lists.length) {
            app.fireEvent('openList', data.lists[0]);
        }
        if (option.setup && !tasks) {
            app.dom.show(app.dom.get('showable', 'welcome'));
        } else {
            app.fireEvent('sortTask', 'updated', true);
        }
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
            app.data.task_map[params.task_id].updated_on = data.task.updated_on;
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
            app.fireEvent('registerTask', data.task, app.data.list_map[dst_list_id]);
            if (app.data.current_task && app.data.current_task.id === data.task.id) {
                app.fireEvent('openTask', data.task);
            }
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
        app.fireEvent('filterTask', {
            list_id: app.data.current_list.id,
            closed: val
        });
        if (val) {
            ele.addClass('active');
        } else {
            ele.removeClass('active');
        }
    });
    app.addListener('clickNotification', function(option){
        if (ele.hasClass('active')) {
            ele.click();
        }
    });
}
app.setup.switchMute = function(ele){
    ele.click(function(){
        var method = app.data.state.mute[app.data.current_list.id] ? '-' : '+';
        app.api.account.update({
            ns: 'state',
            method: method,
            key: 'mute',
            val: app.data.current_list.id
        })
        .done(function(data){
            if (data.success === 1) {
                app.data.state.mute = data.account.state.mute;
                app.fireEvent('checkMute', app.data.current_list,
                    (app.data.current_list.id in app.data.state.mute));
            } else {
                // 現在 ステータスコード 200 の例外ケースは無い
            }
        });
    });
}
app.setup.taskCounter = function(ele){
    var count = 0;
    var condition = ele.data('counter-condition');
    app.addListener('registerTask', function(task){
        var before = (task.before && app.util.taskFilter(task.before, condition)) ? 1 : 0;
        var after = app.util.taskFilter(task, condition) ? 1 : 0;
        var add = after - before;
        if (add) {
            count+= add;
            ele.text(count);
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
    app.addListener('clear', function(){
        count = 0;
        ele.text(count);
    });
}
app.setup.starCounter = function(ele){
    var count = 0;
    app.addListener('registerTask', function(task){
        // 初回かつOn
        if (!task.before && app.util.taskFilter(task, {star: 1})) {
            count++;
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
    app.addListener('filterTask', function(){
        ele.parent().removeClass('active');
    });
    app.addListener('openList', function(){
        ele.parent().removeClass('active');
    });
    app.addListener('clear', function(){
        ele.parent().removeClass('active');
    });
}
app.setup.rightColumn = function(ele){
    var list_id_input    = ele.find('input[name=list_id]');
    var task_id_input    = ele.find('input[name=task_id]');
    var registrant_input = ele.find('input[name=registrant]');
    var button           = ele.find('button:first');
    var textarea         = ele.find('textarea');
    var list_name        = ele.find('.list_name');
    var task_name        = ele.find('.task_name');
    var ul               = ele.find('ul.comments');
    var template         = ul.html();

    // 初期化処理
    ul.empty();
    button.attr('disabled', true);

    var textarea_watch = function(){
        button.attr('disabled', !textarea.val().length)
    };
    textarea.change(textarea_watch).keydown(textarea_watch).keyup(textarea_watch);

    // Shortcut
    $(d).keydown(function(e){
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }
        if (e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }
        if (e.shiftKey) {
            if (!app.data.current_task) {
                return;
            }
            if (e.keyCode === 39) { // right
                e.preventDefault();
                ele.find('textarea:first').focus();
            }
            return;
        }
    });

    app.addListener('openTask', function(task){
        list_id_input.val(task.list.id);
        task_id_input.val(task.id);
        registrant_input.val(app.util.getRegistrant(task.list));
        list_name.text(task.list.name);
        task_name.text(task.name);
        textarea.val('');
        textarea.attr('disabled', false);
        button.attr('disabled', true);
        ul.empty();
        var li = $(template);
        li.find('.icon:first').append(app.util.getIcon(task.registrant, 32));
        li.find('.icon:last').remove();
        li.find('.name').text(app.util.getName(task.registrant));
        li.find('.message').text(app.data.messages.data('text-create-task-' + app.env.lang));
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
            if (comment.action) {
                li.find('.message').text(
                    app.data.messages.data('text-' + comment.action + '-' + app.env.lang));
                li.find('.icon:last').remove();
            } else {
                li.find('.message').html(
                    app.util.autolink(comment.message).replace(/\r?\n/g, '<br />'));
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
    });

    app.addListener('missingTask', function(){
        ul.empty();
        textarea.val('');
        textarea.attr('disabled', true);
        list_name.text('-');
        task_name.text('-');
    });

    app.addListener('clear', function(){
        ul.empty();
        textarea.val('');
        textarea.attr('disabled', true);
        list_name.text('-');
        task_name.text('-');
    });
}

app.setup.tasks = function(ul){
    
    var template = ul.html();
    var taskli_map = {};

    // 初期化処理
    ul.empty();

    app.addListener('registerTask', function(task){
        var li = $(template);

        li.data('id', task.id);

        app.dom.setup(li, task);

        app.setup.task(li, task);

        // FIXME: 表示条件との照合
        if (task.id in taskli_map) {
            if (!taskli_map[task.id].data('visible')) {
                li.data('visible', false);
                li.hide();
            } else {
                li.data('visible', true);
            }
            if (taskli_map[task.id].hasClass('selected')) {
                li.addClass('selected');
            }
            taskli_map[task.id].after(li);
            taskli_map[task.id].remove();
            taskli_map[task.id] = li;
            if (app.data.current_filter &&
                app.util.taskFilter(task, app.data.current_filter)) {
                if (!li.data('visible')) {
                    li.data('visible', true);
                    li.slideDown('fast');
                }
                if (app.data.current_task &&
                    app.data.current_task.id === task.id) {
                    app.fireEvent('openTask', task);
                }
            } else {
                if (li.data('visible')) {
                    li.data('visible', false);
                    li.slideUp('fast');
                }
                if (app.data.current_task &&
                    app.data.current_task.id === task.id) {
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
            li.prependTo(ul);
            if (app.data.current_filter &&
                app.util.taskFilter(task, app.data.current_filter)) {
                li.data('visible', true);
                li.slideDown('fast');
            } else {
                li.data('visible', false);
            }
        }
        taskli_map[task.id] = li;
    });

    app.addListener('openTask', function(task){
        ul.children().removeClass('selected');
        if (task.id in taskli_map) {
            taskli_map[task.id].addClass('selected');
        }
    });

    app.addListener('openTopTask', function(){
        var lis = ul.children();
        for (var i = 0, max_i = lis.length; i < max_i; i++) {
            var li = $(lis[i]);
            if (li.data('visible')) {
                var id = li.data('id');
                if (id in app.data.task_map) {
                    app.fireEvent('openTask', app.data.task_map[id]);
                }
                break;
            }
        }
    });

    app.addListener('openBottomTask', function(){
        var lis = ul.children();
        for (var i = 0, max_i = lis.length; i < max_i; i++) {
            var li = $(lis[max_i - i - 1]);
            if (li.data('visible')) {
                var id = li.data('id');
                if (id in app.data.task_map) {
                    app.fireEvent('openTask', app.data.task_map[id]);
                }
                break;
            }
        }
    });

    app.addListener('sortTask', function(column, reverse){
        var tasks = [];
        for (var task_id in app.data.task_map) {
            tasks.push(app.data.task_map[task_id]);
        }
        if (column === 'name') {
            tasks.sort(function(a, b){
                return a.name > b.name ?  1 :
                       b.name < a.name ? -1 : 0;
            });
        } else if (column === 'person') {
            tasks.sort(function(a, b){
                return a.person > b.person ?  1 :
                       b.person < a.person ? -1 : 0;
            });
        } else {
            tasks.sort(function(a, b){
                return (Number(a[column]) || 0) - (Number(b[column]) || 0);
            });
        }
        if (app.data.current_sort.column === column
            && app.data.current_sort.reverse === reverse) {
            reverse = reverse ? false : true;
        }
        if (reverse) {
            tasks.reverse();
        }
        for (var i = 0, max_i = tasks.length; i < max_i; i++) {
            ul.append(taskli_map[tasks[i].id]);
        }
        app.data.current_sort.column = column;
        app.data.current_sort.reverse = reverse;
    });

    app.addListener('filterTask', function(condition){
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            var li = taskli_map[task_id];
            if (app.util.taskFilter(task, condition)) {
                if (!li.data('visible')) {
                    li.data('visible', true);
                    li.slideDown('fast');
                } else {
                    li.show();
                }
            } else {
                if (li.data('visible')) {
                    li.data('visible', false);
                    li.slideUp('fast');
                }
                if (app.data.current_task && app.data.current_task.id === task.id) {
                    app.fireEvent('missingTask');
                }
            }
        }
    });

    app.addListener('clearList', function(list){
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            if (list.id === task.list.id && task.closed) {
                if (task_id in taskli_map) {
                    if (app.data.current_task && app.data.current_task.id === task_id) {
                        app.fireEvent('missingTask');
                    }
                    taskli_map[task_id].remove();
                    delete taskli_map[task_id];
                }
                delete app.data.task_map[task_id];
            }
        }
    });

    app.addListener('missingTask', function(){
        if (app.data.current_task &&
            app.data.current_task.id in taskli_map) {
            taskli_map[app.data.current_task.id].removeClass('selected');
        }
    });

    app.addListener('clear', function(){
        ul.empty();
        taskli_map = {};
    });

    $(d).keydown(function(e){
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }
        if (e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }
        if (e.shiftKey) {
            if (e.keyCode === 38) { // Up
                app.fireEvent('openPrevList');
            } else if (e.keyCode === 40) { // Down
                app.fireEvent('openNextList');
            }
            return;
        }
        if (e.keyCode === 38) { // Up
            var next;
            if (app.data.current_task) {
                next = taskli_map[app.data.current_task.id].prevAll(':visible:first');
            }
            if (!next) {
                next = ul.find('> li:visible:first');
            }
            if (next && next.length) {
                var next_id = next.data('id');
                if (!(next_id in app.data.task_map)) {
                    return;
                }
                app.fireEvent('openTask', app.data.task_map[next_id]);
            } else {
                app.fireEvent('openPrevList');
            }
        } else if (e.keyCode === 40) { // Down
            var next;
            if (app.data.current_task) {
                next = taskli_map[app.data.current_task.id].nextAll(':visible:first');
            }
            if (!next) {
                next = ul.find('> li:visible:first');
            }
            if (next && next.length) {
                var next_id = next.data('id');
                if (!(next_id in app.data.task_map)) {
                    return;
                }
                app.fireEvent('openTask', app.data.task_map[next_id]);
            } else {
                app.fireEvent('openNextList');
            }
        } else if (!app.data.current_task) {
            return;
        } else if (e.keyCode === 37) { // Left
            var task = app.data.current_task;
            var date = task.due_date || new Date();
            date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
            var due = app.date.mdy(date);
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                due: due
            });
        } else if (e.keyCode === 39) { // Right
            var task = app.data.current_task;
            var date = task.due_date || new Date();
            date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
            var due = app.date.mdy(date);
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                due: due
            });
        } else if (e.keyCode === 32) { // Space
            var task = app.data.current_task;
            var status = task.status === 2 ? 0 : task.status + 1;
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                status: status
            });
        } else if (e.keyCode === 13) { // Enter
            var task = app.data.current_task;
            var closed = task.closed ? 0 : 1;
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                closed: closed
            });
        } else if (e.keyCode === 69) { // E
            var task = app.data.current_task;
            app.fireEvent('editTask', task);
        }
    });
}
app.setup.task = function(ele, task){
    if (!task) return;
    if (task.salvage) {
        ele.addClass('salvage');
    }
    ele.get(0).addEventListener('dragstart', function(e){
        app.fireEvent('moveTask', task);
        e.dataTransfer.setData("text", task.id);
    }, false);
    ele.get(0).addEventListener('dragend', function(e){
        app.fireEvent('moveTaskCancel');
        e.dataTransfer.clearData();
    }, false);
    ele.click(function(e){
        e.stopPropagation();
        app.fireEvent('openTask', task);
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
    if (task.id in app.data.state.star) {
        ele.removeClass('icon-star-off').addClass('icon-star');
    }
    ele.click(function(e){
        e.stopPropagation();
        var method = '+';
        if (task.id in app.data.state.star) {
            method = '-';
            delete app.data.state.star[task.id];
            ele.removeClass('icon-star').addClass('icon-star-off');
        } else {
            app.data.state.star[task.id] = 1;
            ele.removeClass('icon-star-off').addClass('icon-star');
        }
        app.api.account.update({
            ns: 'state',
            method: method,
            key: 'star',
            val: task.id
        });
        app.fireEvent('checkStar', method === '+');
    });
}
app.setup.human = function(ele, task){
    if (!task) return;
    var size = ele.data('human-size') || 16;
    ele.prepend(app.util.getIcon(task.requester, size));
    if (task.assign.length) {
        ele.prepend($('<span class="icon icon-left"/>'));
        $.each(task.assign, function(i, assign){
            ele.prepend(app.util.getIcon(assign, size));
        });
    }
    if (task.status == 2 && task.assign.length) {
        ele.prepend($('<span class="icon icon-left"/>'));
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
        ele.removeClass('icon-cross').addClass('icon-plus');
    } else {
        ele.removeClass('icon-plus').addClass('icon-cross');
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
app.setup.due = function(ele, task){
    if (!task) return;
    if (task.due) {
        var label = (task.due_date.getMonth() + 1) + '/' + task.due_date.getDate();
        var now = new Date();
        if (now.getFullYear() !== task.due_date.getFullYear()) {
            if (app.env.lang === 'ja') {
                label = task.due_date.getFullYear() + '/' + label;
            } else {
                label = label + '/' + task.due_date.getFullYear();
            }
        }
        ele.text(label);
        if (now.getTime() > task.due_date.getTime()) {
            ele.addClass('over');
        }
    } else {
        ele.text('-');
    }
}
app.setup.recent = function(ele, task){
    if (!task) return;
    if (task.recent) {
        var size = ele.find('.icon').data('human-size') || 16;
        ele.find('.icon').append(app.util.getIcon(task.recent.code, size));
        var date = app.date.relative(task.recent.time);
        if (task.recent.message) {
            ele.find('.message span').text(task.recent.message + ' ' + date);
        } else {
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
    var assign_input = form.find('input[name=assign]');
    var assign_list = form.find('ul.assign');
    var assign_template = assign_list.html();
    var name_input = form.find('input[name=name]');
    var due_input = form.find('input[name=due]');
    var requester_select = form.find('select[name=requester]');
    var registrant_input = form.find('input[name=registrant]');
    var task_id_input = form.find('input[name=task_id]');
    var list_id_input = form.find('input[name=list_id]');

    form.find('a.due-plus').click(function(e){
        e.preventDefault();
        var due = due_input.val();
        var date = due ? app.date.parse(due) : (new Date());
        date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
        due_input.val(app.date.ymd(date));
    });

    form.find('a.due-minus').click(function(e){
        e.preventDefault();
        var due = due_input.val();
        var date = due ? app.date.parse(due) : (new Date());
        var date = app.date.parse(due);
        date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
        due_input.val(app.date.ymd(date));
    });

    var setup = function(list){
        assign_list.empty();
        requester_select.empty();
        var assigns = [list.owner].concat(list.members);
        for (var i = 0, max_i = assigns.length; i < max_i; i++) {
            var assign = assigns[i];
            var friend = app.data.users[assign];
            var li = $(assign_template);
            if (friend && friend.icon) {
                li.find('img').attr('src', friend.icon);
            } else if (/@/.test(assign)) {
                li.find('img').attr('src', '/static/img/email.png');
            } else {
                li.find('img').attr('src', '/static/img/address.png');
            }
            var name = friend ? friend.name : assign;
            li.find('div.name').text(name);
            li.find('input').val(assign);
            li.find('input[type="checkbox"]')
                .focus(function(){$(this).parent().addClass('focused')})
                .blur(function(){$(this).parent().removeClass('focused')});
            li.appendTo(assign_list);

            $('<option/>')
                .attr('value', assign)
                .text(name)
                .appendTo(requester_select);
        }

        // 依頼者のデフォルトは自分
        var registrant = app.util.getRegistrant(list);
        requester_select.val(registrant);
        registrant_input.val(registrant);
        task_id_input.val('');
        list_id_input.val(list.id);
    };

    app.addListener('createTask', function(){
        app.dom.reset(form);
        if (!app.data.current_list) {
            alert('missing current_list');
            return;
        }
        setup(app.data.current_list);
        app.dom.show(form);
    });

    app.addListener('editTask', function(task){
        app.dom.reset(form);
        if (!app.data.current_list) {
            alert('missing current_list');
            return;
        }
        setup(task.list);
        name_input.val(task.name);
        if (task.due) {
            due_input.val(app.date.ymd(task.due_date));
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
app.click.reload = function(){
    app.fireEvent('reload');
}
app.click.createTask = function(){
    app.fireEvent('createTask');
}
app.click.editTask = function(){
    if (app.data.current_task) {
        app.fireEvent('editTask', app.data.current_task);
    } else {
        alert('please select a task.');
    }
}
app.click.filterTask = function(ele){
    if (ele.parent().hasClass('active') && app.data.current_list) {
        app.fireEvent('openList', app.data.current_list);
    } else {
        app.fireEvent('filterTask', ele.data('filter-condition'));
        ele.parent().addClass('active');
    }
}

app.submit.clearList = function(form){
    if (!app.data.current_list) {
        alert('app.data.current_list is null.');
        return;
    }
    app.ajax({
        type: 'POST',
        url: '/api/1/list/clear',
        data: {
            list_id: app.data.current_list.id
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success === 1) {
            app.fireEvent('clearList', data.list);
            app.fireEvent('openList', data.list);
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
            app.fireEvent('registerTask', data.task, list);
            app.fireEvent('openTask', data.task);
            app.dom.reset(form);
            if (task_id) {
                app.dom.hide(form);
            } else {
                app.dom.show(app.dom.get('showable', 'create-task-twipsy'));
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
                comments: [],
                history: [],
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
    if (!message.length) {
        return false;
    }
    app.ajax({
        type: 'POST',
        url: '/api/1/comment/create',
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
                task.comments.push({
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

})(this, this, document);