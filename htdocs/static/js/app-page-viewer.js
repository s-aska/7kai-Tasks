(function(ns, w, d) {

var c = ns.c;
var app = ns.app;

c.addEvents('registerTwitterFriends');
c.addEvents('registerSubAccount');

c.addEvents('registerList');
c.addEvents('openList');
c.addEvents('createList');
c.addEvents('editList');
c.addEvents('removeList');

c.addEvents('registerTask'); // サーバーから取得又は登録フォームから登録した場合発火
c.addEvents('openTask');
c.addEvents('createTask');   // 登録フォーム表示(新規モード)
c.addEvents('editTask');     // 登録フォーム表示(編集モード)
c.addEvents('clearTask');
c.addEvents('sortTask');
c.addEvents('filterTask');

c.addEvents('checkStar');
c.addEvents('checkMute');

// イベントのキャッシュコントロール
c.addListener('openList', function(list){
    console.log(list);
    app.data.current_list = list;

    c.fireEvent('filterTask', {
        list_id: list.id
    });
});
c.addListener('registerList', function(list){
    console.log(list);
    app.data.list_map[list.id] = list;
});
c.addListener('removeList', function(list){
    console.log(list);
    delete app.data.list_map[list.id];
});

c.addListener('openTask', function(task){
    console.log(task);
    app.data.current_task = task;
});
c.addListener('registerTask', function(task, list){
    console.log(task);

    // リスト
    task.list = list;

    // 期日
    if (task.due) {
        task.due_date = $.datepicker.parseDate('mm/dd/yy', task.due);
        task.due_epoch = task.due_date.getTime();
    } else {
        task.due_epoch = 0;
    }

    // 履歴・コメント
    task.actions = [].concat(task.comments).concat(task.history).sort(function(a, b) {
        return (Number(a.date) || 0) - (Number(b.date) || 0);
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

    app.data.task_map[task.id] = task;
    if (app.data.current_task && task.id === app.data.current_task.id) {
        app.data.current_task = task;
    }
});

// セットアップ
c.addListener('setup', function(){
    app.ajax({
        url: '/api/1/account/info_with_all'
    })
    .done(function(data){
        var friends
            , friends_data
            , sub_account
            , reload
            , user_id
            , diff
            , status;
        
        console.log(data);
        
        app.data.sign = data.sign;
        app.data.state = data.account.state;
        app.data.sub_accounts = data.sub_accounts;
        
        if (!('mute' in app.data.state)) {
            app.data.state.mute = {};
        }

        // localStorageのfriendsリストを更新
        for (var i = 0, max_i = data.sub_accounts.length; i < max_i; i++) {
            sub_account = data.sub_accounts[i];

            console.log('find sub account ' + sub_account.name + ' ' + sub_account.code);

            c.fireEvent('registerSubAccount', sub_account);

            // Twitter
            if (/^tw-/.test(sub_account.code)) {
                user_id = sub_account.code.substring(3);
                friends = localStorage.getItem('friends-tw-' + user_id);
                if (friends) {
                    friends_data = JSON.parse(friends);
                    reload = false;
                    if (data.sign.code === sub_account.code) {
                        var time = (new Date()).getTime() - friends_data.time;
                        if (time > app.option.friends_reload_threshold) {
                            reload = true;
                        }
                    }
                    if (reload) {
                        app.friendFetchTwitter(user_id, '-1', []);
                    } else {
                        c.fireEvent('registerTwitterFriends',
                            sub_account.code,
                            friends_data.friends);
                    }
                }
                else if (data.sign.code === sub_account.code) {
                    app.friendFetchTwitter(user_id, '-1', []);
                }
                
                status = localStorage.getItem('status-tw-' + user_id);
                if (status) {
                    status_data = JSON.parse(status);
                    reload = false;
                    var time = (new Date()).getTime() - status_data.time;
                    if (time > app.option.friends_reload_threshold) {
                        reload = true;
                    }
                    if (reload) {
                        app.statusFetchTwitter(user_id);
                    } else {
                        console.log(status_data);
                        app.data.friends['tw-' + user_id] = status_data.status;
                    }
                }
                else {
                    app.statusFetchTwitter(user_id);
                }
            }
            
            // Facebook
            else if (/^fb-/.test(sub_account.code)) {
                
            }
            
            // E-mail
            else {
                
            }
            
            
        }
        
        $.each(data.lists, function(i, list){
            c.fireEvent('registerList', list);
            $.each(list.tasks, function(i, task){
                c.fireEvent('registerTask', task, list);
            });
        });
        
        // 
        var last_list_id = localStorage.getItem('last_list_id');
        if (last_list_id && (last_list_id in app.data.list_map)) {
            c.fireEvent('openList', app.data.list_map[last_list_id]);
        } else if (data.lists.length) {
            c.fireEvent('openList', data.lists[0]);
        }
        c.fireEvent('sortTask', 'updated', true);
    });
});

// フレンド同期機能
app.friendFetchTwitter = function(user_id, cursor, cache){

    console.log('[' + user_id + '] twitter friends get from api.');

    app.ajax({
        url: 'https://api.twitter.com/1/statuses/friends.json',
        data: {
            cursor: cursor,
            user_id: user_id
        },
        dataType: 'jsonp'
    })
    .done(function(data){
        for (var i = 0, max_i = data.users.length; i < max_i; i++) {
            cache.push({
                name: data.users[i].name,
                screen_name: data.users[i].screen_name,
                profile_image_url: data.users[i].profile_image_url,
                id: data.users[i].id_str
            });
        }
        
        // next
        if (data.next_cursor) {
            app.friendFetchTwitter(user_id, data.next_cursor_str, cache);
        }
        
        // last
        else {
            console.log('[' + user_id + '] twitter friends save to localStorage.');
            localStorage.setItem('friends-tw-' + user_id,
                JSON.stringify({ time: (new Date()).getTime(), friends: cache }));
            c.fireEvent('registerTwitterFriends', 'tw-' + user_id, cache);
        }
    });
}
app.statusFetchTwitter = function(user_id){
    app.ajax({
        url: 'https://api.twitter.com/1/users/show.json',
        data: {
            user_id: user_id
        },
        dataType: 'jsonp'
    })
    .done(function(data){
        var cache = {
            name: data.name,
            screen_name: data.screen_name,
            profile_image_url: data.profile_image_url,
            id: data.id_str
        };
        console.log('[' + user_id + '] twitter status save to localStorage.');
        localStorage.setItem('status-tw-' + user_id,
            JSON.stringify({ time: (new Date()).getTime(), status: cache }));
        app.data.friends['tw-' + user_id] = cache;
    });
}
app.friendFetchFacebook = function(){
    
}
c.addListener('registerTwitterFriends', function(code, friends){
    var friend
        , label;
    for (var i = 0, max_i = friends.length; i < max_i; i++) {
        friend = friends[i];
        label =
            $('<div/>')
                .append(
                    $('<img/>')
    		            .addClass('sq16')
                        .attr('src', friend.profile_image_url)
                )
                .append(
                    $('<span>').text(friend.screen_name + '(' + friend.name + ')')
                )
                .html();
        app.data.friends['tw-' + friend.id] = friend;
        if (!(code in app.data.assigns)) {
            app.data.assigns[code] = [];
        }
        app.data.assigns[code].push({
            code: 'tw-' + friend.id,
            name: friend.name,
            value: friend.screen_name,
            label: label
        })
    }
});

app.util.getIcon = function(code, size){
    var src;
    var friend = app.data.friends[code];
    if (friend) {
        src = friend.profile_image_url;
    }
    else if (/@/.test(code)) {
        src = size === 16 ? '/static/img/email.png' : '/static/img/email24.png';
    }
    else {
        src = '/static/img/address.png';
    }
    return $('<img/>').attr('src', src).addClass('sq' + size);
}
app.util.getScreenName = function(code){
    var friend = app.data.friends[code];
    if (friend) {
        return friend.screen_name;
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
    // 自分がアサインされていない!?
    console.log('missing registrant...');
}
app.util.taskFilter = function(task, condition){
    if (!condition.closed) {
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
        if (task.list.id in app.data.state.mute) {
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
    if (condition.watch) {
        if (!(task.id in app.data.state.watch)) {
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
            c.fireEvent('openTask', data.task);
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    });
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
}
app.setup.starCounter = function(ele){
    var count = 0;
    c.addListener('registerTask', function(task){
        // 初回かつOn
        if (!task.before && app.util.taskFilter(task, {watch: 1})) {
            count++;
            ele.text(count);
        }
    });
    c.addListener('checkStar', function(checked){
        count+= checked ? 1 : -1;
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
}
app.click.filterTask = function(ele){
    c.fireEvent('filterTask', ele.data('filter-condition'));
    ele.parent().addClass('active');
}

// ----------------------------------------------------------------------
// リスト管理
// ----------------------------------------------------------------------
app.setup.leftColumn = function(ele){
    
    // リスト表示
    (function(){
        var a = ele.find('a.list-name:first');
        var ul = ele.find('ul.members:first');
        var checkbox = ele.find('input:first');
        c.addListener('openList', function(list){
            a.text(list.name);
            ul.empty();
            var members = [list.owner].concat(list.members);
            for (var i = 0, max_i = members.length; i < max_i; i++) {
                var code = members[i];
                var friend = app.data.friends[code];
                var name = friend ? friend.screen_name : code;
                if (i === 0) {
                    name = name + ' (owner)';
                }
                var li = $('<li/>');
                li.append(app.util.getIcon(code, 24));
                li.append($('<span/>').text(name));
                ul.append(li);
            }
            checkbox.attr('checked', (list.id in app.data.state.mute) ? true: false);
            checkbox.attr('disabled', false);
        });
        checkbox.click(function(){
            var list = app.data.current_list;
            if (!list) {
                console.log('リストを選択していないと指定出来ません。');
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
                console.log(data);
                if (data.success === 1) {
                    app.data.state.mute = data.account.state.mute;
                    c.fireEvent('checkMute', list, checkbox.attr('checked'));
                } else {
                    // 現在 ステータスコード 200 の例外ケースは無い
                }
            });
        });
    })();
    
    // リスト選択
    (function(){
        var cache = {};
        var ul = ele.find('ul.lists:first');
        c.addListener('registerList', function(list){
            var li = $('<li/>')
                .data('id', list.id)
                .append(
                    $('<a/>').text(list.name).click(function(){
                        c.fireEvent('openList', list);
                    })
                );
            if (list.id in cache) {
                cache[list.id].after(li);
                cache[list.id].remove();
            } else {
                ul.prepend(li);
            }
            cache[list.id] = li;
        });
        c.addListener('removeList', function(list){
            var remove_li = cache[list.id];
            var next_li = remove_li.next() || remove_li.prev();
            remove_li.remove();
            if (next_li) {
                var next_id = next_li.data('id');
                if (next_id in app.data.list_map) {
                    c.fireEvent('openList', app.data.list_map[next_id]);
                } else {
                    console.log('ここに来たらバグですね...');
                }
            } else {
                console.log('表示するリストが無くなった...');
            }
        });
    })();

    // 
    
}

// リスト登録
app.setup.registerListWindow = function(form){
    
    var id_input                = form.find('input[name=list_id]');
    var name_input              = form.find('input[name=name]');
    var owner_field             = form.find('div.owner-field');
    var owner_select            = form.find('select[name=owner]');
    var twitter_member_field    = form.find('div.twitter-member');
    var twitter_member_list     = form.find('ul.twitter-members');
    var twitter_member_input    = twitter_member_field.find('input');
    var twitter_member_template = twitter_member_list.html();
    var facebook_member_field   = form.find('div.facebook-member');
    var facebook_member_list    = form.find('ul.facebook-members');
    var email_member_field      = form.find('div.email-member');
    var email_member_list       = form.find('ul.email-members');
    var email_member_template   = email_member_list.html();
    var email_member_input      = email_member_field.find('input');
    
    var addTwitterMember = function(code){
        if (twitter_member_list.find('input[value="' + code + '"]').length) {
            return;
        }
	    var friend = app.data.friends[code];
	    var li = $(twitter_member_template);
	    li.find('img')
	        .attr('src', friend.profile_image_url);
	    li.find('.name')
	        .text(friend.screen_name);
	    li.find('input')
	        .attr('value', code);
	    li.find('.icon').click(function(){ li.remove() });
	    li.prependTo(twitter_member_list);
    };
    var addEmailMember = function(code){
        var li = $(email_member_template);
        li.find('.name').text(code);
        li.find('.icon-cross')
            .click(function(){ li.remove() });
        li.find('input')
            .val(code);
        li.prependTo(email_member_list);
    };
    
    // Owner
    (function(){
        var cache = {};
        c.addListener('registerSubAccount', function(sub_account){
            if (cache[sub_account.code]) {
                cache[sub_account.code].remove();
            }
            cache[sub_account.code] =
                $('<option/>')
                    .attr('value', sub_account.code)
                    .text(sub_account.name)
                    .appendTo(owner_select);
            if (app.data.sign.code === sub_account.code) {
                cache[sub_account.code].attr('selected', true);
            }
        });
    })();
    
    // Member(Twitter)
    (function(){
        
        // Twitterアカウントを持っている場合のみ表示
        c.addListener('registerSubAccount', function(sub_account){
            if (/^tw-/.test(sub_account.code)) {
                twitter_member_field.show();
            }
        });
        
        // autocomplete
        var filter = function(term){
            var matcher = new RegExp( $.ui.autocomplete.escapeRegex(term), "i" );
            var dup = {};
            var code = owner_select.val();
            var array = [];
            if (code in app.data.assigns) {
                array = app.data.assigns[code];
            } else {
                console.log('missing assings.');
            }
            return $.grep( array, function(value) {
                if (value.code in dup) {
                    return false;
                } else if (matcher.test( value.name + value.value )) {
                    dup[value.code] = 1;
                    return true;
                }
    			return false;
    		});
        };
        
        twitter_member_list.empty();
        twitter_member_input.autocomplete({
    		source: function(request, response) {
    		    response(filter(request.term));
    		},
    		select: function(event, ui) {
    		    addTwitterMember(ui.item.code);
            }
    	}).data('autocomplete')._renderItem = function(ul, item) {
            return $(document.createElement('li'))
                .data('item.autocomplete', item)
                .append("<a>"+ item.label + "</a>")
                .appendTo(ul);
        };
        twitter_member_input.bind('autocompleteclose', function(){ twitter_member_input.val('') });
    })();
    
    // Member(Facebook)
    (function(){
        // Facebookアカウントを持っている場合のみ表示
        c.addListener('registerSubAccount', function(sub_account){
            if (/^fb-/.test(sub_account.code)) {
                facebook_member_field.show();
            }
        });
        var template = facebook_member_list.html();
        facebook_member_list.empty();
    })();
    
    // Members(E-mail)
    (function(){
        email_member_field.show();
        email_member_list.empty();
        email_member_input.keydown(function(e){
            if (e.keyCode === 13) {
                e.preventDefault();
                addEmailMember(email_member_input.val());
                email_member_input.val('');
            }
        });
    })();
    
    (function(){
       c.addListener('editList', function(list){
           owner_field.hide();
           app.dom.reset(form);
           app.dom.show(form);
           id_input.val(list.id);
           name_input.val(list.name);
           twitter_member_list.empty();
           facebook_member_list.empty();
           email_member_list.empty();
           for (var i = 0, max_i = list.members.length; i < max_i; i++) {
               var code = list.members[i];
               if (/^tw-/.test(code)) {
                   addTwitterMember(code);
               }
               else if (/^fb-/.test(code)) {
                   
               }
               else {
                   addEmailMember(code);
               }
           }
       });
       c.addListener('createList', function(){
           owner_field.show();
           twitter_member_list.empty();
           facebook_member_list.empty();
           email_member_list.empty();
           app.dom.reset(form);
           app.dom.show(form);
       });
    })();
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
    var id = form.find('input[name=list_id]').val();
    var url = id ? '/api/1/list/update' : '/api/1/list/create';
    app.ajax({
        type: 'POST',
        url: url,
        data: form.serialize(),
        dataType: 'json'
    })
    .done(function(data){
        console.log(data);
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
        console.log(data);
        if (data.success === 1) {
            c.fireEvent('removeList', app.data.current_list);
            app.dom.show($('#delete-list-twipsy'));
            app.dom.hide($('#delete-list-window'));
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    });
}

// ----------------------------------------------------------------------
// タスク管理
// ----------------------------------------------------------------------
app.setup.centerColumn = function(ele){
    
    
    (function(){
        var ul = ele.find('ul.tasks:first');
        var template = ul.html();
        ul.empty();
        
        c.addListener('registerTask', function(task){
            var li = $(template);
            
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
                if (task.id in app.data.state.watch) {
                    ele.removeClass('icon-star-off').addClass('icon-star');
                }
                ele.click(function(e){
                    e.stopPropagation();
                    var method = '+';
                    if (task.id in app.data.state.watch) {
                        method = '-';
                        delete app.data.state.watch[task.id];
                        ele.removeClass('icon-star').addClass('icon-star-off');
                    } else {
                        app.data.state.watch[task.id] = 1;
                        ele.removeClass('icon-star-off').addClass('icon-star');
                    }
                    app.api.updateAccount({
                        ns: 'state',
                        method: method,
                        key: 'watch',
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
                var label = mdy[0] + '/' + mdy[1];
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
                var date = c.date.relative(task.recent.date);
                if (task.recent.message) {
                    div.find('.message span').text(task.recent.message + ' ' + date);
                } else {
                    div.find('.message span').text(
                        $('#messages').data('text-' + task.recent.action + '-' + c.lang)
                        + ' ' + date);
                }
            } else {
                li.find('.recent-comment').hide();
            }
            
            li.click(function(){
                c.fireEvent('openTask', task);
            });
            
            // FIXME: 表示条件との照合
            if (task.id in app.data.taskli_map) {
                app.data.taskli_map[task.id].after(li);
                app.data.taskli_map[task.id].remove();
            } else {
                li.prependTo(ul);
            }
            app.data.taskli_map[task.id] = li;
        });
        
        c.addListener('openTask', function(task){
            ul.find('> li').removeClass('selected');
            if (task.id in app.data.taskli_map) {
                app.data.taskli_map[task.id].addClass('selected');
            }
        });
        
        c.addListener('sortTask', function(column, reverse){
            var tasks = [];
            for (var task_id in app.data.task_map) {
                tasks.push(app.data.task_map[task_id]);
            }
            tasks.sort(function(a, b){
                return (Number(a[column]) || 0) - (Number(b[column]) || 0);
            });
            if (app.data.current_sort.column === column
                && app.data.current_sort.reverse === reverse) {
                reverse = reverse ? false : true;
            }
            if (reverse) {
                tasks.reverse();
            }
            for (var i = 0, max_i = tasks.length; i < max_i; i++) {
                ul.append(app.data.taskli_map[tasks[i].id]);
            }
            app.data.current_sort.column = column;
            app.data.current_sort.reverse = reverse;
        });
        
        c.addListener('filterTask', function(condition){
            for (var task_id in app.data.task_map) {
                var task = app.data.task_map[task_id];
                var li = app.data.taskli_map[task_id];
                if (app.util.taskFilter(task, condition)) {
                    if (!li.is(':visible')) {
                        li.slideDown('fast');
                    }
                } else {
                    if (li.is(':visible')) {
                        li.slideUp('fast');
                    }
                }
            }
            
            
        });
        
    })();
    
    
    
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
            var friend = app.data.friends[assign];
            var li = $(assign_template);
            if (friend && friend.profile_image_url) {
                li.find('img').attr('src', friend.profile_image_url);
            } else if (/@/.test(assign)) {
                li.find('img').attr('src', '/static/img/email.png');
            } else {
                li.find('img').attr('src', '/static/img/address.png');
            }
            var name = friend ? friend.screen_name : assign;
            li.find('div.name').text(name);
            li.find('input').val(assign);
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
    var list_id_input = ele.find('input[name=list_id]');
    var task_id_input = ele.find('input[name=task_id]');
    var registrant_input = ele.find('input[name=registrant]');
    var list_name = ele.find('.list_name');
    var task_name = ele.find('.task_name');
    var ul = ele.find('ul.comments');
    var template = ul.html();
    
    c.addListener('openTask', function(task){
        list_id_input.val(task.list.id);
        task_id_input.val(task.id);
        registrant_input.val(app.util.getRegistrant(task.list));
        list_name.text(task.list.name);
        task_name.text(task.name);
        ul.empty();
        var li = $(template);
        li.find('.icon').append(app.util.getIcon(task.registrant, 32));
        li.find('.name').text(app.util.getScreenName(task.registrant));
        li.find('.message').text($('#messages').data('text-create-task-' + c.lang));
        li.find('.date').text(c.date.relative(task.created));
        li.prependTo(ul);
        $.each(task.actions, function(i, comment){
            var li = $(template);
            li.find('.icon').append(app.util.getIcon(comment.code, 32));
            li.find('.name').text(app.util.getScreenName(comment.code));
            if (comment.action) {
                li.find('.message').text($('#messages').data('text-' + comment.action + '-' + c.lang));
            } else {
                li.find('.message').text(comment.message);
            }
            li.find('.date').text(c.date.relative(comment.date));
            li.prependTo(ul);
        });
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
            // app.dom.show($('#create-comment-twipsy'));
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    });
}



})(this, this, document);