(function(ns, w, d) {

var app = ns.app;

app.addEvents('moveTask');
app.addEvents('moveTaskCancel');
app.addEvents('removeAccountConfirm');

// ----------------------------------------------------------------------
// トップバー機能(ってなんだよ...)
// ----------------------------------------------------------------------
app.setup.topBar = function(ele){

    var filter_list = ele.find('.container > ul:first');

    // リスト選択されたらハイライトを全力で切る
    app.addListener('openList', function(list){
        filter_list.find('> li').removeClass('active');
    });
}
app.setup.notificationCounter = function(ele){

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
    var li_cache = {};
    var ul = ele.find('ul.accounts');
    var template = ul.html();
    ul.empty();
    app.addListener('registerSubAccount', function(sub_account){
        var li = $(template);
        li.find('img').attr('src', app.util.getIconUrl(sub_account.code));
        li.find('.name').text(sub_account.name);
        li.find('button').click(function(){
            app.fireEvent('removeAccountConfirm', sub_account);
        });
        if (sub_account.code in li_cache) {
            li_cache[sub_account.code].after(li);
            li_cache[sub_account.code].remove();
        } else {
            li.appendTo(ul);
        }
        li_cache[sub_account.code] = li;
    });
    app.addListener('reset', function(){
        ul.empty();
        ele.hide();
    });
}
app.setup.removeAccountWindow = function(form){
    app.addListener('removeAccountConfirm', function(sub_account){
        app.dom.show(form);
        form.find('input[name="code"]').val(sub_account.code);
        form.find('img').attr('src', app.util.getIconUrl(sub_account.code));
        form.find('.name').text(sub_account.name);
    });
    app.addListener('reset', function(){
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
                app.fireEvent('resetup');
            }
        }
    })
}
app.click.addTwitter = function(){
    $('#add-twitter').submit();
}
app.click.addFacebook = function(){
    $('#add-facebook').submit();
}
app.click.openMini = function(ele){
    window.open(window.location.href + '?mobile=1', '',
        'width=320,height=480,left=100,top=100');
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
            app.fireEvent('openList', app.data.current_list);
        }
    });

    checkbox.click(function(){
        var list = app.data.current_list;
        if (!list) {
            alert('please select a list.');
            return;
        }
        var method = checkbox.attr('checked') ? '+' : '-';
        app.api.account.update({
            ns: 'state',
            method: method,
            key: 'mute',
            val: list.id
        })
        .done(function(data){
            if (data.success === 1) {
                app.data.state.mute = data.account.state.mute;
                app.fireEvent('checkMute', list, checkbox.attr('checked'));
            } else {
                // 現在 ステータスコード 200 の例外ケースは無い
            }
        });
    });

    app.addListener('openList', function(list){
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
    app.addListener('moveTask', function(task){
        app.data.dragtask = task;
        list_ul.slideDown('fast');
    });
    app.addListener('moveTaskCancel', function(task){
        app.data.dragtask = null;
        list_ul.slideUp('fast');
    });
    app.addListener('registerList', function(list){
        var li = $('<li/>')
            .data('id', list.id)
            .append(
                $('<a/>').text(list.name).click(function(){
                    app.fireEvent('openList', list);
                })
            );

        // Task Move
        li.get(0).addEventListener('dragover', function(e){
            if (list.id === app.data.dragtask.list.id) {
                return true;
            }
            if (e.preventDefault) {
                e.preventDefault();
                li.addClass('active');
            }
            return false;
        });
        li.get(0).addEventListener('dragleave', function(e){
            li.removeClass('active');
        });
        li.get(0).addEventListener('drop', function(e){
            list_ul.find('> li').removeClass('active');
            list_ul.slideUp('fast');
            app.api.task.move(app.data.dragtask.list.id, app.data.dragtask.id, list.id);
        }, false);

        if (list.id in li_map) {
            li_map[list.id].after(li);
            li_map[list.id].remove();
        } else {
            list_ul.prepend(li);
        }
        li_map[list.id] = li;
    });
    app.addListener('deleteList', function(list){
        var remove_li = li_map[list.id];
        var next_li = remove_li.next() || remove_li.prev();
        remove_li.remove();
        delete li_map[list.id]
        if (next_li) {
            var next_id = next_li.data('id');
            if (next_id in app.data.list_map) {
                app.fireEvent('openList', app.data.list_map[next_id]);
            } else {
                // bug
            }
        } else {
            checkbox.attr('disabled', true);
        }
    });
    app.addListener('reset', function(list){
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
        if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }
        if (e.keyCode >= 49 && e.keyCode <= 57) { // 1-9
            e.preventDefault();
            var i = e.keyCode - 49;
            var lis = ele.find('ul.lists > li');
            if (i in lis) {
                app.fireEvent('openList', app.data.list_map[$(lis[i]).data('id')]);
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
            social_member_label.text(social_member_label.data('text-tw-' + app.env.lang));
            social_member_field.show();
        } else if (/^fb-[0-9]+$/.test(code)) {
            social_member_input.attr('placeholder', 'username');
            social_member_addon.text('f');
            social_member_label.text(social_member_label.data('text-fb-' + app.env.lang));
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

    app.addListener('registerSubAccount', function(sub_account){
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

    app.addListener('editList', function(list){
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

    app.addListener('createList', function(){
        id_input.val('');
        owner_field.show();
        modeReset(owner_select.val());
        social_member_list.empty();
        email_member_list.empty();
        app.dom.reset(form);
        app.dom.show(form);
    });

    app.addListener('reset', function(){
        option_map = {};
        owner_select.empty();
    });
}
app.setup.deleteListWindow = function(form){

}
app.click.createList = function(){
    app.fireEvent('createList');
}
app.click.editList = function(){
    if (app.data.current_list) {
        app.fireEvent('editList', app.data.current_list);
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
            app.fireEvent('registerList', data.list);
            app.fireEvent('openList', data.list);
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
            app.fireEvent('deleteList', app.data.current_list);
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
    app.api.account.update({
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

    app.addListener('registerTask', function(task){
        var li = $(template);

        li.data('id', task.id);

        if (task.salvage) {
            li.addClass('salvage');
        }

        // Task Move
        li.get(0).addEventListener('dragstart', function(e){
            app.fireEvent('moveTask', task);
            e.dataTransfer.setData("text", task.id);
        }, false);
        li.get(0).addEventListener('dragend', function(e){
            app.fireEvent('moveTaskCancel');
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
                app.api.task.update({
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
                app.api.task.update({
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
                app.api.account.update({
                    ns: 'state',
                    method: method,
                    key: 'star',
                    val: task.id
                });
                app.fireEvent('checkStar', method === '+');
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
            var label = (task.due_date.getMonth() + 1) + '/' + task.due_date.getDate();
            var now = new Date();
            if (now.getFullYear() !== task.due_date.getFullYear()) {
                if (app.env.lang === 'ja') {
                    label = task.due_date.getFullYear() + '/' + label;
                } else {
                    label = label + '/' + task.due_date.getFullYear();
                }
            }
            li.find('.due').text(label);
            if (now.getTime() > task.due_date.getTime()) {
                li.find('.due').addClass('over');
            }
        } else {
            li.find('.due').text('-');
        }

        if (task.recent) {
            var div = li.find('.recent-comment');
            div.find('.icon').append(app.util.getIcon(task.recent.code, 16));
            var date = app.date.relative(task.recent.time);
            if (task.recent.message) {
                div.find('.message span').text(task.recent.message + ' ' + date);
            } else {
                div.find('.message span').text(
                    app.data.messages.data('text-' + task.recent.action + '-' + app.env.lang)
                    + ' ' + date);
            }
        } else {
            li.find('.recent-comment').hide();
        }

        li.click(function(e){
            e.stopPropagation();
            app.fireEvent('openTask', task);
        });

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
        ul.find('> li').removeClass('selected');
        if (task.id in taskli_map) {
            taskli_map[task.id].addClass('selected');
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

    app.addListener('reset', function(){
        ul.empty();
        taskli_map = {};
    });

    $(d).keydown(function(e){
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }
        if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }
        if (e.keyCode === 38) { // Up
            var next;
            if (app.data.current_task) {
                next = taskli_map[app.data.current_task.id].prevAll(':visible:first');
            } else {
                next = ul.find('> li:visible:first');
            }
            if (next.length) {
                var next_id = next.data('id');
                if (!(next_id in app.data.task_map)) {
                    return;
                }
                app.fireEvent('openTask', app.data.task_map[next_id]);
            }
        } else if (e.keyCode === 40) { // Down
            var next;
            if (app.data.current_task) {
                next = taskli_map[app.data.current_task.id].nextAll(':visible:first');
            } else {
                next = ul.find('> li:visible:first');
            }
            if (next.length) {
                var next_id = next.data('id');
                if (!(next_id in app.data.task_map)) {
                    return;
                }
                app.fireEvent('openTask', app.data.task_map[next_id]);
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

        //
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
app.click.sortTask = function(ele){
    app.fireEvent('sortTask', ele.data('sort-column'), ele.data('sort-reverse'));
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
                app.dom.show($('#create-task-twipsy'));
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
                app.dom.show($('#create-task-twipsy'));
            }
        }
    });
}

// ----------------------------------------------------------------------
// イベント受信
// ----------------------------------------------------------------------
app.setup.receiver = function(ele){
    ele.get(0).addEventListener('extentionsEvent', function() {
        var data = JSON.parse(ele.text());
        app.fireEvent(data.event, data.option);
    }, false);
}

})(this, this, document);