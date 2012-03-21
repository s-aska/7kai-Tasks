"use strict";
(function(ns, w, d, $) {

var app = ns.app;

app.addEvents('moveTask');
app.addEvents('moveTaskCancel');
app.addEvents('removeAccountConfirm');
app.addEvents('showListMenu');

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
        app.dom.setup(li);
        if (sub_account.code in li_cache) {
            li_cache[sub_account.code].after(li);
            li_cache[sub_account.code].remove();
        } else {
            li.appendTo(ul);
        }
        li_cache[sub_account.code] = li;
    });
    app.addListener('clear', function(){
        ul.empty();
        ele.hide();
        li_cache = {};
    });
}
app.setup.removeAccountWindow = function(form){
    app.addListener('removeAccountConfirm', function(sub_account){
        app.dom.show(form);
        form.find('input[name="code"]').val(sub_account.code);
        form.find('img').attr('src', app.util.getIconUrl(sub_account.code));
        form.find('.name').text(sub_account.name);
    });
    app.addListener('clear', function(){
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
            app.dom.show(app.dom.get('showable', 'success-delete-account'));
            if (data.signout) {
                setTimeout(function(){
                    location.reload();
                }, 3000);
            } else {
                app.fireEvent('reload');
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
    window.open(
        window.location.protocol
        + '//'
        + window.location.host
        + '/?mobile=1',
        '',
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
        var method = checkbox.is(':checked') ? 'on' : 'off';
        app.api.account.update({
            ns: 'state',
            method: method,
            key: 'mute',
            val: list.id
        })
        .done(function(data){
            if (data.success === 1) {
                app.data.state.mute = data.account.state.mute;
                app.fireEvent('checkMute', list, checkbox.is(':checked'));
            } else {
                // 現在 ステータスコード 200 の例外ケースは無い
            }
        });
    });

    var timer;
    app.addListener('showListMenu', function(){
        if (!list_ul.is(':visible')) {
            list_ul.slideDown('fast');
        }
        list_ul.children().removeClass('active');
        if (app.data.current_list &&
            (app.data.current_list.id in li_map)) {
            li_map[app.data.current_list.id].addClass('active');
        }
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        timer = setTimeout(function(){
            list_ul.slideUp('fast');
            timer = null;
        }, 5000);
    });

    app.addListener('openList', function(list){
        a.text(list.name);
        member_ul.empty();
        var members = [list.owner].concat(list.members);
        for (var i = 0, max_i = members.length; i < max_i; i++) {
            var code = members[i];
            var friend = app.data.users[code];
            var name = friend ? (friend.screen_name || friend.name) : code;
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

    app.addListener('openNextList', function(){
        var next;
        if (app.data.current_list) {
            next = li_map[app.data.current_list.id].nextAll(':first');
        }
        if (!next) {
            next = list_ul.find('> li:first');
        }
        if (next && next.length) {
            var list_id = next.data('id');
            if (list_id in app.data.list_map) {
                app.fireEvent('openList', app.data.list_map[list_id]);
                app.fireEvent('showListMenu');
                app.fireEvent('openTopTask');
            }
        }
    });

    app.addListener('openPrevList', function(){
        var prev;
        if (app.data.current_list) {
            prev = li_map[app.data.current_list.id].prevAll(':first');
        }
        if (!prev) {
            prev = list_ul.find('> li:first');
        }
        if (prev && prev.length) {
            var list_id = prev.data('id');
            if (list_id in app.data.list_map) {
                app.fireEvent('openList', app.data.list_map[list_id]);
                app.fireEvent('showListMenu');
                app.fireEvent('openBottomTask');
            }
        }
    });

    // リスト選択
    app.addListener('moveTask', function(task){
        list_ul.slideDown('fast');
    });
    app.addListener('moveTaskCancel', function(task){
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
            e.stopPropagation();
            if (list.id === app.data.dragtask.list.id) {
                return true;
            }
            e.preventDefault();
            li.addClass('active');
            return false;
        });
        li.get(0).addEventListener('dragleave', function(e){
            li.removeClass('active');
        });
        li.get(0).addEventListener('drop', function(e){
            e.stopPropagation();
            list_ul.children().removeClass('active');
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
    app.addListener('clear', function(list){
        a.text('');
        list_ul.empty();
        member_ul.empty();
        li_map = {};
        checkbox.attr('disabled', true);
    });

    // //
    // $(d).keydown(function(e){
    //     if (document.activeElement.tagName !== 'BODY') {
    //         return;
    //     }
    //     if (e.ctrlKey || e.altKey || e.metaKey) {
    //         return;
    //     }
    //     if (e.shiftKey) {
    //         return;
    //     }
    //     if (e.keyCode >= 49 && e.keyCode <= 57) { // 1-9
    //         e.preventDefault();
    //         var i = e.keyCode - 49;
    //         var lis = ele.find('ul.lists > li');
    //         if (i in lis) {
    //             app.fireEvent('openList', app.data.list_map[$(lis[i]).data('id')]);
    //         }
    //     } else if (e.keyCode === 76) {
    //         app.fireEvent('showListMenu');
    //     }
    // });
}
app.setup.registerListWindow = function(form){

    var id_input          = form.find('input[name=list_id]');
    var name_input        = form.find('input[name=name]');
    var description_input = form.find('textarea[name=description]');
    var owner_field       = form.find('div.owner-field');
    var owner_select      = form.find('select[name=owner]');
    var option_map        = {};

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
        app.dom.reset(form);
        owner_select.val(list.owner);
        owner_field.hide();
        app.dom.show(form);
        id_input.val(list.id);
        name_input.val(list.name);
        description_input.val(list.description);
    });

    app.addListener('createList', function(){
        id_input.val('');
        owner_field.show();
        app.dom.reset(form);
        app.dom.show(form);
    });

    app.addListener('clear', function(){
        option_map = {};
        owner_select.empty();
    });
}
app.setup.deleteListWindow = function(form){
    app.addListener('deleteListBegin', function(list){
        form.data('id', list.id);
        form.find('.name').text(list.name);
        app.dom.show(form);
    });
}
app.setup.memberListWindow = function(form){
    var id_input = form.find('input[name=list_id]');
    var ul = form.find('ul');
    var template = ul.html();
    form.find('input[name="invite_code"]').click(function(e){
        e.preventDefault();
        $(this).select();
    });
    form.find('.ui-invite').click(function(e){
        e.preventDefault();
        e.stopPropagation();
        var id = form.data('id');
        app.api.list.invite(id).done(function(data){
            var url = location.protocol + '//'
                + location.host
                + '/join/'
                + id
                + '/'
                + data.invite_code;
            form.find('input[name="invite_code"]').val(url);
            app.data.list_map[id].invite_code = data.invite_code;
        });
    });
    form.find('.ui-disinvite').click(function(e){
        e.preventDefault();
        e.stopPropagation();
        var id = form.data('id');
        app.api.list.disinvite(id).done(function(){
            form.find('input[name="invite_code"]').val('');
            app.data.list_map[id].invite_code = null;
        });
    });
    app.addListener('editListMember', function(list){
        app.dom.reset(form);
        form.data('id', list.id);
        form.find('.ui-listname').text(list.name);
        if (list.invite_code) {
            var url = location.protocol + '//'
                + location.host
                + '/join/'
                + list.id
                + '/'
                + list.invite_code;
                form.find('input[name="invite_code"]').val(url);
        }
        ul.empty();
        for (var i = 0, max_i = list.members.length; i < max_i; i++) {
            var code = list.members[i];
            if (!(code in app.data.users)) {
                continue;
            }
            var user = app.data.users[code];
            $(template)
                .find('.member-icon').append(app.util.getIcon(code, 24)).end()
                .find('.member-name').text(user.name).end()
                .find('.icon-remove').data('code', code).click(function(e){
                    var code = $(this).data('code');
                    app.fireEvent('leaveListMember',
                        list, code, app.data.users[code].name, app.util.getIcon(code, 24));
                }).end()
                .appendTo(ul);
        }
        app.dom.show(form);
        id_input.val(list.id);
    });
    app.addListener('registerList', function(list){
        if (!form.is(':visible')) {
            return;
        }
        if (form.data('id') === list.id) {
            app.fireEvent('editListMember', list);
        }
    });
    app.addListener('receiveMe', function(){
        if (!form.is(':visible')) {
            return;
        }
        if (!(form.data('id') in app.data.list_map)) {
            app.dom.hide(form);
        }
    });
}
app.setup.inviteListWindow = function(form){
    var member_select = form.find('select[name="member_code"]');
    var option_map = {};
    form.find('.btn-primary').click(function(e){
        var list_id = form.find('input[name="list_id"]').val();
        var invite_code = form.find('input[name="invite_code"]').val();
        var member_code = member_select.val();
        app.api.list.join(list_id, invite_code, member_code).done(function(data){
            form.hide();
            app.fireEvent('reload');
        });
    });
    app.addListener('registerSubAccount', function(sub_account){
        if (option_map[sub_account.code]) {
            option_map[sub_account.code].remove();
        }
        option_map[sub_account.code] =
            $('<option/>')
                .attr('value', sub_account.code)
                .text(sub_account.name)
                .appendTo(member_select);
        if (app.data.sign.code === sub_account.code) {
            option_map[sub_account.code].attr('selected', true);
        }
    });
    app.addListener('receiveInvite', function(invite){
        form.find('.ui-listname').text(invite.list_name);
        form.find('input[name="list_id"]').val(invite.list_id);
        form.find('input[name="invite_code"]').val(invite.invite_code);
        form.show();
    });
}
app.setup.leaveListWindow = function(form){
    form.find('.btn-primary').click(function(e){
        e.preventDefault();
        e.stopPropagation();
        var list_id = form.find('input[name="list_id"]').val();
        var member_code = form.find('input[name="member_code"]').val();
        app.api.list.leave(list_id, member_code).done(function(data){
            app.fireEvent('reload');
            form.hide();
        });
    });
    app.addListener('leaveListMember', function(list, member_code, member_name, member_icon){
        form.find('.ui-listname').text(list.name);
        form.find('.ui-membername').text(member_name);
        form.find('input[name="list_id"]').val(list.id);
        form.find('input[name="member_code"]').val(member_code);
        form.find('img').replaceWith(member_icon);
        form.show();
    });
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
    var owner = form.find('[name="owner"]').val();
    app.ajax({
        type: 'POST',
        url: url,
        data: form.serialize(),
        dataType: 'json'
    })
    .done(function(data){
        if (data.success === 1) {
            if (data.list.id in app.data.list_map) {
                $.extend(app.data.list_map[data.list.id], data.list);
            }
            app.fireEvent('registerList', data.list);
            app.fireEvent('openList', data.list);
            app.dom.reset(form);
            if (id) {
                app.dom.show(app.dom.get('showable', 'update-list-twipsy'));
                app.dom.hide(form);
            } else {
                app.dom.show(app.dom.get('showable', 'create-list-twipsy'));
            }
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    });
}
app.submit.deleteList = function(form){
    var list = form.data('id')
             ? app.data.list_map[form.data('id')]
             : app.data.current_list;
    app.ajax({
        type: 'POST',
        url: '/api/1/list/delete',
        data: {
            list_id: list.id
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success === 1) {
            app.fireEvent('deleteList', list);
            app.dom.show(app.dom.get('showable', 'delete-list-twipsy'));
            app.dom.hide(app.dom.get('showable', 'delete-list-window'));
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
app.click.sortTask = function(ele){
    ele.parent().children().removeClass('active');
    ele.addClass('active');
    app.fireEvent('sortTask', ele.data('sort-column'), ele.data('sort-reverse'));
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

})(this, window, document, jQuery);