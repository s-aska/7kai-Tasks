(function(ns, w, d) {

var c = ns.c;
var app = ns.app;

app.option.auto_sync_friends = false;
app.option.show_loading = true;

c.addEvents('domresize');

c.addListener('setup', function(){
    document.addEventListener('touchmove', function(e){ e.preventDefault(); });
});

// ----------------------------------------------------------------------
app.setup.listmenu = function(ul){
    var li_cache = {};
    ul.empty();
    c.addListener('registerList', function(list){
        var li = $('<li/>')
            .data('id', list.id)
            .append(
                $('<a/>').text(list.name).click(function(){
                    c.fireEvent('openList', list);
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
}
app.setup.bottommenu = function(ul){
    var center = ul.find('li.center');
    var width = $(w).width();
    var li_width = Number((width - center.width()) / 4);
    ul.find('li').not('.center').width(li_width);
}
app.setup.scroller = function(ele){ 
    var headerH = document.getElementById('header').offsetHeight,
		footerH = document.getElementById('footer').offsetHeight,
		wrapperH = window.innerHeight - headerH - footerH;
	document.getElementById('wrapper').style.height = wrapperH + 'px';
    var myScroll = new iScroll(ele.get(0), { hScrollbar: true });
    c.addListener('domresize', function(){
        setTimeout(function(){ myScroll.refresh() }, 0);
    });
    c.addListener('selectTab', function(){
        setTimeout(function(){ myScroll.refresh() }, 100);
    });
    c.addListener('filterTask', function(){
        setTimeout(function(){ myScroll.refresh() }, 100);
    });
}

// ----------------------------------------------------------------------
app.setup.tasks = function(ul){
    var template = ul.html();
    ul.empty();
    var taskli_map = {};
    c.addListener('registerTask', function(task){
        var li = $(template);
        
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
        
        li.click(function(){
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
}
app.setup.menu = function(ele){
    var ul = ele.find('> ul');
    ele.click(function(){
        ul.slideToggle('fast');
    });
}
app.setup.more = function(ele){
    var target = $('#' + ele.data('more-id') );
    target.hide();
    ele.click(function(){
        target.slideToggle('fast', function(){
            c.fireEvent('domresize');
        });
    });
}

// ----------------------------------------------------------------------
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
        id_input.val('');
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
app.setup.registerTaskWindow = function(form){

    //
    var assign_label = form.find('label.assign');
    var assign_field = form.find('div.assign-field');
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
        c.fireEvent('selectTab', 'main', 'registerTask');
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

        c.fireEvent('selectTab', 'main', 'registerTask');

    });
}

app.setup.comments = function(ele){
    c.addListener('openTask', function(){
        c.fireEvent('selectTab', 'main', 'comments');
    });
}

// ----------------------------------------------------------------------


})(this, this, document);