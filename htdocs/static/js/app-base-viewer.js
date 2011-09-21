(function(ns, w, d) {

var c = ns.c;
var app = ns.app;

c.addEvents('registerSubAccount');
c.addEvents('registerFriends');

c.addEvents('registerList');
c.addEvents('openList');
c.addEvents('createList');
c.addEvents('editList');
c.addEvents('deleteList');
c.addEvents('clearList');

c.addEvents('registerTask'); // サーバーから取得又は登録フォームから登録した場合発火
c.addEvents('openTask');
c.addEvents('missingTask');
c.addEvents('createTask');   // 登録フォーム表示(新規モード)
c.addEvents('editTask');     // 登録フォーム表示(編集モード)
c.addEvents('clearTask');
c.addEvents('sortTask');
c.addEvents('filterTask');

c.addEvents('checkStar');
c.addEvents('checkMute');

// イベントのキャッシュコントロール
c.addListener('openList', function(list){
    app.data.current_list = list;
    localStorage.setItem('last_list_id', list.id);
    c.fireEvent('filterTask', {
        list_id: list.id
    });
});
c.addListener('registerList', function(list){
    app.data.list_map[list.id] = list;
});
c.addListener('deleteList', function(list){
    delete app.data.list_map[list.id];
});
c.addListener('clearList', function(list){
    delete app.data.list_map[list.id];
});
c.addListener('openTask', function(task){
    app.data.current_task = task;
});
c.addListener('registerTask', function(task, list){
    // リスト
    task.list = list;

    // 期日
    if (task.due) {
        task.due_date = $.datepicker.parseDate('mm/dd/yy', task.due);
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
c.addListener('filterTask', function(filter){
    app.data.current_filter = filter;
});
c.addListener('registerFriends', function(friends, owner){
    for (var i = 0, max_i = friends.length; i < max_i; i++) {
        var friend = friends[i];
        var icon = /^tw-[0-9]+$/.test(friend.code) ?
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
c.addListener('registerSubAccount', function(sub_account){
    var icon = /^tw-[0-9]+$/.test(sub_account.code) ?
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

// セットアップ
c.addListener('reset', function(){
    app.data.list_map = {};
    app.data.task_map = {};
    app.data.users = {};
    app.data.assigns = [];
    app.data.current_list = null;
    app.data.current_task = null;
});
c.addListener('resetup', function(){
    app.api.account.me({ reset: true });
});
c.addListener('setup', function(option){
    app.api.account.me({ setup: true });
    // auto reload
    setInterval(function(){
        app.api.account.me({
            data: {
                if_modified_since: app.data.if_modified_since,
                if_modified_lists: app.data.if_modified_lists
            }
        });
    }, 60000);
});

app.util.getIconUrl = function(code, size){
    var src;
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

app.api.account.me = function(option){
    app.ajax({
        url: '/api/1/account/me',
        data: option.data,
        dataType: 'json'
    })
    .done(function(data){
        var friends
            , friends_data
            , sub_account
            , reload
            , user_id
            , diff
            , status;

        if (!data) {
            return;
        }

        if (data.list_ids !== app.data.if_modified_lists) {
            option.reset = true;
        }

        if (option.reset) {
            c.fireEvent('reset');
        }

        app.data.sign = data.sign;
        app.data.state = data.account.state;
        app.data.sub_accounts = data.sub_accounts;
        app.data.if_modified_lists = data.list_ids;

        if (!('mute' in app.data.state)) {
            app.data.state.mute = {};
        }
        if (!('star' in app.data.state)) {
            app.data.state.star = {};
        }

        $.each(data.lists, function(i, list){
            c.fireEvent('registerFriends', list.users);
        });

        // localStorageのfriendsリストを更新
        for (var i = 0, max_i = data.sub_accounts.length; i < max_i; i++) {
            sub_account = data.sub_accounts[i];

            c.fireEvent('registerSubAccount', sub_account);

            // Twitter
            if (/^tw-[0-9]+$/.test(sub_account.code)) {
                if ("friends" in sub_account.data) {
                    c.fireEvent('registerFriends', sub_account.data.friends, sub_account.code);
                }
                if (option.setup
                    && data.sign.code === sub_account.code
                    && app.option.auto_sync_friends) {
                    app.api.twitter.friends(sub_account.code.substring(3), '-1', []);
                }
            }

            // Facebook
            else if (/^fb-[0-9]+$/.test(sub_account.code)) {
                c.fireEvent('registerFriends', sub_account.data.friends, sub_account.code);
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
            c.fireEvent('registerList', list);
            $.each(list.tasks, function(i, task){
                tasks++;
                c.fireEvent('registerTask', task, list);
            });
        });

        //
        var last_list_id = localStorage.getItem('last_list_id');
        if (option.list_id && (option.list_id in app.data.list_map)) {
            c.fireEvent('openList', app.data.list_map[option.list_id]);
            if (option.task_id in app.data.task_map) {
                c.fireEvent('openTask', app.data.task_map[option.task_id]);
            }
        } else if (option.setup || option.reset) {
            if (last_list_id && (last_list_id in app.data.list_map)) {
                c.fireEvent('openList', app.data.list_map[last_list_id]);
            } else if (data.lists.length) {
                c.fireEvent('openList', data.lists[0]);
            }
            if (option.setup && !tasks) {
                app.dom.show($('#welcome'));
            } else {
                c.fireEvent('sortTask', 'updated', true);
            }
        }
    });
}
app.api.account.update = function(params, refresh){
    return app.ajax({
        type: 'post',
        url: '/api/1/account/update',
        data: params,
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            if (refresh) {
                app.refresh();
            }
        }
    });
}
app.api.task.update = function(params){
    var list = app.data.list_map[params.list_id];
    if (!list) {
        alert('unknown list ' + params.list_id);
        return;
    }
    app.ajax({
        type: 'POST',
        url: '/api/1/task/update',
        data: params,
        dataType: 'json'
    })
    .done(function(data){
        if (data.success === 1) {
            c.fireEvent('registerTask', data.task, list);
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
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
            c.fireEvent('registerTask', data.task, app.data.list_map[dst_list_id]);
            if (app.data.current_task.id === data.task.id) {
                c.fireEvent('openTask', data.task);
            }
        }
    });
}
app.api.twitter.friends = function(user_id, cursor, cache){
    var timer = setTimeout(function(){
        app.dom.show($('#notice-failed-sync-twitter'));
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
            c.fireEvent('registerFriends', cache, 'tw-' + user_id);
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
                app.dom.show($('#notice-succeeded-sync-twitter'));
            })
            .fail(function(){
                app.dom.show($('#notice-failed-sync-twitter'));
            });
        }
    });
}

app.click.createTask = function(){
    c.fireEvent('createTask');
}
app.click.editTask = function(){
    if (app.data.current_task) {
        c.fireEvent('editTask', app.data.current_task);
    } else {
        alert('please select a task.');
    }
}

app.setup.messages = function(ele){
    app.data.messages = ele;
}

/* */
app.setup.taskCounter = function(ele){
    var count = 0;
    var condition = ele.data('counter-condition');
    c.addListener('registerTask', function(task){
        var before = (task.before && app.util.taskFilter(task.before, condition)) ? 1 : 0;
        var after = app.util.taskFilter(task, condition) ? 1 : 0;
        var add = after - before;
        if (add) {
            count+= add;
            ele.text(count);
        }
    });
    c.addListener('checkMute', function(){
        count = 0;
        for (var task_id in app.data.task_map) {
            if (app.util.taskFilter(app.data.task_map[task_id], condition)) {
                count++;
            }
        }
        ele.text(count);
    });
    c.addListener('reset', function(){
        count = 0;
        ele.text(count);
    });
}
app.setup.starCounter = function(ele){
    var count = 0;
    c.addListener('registerTask', function(task){
        // 初回かつOn
        if (!task.before && app.util.taskFilter(task, {star: 1})) {
            count++;
            ele.text(count);
        }
    });
    c.addListener('checkStar', function(checked){
        count+= checked ? 1 : -1;
        ele.text(count);
    });
    c.addListener('reset', function(){
        count = 0;
        ele.text(count);
    });
}
app.setup.filterTask = function(ele){
    c.addListener('filterTask', function(){
        ele.parent().removeClass('active');
    });
    c.addListener('openList', function(){
        ele.parent().removeClass('active');
    });
    c.addListener('reset', function(){
        ele.parent().removeClass('active');
    });
}
app.click.filterTask = function(ele){
    if (ele.parent().hasClass('active') && app.data.current_list) {
        c.fireEvent('openList', app.data.current_list);
    } else {
        c.fireEvent('filterTask', ele.data('filter-condition'));
        ele.parent().addClass('active');
    }
}

// ----------------------------------------------------------------------
// コメント管理
// ----------------------------------------------------------------------
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
        if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }
        if (!app.data.current_task) {
            return;
        }
        if (e.keyCode === 77) { // M
            e.preventDefault();
            ele.find('textarea:first').focus();
        }
    });

    c.addListener('openTask', function(task){
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
        li.find('.message').text(app.data.messages.data('text-create-task-' + c.lang));
        li.find('.date').text(c.date.relative(task.created_on));
        li.prependTo(ul);
        $.each(task.actions, function(i, comment){
            var li = $(template);
            li.find('.icon:first').append(app.util.getIcon(comment.code, 32));
            li.find('.name').text(app.util.getName(comment.code));
            if (comment.action) {
                li.find('.message').text(app.data.messages.data('text-' + comment.action + '-' + c.lang));
                li.find('.icon:last').remove();
            } else {
                li.find('.message').html(c.string.autolink(comment.message));
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
                            c.fireEvent('registerTask', data.task, task.list);
                        } else {
                            // 現在 ステータスコード 200 の例外ケースは無い
                        }
                    });
                    return false;
                });
            }
            li.find('.date').text(c.date.relative(comment.time));
            li.prependTo(ul);
        });
    });

    c.addListener('missingTask', function(){
        ul.empty();
        textarea.val('');
        textarea.attr('disabled', true);
        list_name.text('-');
        task_name.text('-');
    });

    c.addListener('reset', function(){
        ul.empty();
        textarea.val('');
        textarea.attr('disabled', true);
        list_name.text('-');
        task_name.text('-');
    });
}
app.submit.registerComment = function(form){
    var task_id = form.find('input[name=task_id]').val();
    var list_id = form.find('input[name=list_id]').val();
    var list = app.data.list_map[list_id];
    if (!list) {
        alert('unknown list ' + list_id);
        return false;
    }
    if (!form.find('textarea').val().length) {
        return false;
    }
    app.ajax({
        type: 'POST',
        url: '/api/1/comment/create',
        data: form.serialize(),
        dataType: 'json'
    })
    .done(function(data){
        if (data.success === 1) {
            app.dom.reset(form);
            c.fireEvent('registerTask', data.task, list);
            c.fireEvent('openTask', data.task);
            document.activeElement.blur();
            // app.dom.show($('#create-comment-twipsy'));
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    });
}

})(this, this, document);