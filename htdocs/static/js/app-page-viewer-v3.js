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

    var id_input                = form.find('input[name=list_id]');
    var name_input              = form.find('input[name=name]');
    var description_input       = form.find('textarea[name=description]');
    var owner_field             = form.find('div.owner-field');
    var owner_select            = form.find('select[name=owner]');
    var social_member_field     = form.find('div.twitter-member');
    var social_member_list      = form.find('ul.twitter-members');
    var social_member_input     = social_member_field.find('input');
    var social_member_addon     = social_member_field.find('.add-on');
    var social_member_label     = social_member_field.find('label');
    var social_member_template  = social_member_list.html();
    var option_map              = {};

    var addMember = function(code){
        if (social_member_list.find('input[value="' + code + '"]').length) {
            return;
        }
	    var user = app.data.users[code];
	    var li = $(social_member_template);
	    li.find('img').attr('src', user.icon);
	    li.find('.name').text(user.screen_name || user.name);
	    li.find('input').attr('value', code);
	    li.find('.icon').click(function(){ li.remove() });
	    li.prependTo(social_member_list);
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
		zIndex: 1051,
		source: function(request, response) {
		    response(autocomplete_filter(request.term));
		},
		select: function(event, ui) {
		    addMember(ui.item.code);
        }
	}).data('autocomplete')._renderItem = function(ul, item) {
        return $(document.createElement('li'))
            .data('item.autocomplete', item)
            .append("<a>"+ item.label + "</a>")
            .appendTo(ul);
    };
    social_member_input.bind('autocompleteclose',
        function(){ social_member_input.val('') });

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
        modeReset(app.util.getRegistrant(list));
        social_member_list.empty();
        for (var i = 0, max_i = list.members.length; i < max_i; i++) {
            addMember(list.members[i]);
        }
    });

    app.addListener('createList', function(){
        id_input.val('');
        owner_field.show();
        modeReset(owner_select.val());
        social_member_list.empty();
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
            if (data.list.id in app.data.list_map) {
                $.extend(app.data.list_map[data.list.id], data.list);
            }
            app.fireEvent('registerList', data.list);
            app.fireEvent('openList', data.list);
            app.dom.reset(form);
            form.find('ul.members').empty();
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