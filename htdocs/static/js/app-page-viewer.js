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
c.addEvents('moveTask');
c.addEvents('moveTaskCancel');

c.addEvents('checkStar');
c.addEvents('checkMute');

c.addEvents('clickNotification');

c.addEvents('removeAccountConfirm');

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
                     + (friend.screen_name || friend.name)
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
c.addListener('reset', function(){
    app.data.list_map = {};
    app.data.task_map = {};
    app.data.users = {};
    app.data.assigns = [];
    app.data.current_list = null;
    app.data.current_task = null;
});

c.addListener('resetup', function(){
    app.api.me({ reset: true });
});

// セットアップ
c.addListener('setup', function(option){
    app.api.me({ setup: true });
    // auto reload
    setInterval(function(){
        app.api.me({
            data: {
                if_modified_since: app.data.if_modified_since,
                if_modified_lists: app.data.if_modified_lists
            }
        });
    }, 60000);
});



c.addListener('clickNotification', function(option){
    app.data.current_filter = { list_id: option.list_id };
    app.api.me(option);
});

app.api.me = function(option){
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

        // localStorageのfriendsリストを更新
        for (var i = 0, max_i = data.sub_accounts.length; i < max_i; i++) {
            sub_account = data.sub_accounts[i];

            c.fireEvent('registerSubAccount', sub_account);

            // Twitter
            if (/^tw-[0-9]+$/.test(sub_account.code)) {
                if ("friends" in sub_account.data) {
                    c.fireEvent('registerFriends', sub_account.data.friends, sub_account.code);
                }
                app.data.users[sub_account.code] = {
                    code: sub_account.code,
                    name: sub_account.name,
                    icon: sub_account.data.icon
                };
                if (option.setup && data.sign.code === sub_account.code) {
                    app.friendFetchTwitter(sub_account.code.substring(3), '-1', []);
                }
            }

            // Facebook
            else if (/^fb-[0-9]+$/.test(sub_account.code)) {
                c.fireEvent('registerFriends', sub_account.data.friends, sub_account.code);
                app.data.users[sub_account.code] = {
                    code: sub_account.code,
                    name: sub_account.name,
                    icon: 'https://graph.facebook.com/'
                        + sub_account.code.substring(3) + '/picture'
                };
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
            c.fireEvent('registerFriends', list.users);
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

// フレンド同期機能
app.friendFetchTwitter = function(user_id, cursor, cache){
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
            app.friendFetchTwitter(user_id, data.next_cursor_str, cache);
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
    if (task.list.id in app.data.state.mute) {
        return false;
    }
    if (condition.list_id) {
        if (condition.list_id !== task.list.id) {
            return false;
        }
    }
    
    if (condition.todo) {
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

app.api.updateAccount = function(params, refresh){
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
app.api.updateTask = function(params){
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
app.api.moveTask = function(src_list_id, task_id, dst_list_id){
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

app.setup.messages = function(ele){
    app.data.messages = ele;
}

// ----------------------------------------------------------------------
// トップバー機能(ってなんだよ...)
// ----------------------------------------------------------------------
app.setup.topBar = function(ele){

    var filter_list = ele.find('.container > ul:first');

    // リスト選択されたらハイライトを全力で切る
    c.addListener('openList', function(list){
        filter_list.find('> li').removeClass('active');
    });
}
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
app.setup.notificationCounter = function(ele){

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
app.setup.getTheExtensions = function(ele){
    if (navigator.userAgent.indexOf('Chrome') === -1) {
        ele.parent().remove();
    }
}
app.setup.getTheChrome = function(ele){
    if (navigator.userAgent.indexOf('Chrome') !== -1) {
        ele.parent().remove();
    }
}
app.setup.settingsWindow = function(ele){
    var ul = ele.find('ul.accounts');
    var template = ul.html();
    ul.empty();
    c.addListener('registerSubAccount', function(sub_account){
        var li = $(template);
        li.find('img').attr('src', app.util.getIconUrl(sub_account.code));
        li.find('.name').text(sub_account.name);
        li.find('button').click(function(){
            c.fireEvent('removeAccountConfirm', sub_account);
        });
        li.appendTo(ul);
    });
    c.addListener('reset', function(){
        ul.empty();
        ele.hide();
    });
}
app.setup.removeAccountWindow = function(form){
    c.addListener('removeAccountConfirm', function(sub_account){
        app.dom.show(form);
        form.find('input[name="code"]').val(sub_account.code);
        form.find('img').attr('src', app.util.getIconUrl(sub_account.code));
        form.find('.name').text(sub_account.name);
    });
    c.addListener('reset', function(){
        form.hide();
    });
}
app.submit.deleteAccount = function(form){
    var code = form.find('input[name="code"]').val();
    app.ajax({
        url: '/api/1/account/delete',
        type: 'post',
        data: {
            code: code
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            app.dom.show($('#success-delete-account'));
            if (data.signout) {
                setTimeout(function(){
                    location.reload();
                }, 3000);
            } else {
                c.fireEvent('resetup');
            }
        }
    })
}
app.click.filterTask = function(ele){
    if (ele.parent().hasClass('active') && app.data.current_list) {
        c.fireEvent('openList', app.data.current_list);
    } else {
        c.fireEvent('filterTask', ele.data('filter-condition'));
        ele.parent().addClass('active');
    }
}
app.click.addTwitter = function(){
    $('#add-twitter').submit();
}
app.click.addFacebook = function(){
    $('#add-facebook').submit();
}

// ----------------------------------------------------------------------
// リスト管理
// ----------------------------------------------------------------------
app.setup.leftColumn = function(ele){

    var a = ele.find('a.list-name:first');
    var list_ul = ele.find('ul.lists:first');
    var member_ul = ele.find('ul.members:first');
    var checkbox = ele.find('input:first');
    var li_map = {};

    checkbox.attr('disabled', true);

    a.click(function(){
        if (app.data.current_list) {
            c.fireEvent('openList', app.data.current_list);
        }
    });

    checkbox.click(function(){
        var list = app.data.current_list;
        if (!list) {
            alert('please select a list.');
            return;
        }
        var method = checkbox.attr('checked') ? '+' : '-';
        app.api.updateAccount({
            ns: 'state',
            method: method,
            key: 'mute',
            val: list.id
        })
        .done(function(data){
            if (data.success === 1) {
                app.data.state.mute = data.account.state.mute;
                c.fireEvent('checkMute', list, checkbox.attr('checked'));
            } else {
                // 現在 ステータスコード 200 の例外ケースは無い
            }
        });
    });

    c.addListener('openList', function(list){
        a.text(list.name);
        member_ul.empty();
        var members = [list.owner].concat(list.members);
        for (var i = 0, max_i = members.length; i < max_i; i++) {
            var code = members[i];
            var friend = app.data.users[code];
            var name = friend ? friend.name : code;
            if (i === 0) {
                name = name + ' (owner)';
            }
            $('<li/>')
                .append(app.util.getIcon(code, 24))
                .append($('<span/>').text(name))
                .appendTo(member_ul);
        }
        checkbox.attr('checked', (list.id in app.data.state.mute) ? true: false);
        checkbox.attr('disabled', false);
        if (list.original) {
            ele.find('.delete-list').hide();
        } else {
            ele.find('.delete-list').show();
        }
    });

    // リスト選択
    c.addListener('moveTask', function(task){
        app.data.dragtask = task;
        list_ul.slideDown('fast');
    });
    c.addListener('moveTaskCancel', function(task){
        app.data.dragtask = null;
        list_ul.slideUp('fast');
    });
    c.addListener('registerList', function(list){
        var li = $('<li/>')
            .data('id', list.id)
            .append(
                $('<a/>').text(list.name).click(function(){
                    c.fireEvent('openList', list);
                })
            );

        // Task Move
        li.get(0).addEventListener('dragover', function(e){
            if (list.id === app.data.dragtask.list.id) {
                return true;
            }
            if (e.preventDefault) {
                e.preventDefault();
            }
            return false;
        });
        li.get(0).addEventListener('drop', function(e){
            list_ul.slideUp('fast');
            app.api.moveTask(app.data.dragtask.list.id, app.data.dragtask.id, list.id);
        }, false);

        if (list.id in li_map) {
            li_map[list.id].after(li);
            li_map[list.id].remove();
        } else {
            list_ul.prepend(li);
        }
        li_map[list.id] = li;
    });
    c.addListener('deleteList', function(list){
        var remove_li = li_map[list.id];
        var next_li = remove_li.next() || remove_li.prev();
        remove_li.remove();
        delete li_map[list.id]
        if (next_li) {
            var next_id = next_li.data('id');
            if (next_id in app.data.list_map) {
                c.fireEvent('openList', app.data.list_map[next_id]);
            } else {
                // bug
            }
        } else {
            checkbox.attr('disabled', true);
        }
    });
    c.addListener('reset', function(list){
        a.text('');
        list_ul.empty();
        member_ul.empty();
        li_map = {};
        checkbox.attr('disabled', true);
    });

    //
    $(d).keydown(function(e){
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }
        if (e.shiftKey || e.ctrlKey || e.altKey) {
            return;
        }
        if (e.keyCode >= 49 && e.keyCode <= 57) { // 1-9
            e.preventDefault();
            var i = e.keyCode - 49;
            var lis = ele.find('ul.lists > li');
            if (i in lis) {
                c.fireEvent('openList', app.data.list_map[$(lis[i]).data('id')]);
            }
        } else if (e.keyCode === 76) {
            var menu = ele.find('ul.lists:first');
            if (menu.is(':visible')) {
                menu.slideUp('fast');
            } else {
                menu.slideDown('fast');
            }
        }
    });
}

// リスト登録
app.setup.registerListWindow = function(form){

    var id_input                = form.find('input[name=list_id]');
    var name_input              = form.find('input[name=name]');
    var owner_field             = form.find('div.owner-field');
    var owner_select            = form.find('select[name=owner]');
    var social_member_field     = form.find('div.twitter-member');
    var social_member_list      = form.find('ul.twitter-members');
    var social_member_input     = social_member_field.find('input');
    var social_member_addon     = social_member_field.find('.add-on');
    var social_member_label     = social_member_field.find('label');
    var social_member_template  = social_member_list.html();
    var email_member_field      = form.find('div.email-member');
    var email_member_list       = form.find('ul.email-members');
    var email_member_template   = email_member_list.html();
    var email_member_input      = email_member_field.find('input');
    var option_map              = {};

    var addSocialMember = function(code){
        if (social_member_list.find('input[value="' + code + '"]').length) {
            return;
        }
	    var user = app.data.users[code];
	    var li = $(social_member_template);
	    li.find('img').attr('src', user.icon);
	    li.find('.name').text(user.name);
	    li.find('input').attr('value', code);
	    li.find('.icon').click(function(){ li.remove() });
	    li.prependTo(social_member_list);
    };

    var addEmailMember = function(code){
        var li = $(email_member_template);
        li.find('.name').text(code);
        li.find('.icon-cross').click(function(){ li.remove() });
        li.find('input').val(code);
        li.prependTo(email_member_list);
    };

    var addMember = function(code){
        if (/^(tw|fb)-[0-9]+$/.test(code)) {
            addSocialMember(code);
        } else {
            addEmailMember(code);
        }
    };

    var modeReset = function(code){
        if (/^tw-[0-9]+$/.test(code)) {
            social_member_input.attr('placeholder', 'screen_name');
            social_member_addon.text('@');
            social_member_label.text(social_member_label.data('text-tw-' + c.lang));
            social_member_field.show();
        } else if (/^fb-[0-9]+$/.test(code)) {
            social_member_input.attr('placeholder', 'username');
            social_member_addon.text('f');
            social_member_label.text(social_member_label.data('text-fb-' + c.lang));
            social_member_field.show();
        } else {
            social_member_field.hide();
        }
    };

    var autocomplete_filter = function(term){
        var matcher = new RegExp( $.ui.autocomplete.escapeRegex(term), "i" );
        var dup = {};
        var code = owner_select.val();
        var members = [code];
        social_member_list.find('input').each(function(){
            members.push($(this).val());
        });
        var sub_list = app.util.findMeList(members);
        var sub_map = {};
        for (var i = 0, max_i = sub_list.length; i < max_i; i++) {
            sub_map[sub_list[i]] = 1;
        }

        return $.grep( app.data.assigns, function(value) {
            if (value.code in dup) {
                return false;
            } else if (!(value.owner in sub_map)) {
                return false;
            } else if (matcher.test( value.value )) {
                dup[value.code] = 1;
                return true;
            }
			return false;
		});
    };

    owner_select.change(function(){
        social_member_list.empty();
        modeReset(owner_select.val());
    });
    social_member_list.empty();
    social_member_input.autocomplete({
		source: function(request, response) {
		    response(autocomplete_filter(request.term));
		},
		select: function(event, ui) {
		    addSocialMember(ui.item.code);
        }
	}).data('autocomplete')._renderItem = function(ul, item) {
        return $(document.createElement('li'))
            .data('item.autocomplete', item)
            .append("<a>"+ item.label + "</a>")
            .appendTo(ul);
    };
    social_member_input.bind('autocompleteclose',
        function(){ social_member_input.val('') });
    email_member_field.show();
    email_member_list.empty();
    email_member_input.keydown(function(e){
        if (e.keyCode === 13 && email_member_input.val().length) {
            e.preventDefault();
            addEmailMember(email_member_input.val());
            email_member_input.val('');
        }
    });
    email_member_input.blur(function(e){
        if (email_member_input.val().length) {
            addEmailMember(email_member_input.val());
            email_member_input.val('');
        }
    });

    c.addListener('registerSubAccount', function(sub_account){
        if (option_map[sub_account.code]) {
            option_map[sub_account.code].remove();
        }
        option_map[sub_account.code] =
            $('<option/>')
                .attr('value', sub_account.code)
                .text(sub_account.name)
                .appendTo(owner_select);
        if (app.data.sign.code === sub_account.code) {
            option_map[sub_account.code].attr('selected', true);
        }
    });

    c.addListener('editList', function(list){
        owner_field.hide();
        app.dom.reset(form);
        app.dom.show(form);
        id_input.val(list.id);
        name_input.val(list.name);
        modeReset(app.util.getRegistrant(list));
        social_member_list.empty();
        email_member_list.empty();
        for (var i = 0, max_i = list.members.length; i < max_i; i++) {
            addMember(list.members[i]);
        }
    });

    c.addListener('createList', function(){
        owner_field.show();
        modeReset(owner_select.val());
        social_member_list.empty();
        email_member_list.empty();
        app.dom.reset(form);
        app.dom.show(form);
    });

    c.addListener('reset', function(){
        option_map = {};
        owner_select.empty();
    });
}
app.click.createList = function(){
    c.fireEvent('createList');
}
app.click.editList = function(){
    if (app.data.current_list) {
        c.fireEvent('editList', app.data.current_list);
    } else {
        alert('app.data.current_list is null.');
    }
}
app.submit.registerList = function(form){
    var id = form.find('input[name="list_id"]').val();
    var url = id ? '/api/1/list/update' : '/api/1/list/create';
    var users = [];
    var owner = form.find('[name="owner"]').val();
    users.push({
        code: owner,
        name: app.util.getName(owner),
        icon: app.util.getIconUrl(owner)
    });
    form.find('input[name="members"]').each(function(){
        var ele = $(this);
        var code = ele.val();
        users.push({
            code: code,
            name: app.util.getName(code),
            icon: app.util.getIconUrl(code)
        });
    });
    form.find('input[name="users"]').val(JSON.stringify(users));
    app.ajax({
        type: 'POST',
        url: url,
        data: form.serialize(),
        dataType: 'json'
    })
    .done(function(data){
        if (data.success === 1) {
            c.fireEvent('registerList', data.list);
            c.fireEvent('openList', data.list);
            app.dom.reset(form);
            form.find('ul.members').empty();
            if (id) {
                app.dom.show($('#update-list-twipsy'));
                app.dom.hide(form);
            } else {
                app.dom.show($('#create-list-twipsy'));
            }
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    });
}

// リストクリア
app.setup.switchClosed = function(ele){
    c.addListener('filterTask', function(){
        ele.removeClass('active');
    });
    ele.click(function(){
        var val = ele.hasClass('active') ? 0 : 1;
        c.fireEvent('filterTask', {
            list_id: app.data.current_list.id,
            closed: val
        });
        if (val) {
            ele.addClass('active');
        } else {
            ele.removeClass('active');
        }
    });
    c.addListener('clickNotification', function(option){
        if (ele.hasClass('active')) {
            ele.click();
        }
    });
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
            c.fireEvent('clearList', data.list);
            c.fireEvent('openList', data.list);
            app.dom.hide($('#clear-list-window'));
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    });
}

// リスト削除
app.setup.deleteListWindow = function(form){

}
app.submit.deleteList = function(form){
    app.ajax({
        type: 'POST',
        url: '/api/1/list/delete',
        data: {
            list_id: app.data.current_list.id
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success === 1) {
            c.fireEvent('deleteList', app.data.current_list);
            app.dom.show($('#delete-list-twipsy'));
            app.dom.hide($('#delete-list-window'));
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    });
}
app.sortable.list = function(ele){
    var sort = {};
    var lists = ele.find('> li');
    var count = lists.length;
    lists.each(function(i, element) {
        var li = $(element);
        if (li.data('id')) {
            sort[li.data('id')] = count;
            count--;
        }
    });
    app.api.updateAccount({
        ns: 'state.sort',
        method: 'set',
        type: 'json',
        key: 'list',
        val: JSON.stringify(sort)
    });
}

// ----------------------------------------------------------------------
// タスク管理
// ----------------------------------------------------------------------
app.setup.centerColumn = function(ele){
    
    var ul = ele.find('ul.tasks:first');
    var template = ul.html();
    var taskli_map = {};

    // 初期化処理
    ul.empty();

    c.addListener('registerTask', function(task){
        var li = $(template);

        li.data('id', task.id);

        // Task Move
        li.get(0).addEventListener('dragstart', function(e){
            c.fireEvent('moveTask', task);
            e.dataTransfer.setData("text", task.id);
        }, false);
        li.get(0).addEventListener('dragend', function(e){
            c.fireEvent('moveTaskCancel');
            e.dataTransfer.clearData();
        }, false);

        // closed
        (function(){
            var ele = li.find('.delete');
            if (task.closed) {
                li.addClass('closed');
                ele.removeClass('icon-cross').addClass('icon-plus');
            } else {
                ele.removeClass('icon-plus').addClass('icon-cross');
            }
            ele.click(function(e){
                e.stopPropagation();
                app.api.updateTask({
                    list_id: task.list.id,
                    task_id: task.id,
                    registrant: app.util.getRegistrant(task.list),
                    closed: (task.closed ? 0 : 1)
                });
            });
        })();

        // status
        (function(){
            var ele = li.find('.icon-tasks-off');
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
                app.api.updateTask({
                    list_id: task.list.id,
                    task_id: task.id,
                    registrant: app.util.getRegistrant(task.list),
                    status: status
                });
            });
        })();

        // star
        (function(){
            var ele = li.find('.icon-star-off');
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
                app.api.updateAccount({
                    ns: 'state',
                    method: method,
                    key: 'star',
                    val: task.id
                });
                c.fireEvent('checkStar', method === '+');
            });
        })();

        // human
        (function(){
            var div = li.find('.human');
            div.prepend(app.util.getIcon(task.requester, 16));
            if (task.assign.length) {
                div.prepend($('<span class="icon icon-left"/>'));
                $.each(task.assign, function(i, assign){
                    div.prepend(app.util.getIcon(assign, 16));
                });
            }
            if (task.status == 2 && task.assign.length) {
                div.prepend($('<span class="icon icon-left"/>'));
                div.prepend(app.util.getIcon(task.requester, 16));
            }
        })();

        // name
        li.find('.name').text(task.name);

        // FIXME: リファクタリング
        if (task.due) {
            var mdy = task.due.split('/');
            var label = Number(mdy[0]) + '/' + Number(mdy[1]);
            var now = new Date();
            if (now.getFullYear() != mdy[2]) {
                if (c.LANG === 'ja') {
                    label = mdy[2] + '/' + label;
                } else {
                    label = label + '/' + mdy[2];
                }
            }
            li.find('.due').text(label);
            if (now.getTime() > (new Date(mdy[2], mdy[0] - 1, mdy[1])).getTime()) {
                li.find('.due').addClass('over');
            }
        } else {
            li.find('.due').text('-');
        }

        if (task.recent) {
            var div = li.find('.recent-comment');
            div.find('.icon').append(app.util.getIcon(task.recent.code, 16));
            var date = c.date.relative(task.recent.time);
            if (task.recent.message) {
                div.find('.message span').text(task.recent.message + ' ' + date);
            } else {
                div.find('.message span').text(
                    app.data.messages.data('text-' + task.recent.action + '-' + c.lang)
                    + ' ' + date);
            }
        } else {
            li.find('.recent-comment').hide();
        }

        li.click(function(e){
            e.stopPropagation();
            c.fireEvent('openTask', task);
        });

        // FIXME: 表示条件との照合
        if (task.id in taskli_map) {
            if (!taskli_map[task.id].is(':visible')) {
                li.hide();
            }
            if (taskli_map[task.id].hasClass('selected')) {
                li.addClass('selected');
            }
            taskli_map[task.id].after(li);
            taskli_map[task.id].remove();
            taskli_map[task.id] = li;
            if (app.util.taskFilter(task, app.data.current_filter)) {
                if (!li.is(':visible')) {
                    li.slideDown('fast');
                }
                if (app.data.current_task &&
                    app.data.current_task.id === task.id) {
                    c.fireEvent('openTask', task);
                }
            } else {
                if (li.is(':visible')) {
                    li.slideUp('fast');
                }
                if (app.data.current_task &&
                    app.data.current_task.id === task.id) {
                    var next = li.nextAll(':visible:first');
                    if (!next.length) {
                        next = li.prevAll(':visible:first');
                    }
                    if (next.length) {
                        c.fireEvent('openTask', app.data.task_map[next.data('id')]);
                    } else {
                        c.fireEvent('missingTask');
                    }
                }
            }
        } else {
            li.hide();
            li.prependTo(ul);
            if (app.data.current_filter &&
                app.util.taskFilter(task, app.data.current_filter)) {
                li.slideDown('fast');
            }
        }
        taskli_map[task.id] = li;
    });

    c.addListener('openTask', function(task){
        ul.find('> li').removeClass('selected');
        if (task.id in taskli_map) {
            taskli_map[task.id].addClass('selected');
        }
    });

    c.addListener('sortTask', function(column, reverse){
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

    c.addListener('filterTask', function(condition){
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            var li = taskli_map[task_id];
            if (app.util.taskFilter(task, condition)) {
                if (!li.is(':visible')) {
                    li.slideDown('fast');
                } else {
                    li.show();
                }
            } else {
                if (li.is(':visible')) {
                    li.slideUp('fast');
                }
                if (app.data.current_task && app.data.current_task.id === task.id) {
                    c.fireEvent('missingTask');
                }
            }
        }
    });

    c.addListener('clearList', function(list){
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            if (list.id === task.list.id && task.closed) {
                if (task_id in taskli_map) {
                    if (task_id === app.data.current_task.id) {
                        c.fireEvent('missingTask');
                    }
                    taskli_map[task_id].remove();
                    delete taskli_map[task_id];
                }
                delete app.data.task_map[task_id];
            }
        }
    });

    c.addListener('missingTask', function(){
        if (app.data.current_task &&
            app.data.current_task.id in taskli_map) {
            taskli_map[app.data.current_task.id].removeClass('selected');
        }
    });

    c.addListener('reset', function(){
        ul.empty();
        taskli_map = {};
    });

    $(d).keydown(function(e){
        if (!app.data.current_task) {
            return;
        }
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }
        if (e.shiftKey || e.ctrlKey || e.altKey) {
            return;
        }
        if (e.keyCode === 38) { // Up
            var id = app.data.current_task.id;
            var li = taskli_map[id];
            var next = li.prevAll(':visible:first');
            if (next.length) {
                var next_id = next.data('id');
                if (!(next_id in app.data.task_map)) {
                    return;
                }
                c.fireEvent('openTask', app.data.task_map[next_id]);
            }
        } else if (e.keyCode === 40) { // Down
            var id = app.data.current_task.id;
            var li = taskli_map[id];
            var next = li.nextAll(':visible:first');
            if (next.length) {
                var next_id = next.data('id');
                if (!(next_id in app.data.task_map)) {
                    return;
                }
                c.fireEvent('openTask', app.data.task_map[next_id]);
            }
        } else if (e.keyCode === 37) { // Left
            var task = app.data.current_task;
            var date = task.due_date || new Date();
            date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
            var due = c.date.ymd(date);
            app.api.updateTask({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                due: due
            });
        } else if (e.keyCode === 39) { // Right
            var task = app.data.current_task;
            var date = task.due_date || new Date();
            date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
            var due = c.date.ymd(date);
            app.api.updateTask({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                due: due
            });
        } else if (e.keyCode === 32) { // Space
            var task = app.data.current_task;
            var status = task.status === 2 ? 0 : task.status + 1;
            app.api.updateTask({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                status: status
            });
        } else if (e.keyCode === 13) { // Enter
            var task = app.data.current_task;
            var closed = task.closed ? 0 : 1;
            app.api.updateTask({
                list_id: task.list.id,
                task_id: task.id,
                registrant: app.util.getRegistrant(task.list),
                closed: closed
            });
        } else if (e.keyCode === 69) { // E
            var task = app.data.current_task;
            c.fireEvent('editTask', task);
        }
    });
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



    // setup datepicker
    if (c.lang === 'ja') {
        due_input.datepicker({dateFormat: 'yy/mm/dd'});
    } else {
        due_input.datepicker();
    }

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

    c.addListener('createTask', function(){
        app.dom.reset(form);
        if (!app.data.current_list) {
            alert('missing current_list');
            return;
        }
        setup(app.data.current_list);

        //
        app.dom.show(form);
    });

    c.addListener('editTask', function(task){
        app.dom.reset(form);
        if (!app.data.current_list) {
            alert('missing current_list');
            return;
        }
        setup(task.list);

        name_input.val(task.name);
        due_input.val(task.due);
        requester_select.val(task.requester);
        task_id_input.val(task.id);
        form.find('input[name=assign]').val(task.assign);

        if (task.due) {
            due_input.datepicker('setDate', task.due_date);
        }

        app.dom.show(form);

    });
}
app.click.createTask = function(){
    c.fireEvent('createTask');
}
app.click.editTask = function(){
    if (app.data.current_task) {
        c.fireEvent('editTask', app.data.current_task);
    } else {
        alert('app.data.current_task is null.');
    }
}
app.click.sortTask = function(ele){
    c.fireEvent('sortTask', ele.data('sort-column'), ele.data('sort-reverse'));
}
app.submit.registerTask = function(form){
    var task_id = form.find('input[name=task_id]').val();
    var list_id = form.find('input[name=list_id]').val();
    var list = app.data.list_map[list_id];
    if (!list) {
        alert('unknown list ' + list_id);
        return;
    }
    var url = task_id ? '/api/1/task/update' : '/api/1/task/create';
    app.ajax({
        type: 'POST',
        url: url,
        data: form.serialize(),
        dataType: 'json'
    })
    .done(function(data){
        if (data.success === 1) {
            c.fireEvent('registerTask', data.task, list);
            c.fireEvent('openTask', data.task);
            app.dom.reset(form);
            // form.find('ul.members').empty();
            if (task_id) {
                // app.dom.show($('#update-task-twipsy'));
                app.dom.hide(form);
            } else {
                app.dom.show($('#create-task-twipsy'));
            }
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    });
}

// ----------------------------------------------------------------------
// コメント管理
// ----------------------------------------------------------------------
app.setup.rightColumn = function(ele){
    var list_id_input    = ele.find('input[name=list_id]');
    var task_id_input    = ele.find('input[name=task_id]');
    var registrant_input = ele.find('input[name=registrant]');
    var button           = ele.find('button');
    var list_name        = ele.find('.list_name');
    var task_name        = ele.find('.task_name');
    var ul               = ele.find('ul.comments');
    var template         = ul.html();

    // 初期化処理
    ul.empty();
    button.attr('disabled', true);

    // Shortcut
    $(d).keydown(function(e){
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }
        if (e.shiftKey || e.ctrlKey || e.altKey) {
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
        button.attr('disabled', false);
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
                li.find('.message').text(comment.message);
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
                        } else {
                            // 現在 ステータスコード 200 の例外ケースは無い
                        }
                    });
                });
            }
            li.find('.date').text(c.date.relative(comment.time));
            li.prependTo(ul);
        });
    });

    c.addListener('missingTask', function(){
        ul.empty();
        button.attr('disabled', true);
        list_name.text('-');
        task_name.text('-');
    });

    c.addListener('reset', function(){
        ul.empty();
        button.attr('disabled', true);
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
        return;
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

// ----------------------------------------------------------------------
// イベント受信
// ----------------------------------------------------------------------
app.setup.receiver = function(ele){
    ele.get(0).addEventListener('extentionsEvent', function() {
        var data = JSON.parse(ele.text());
        c.fireEvent(data.event, data.option);
    }, false);
}

})(this, this, document);