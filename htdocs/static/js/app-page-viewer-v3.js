"use strict";
(function(ns, w, d, $) {

var app = ns.app;
app.addEvents('moveTask');
app.addEvents('moveTaskCancel');
app.addEvents('removeAccountConfirm');
app.addEvents('showListMenu');

app.addListener('createTask', function(){
    app.dom.hide(app.dom.get('showable', 'welcome'));
});

app.setup.rightColumn = function(ele){
    var list_id_input    = ele.find('input[name=list_id]');
    var task_id_input    = ele.find('input[name=task_id]');
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
    var pin_ul           = ele.find('.pins ul');

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
        if (plus === 'start') {
            status_input.val(1);
        } else if (plus === 'fix') {
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
            if (plus === 'start') {
                ele.attr('disabled', !(!task.closed && task.status === 0));
            } else if (plus === 'fix') {
                ele.attr('disabled', !(!task.closed && task.status !== 2));
            } else if (plus === 'revert') {
                ele.attr('disabled', !(!task.closed && task.status === 2));
            } else if (plus === 'close') {
                ele.attr('disabled', Boolean(task.closed));
            }
        });
        ul.empty();
        pin_ul.empty();
        var li = $(template);
        li.find('.icon:first').append(app.util.getIcon(task.registrant, 32));
        li.find('.icon:last').remove();
        li.find('.name').text(app.util.getName(task.registrant));
        li.find('.status').text(app.data.messages.data('text-create-task-' + app.env.lang));
        li.find('.message').remove();
        li.find('.menu').remove();
        li.find('.date').text(app.date.relative(task.created_on));
        li.prependTo(ul);
        $.each(task.actions, function(i, comment){
            var li = $(template);
            li.find('.icon:first').append(app.util.getIcon(comment.account_id, 32));
            li.find('.name').text(app.util.getName(comment.account_id));
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
            if (! comment.message) {
                li.find('.message').remove();
                li.find('.icon:last').remove();
                li.find('.menu').remove();
            } else {
                if (comment.message === '[like]') {
                    li.find('.message').html('<i class="icon-heart"></i>');
                } else {
                    var html = app.util.autolink(comment.message).replace(/\r?\n/g, '<br />');
                    li.find('.message').html(html);
                    if (pin_ul && comment.is_pinned) {
                        var pin_li = $('<li/>').html(html);
                        var unpin = $('<a class="unpin"><i class="icon-remove"></i></a>').appendTo(pin_li);
                        pin_li.prependTo(pin_ul);
                        unpin.click(function(e){
                            e.preventDefault();
                            app.ajax({
                                type: 'POST',
                                url: '/api/1/comment/unpin',
                                data: {
                                    list_id: task.list.id,
                                    task_id: task.id,
                                    comment_id: comment.id
                                },
                                dataType: 'json'
                            })
                            .done(function(data){
                                if (data.success === 1) {
                                    pin_li.hide('fade', function(){
                                        app.fireEvent('registerTask', data.task, task.list);
                                    });
                                } else {
                                    // 現在 ステータスコード 200 の例外ケースは無い
                                }
                            });
                        });
                    }
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
                var a = li.find('.menu a');
                if (a) {
                    var method = 'pin';
                    if (comment.is_pinned) {
                        a.text('Unpinned');
                        method = 'unpin';
                    }
                    a.click(function(e){
                        e.preventDefault();
                        app.ajax({
                            type: 'POST',
                            url: '/api/1/comment/' + method,
                            data: {
                                list_id: task.list.id,
                                task_id: task.id,
                                comment_id: comment.id
                            },
                            dataType: 'json'
                        })
                        .done(function(data){
                            if (data.success === 1) {
                                // li.hide('fade');
                                app.fireEvent('registerTask', data.task, task.list);
                            } else {
                                // 現在 ステータスコード 200 の例外ケースは無い
                            }
                        });
                    });
                }
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

    var listli_toggle = function(li){
        var id = li.data('id');
        var tag = app.data.current_tag;
        if (app.data.current_filter && (!("closed" in app.data.current_filter))) {
            li.toggle(Boolean(li.data('has-visible-tasks')));
        } else if (tag) {
            li.toggle(Boolean((id in app.data.state.tags) && (tag === app.data.state.tags[id])));
        } else {
            li.show();
        }
    };

    var collapseList = function(li, collapse, effect){
        var folder = li.find('.icon-folder-open, .icon-folder-close');
        if (collapse) {
            folder.data('closed', true);
            folder.removeClass('icon-folder-open').addClass('icon-folder-close');
            if (effect) {
                li.find('> ul.tasks').slideUp('fast', function(){ li.addClass('task-collapse') });
            } else {
                li.find('> ul.tasks').hide();
                li.addClass('task-collapse');
            }

        } else {
            folder.data('closed', false);
            folder.removeClass('icon-folder-close').addClass('icon-folder-open');
            li.removeClass('task-collapse');
            if (effect) {
                li.find('> ul.tasks').slideDown('fast');
            } else {
                li.find('> ul.tasks').show();
            }
        }
    };

    app.addListener('toggleTag', function(tag){
        ul.children().each(function(i, element){ listli_toggle($(element)) });
        if (ul.is(':visible')
            && current_task
            && !app.data.taskli_map[current_task.id].is(':visible')) {
            app.fireEvent('missingTask');
        }
    });

    app.addListener('resetTag', function(){
        ul.children().each(function(i, element){ listli_toggle($(element)) });
        app.fireEvent('missingTask');
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
            return false;
        });
        li.get(0).addEventListener('drop', function(e){
            e.stopPropagation();
            app.api.task.move(app.data.dragtask.list.id, app.data.dragtask.id, list.id);
        }, false);

        var folder = li.find('.icon-folder-open');
        if ("collapse" in app.data.state && list.id in app.data.state.collapse) {
            collapseList(li, true, false);
        }
        folder.click(function(){
            var folder = $(this);
            if (folder.data('closed')) {
                app.fireEvent('collapseList', list, false);
            } else {
                app.fireEvent('collapseList', list, true);
            }
        });

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
        if (list.id in app.data.state.tags) {
            li.attr('data-tag', app.data.state.tags[list.id]);
        }
        li.find('.ui-tags a').each(function(i, element){
            var ele = $(element);
            var tag = ele.data('tag');
            if (tag) {
                if ((list.id in app.data.state.tags) &&
                    (tag === app.data.state.tags[list.id])) {
                    ele.addClass('active');
                    li.attr('data-tag', tag);
                }
                ele.click(function(e){
                    var ns = 'state.tags';
                    var method = 'set';
                    var key = list.id;
                    var val = tag;
                    if (ele.hasClass('active')) {
                        ns = 'state';
                        method = 'off';
                        key = 'tags';
                        val = list.id;
                    }
                    app.api.account.update({
                        ns: ns,
                        method: method,
                        key: key,
                        val: val
                    })
                    .done(function(data){
                        if (data.success === 1) {
                            app.data.state.tags = data.account.state.tags;
                            ele.parent().children().removeClass('active');
                            if (method === 'set') {
                                ele.addClass('active');
                                li.attr('data-tag', tag);
                            } else {
                                li.removeAttr('data-tag');
                            }
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
        li.find('.ui-listmenu .icon-user').parent().click(function(e){
            app.fireEvent('editListMember', list);
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
            li.find('.ui-description').html(app.util.autolink(list.description, 64).replace(/\r?\n/g, '<br />'));
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
                var account_id = members[i];
                if (!(account_id in app.data.users)) {
                    continue;
                }
                var condition = { turn: account_id, list_id: list.id };
                var icon = app.util.getIcon(account_id, 26);
                icon.data('account_id', account_id);
                // var count = $('<div class="count"/>');
                // count.data('counter-condition', condition);
                // app.setup.memberCounter(count);
                var li2 = $('<li/>')
                    .append(icon)
                    // .append(count)
                    .data('id', account_id)
                    .data('filter-condition', condition)
                    .click(function(e){
                        e.preventDefault();
                        var li2 = $(this);
                        var reset = li2.hasClass('active');
                        li2.parent().children().removeClass('active');
                        if (reset) {
                            app.fireEvent('filterTask', app.data.current_filter);
                        } else {
                            app.fireEvent('memberTask', li2.data('filter-condition'));
                            li2.addClass('active');
                        }
                        li2.parent().toggleClass('active-filter', li2.hasClass('active'));
                    })
                    // .dblclick(function(e){
                    //     e.preventDefault();
                    //     app.fireEvent('createTask', list, $(this).data('id'));
                    // })
                    .addClass('member')
                    .appendTo(li.find('ul.members'));
            }
        }

        if (list.id in app.data.listli_map) {
            li.find('> ul.tasks').append(
                app.data.listli_map[list.id].find('> ul.tasks').children());
            li.css('display', app.data.listli_map[list.id].css('display'));
            if (app.data.listli_map[list.id].find('.icon-folder-close').length) {
                li.find('.icon-folder-open').data('closed', true);
                li.find('.icon-folder-open').removeClass('icon-folder-open').addClass('icon-folder-close');
                li.addClass('task-collapse');
            }
            app.data.listli_map[list.id].after(li);
            app.data.listli_map[list.id].remove();
        } else {
            li.prependTo(ul);
        }
        app.data.listli_map[list.id] = li;
    });

    app.addListener('collapseList', function(list, collapse){
        var li = app.data.listli_map[list.id];
        if (li) {
            collapseList(li, collapse, true);
        }
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
            if (app.util.taskFilter(task, app.data.current_filter)) {
                if (!li.data('visible')) {
                    li.data('visible', true);
                    app.dom.slideDown(li);
                    app.util.findChildTasks(task, function(child){
                        if (child.id && app.data.taskli_map[child.id]) {
                            var child_li = app.data.taskli_map[child.id];
                            if (!app.util.taskFilter(child, app.data.current_filter)) {
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
                            if (app.util.taskFilter(child, app.data.current_filter)) {
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
            if ((!app.data.current_filter && !task.closed) ||
                (app.data.current_filter &&
                 app.util.taskFilter(task, app.data.current_filter))) {
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
            if (forceTop !== -1) {
                app.dom.scrollTopFix(ul.parent(), app.data.taskli_map[task.id], forceTop);
            }
        }
        current_task = task;
    });

    app.addListener('selectTab', function(group, id){
        if (group === 'viewer' && id === 'task') {
            app.fireEvent('selectTab', 'homemenu', 'task');
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
            app.fireEvent('filterTask', app.data.current_filter);
        }
        if (group === 'homemenu') {
            if (id === 'task') {
                ul.children().each(function(i, element){ listli_toggle($(element)) });
            } else {
                ul.children().show();
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

    app.addListener('sortTask', function(tasks, column, reverse){
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
    });

    app.addListener('memberTask', function(condition){
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            var li = app.data.taskli_map[task_id];
            if (condition.list_id !== task.list.id) {
                continue;
            }
            if (app.util.taskFilter(task, condition)) {
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
    });

    app.addListener('filterTask', function(condition){
        if (!ul.is(':visible')) {
            return;
        }
        ul.find('> li > header ul.members > li.active').removeClass('active');
        ul.find('> li > header ul.members.active-filter').removeClass('active-filter');
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

        if (condition && condition.closed) {
            ul.find('> li > header li.ui-normal, > li > header ul.members, > li > header li.ui-submenu').hide();
            ul.find('> li > header li.ui-clear').show();
        } else {
            ul.find('> li > header li.ui-clear').hide();
            ul.find('> li > header li.ui-normal, > li > header ul.members, > li > header li.ui-submenu').show();
        }
        ul.children().each(function(){
            var li = $(this);
            li.data('has-visible-tasks', Boolean(li.data('id') in hasVisible));
            listli_toggle(li);
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
                due: due
            });
        } else if (e.keyCode === 32) { // Space
            var task = current_task;
            var status = task.status >= 2 ? 0 : task.status + 1;
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
                status: status
            });
        } else if (e.keyCode === 13) { // Enter
            var task = current_task;
            var closed = task.closed ? 0 : 1;
            app.api.task.update({
                list_id: task.list.id,
                task_id: task.id,
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
        e.preventDefault();
        return false;
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
            parent_id: task.id
        });
    }, false);
    ele.click(function(e){
        e.stopPropagation();
        app.fireEvent('openTask', task, -1);
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
        ele.data('text-' + app.env.lang, app.dom.text(ele, 'closed'));
    } else {
        ele.find('i').removeClass('icon-plus').addClass('icon-remove');
        ele.data('text-' + app.env.lang, app.dom.text(ele, 'unclosed'));
    }
    ele.click(function(e){
        e.stopPropagation();
        app.api.task.update({
            list_id: task.list.id,
            task_id: task.id,
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
        var date = '';
        if (task.recent.message) {
            if (task.recent.message === '[like]') {
                ele.find('.message i').attr('class', 'icon-heart');
                ele.find('.message span').text(date);
            } else {
                var html = app.util.autolink(task.recent.message).replace(/\r?\n/g, '<br />');
                ele.find('.message span').html(html);
                ele.find('.message span a').click(function(e){ e.stopPropagation() });
            }
        } else {
            // ele.find('.message i').attr('class', 'icon-info-sign');
            // ele.find('.message span').text(
            //     app.data.messages.data('text-'
            //         + task.recent.action + '-' + app.env.lang)
            //     + ' ' + date);
            ele.hide();
        }
    } else {
        ele.hide();
    }
}
app.setup.pin = function(ul, task){
    if (!task) return;
    var pins = [];
    $.each(task.actions.concat().reverse(), function(i, action){
        if (action.is_pinned) {
            pins.push(action);
        }
    });
    if (pins.length > 0) {
        var template = ul.html();
        ul.empty();
        for (var i = 0, max_i = pins.length; i < max_i; i++) {
            var action = pins[i];
            var li = $(template);
            var html = app.util.autolink(action.message).replace(/\r?\n/g, '<br />');
            li.find('span')
                .html(html)
                .find('a').click(function(e){ e.stopPropagation() });
            li.appendTo(ul);
        }
    } else {
        ul.hide();
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
    var duration_input = form.find('input[name=duration]');
    var requester_select = form.find('select[name=requester]');
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

        if (list.members.length) {
            form.find('.team').show();
            var assigns = [list.owner].concat(list.members);
            for (var i = 0, max_i = assigns.length; i < max_i; i++) {
                var assign = assigns[i];
                var friend = app.data.users[assign];
                if (!friend) {
                    continue;
                }
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
                    .attr('checked', assign === assignMember);
                li.appendTo(assign_list);

                $('<option/>')
                    .attr('value', assign)
                    .text(name)
                    .appendTo(requester_select);
            }
            // 依頼者のデフォルトは自分
            requester_select.val(app.data.sign.account_id);
        } else {
            form.find('.team').hide();
        }

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
        setup(parentTask.list, parentTask);
        app.dom.show(form);
    });

    app.addListener('editTask', function(task){
        app.dom.reset(form);
        setup(task.list, app.data.task_map[task.parent_id]);
        name_input.val(task.name);
        if (task.due) {
            due_input.val(app.date.ymd(task.due_date));
            due_check();
        }
        if (task.duration) {
            duration_input.val(task.duration);
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
                        account_id: task.registrant,
                        time: task.created_on
                    });
                }
                $.each(task.actions, function(iii, action){
                    action.task = task;
                    if (Boolean(app.util.findMe([action.account_id])) === is_me) {
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
            li.find('.icon').append(app.util.getIcon(action.account_id, 32));
            li.find('.listname').text(action.task.list.name);
            li.find('.taskname').text(action.task.name);
            li.find('.name').text(app.util.getName(action.account_id));
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
    var name = form.find('input[name="name"]').val();
    var due = form.find('input[name="due"]').val();
    if (due) {
        due = app.date.parse(due);
        due = app.date.mdy(due);
    }
    var duration = form.find('input[name="duration"]').val();
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
                form.find('select[name="requester"]').val(app.data.sign.account_id);
                app.dom.autofocus(form);
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
                registrant: app.data.sign.account_id,
                assign: assign,
                name: name,
                due: due,
                duration: duration,
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
                    account_id: app.data.sign.account_id,
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
    var iconli_cache = {};
    var ul = ele.find('ul.accounts');
    var template = ul.html();
    ul.empty();
    var icon_ul = ele.find('ul.ui-icons');
    var icon_template = icon_ul.html();
    icon_ul.empty();
    app.addListener('registerSubAccount', function(sub_account){
        var li = $(template);
        li.find('img').attr('src', app.util.getIconUrl(sub_account.code));
        li.find('.name').text(sub_account.name);
        li.find('button').click(function(){
            app.fireEvent('removeAccountConfirm', sub_account);
        });
        app.dom.setup(li);
        if (sub_account.code in li_cache) {
            li_cache[sub_account.code].replaceWith(li);
        } else {
            li.appendTo(ul);
        }
        li_cache[sub_account.code] = li;

        var iconli = $(icon_template);
        iconli.find('img').attr('src', app.util.getIconUrl(sub_account.code));
        iconli.find('span').text(sub_account.name);
        iconli.find('input').val(sub_account.data.icon);
        if (sub_account.code in iconli_cache) {
            iconli_cache[sub_account.code].replaceWith(iconli);
        } else {
            iconli.appendTo(icon_ul);
        }
        var url = /^tw-[0-9]+$/.test(sub_account.code) ? 'https://twitter.com/settings/profile'
                : /^fb-[0-9]+$/.test(sub_account.code) ? 'https://www.facebook.com/me'
                : app.env.lang === 'ja' ? 'https://ja.gravatar.com/' : 'https://gravatar.com/';
        iconli.find('a').attr('href', url);
        iconli_cache[sub_account.code] = iconli;
    });
    app.addListener('clear', function(){
        ul.empty();
        ele.hide();
        li_cache = {};
    });
    ele.on('app.dom.show', function(){
      ele.find('input[name="name"]').val(app.data.sign.name);
      ele.find('input[name="icon"]').val([app.data.sign.icon]);
    });
}
app.submit.saveSettings = function(form){
    var name = form.find('input[name="name"]').val();
    var icon = form.find('input[name="icon"]:checked').val();
    app.api.account.update_profile({
        name: name,
        icon: icon
    }).done(function(){
        form.hide();
        app.fireEvent('reload');
    });
}
app.setup.removeAccountWindow = function(form){
    app.addListener('removeAccountConfirm', function(sub_account){
        app.dom.show(form);
        form.find('input[name="code"]').val(sub_account.code);
        form.find('img').attr('src', sub_account.data.icon);
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
app.click.addGoogle = function(){
    $('#add-google').submit();
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
            var account_id = members[i];
            var friend = app.data.users[account_id];
            var name = friend ? (friend.screen_name || friend.name) : code;
            if (i === 0) {
                name = name + ' (owner)';
            }
            $('<li/>')
                .append(app.util.getIcon(account_id, 24))
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
    var option_map        = {};

    app.addListener('editList', function(list){
        app.dom.reset(form);
        app.dom.show(form);
        id_input.val(list.id);
        name_input.val(list.name);
        description_input.val(list.description);
    });

    app.addListener('createList', function(){
        id_input.val('');
        app.dom.reset(form);
        app.dom.show(form);
    });

    app.addListener('clear', function(){
        option_map = {};
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
            var account_id = list.members[i];
            if (!(account_id in app.data.users)) {
                continue;
            }
            var user = app.data.users[account_id];
            $(template)
                .find('.member-icon').append(app.util.getIcon(account_id, 24)).end()
                .find('.member-name').text(user.name).end()
                .find('.icon-remove').data('account_id', account_id).click(function(e){
                    var account_id = $(this).data('account_id');
                    app.fireEvent('leaveListMember'
                        , list
                        , account_id
                        , app.data.users[account_id].name
                        , app.util.getIcon(account_id, 24));
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
    var option_map = {};
    form.find('.btn-primary').click(function(e){
        var list_id = form.find('input[name="list_id"]').val();
        var invite_code = form.find('input[name="invite_code"]').val();
        app.api.list.join(list_id, invite_code).done(function(data){
            form.hide();
            app.fireEvent('reload');
        });
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
        var account_id = form.find('input[name="account_id"]').val();
        app.api.list.leave(list_id, account_id).done(function(data){
            app.fireEvent('reload');
            form.hide();
        });
    });
    app.addListener('leaveListMember', function(list, account_id, member_name, member_icon){
        form.find('.ui-listname').text(list.name);
        form.find('.ui-membername').text(member_name);
        form.find('input[name="list_id"]').val(list.id);
        form.find('input[name="account_id"]').val(account_id);
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
                // app.dom.show(app.dom.get('showable', 'update-list-twipsy'));
                app.dom.hide(form);
            } else {
                // app.dom.show(app.dom.get('showable', 'create-list-twipsy'));
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
            // app.dom.show(app.dom.get('showable', 'delete-list-twipsy'));
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
// イベント受信
// ----------------------------------------------------------------------
app.setup.receiver = function(ele){
    ele.get(0).addEventListener('extentionsEvent', function() {
        var data = JSON.parse(ele.text());
        app.fireEvent(data.event, data.option);
    }, false);
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