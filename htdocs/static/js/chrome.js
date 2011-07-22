(function(ns, w, d) {

var app = {
    // 定数
    cond_default: {
        list_id: null,
        star: null,
        status: null,
        status_ignore: null,
        closed: 0,
        registrant: null,
        assign: null,
        todo: null,
        notify: null
    },
    valid: {
        list_name_max_length: 20
    },

    // オブジェクト変数
    template: {},
    localizer: null,
    counters: [],
    is_webkit: false,
    lang: 'en',
    guide: true,
    dragging: false,
    dragtask: null,
    current_list: null,
    current_task: null,
    current_taskli: null,
    account: null,
    assign: [],
    modals: {},
    offset: {},
    parts: {},
    friends: {},
    friend_ids: {},
    taskli: {},
    listli: {},
    active: null,
    cond: {},
    sort: null,
    unread_comment_count: 0,
    notifications: [],
    busy: false,
    
    // 初期化系
    run: run,
    initParts: initParts,
    initEvent: initEvent,
    initAccount: initAccount,
    initElements: initElements,
    initElementClick: initElementClick,
    initElementLocalize: initElementLocalize,
    initElementLocalizePlaceholder: initElementLocalizePlaceholder,
    initElementPulldown: initElementPulldown,
    initElementGuide: initElementGuide,
    initElementSummary: initElementSummary,
    initElementSortable: initElementSortable,
    initElementCommentBox: initElementCommentBox,
    initElementFormWindow: initElementFormWindow,
    initElementDatepicker: initElementDatepicker,
    initElementDisableSelection: initElementDisableSelection,
    initElementAutocomplete: initElementAutocomplete,
    initElementNoticecheck: initElementNoticecheck,
    
    // イベント
    handleEvent: handleEvent,
    windowResizeEvent: windowResizeEvent,
    commentHeightResize: commentHeightResize,
    
    // General
    exec: exec,
    ajax: ajax,
    
    message: message,
    
    getProfileImageUrl: getProfileImageUrl,
    getTwitterProfileImageUrl: getTwitterProfileImageUrl,
    syncTwitterContact: syncTwitterContact,
    lookupUnknownMembers: lookupUnknownMembers,
    
    updateAccount: updateAccount,
    refresh: refresh,
    
    submitFinalize: submitFinalize,
    showNotifications: showNotifications,
    showList: showList,
    switchList: switchList,
    switchFilterListClick: switchFilterListClick,
    switchClosedClick: switchClosedClick,
    renderList: renderList,
    renderBadge: renderBadge,
    needCount: needCount,
    needNotify: needNotify,
    renderCommentBadge: renderCommentBadge,
    
    createList: createList,
    modifyList: modifyList,
    deleteList: deleteList,
    sortList: sortList,
    sortUpdateList: sortUpdateList,
    
    createTask: createTask,
    modifyTask: modifyTask,
    moveTask: moveTask,
    deleteTask: deleteTask,
    filterTask: filterTask,
    sortTask: sortTask,
    sortUpdateTask: sortUpdateTask,
    
    readComment: readComment,
    isMe: isMe,
    findMe: findMe,
    findMeFromList: findMeFromList,
    listReadLastRev: listReadLastRev,
    listReadLastTime: listReadLastTime,
    statebleCheckboxClick: statebleCheckboxClick,
    updateCounter: updateCounter,
    resetCounter: resetCounter,
    
    needNotification: needNotification,
    notificationCheck: notificationCheck,
    notificationCheckDone: notificationCheckDone,
    
    // GrobalMenu
    openClick: openClick,
    openCommentClick: openCommentClick,
    signInTwitterClick: signInTwitterClick,
    syncTwitterContactClick: syncTwitterContactClick,
    refreshClick: refreshClick,
    guideSwitchClick: guideSwitchClick,
    
    // SideMenu
    listDisplaySwitchClick: listDisplaySwitchClick,
    listBadgeSwitchClick: listBadgeSwitchClick,
    openCallbackCreateList: openCallbackCreateList,
    openCallbackCreateTaskWithMember: openCallbackCreateTaskWithMember,
    openCallbackEditList: openCallbackEditList,
    openCallbackDeleteList: openCallbackDeleteList,
    submitCreateList: submitCreateList,
    submitDeleteList: submitDeleteList,
    resetCreateList: resetCreateList,
    registList: registList,
    
    // MainMenu
    tasksFilterGenerate: tasksFilterGenerate,
    tasksCommentFilter: tasksCommentFilter,
    tasksTodoFilter: tasksTodoFilter,
    taskmenuSortClick: taskmenuSortClick,
    createTaskDuePlusClick: createTaskDuePlusClick,
    createTaskDuePlusMonthClick: createTaskDuePlusMonthClick,
    createTaskDueMinusClick: createTaskDueMinusClick,
    createTaskDueDeleteClick: createTaskDueDeleteClick,
    createTaskDueTodayClick: createTaskDueTodayClick,
    openCallbackCreateTask: openCallbackCreateTask,
    openCallbackEditTask: openCallbackEditTask,
    openCallbackClearTrash: openCallbackClearTrash,
    submitCreateTask: submitCreateTask,
    submitClearTrash: submitClearTrash,
    resetCreateTask: resetCreateTask,
    
    // MainContents
    registAssign: registAssign,
    createAssignLabel: createAssignLabel,
    createAssignList: createAssignList,
    renderTask: renderTask,
    createTaskElement: createTaskElement,
    taskActionClick: taskActionClick,
    submitComment: submitComment,
    deleteComment: deleteComment,
    renderComment: renderComment,
    renderMember: renderMember
};

c.addEvents('initApplication');

$(d).ready(function(){
    app.run();
});

// Run
function run() {
    
    if (navigator.userAgent.indexOf('AppleWebKit/') != -1) {
        app.is_webkit = true;
    }
    
    c.init();
    
    app.initParts();
    app.initEvent();
    app.initElements();
    app.windowResizeEvent();
    
    app.initAccount();
    
    c.fireEvent('initApplication');
}
function initParts() {
    
    // base
    app.parts.header      = $('body > header');
    app.parts.aside       = $('body > div > aside');
    app.parts.article     = $('body > div > article');
    app.parts.right       = $('body > div > div');
    app.parts.footer      = $('body > footer');
    
    // header
    app.parts.status      = app.parts.header.find('p');
    app.parts.badge       = $('#notification-badge');
    
    // aside
    app.parts.sidemenu    = app.parts.aside.find('> header');
    app.parts.listnav     = app.parts.aside.find('> header > ul');
    app.parts.lists       = app.parts.listnav;
    app.parts.listname    = app.parts.aside.find('#current-list-name');
    app.parts.listmembers = app.parts.aside.find('#list-members');
    app.parts.listmenu    = app.parts.aside.find('> article li.action');
    app.parts.listonly    = app.parts.aside.find('[data-listonly]');
    app.parts.listsort    = app.parts.aside.find('> article ul.sort');
    app.parts.summary     = $('#summary');
    
    // article
    app.parts.tasks       = app.parts.article.find('> section > ul.task');
    
    // comment
    app.parts.comment     = $('body > div > div > ul');
    app.parts.commentform = $('#comment-box');
    app.parts.commentbox  = $('#comment-box textarea');
    
    // absolute
    app.parts.guide       = $('#guide');
    app.parts.owners      = $('#create-list-window select[name=owner]');
    app.parts.connectacs  = $('#connect-accounts');
    
    // template
    app.template.task     = app.parts.tasks.html();
    app.template.assign   = $('#create-task-assign').html();
    
    // offset
    app.offset.commment   = $('body > div > div').offset();
}
function initEvent() {
    
    $(w).resize($.proxy(this.windowResizeEvent, this));
    
    // Receiver Element for Chrome Extensions
    document.getElementById('extentionsEventDiv').addEventListener('extentionsEvent', function() {
        var text = document.getElementById('extentionsEventDiv').innerText;
        var data = JSON.parse(text);
        app.exec(data.method, data.arguments);
    }, false);
    
    // Shortcut Key
    $(document).keypress(function(e){
        if (e.shiftKey || e.ctrlKey) {
            return true;
        }
        if (document.activeElement.tagName === 'BODY') {
            // C
            if (e.keyCode === 99) {
                $('#create-task-button').click();
                return false;
            }
            // R
            else if (e.keyCode === 114) {
                app.notificationCheck();
            }
        }
        return true;
    });
}
function initAccount() {
    app.refresh();
    setTimeout(function(){
        app.notificationCheck(true);
    }, 60 * 1000);
}

function initElements(context) {
    $('*[data-init]', context).each(function(){
        var ele = $(this);
        var methods = ele.data('init').split(',');
        for (var i = 0, max_i = methods.length; i < max_i; i++) {
            app.exec(['initElement', methods[i]], [this]);
        }
    });
}
function initElementClick(element) {
    element.addEventListener("click", app, false);
}
function initElementLocalize(element) {
    var ele = $(element);
    ele.text(ele.data('text-' + c.lang));
}
function initElementLocalizePlaceholder(element) {
    var ele = $(element);
    ele.attr('placeholder', ele.data('text-' + c.lang));
}
function initElementGuide(element) {
    var ele = $(element);
    var msg = ele.data('guide-' + c.lang);
    ele.hover(function(){
        // 動的に変更可能にする為、この段階で評価する
        if (app.account.state.noguide) {
            return true;
        }
        if (app.dragging) {
            return true;
        }
        var top = ele.offset().top + ele.height();
        var left = ele.offset().left;
        app.parts.guide.text(msg);
        app.parts.guide.show();
        app.parts.guide.css('top', top + 'px');
        app.parts.guide.css('left', left + 'px');
    }, function() {
        app.parts.guide.hide();
    });
}
function initElementPulldown(element) {
    var ele = $(element);
    var menu = ele.find('> .pulldown-menu');
    var effect = ele.data('effect');
    c.delayHover(element, function(){
        if (effect) {
            menu.show(effect, {}, c.SPEED);
        } else {
            menu.slideDown(c.SPEED);
        }
    }, function(){
        if (effect) {
            menu.hide(effect, {}, c.SPEED);
        } else {
            menu.slideUp(c.SPEED);
        }
    }, 500);
}
function initElementSummary(element) {
    var li = $(element);
    var link = li.find('> span.action');
    var badge = li.find('> span.badge');
    badge.text(0);
    var cond = $.extend({}, app.cond_default);
    for (var key in cond) {
        var val = link.data(key.replace('_', '-'));
        if (typeof val !== 'undefined') {
            cond[key] = val;
        }
    }
    var filter = app.tasksFilterGenerate(cond);
    app.counters.push({
        filter: filter,
        badge: badge
    });
}
function initElementSortable(element) {
    var ele = $(element);
    var update = ele.data('update');
    var handle = ele.data('handle');
    ele.sortable({
        handle: handle,
        cursor: 'url(/static/img/openhand.cur), move',
        start: function (e, ui) {
            app.dragging = true;
            app.parts.guide.hide();
        },
        stop: function (e, ui) {
            app.dragging = false;
        },
        update: function(e, ui) {
            app.exec(update);
        }
    });
}
function initElementCommentBox(element) {
    var ele = $(element);
    ele.attr('disabled', true);
    ele.keydown(function(e){
        if (e.keyCode === 13 && !e.shiftKey) {
            e.stopPropagation();
            e.preventDefault();
            if (ele.val().length) {
                app.submitComment();
            }
        } else if (e.keyCode === 27) {
            app.parts.commentbox.val('');
            $('#comment-window').hide('drop');
        }
    });
    ele.autogrow({single: true});
}
function initElementFormWindow(element) {
    var form = $(element);
    var reset = form.data('reset');
    form.find('button.cancel').click(function(){
        if (reset) {
            app.exec(reset, [form]);
        }
        form.hide('drop');
        return false;
    });
    form.find('input[type=text]:first').keydown(function(e){
        var input = $(this);
        if (e.keyCode == 27) {
            if (e.shiftKey) {
                if (reset) {
                    app.exec(reset, [form]);
                } else {
                    form.find('*[data-no-keep=1]').val('');
                    input.get(0).focus();
                }
            } else {
                document.activeElement.blur();
                if (reset) {
                    app.exec(reset, [form]);
                }
                form.hide('drop');
            }
        }
    });
    form.bind('submit', function(){
        var submit = form.data('submit');
        if (submit) {
            app.exec(submit, [form]);
        }
        return false;
    });
    app.modals[form.attr('id')] = form;
    form.draggable({ handle: 'h1' });
    form.find('footer input[type=checkbox]').click($.proxy(app.statebleCheckboxClick, app));
}
function initElementDatepicker(element) {
    var ele = $(element);
    var datepicker_option = {};
    if (c.lang === 'ja') {
        datepicker_option.dateFormat = 'yy/mm/dd';
        var ymd = $.datepicker.formatDate('yy/mm/dd', new Date());
        ele.attr('placeholder', ymd);
    }
    ele.datepicker(datepicker_option);
}
function initElementDisableSelection(element) {
    $(element).disableSelection();
}
function initElementAutocomplete(element) {
    var ele = $(element);
    var prependTo = $('#create-list-members');
    ele.autocomplete({
		source: function(request, response) {
		    response($.ui.autocomplete.filter(app.assign, request.term));
		},
		select: function(event, ui) {
		    app.createAssignList(app.friends[ui.item.value])
		    .prependTo(prependTo);
        }
	}).data('autocomplete')._renderItem = function(ul, item) {
        return $(document.createElement('li'))
            .data('item.autocomplete', item)
            .append("<a>"+ item.label + "</a>")
            .appendTo(ul);
    };
    ele.bind('autocompleteclose', function(){ ele.val('') });
}
function initElementNoticecheck(element) {
    var ele = $(element);
    ele.mouseover(function(){
        if (ele.find('> span').hasClass('active')) {
            ele.find('> span').removeClass('active').text(0);
            app.account.state.last_history_time = (new Date()).getTime();
            app.updateAccount({
                ns: 'state',
                method: 'set',
                key: 'last_history_time',
                val: app.account.state.last_history_time
            });
        }
    });
}

// Event
function handleEvent(e) {
    var ele = $(e.currentTarget);
    if (ele.data('bind')) {
        e.stopPropagation();
    }
    app.exec(ele.data('bind') + 'Click', [e, ele])
}
function windowResizeEvent() {
    // FIXME: スクロールが発生した場合にボタンを有効化する
    var w_height = $(w).height();
    var h_height = app.parts.footer.height();
    if (h_height > 0) {
        h_height+= 8;
    }
    $('body > div > aside > header > ul').height(w_height - h_height - 70);
    $('body > div > aside').height(w_height - h_height - 33);
    $('body > div > article > section').height(w_height - h_height - 93 + 17);
    $('body > div > div').width($(w).width() - app.offset.commment.left - 24);
    this.commentHeightResize();
}
function commentHeightResize() {
    var w_height = $(w).height();
    var h_height = app.parts.footer.height();
    if (h_height > 0) {
        h_height+= 8;
    }
    $('body > div > div > ul').height(w_height - h_height - $('body > div > div > ul').offset().top - 19);
}

// General
function exec(method, args) {
    if ($.isArray(method)) {
        method = method[0] + c.capitalize(method[1]);
    }
    if (method in app) {
        app[method].apply(app, args);
    } else {
        console.log('unkown method ' + method);
    }
}
function ajax(option) {
    if ("data" in option && "type" in option && option.type.toLowerCase() === 'post') {
        option.data[c.CSRF_TOKEN_NAME] = c.csrf_token;
        option.data["request_time"] = (new Date()).getTime();
    }
    return $.ajax(option)
    .fail(function(jqXHR, textStatus, errorThrown){
        console.log({
            status: jqXHR.status,
            thrown: errorThrown,
            textStatus: textStatus
        });

        // Collision
        if (jqXHR.status === 403 || jqXHR.status === 404) {
            // soft reload
            console.log('permission or not found.');
        }

        // Internal Server Error
        else if (jqXHR.status === 500) {
            // しばらくして...
            console.log('error.');
        }
    });
}
function message(message) {
    alert(message);
}
function getProfileImageUrl(user_id) {
    var friend = this.friend_ids[user_id];
    if (friend) {
        if ("profile_image_url" in friend) {
            return friend.profile_image_url;
        }
        if (/^tw-/.test(user_id)) {
            return this.getTwitterProfileImageUrl(friend.screen_name);
        }
    } else {
        console.log('unknown id ' + user_id);
    }
}
function getTwitterProfileImageUrl(screen_name) {
    var code = '@' + screen_name;
    if (code in this.friends) {
        return this.friends[code].profile_image_url;
    } else {
        return 'http://api.twitter.com/1/users/profile_image/' + screen_name;
    }
}
function syncTwitterContact(user_id, cursor, screen_name) {
    if (!cursor || cursor === -1) {
        if (user_id in app.account.tw) {
            app.account.tw[user_id].friends = [];
        } else {
            app.account.tw[user_id] = {friends: []};
        }
    }
    this.ajax({
        type: 'get',
        url: '/api/1/contact/sync_from_twitter',
        data: {
            user_id: user_id,
            cursor: cursor
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            app.registAssign(data.friends);
            $.merge(app.account.tw[user_id].friends, data.friends);
            if (data.next_cursor) {
                app.syncTwitterContact(user_id, data.next_cursor, screen_name);
            } else {
                app.refresh();
            }
        }
    });
}
function lookupUnknownMembers(unknownMembers, callback) {
    console.log(unknownMembers);
    this.ajax({
        type: 'get',
        url: '/api/1/contact/lookup_twitter',
        data: {
            user_ids: unknownMembers
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            for (var i = 0, max = data.friends.length; i < max; i++) {
                var friend = data.friends[i];
                var meta = {
                    user_id: friend.id,
                    name: friend.name,
                    screen_name: friend.screen_name,
                    profile_image_url: friend.profile_image_url
                };
                app.friends["@" + friend.screen_name] = meta;
                app.friend_ids["tw-" + friend.id] = meta;
            }
            callback.call();
        } else {
            callback.call();
        }
    });
}
function updateAccount(params, refresh) {
    return this.ajax({
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
function refresh(option) {
    var syncContact = false;
    var unknownMembers = [];
    if (!option) {
        option = {};
    }
    return this.ajax({
        type: 'get',
        url: '/api/1/account/',
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            app.account = data.account;
            app.assign = [];
            app.parts.owners.empty();
            app.parts.tasks.empty();
            app.parts.connectacs.empty();
            for (var user_id in data.account.tw) {
                var tw = data.account.tw[user_id];
                app.registAssign(tw.friends);
                if (!("user_id" in tw.friends[0])) {
                    app.syncTwitterContact(user_id, -1, tw.screen_name);
                }
            }
            for (var i = 0; i < app.account.tw_accounts.length; i++) {
                var tw_account = app.account.tw_accounts[i];
                var user_id = tw_account.user_id;
                $('<option/>')
                    .attr('value', 'tw-' + user_id)
                    .text('@' + tw_account.screen_name)
                    .appendTo(app.parts.owners);
                $('<li>Twitter: '
                    + tw_account.screen_name
                    + ' <!-- span class="icon icon-delete"></span --></li>')
                    .appendTo(app.parts.connectacs);
                
                if (!(user_id in data.account.tw)) {
                    app.syncTwitterContact(user_id, -1, tw_account.screen_name);
                }
            }
            // FIXME: 抜けたTwitterの情報を消す
            app.resetCounter();
            app.listmap = [];
            app.parts.lists.find('.project').remove();
            
            app.unread_comment_count = 0;
            var lists = app.account.lists;
            
            var humanmap = {};
            var unknownCheck = function(id){
                if (id && !(id in app.friend_ids) && !(id in humanmap)) {
                    humanmap[id] = true;
                    unknownMembers.push(id);
                }
            }
            for (var i = 0, max_i = lists.length; i < max_i; i++) {
                var list = lists[i];
                var humans = [list.doc.owner_id].concat(list.doc.member_ids);
                for (var j = 0, max_j = humans.length; j < max_j; j++) {
                    unknownCheck(humans[j]);
                }
                for (var j = 0, max_j = list.doc.tasks.length; j < max_j; j++) {
                    var task = list.doc.tasks[j];
                    unknownCheck(task.requester_id);
                    for (var k = 0, max_k = task.comments.length; k < max_k; k++) {
                        unknownCheck(task.comments[k].owner_id);
                    }
                    for (var k = 0, max_k = task.history.length; k < max_k; k++) {
                        unknownCheck(task.history[k].id);
                    }
                }
            }
            var showList = function(){
                for (var i = 0, max = lists.length; i < max; i++) {
                    app.registList(lists[i]);
                }
                app.sortList();
                app.sortTask('updated');
                app.renderCommentBadge();
                if ("select_list_id" in option) {
                    var id = option.select_list_id;
                    var speed = c.SPEED;
                    c.SPEED = null;
                    app.parts.lists.find('> li[data-list-id="' + id + '"]:first').click();
                    c.SPEED = speed;
                    if (option.select_task_id) {
                        var taskli = app.taskli[id + '-' + option.select_task_id];
                        var display = taskli.css('display');
                        if (taskli) {
                            if (display === 'none') {
                                taskli.removeClass('delete');
                            }
                            taskli.effect("highlight", {}, 3000, function(){
                                if (display === 'none') {
                                    taskli.slideUp(c.SPEED, function(){
                                        taskli.addClass('delete');
                                    });
                                }
                            });
                        }
                    }
                } else if ("last_read_list" in app.account.state) {
                    var id = app.account.state.last_read_list;
                    app.parts.lists.find('> li[data-list-id="' + id + '"]:first').click();
                } else {
                    app.parts.lists.find('li:first').click();
                }
                app.notificationCheckDone(data);
            };
            if (unknownMembers.length) {
                app.lookupUnknownMembers(unknownMembers, showList);
            } else {
                showList.call();
            }
            if (app.account.state.noguide) {
                $('#guide-switch').removeClass('on');
                $('#guide-switch').text($('#guide-switch').data('text-off'));
            } else {
                $('#guide-switch').addClass('on');
                $('#guide-switch').text($('#guide-switch').data('text-on'));
            }
        }
    });
}
function needNotification(account, history) {
    if (this.isMe(history.id)) {
        return false;
    }
    var key = history.list_id + ':' + history.task.id;
    if (key in account.state.watch) {
        return true;
    } else if (this.findMe([history.task.requester_id].concat(history.task.assign_ids))) {
        return true;
    }
}
function notificationCheck(loop) {
    return this.ajax({
        type: 'get',
        url: '/api/1/account/',
        dataType: 'json'
    })
    .done(function(data){
        app.notificationCheckDone(data, loop);
    })
}
function notificationCheckDone(data, loop) {
    app.notifications = [];
    var check = function(account, history) {
        if (app.needNotification(account, history)) {
            app.notifications.push(history);
        }
    }
    var lists = data.account.lists;
    for (var i = 0, max_i = lists.length; i < max_i; i++) {
        var list = lists[i];
        var tasks = list.doc.tasks;
        for (var j = 0, max_j = tasks.length; j < max_j; j++) {
            var task = tasks[j];
            // create task
            check.call(app, data.account, {
                id: task.registrant_id,
                action: 'create-task',
                date: (task.created * 1000),
                task: task,
                list_id: list.id,
                list_name: list.doc.name
            });
            // update task
            for (var k = 0, max_k = task.history.length; k < max_k; k++) {
                var history = task.history[k];
                history.task = task;
                history.list_id = list.id;
                history.list_name = list.doc.name;
                check.call(app, data.account, history);
            }
            // create comment
            for (var l = 0, max_l = task.comments.length; l < max_l; l++) {
                var comment = task.comments[l];
                var history = {
                    id: comment.owner_id,
                    action: 'create-comment',
                    date: comment.time,
                    task: task,
                    list_id: list.id,
                    list_name: list.doc.name,
                    comment: comment.comment
                };
                check.call(app, data.account, history);
            }
        }
    }
    
    if (app.notifications.length === 0) {
        app.parts.badge.find('> div > p').text('none.');
    } else {
        app.parts.badge.find('> div > p').text('');
    }
    app.notifications.sort(function(a, b){
        return b.date - a.date;
    });
    var disp = function(history){
        return function(){
            $('#digest-title').text(history.task.title || '');
            $('#digest-comment').text(
                history.comment ? '> ' + history.comment : ''
            );
            $('#digest')
                .css('left', $(this).offset().left - $('#digest').width() - 20 + 'px')
                .css('top', $(this).offset().top - 20 + 'px')
                .show();
        };
    };
    var ul = app.parts.badge.find('> div > ul');
    ul.empty();
    var comment_map = {};
    var count = 0;
    var disps = 0;
    for (var i = 0, max_i = app.notifications.length; i < max_i; i++) {
        var history = app.notifications[i];
        var key = history.id + ':' + history.list_id + ':' + history.task.id + history.action;
        if (key in comment_map) {
            continue;
        }
        comment_map[key] = true;
        disps++;
        if (disps >= 20) {
            break;
        }
        if (!(history.id in app.friend_ids)) {
            continue;
        }
        var friend = app.friend_ids[history.id];
        var screen_name = $('<span class="screen_name"/>').text(friend.screen_name);
        var icon = $('<img/>').attr('src', friend.profile_image_url);
        var key = 'text-' + history.action + '-' + app.account.lang;
        var action = $('<span class="action"/>').text(ul.data(key));
        var list = $('<span class="list"/>').text(history.list_name);
        var date = $('<span class="date"/>').text(c.timestamp(history.date));
        $('<li/>')
            .addClass('clearfix')
            .append(icon)
            .append(screen_name)
            .append(action)
            .append(list)
            .append($('<br>'))
            .append(date)
            .data('list-id', history.list_id)
            .data('task-id', history.task.id)
            .hover(disp.call(app, history), function(){
                $('#digest').hide();
            })
            .click(function(){
                app.refresh({
                    select_list_id: $(this).data('list-id'),
                    select_task_id: $(this).data('task-id')
                });
            })
            .appendTo(ul);
        if (history.date > this.account.state.last_history_time) {
            count++;
        }
    }
    app.parts.badge.find('> span').text(count);
    if (count > 0) {
        app.parts.badge.find('> span').addClass('active');
    } else {
        app.parts.badge.find('> span').removeClass('active');
    }
    if (loop) {
        setTimeout(function(){
            app.notificationCheck(loop);
        }, 60 * 1000);
    }
}
function submitFinalize(form) {
    form.find('*[data-no-keep=1]').val('');
    form.find('input[type=text]:first').get(0).focus();
}
function showList(id, task_id) {
    var li = this.listli[id];
    var list = this.listmap[id];
    this.cond = $.extend({}, this.cond_default);
    this.cond.list_id = id;
    this.current_list = list;
    this.current_filter = null;
    $('#closed-task-switch').removeClass('selected');
    app.parts.listname.text(list.doc.name);
    app.parts.listmenu.data('list-id', id);
    app.parts.listmembers.empty();
    if ("owner_id" in list.doc) {
        this.renderMember(list.doc.owner_id);
    }
    if ('member_ids' in list.doc && list.doc.member_ids.length) {
        var member_ids = list.doc.member_ids.sort();
        for (var i = 0; i < member_ids.length; i++) {
            this.renderMember(member_ids[i]);
        }
    }
    
    if (id in this.account.state.ignore_badge_list) {
        $('#ignore-badge-count').attr('checked', true);
    } else {
        $('#ignore-badge-count').attr('checked', false);
    }
    
    this.filterTask();
    this.sortTask();
    if (task_id) {
        var taskli = app.taskli[id + '-' + task_id];
        if (taskli) {
            taskli.effect("highlight", {}, 3000);
        }
    }
    // // 未読があった場合更新
    // if (li.hasClass('updated')) {
    //     li.removeClass('updated');
    //     this.updateAccount({
    //         ns: 'state.read.list',
    //         method: 'set',
    //         key: id,
    //         val: list.value.rev + ',' + (new Date()).getTime()
    //     });
    // }
    this.updateAccount({
        ns: 'state',
        method: 'set',
        key: 'last_read_list',
        val: list.id
    });
}
function switchList(e) {
    var li = $(e.currentTarget);
    var id = li.data('list-id');
    app.showList(id);
    app.parts.listonly.show();
    app.parts.summary.find('.selected').removeClass('selected');
    $('#create-task-button').attr('disabled', false);
}
function switchFilterListClick(e) {
    var li = $(e.currentTarget);
    var pli = li.parent().parent().parent().find('> span.action:first');
    var listname = li.text();
    if (pli.length) {
        listname = pli.text();
    }
    app.parts.summary.find('.selected').removeClass('selected');
    li.addClass('selected');
    app.cond = $.extend({}, app.cond_default);
    for (var key in app.cond) {
        var val = li.data(key.replace('_', '-'));
        if (typeof val !== 'undefined') {
            app.cond[key] = val;
        }
    }
    if (!app.cond.list_id) {
        app.parts.listonly.hide();
        app.parts.listname.text(listname);
        app.current_list = null;
        $('#create-task-button').attr('disabled', true);
    } else {
        $('#create-task-button').attr('disabled', false);
    }
    app.filterTask();
}
function switchClosedClick(e) {
    this.switchFilterListClick(e);
    var li = $(e.currentTarget);
    if (li.data('closed')) {
        li.data('closed', 0);
        li.addClass('selected');
    } else {
        li.data('closed', 1);
        li.removeClass('selected');
    }
}
function renderList(list) {
    var badge = $('<span class="badge"></span>');
    var li = $('<li data-list-id="' + list.id + '"></li>');
    li.attr('class', 'project');
    li.text(list.doc.name);
    li.append(badge);
    app.listmap[list.id] = list;
    app.listli[list.id] = li;
    li.click($.proxy(app.switchList, app));
    list.taskmap = {};
    for (var j = 0; j < list.doc.tasks.length; j++) {
        list.doc.tasks[j].list = list;
        list.taskmap[list.doc.tasks[j].id] = list.doc.tasks[j];
    }
    list.badge = badge;
    app.renderBadge(list);
    
    // if (this.listReadLastRev(list.id) != list.value.rev) {
    //     li.addClass('updated');
    // }
    
    li.get(0).addEventListener('dragover', function(e){
        if (list.id === app.dragtask.list.id) {
            return true;
        }
        if (e.preventDefault) {
            e.preventDefault();
        }
        return false;
    }, false);
    li.get(0).addEventListener('drop', function(e){
        app.dragging = false;
        app.parts.guide.hide();
        app.parts.listnav.hide('drop', {}, c.SPEED);
        var data = e.dataTransfer.getData('Text').split(':');
        app.moveTask(data[1], data[0], list.id)
    }, false);
    
    var old = app.parts.lists.find('li[data-list-id="' + list.id + '"]');
    if (old.length) {
        if (old.hasClass('selected')) {
            old.replaceWith(li);
            app.showList(list.id);
        } else {
            old.replaceWith(li);
        }
    } else {
        app.parts.lists.append(li);
        var tasks = list.doc.tasks;
        for (var i = 0; i < tasks.length; i++) {
            var li = app.renderTask(list, tasks[i]);
            li.hide();
        }
    }
}
function renderBadge(list) {
    if (list.id in this.account.state.ignore_badge_list) {
        list.badge.hide();
        return ;
    }
    var count = 0;
    for (var j = 0; j < list.doc.tasks.length; j++) {
        if (this.needCount(list.doc.tasks[j])) {
            count++;
        }
    }
    if (count) {
        list.badge.text(count);
        list.badge.css('display', 'inline');
    } else {
        list.badge.hide();
    }
}
function needCount(task) {
    if (task.list.id in this.account.state.ignore_badge_list) {
        return false;
    }
    if (task.closed) {
        return false;
    }
    var my_order = this.isMe(task.requester_id);
    if (task.status === 2) {
        if (my_order) {
            return true;
        } else {
            return false;
        }
    }
    if (task.due) {
        var mdy = task.due.split('/');
        var date = new Date(mdy[2], mdy[0] - 1, mdy[1]);
        var now = new Date();
        if (date.getTime() > now.getTime()) {
            return false;
        }
    }
    if (task.assign_ids.length) {
        return this.findMe(task.assign_ids);
    }
    return my_order;
}
function needNotify(task) {
    
}
function renderCommentBadge() {
    if (this.unread_comment_count) {
        if (!this.commentbadge) {
            this.commentbadge = 
                $('<span id="comment-badge" class="badge">1</span>')
                .appendTo($('#comment-filter'));
        }
        this.commentbadge.text(this.unread_comment_count);
        this.commentbadge.css('display', 'inline');
    } else {
        if (this.commentbadge) {
            this.commentbadge.hide();
        }
    }
}
function createList(params) {
    // see submitCreateList
}
function modifyList(params) {
    
}
function deleteList(params) {
    
}
function sortList() {
    
    // sidebar
    var lis = [];
    app.parts.lists.find('> li').each(function(i, ele) {
        lis.push($(ele));
    });
    var val = function(ele){
        var list_id = ele.data('list-id');
        if (list_id in app.account.state.sort.list) {
            return parseInt(app.account.state.sort.list[list_id]);
        } else {
            return 0;
        }
    }
    lis.sort(function(a, b) {
        return val(b) - val(a);
    });
    for (var i = 0; i < lis.length; i++) {
        lis[i].appendTo(app.parts.lists);
    }
}
function sortUpdateList() {
    var sort = {};
    var lists = app.parts.lists.find('> li');
    var count = lists.length;
    lists.each(function(i, ele) {
        var li = $(ele);
        sort[li.data('list-id')] = count;
        count--;
    });
    this.updateAccount({
        ns: 'state.sort',
        method: 'set',
        type: 'json',
        key: 'list',
        val: JSON.stringify(sort)
    });
}
function createTask(params) {
    
}
function modifyTask(params) {
    return app.ajax({
        type: 'post',
        url: '/api/1/task/update',
        data: params,
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            var oldtask = $.extend({}, app.listmap[params.list_id].taskmap[data.task.id]);
            var newtask = $.extend(app.listmap[params.list_id].taskmap[data.task.id], data.task);
            var list = app.listmap[params.list_id];
            app.renderBadge(list);
            app.createTaskElement(list, newtask);
            app.updateCounter(oldtask, newtask);
        }
    })
    .fail(function(jqXHR, textStatus, errorThrown){
        console.log('custom fail.');
        console.log({
            status: jqXHR.status,
            thrown: errorThrown,
            textStatus: textStatus
        })
    });
}
function moveTask(task_id, src_list_id, dst_list_id) {
    if (src_list_id === dst_list_id) {
        alert("Can't be moved to the same list.");
        return;
    }
    return this.ajax({
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
        if (data.success) {
            delete app.listmap[src_list_id].taskmap[task_id];
            app.taskli[src_list_id + '-' + task_id].remove();
            
            var task = data.task;
            task.list = app.listmap[dst_list_id];
            app.listmap[dst_list_id].taskmap[task.id] = task;
            app.listmap[dst_list_id].doc.tasks.push(task);
            var li = app.renderTask(task.list, task);
            app.taskli[dst_list_id + '-' + task.id] = li;
            app.resetCounter(true);
            app.renderBadge(app.listmap[src_list_id]);
            app.renderBadge(app.listmap[dst_list_id]);
            
            if (app.current_list) {
                li.slideUp(c.SPEED);
            } else {
                if (app.current_filter.call(app, li)) {
                    li.slideDown(c.SPEED);
                } else {
                    li.slideUp(c.SPEED);
                }
            }
            
        }
    });
}
function deleteTask(params) {
    
}
function filterTask() {
    var filter = this.tasksFilterGenerate();
    this.current_filter = filter;
    app.parts.tasks.find('> li').each(function(i, ele){
        var ele = $(ele);
        if (filter.call(app, ele)) {
            if (app.is_webkit && c.SPEED) {
                ele.slideDown(c.SPEED);
            } else {
                ele.show();
            }
        } else {
            if (app.is_webkit && c.SPEED) {
                ele.slideUp(c.SPEED);
            } else {
                ele.hide();
            }
        }
    });
    this.renderCommentBadge();
}
function readComment(li) {
    li.find('ul.comments > li').each(function(i, ele){
        var comment = $(ele);
        if (comment.data('read')) {
            comment.removeClass('unread');
            comment.removeData('read');
        }
        if (comment.hasClass('unread')) {
            comment.data('read', 1);
            app.unread_comment_count--;
        }
    });
}
function sortTask(id) {
    var lis = [];
    app.parts.tasks.find('> li').each(function(i, ele) {
        lis.push($(ele));
    });
    if (!id) {
        id = this.sort;
    } else {
        this.sort = id;
    }
    
    var label = $('body > div > article > header > div li[data-id="' + id + '"]').text();
    $('body > div > article > header > div > span').text(label);
    lis.sort(function(a, b) {
        if (id === 'title') {
            return a.text() > b.text() ? 1 : -1;
        }
        if (id === 'responser-ids') {
            if (a.data(id) === b.data(id)) {
                return b.data('updated') - a.data('updated');
            } else {
                return a.data(id) > b.data(id) ? 1 : -1;
            }
        }
        var a_val = parseInt(a.data(id)) || 0;
        var b_val = parseInt(b.data(id)) || 0;
        if (a_val != b_val) {
            return b_val - a_val;
        } else {
            return b.data('updated') - a.data('updated');
        }
    });
    if (id === 'due') {
        lis.reverse();
    }
    if (id === "sort") {
        app.parts.tasks.sortable("enable");
        app.parts.tasks.addClass('sortable');
    } else {
        app.parts.tasks.sortable("disable");
        app.parts.tasks.removeClass('sortable');
    }
    for (var i = 0; i < lis.length; i++) {
        lis[i].appendTo(app.parts.tasks);
    }
}
function sortUpdateTask() {
    var list_id = this.current_list.id;
    var task_ids = [];
    var task_ids_sort = [];
    var sort = {};
    app.parts.tasks.find('> li').each(function(i, ele) {
        var li = $(ele);
        if (li.data('list-id') === list_id) {
            task_ids.push(li.data('id'));
            task_ids_sort.push(li.data('id'));
        }
    });
    var task_ids_sort = task_ids_sort.sort(function(a, b){return parseInt(b) - parseInt(a)});
    for (var i = 0; i < task_ids.length; i++) {
        var task_id = task_ids[i];
        var id = task_ids_sort[i];
        sort[task_id] = id;
        this.taskli[list_id + '-' + task_id].data('sort', id);
    }
    this.updateAccount({
        ns: 'state.sort.task',
        method: 'set',
        type: 'json',
        key: list_id,
        val: JSON.stringify(sort)
    });
}
function isMe(id) {
    for (var i = 0; i < this.account.tw_accounts.length; i++) {
        var tw_account = this.account.tw_accounts[i];
        if ('tw-' + tw_account.user_id === id) {
            return true;
        }
    }
    return false;
}
function findMe(ids) {
    for (var i = 0; i < ids.length; i++) {
        if (this.isMe(ids[i])) {
            return ids[i];
        }
    }
}
function findMeFromList(list) {
    for (user_id in this.account.tw) {
        var code = 'tw-' + user_id;
        if (code === list.doc.owner_id) {
            return code;
        } else {
            for (var i = 0, max = list.doc.member_ids.length; i < max; i++) {
                if (code === list.doc.member_ids[i]) {
                    return code;
                }
            }
        }
    }
}
function listReadLastRev(list_id) {
    if (list_id in this.account.state.read.list) {
        return this.account.state.read.list[list_id].split(',')[0];
    }
    return '';
}
function listReadLastTime(list_id) {
    if (list_id in this.account.state.read.list) {
        return this.account.state.read.list[list_id].split(',')[1];
    }
    return '';
}
function statebleCheckboxClick(e) {
    var ele = $(e.currentTarget);
    var val = ele.attr('checked') ? 1 : 0;
    this.updateAccount({
        ns: 'state.checkbox',
        method: 'set',
        key: ele.attr('id'),
        val: val
    })
}
function updateCounter(oldtask, newtask) {
    for (var i = 0, max_i = this.counters.length; i < max_i; i++) {
        var counter = this.counters[i];
        var old_match = 0,
            new_match = 0;
        if (oldtask && counter.filter.call(this, null, oldtask)) {
            old_match = 1;
        }
        if (counter.filter.call(this, null, newtask)) {
            new_match = 1;
        }
        if (old_match !== new_match) {
            counter.badge.text(parseInt(counter.badge.text(), 10) - old_match + new_match);
        }
    }
}
function resetCounter(search) {
    for (var i = 0, max_i = this.counters.length; i < max_i; i++) {
        var counter = this.counters[i];
        var count = 0;
        if (search) {
            for (var list_id in this.listmap) {
                var list = this.listmap[list_id];
                for (var task_id in list.taskmap) {
                    var task = list.taskmap[task_id];
                    if (counter.filter.call(this, null, task)) {
                        count++;
                    }
                }
            }
        }
        counter.badge.text(count);
    }
}
function showNotifications() {
    
}

// GrobalMenu
function openClick(e, ele) {
    var form = app.modals[ele.data('id')];
    if (form.css('display') === 'none') {
        $('#create-task-assign').hide();
        form.show('drop', {}, c.SPEED, function(){
            var input = form.find('input[type=text]:first');
            if (input.length) {
                input.get(0).focus();
            }
            var callback = ele.data('callback');
            if (callback) {
                app.exec(['openCallback', callback], [e, ele]);
            }
        });
    }
}
function openCommentClick(e, ele) {
    var top = ele.offset().top + ele.height() + 20;
    
    var form = app.modals[ele.data('id')];
    if (form.css('display') === 'none') {
        form
        .css({
            top: top + 'px'
        })
        .slideDown(c.SPEED, function(){
            var input = form.find('textarea');
            if (input.length) {
                input.get(0).focus();
            } else {
                form.find('textarea:first').focus();
            }
            var callback = ele.data('callback');
            if (callback) {
                app.exec(['openCallback', callback], [e, ele]);
            }
        });
    }
}
function signInTwitterClick(e, ele) {
    location.href = '/signin/twitter/oauth';
}
function syncTwitterContactClick(e, ele) {
    
    // FIXME: statusbar update
    this.assign = [];
    return this.ajax({
        type: 'get',
        url: '/api/1/account/',
        dataType: 'json'
    })
    .done(function(data){
        for (var i = 0; i < data.account.tw_accounts.length; i++) {
            var tw = data.account.tw_accounts[i];
            app.syncTwitterContact(tw.user_id, -1, tw.screen_name);
        }
    });
    
}
function refreshClick(e, ele) {
    this.refresh();
}
function guideSwitchClick(e, ele) {
    if (this.account.state.noguide) {
        delete this.account.state["noguide"];
        ele.addClass('on').text(ele.data('text-on'));
    } else {
        this.account.state.noguide = true;
        ele.removeClass('on').text(ele.data('text-off'));
        app.parts.guide.fadeOut('slow');
    }
    this.updateAccount({
        ns: '',
        method: (this.account.state.noguide ? '+' : '-'),
        key: 'state',
        val: 'noguide'
    });
}

// SideMenu
function listDisplaySwitchClick(e, ele) {
    var list_id = ele.parent().parent().data('list-id');
    var method = ele.attr('checked') ? '-' : '+';
    
    if (ele.attr('checked')) {
        app.parts.lists.find('li').each(function(i, ele){
            if (list_id === $(ele).data('list-id')) {
                $(ele).slideDown(c.SPEED);
            }
        });
    } else {
        app.parts.lists.find('li').each(function(i, ele){
            if (list_id === $(ele).data('list-id')) {
                $(ele).slideUp(c.SPEED);
            }
        });
    }
    
    this.updateAccount({
        ns: 'state',
        method: method,
        key: 'hide_list',
        val: list_id
    });
}
function listBadgeSwitchClick(e, ele) {
    var list_id = this.current_list.id;
    var method = ele.attr('checked') ? '+' : '-';
    var list = this.listmap[list_id];
    if (ele.attr('checked')) {
        this.account.state.ignore_badge_list[list_id] = 1;
    } else {
        delete this.account.state.ignore_badge_list[list_id];
    }
    this.resetCounter(true);
    this.renderBadge(list);
    this.updateAccount({
        ns: 'state',
        method: method,
        key: 'ignore_badge_list',
        val: list_id
    });
}
function openCallbackCreateList(e, ele) {
    
    var form = $('#create-list-window');
    form.find('input[type=text]:first').get(0).focus();
    form.find('footer input[type=checkbox], footer label').show();
    form.data('list-id', 0);
    
    var h1 = form.find('h1:first');
    h1.text(h1.data('text-default'));
    $('#create-list-members').empty();
    
    this.resetCreateList(form);
}
function openCallbackEditList(e, ele) {
    var list = this.listmap[ele.data('list-id')];

    var form = $('#create-list-window');
    form.data('list-id', list.id);
    form.find('footer input[type=checkbox], footer label').hide();

    var h1 = form.find('h1:first');
    h1.text(h1.data('text-edit'));

    form.find('input[name=name]').val(list.doc.name);

    if (this.isMe(list.doc.owner_id)) {
        form.find('li[data-owner-only]').show();
        $('#create-list-owner-select').val(list.doc.owner_id);
    } else {
        form.find('li[data-owner-only]').hide();
    }

    var createListMembers = $('#create-list-members');
    createListMembers.empty();
    createListMembers.hide();
    for (var i = 0, max = list.doc.member_ids.length; i < max; i++) {
        var member_id = list.doc.member_ids[i];
        if (member_id in this.friend_ids) {
            var member = this.friend_ids[member_id];
            createListMembers.append(this.createAssignList(member));
        } else {
            // console.log(member_id);
        }
    }
    createListMembers.slideDown(c.SPEED);
}
function openCallbackDeleteList(e, ele) {
    var list = this.listmap[ele.data('list-id')];
    var form = $('#delete-list-window');
    form.data('list-id', list.id);
    $('#delete-list-name').text(list.doc.name);
    form.find('button').get(0).focus();
}
function submitCreateList(form) {
    
    var list_id = form.data('list-id');
    var url = list_id ? '/api/1/list/update' : '/api/1/list/create';
    var name = form.find('input[name=name]').val();
    var privacy = form.find('select[name=privacy]').val();
    var owner_id = form.find('select[name=owner]').val();
    var member_ids = [];
    if (!name.length) {
        alert('please input list name.');
        return;
    }
    if (!owner_id) {
        alert('please select owner.');
        return;
    }
    form.find('#create-list-members > li.member').each(function(i, ele){
        member_ids.push($(ele).data('id'));
    });
    if (list_id) {
        form.fadeOut(c.SPEED);
        app.parts.listmembers.empty();
        this.renderMember(owner_id);
        for (var i = 0; i < member_ids.length; i++) {
            this.renderMember(member_ids[i]);
        }
    } else {
        app.submitFinalize(form);
    }
    return this.ajax({
        type: 'post',
        url: url,
        data: {
            list_id: list_id,
            name: name,
            privacy: privacy,
            owner_id: owner_id,
            member_ids: member_ids
        },
        dataType: 'json'
    })
    .pipe(function(data){
        if (data.success) {
            return app.ajax({
                type: 'get',
                url: '/api/1/list/' + data.list_id,
                dataType: 'json'
            });
        }
    })
    .done(function(data){
        if (data.success) {
            app.registList(data.list);
        }
    });
}
function submitDeleteList(form) {
    var list_id = form.data('list-id');
    return this.ajax({
        type: 'post',
        url: '/api/1/list/delete',
        data: {
            list_id: list_id
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            app.refresh();
            form.fadeOut();
        }
    });
}
function resetCreateList(form) {
    form.find('input[type=text]').val('');
    $('#create-list-members').empty();
}
function registList(list) {
    this.renderList(list);
}

// MainMenu
function tasksFilterGenerate(cond) {
    if (!cond) {
        cond = app.cond;
    }
    var func = function(ul, task){
        var list_id, task_id;
        if (task) {
            list_id = task.list.id;
            task_id = task.id;
        } else {
            list_id = ul.data('list-id');
            task_id = ul.data('id');
            task = app.listmap[list_id].taskmap[task_id];
        }
        if (cond.list_id && cond.list_id !== list_id) {
            return false;
        }
        if (cond.star && !task.star) {
            return false;
        }
        if (typeof cond.status === 'number' && cond.status !== task.status) {
            return false;
        }
        if (typeof cond.status_ignore === 'number' && cond.status_ignore === task.status) {
            return false;
        }
        if (typeof cond.closed === 'number' && cond.closed !== task.closed) {
            return false;
        }
        if (cond.registrant && !app.isMe(task.requester_id)) {
            return false;
        }
        if (typeof cond.assign === 'boolean') {
            var assign;
            if (task.assign_ids.length) {
                assign = app.findMe(task.assign_ids) ? true : false;
            } else {
                assign = app.isMe(task.requester_id);
            }
            if (cond.assign !== assign) {
                return false;
            }
        }
        // todo
        if (cond.todo && !app.needCount(task)) {
            return false;
        }
        // notify
        if (cond.notify && !app.needNotify(task)) {
            return false;
        }
        return true;
    };
    return func;
}
function tasksCommentFilter(li) {
    var comments = li.find('ul.comments > li');
    for (var i = 0; i < comments.length; i++) {
        var comment = $(comments[i]);
        if (comment.hasClass('unread')) {
            return true;
        }
    }
    return false;
}
function tasksTodoFilter(list, task) {
    return this.needCount(task);
}
function taskmenuSortClick(e, ele) {
    this.sortTask(ele.data('id'));
}
function createTaskDuePlusClick(e, ele) {
    var due = $('#create-task-date');
    var date = due.datepicker("getDate") || new Date();
    date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
    due.datepicker("setDate", date);
}
function createTaskDuePlusMonthClick(e, ele) {
    var due = $('#create-task-date');
    var date = due.datepicker("getDate") || new Date();
    date.setMonth(date.getMonth() + 1);
    due.datepicker("setDate", date);
}
function createTaskDueMinusClick(e, ele) {
    var due = $('#create-task-date');
    var date = due.datepicker("getDate") || new Date();
    date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
    due.datepicker("setDate", date);
}
function createTaskDueDeleteClick(e, ele) {
    $('#create-task-date').val('');
}
function createTaskDueTodayClick(e, ele) {
    var due = $('#create-task-date');
    due.datepicker("setDate", new Date());
}
function openCallbackCreateTask(e, ele) {
    var list_id = this.current_list
                ? this.current_list.id
                : $(ele).parent().data('list-id');
    if (!list_id) {
        return;
    }
    var list = this.listmap[list_id];
    var ul = $('#create-task-assign');
    ul.empty();
    ul.hide();
    var select = $('#create-task-requester');
    select.empty();
    var member_ids = [list.doc.owner_id].concat(list.doc.member_ids);
    for (var i = 0, max = member_ids.length; i < max; i++) {
        var id = member_ids[i];
        var url = this.getProfileImageUrl(id);
        var friend = this.friend_ids[id];
        var li = $('<li/>');
        var label = $('<label/>');
        var input = $('<input type="checkbox" name="assign" value="">');
        input.val(id);
        label.append(input);
        if (url) {
            $('<img>')
            .attr('src', url)
            .attr('class', 'twitter_profile_image')
            .appendTo(label);
        }
        label.append($('<span></span>').text(friend.screen_name));
        li.append(label);
        ul.append(li);
        
        $('<option/>')
            .val(id)
            .text(friend.screen_name)
            .appendTo(select);
    }
    select.val(this.findMe(member_ids));
    if (!member_ids.length) {
        ul.append($('<li>no member.</li>'));
    }
    ul.slideDown();
    var form = $('#create-task-window');
    var h1 = form.find('h1:first');
    h1.text(h1.data('text-default'));
    var save = form.find('button.save:first');
    save.text(c.lcText(save, 'default'));
    this.resetCreateTask(form);
    // form.find('input[type=text]:first').get(0).focus();
    form.data('list-id', list.id);
    form.data('task-id', 0);
}
function openCallbackCreateTaskWithMember(e, ele) {
    this.openCallbackCreateTask(e, ele);
    var id = $(ele).data('member-id');
    var ul = $('#create-task-assign');
    ul.find('input[value="' + id + '"]').attr('checked', true);
    $('#create-task-requester').val($(ele).data('requester-id'));
}
function openCallbackEditTask(e, ele) {
    this.openCallbackCreateTask(e, ele);
    
    var div = $(ele);
    var list_id = div.parent().data('list-id');
    var task_id = div.parent().data('id');
    var task = this.listmap[list_id].taskmap[task_id];
    var form = $('#create-task-window');
    form.find('footer input[type=checkbox], footer label').hide();
    var h1 = form.find('h1:first');
    h1.text(h1.data('text-edit'));
    var save = form.find('button.save:first');
    save.text(c.lcText(save, 'edit'));
    form.data('list-id', list_id);
    form.data('task-id', task_id);
    form.find('input[name=title]').val(task.title || '');
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(task.due)) {
        var due_date = $.datepicker.parseDate('mm/dd/yy', task.due);
        $('#create-task-date').datepicker('setDate', due_date);
    } else {
        form.find('input[name=due]').val('');
    }
    if (task.assign_ids) {
        for (var i = 0; i < task.assign_ids.length; i++) {
            var id = task.assign_ids[i];
            form.find('input[value="' + id + '"]').attr('checked', true);
        }
    }
    $('#create-task-requester').val(div.parent().data('requester-id'));
}
function openCallbackClearTrash(e, ele) {
    var form = $('#clear-trash-window');
    form.data('list-id', this.current_list.id);
    form.find('button').get(0).focus();
}
function submitCreateTask(form) {
    
    var task_id = form.data('task-id');
    var list;
    if (task_id) {
        var list_id = form.data('list-id');
        list = this.listmap[list_id];
    } else {
        list = this.current_list;
    }
    var url = task_id ? '/api/1/task/update' : '/api/1/task/create';
    var title = form.find('input[name=title]').val();
    var due = form.find('input[name=due]').datepicker("getDate");
    due = $.datepicker.formatDate('mm/dd/yy', due);
    if (!title.length) {
        alert('please input task title.');
        return;
    }
    var requester_id = $('#create-task-requester').val();
    var registrant_id = this.findMeFromList(list);
    if (!registrant_id) {
        alert("can't find registrant.");
        return;
    }
    var assign_ids = [];
    form.find('input[name=assign]:checked').each(function(i, ele){
        assign_ids.push(ele.value);
    });
    if (task_id) {
        form.find('input[name=title]').val('');
        form.hide('drop', {}, c.SPEED);
    } else {
        app.submitFinalize(form);
    }
    return this.ajax({
        type: 'post',
        url: url,
        data: {
            list_id: list.id,
            task_id: task_id,
            requester_id: requester_id,
            registrant_id: registrant_id,
            title: title,
            due: due,
            assign_ids: (assign_ids.length ? assign_ids : 0)
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            var task, li;
            if (!task_id) {
                task = data.task;
                task.list = list;
                list.taskmap[task.id] = task;
                list.doc.tasks.push(task);
                li = app.renderTask(list, task);
            }
            else {
                task = $.extend(app.listmap[list.id].taskmap[data.task.id], data.task);
                task.list = list;
                var li = app.createTaskElement(list, task);
                // console.log(li);
                // li.effect("highlight", {}, c.SPEED);
            }
            if (!app.current_filter.call(app, null, task)) {
                app.taskli[list.id + '-' + task.id].delay(500).slideUp('slow');
            }
            app.renderBadge(list);
        }
    });
}
function submitClearTrash(form) {
    var list_id = form.data('list-id');
    var list = this.listmap[list_id];
    var owner_id = this.findMeFromList(list);
    return this.ajax({
        type: 'post',
        url: '/api/1/list/clear',
        data: {
            list_id: list_id,
            owner_id: owner_id
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            var list = app.listmap[list_id];
            var tasks = [];
            for (var i = 0; i < list.doc.tasks.length; i++) {
                var task = list.doc.tasks[i];
                if (task.closed) {
                    app.taskli[list.id + '-' + task.id].remove();
                    delete list.taskmap[task.id];
                } else {
                    tasks.push(task);
                }
            }
            list.doc.tasks = tasks;
        }
        form.fadeOut(c.SPEED);
        var li = $('#closed-task-switch');
        if (!li.data('closed')) {
            app.switchClosedClick({
                currentTarget: li
            });
        }
    });
}
function resetCreateTask(form) {
    form.find('input[type=text], textarea').val('');
    $('#create-task-assign').find('input[type=checkbox].').attr('checked', false);
}

// MainContents
function registAssign(friends) {
    for (var i = 0, max = friends.length; i < max; i++) {
        var friend = friends[i];
        this.friends['@' + friend.screen_name] = friend;
        this.friend_ids['tw-' + friend.user_id] = friend;
        var label = this.createAssignLabel(friend);
        this.assign.push({
            value: '@' + friend.screen_name,
            label: label
        });
    }
}
function createAssignLabel(friend) {
    var url = this.getTwitterProfileImageUrl(friend.screen_name);
    var html =
        '<span><img class="twitter_profile_image" src="'
        + url
        + '">'
        + friend.screen_name
        + '</span>';
    return html;
}
function createAssignList(friend) {
    var del = $('<span class="icon icon-delete"></span>');
    var li =
        $('<li></li>')
        .append(this.createAssignLabel(friend))
        .data('id', 'tw-' + friend.user_id)
        .data('code', '@' + friend.screen_name)
        .attr('class', 'member')
        .append(del);
    del.click(function(){li.remove()});
    return li;
}
function renderTask(list, task) {
    var li = this.createTaskElement(list, task);
    app.parts.tasks.prepend(li);
    this.updateCounter(null, task);
    return li;
}
function createTaskElement(list, task) {
    var li = $(app.template.task);
    li.data('list-id', list.id);
    li.data('id', task.id);
    li.data('updated', task.updated);
    var due_epoch = 0;
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
        var due = new Date(mdy[2], mdy[0] - 1, mdy[1]);
        due_epoch = due.getTime();
        if (now.getTime() > due_epoch) {
            li.find('.due').addClass('over');
        }
    } else {
        li.find('.due').text('-');
    }
    li.data('due', due_epoch);
    if (task.comments.length) {
        li.find('.comments').text('(' + task.comments.length + ')');
    }
    if (list.id in this.account.state.sort.task) {
        var sort = this.account.state.sort.task[list.id];
        if (task.id in sort) {
            li.data('sort', sort[task.id]);
        } else {
            li.data('sort', 0);
        }
    }
    li.find('.title').text(task.title);
    var responser;
    if ("requester_id" in task) {
        $('<img data-init="guide" data-guide-en="Requester" data-guide-ja="依頼者"/>')
            .attr('src', app.getProfileImageUrl(task.requester_id))
            .addClass('twitter_profile_image')
            .appendTo(li.find('.assign'))
        li.data('requester-id', task.requester_id);
        responser = [task.requester_id];
    }
    if (task.assign_ids.length) {
        li.find('.assign').prepend($('<span class="icon icon-left"/>'));
        for (var i = 0; i < task.assign_ids.length; i++) {
            var assign_id = task.assign_ids[i];
            var url = app.getProfileImageUrl(assign_id);
            var img = $('<img data-init="guide" data-guide-en="Assignee" data-guide-ja="担当者"/>')
                .attr('src', url)
                .addClass('twitter_profile_image');
            li.find('.assign').prepend(img);
        }
        responser = task.assign_ids;
    }
    if (task.status === 2 && task.assign_ids.length) {
        var url = app.getProfileImageUrl(task.requester_id);
        var img = $('<img data-init="guide" data-guide-en="Approver" data-guide-ja="承認者"/>')
            .attr('src', url)
            .addClass('twitter_profile_image');
        li.find('.assign').prepend($('<span class="icon icon-left"/>')).prepend(img);
        responser = [task.requester_id];
    }
    li.data('responser-ids', responser.sort().join(','));
    li.mouseover(function(){
        if (app.active === 'comment') {
            return;
        }
        if (app.current_taskli) {
            app.current_taskli.removeClass('selected');
        }
        app.current_task = task;
        app.current_taskli = li;
        li.addClass('selected');
        $('#list-name').text(list.doc.name);
        $('#task-name').text(task.title);
        if (task.description) {
            $('#task-description').text(task.description);
        } else {
            $('#task-description').text('');
        }
        app.parts.commentbox
            .attr('disabled', false)
            .data('list-id', list.id)
            .data('task-id', task.id);
        app.parts.comment.empty();
        if (task.comments) {
            for (var i = 0, max_i = task.comments.length; i < max_i; i++) {
                var comment = task.comments[i];
                app.renderComment(list.id, task.id, comment);
            }
        }
        app.parts.comment.scrollTop(app.parts.comment.height());
        app.commentHeightResize();
    });
    li.find('.grip').hover(function(e){
        if (app.parts.tasks.hasClass('sortable')) {
            li.removeAttr('draggable');
        } else {
            li.attr('draggable', true);
        }
    }, function(e){
        li.removeAttr('draggable');
    });
    li.removeAttr('draggable');
    if (task.status === 1) {
        li.find('> .icon-tasks-off')
        .removeClass('icon-tasks-off')
        .addClass('icon-progress');
    }
    else if (task.status === 2) {
        li.find('> .icon-tasks-off')
        .removeClass('icon-tasks-off')
        .addClass('icon-tasks-on');
    }
    if (task.closed) {
        li.addClass('delete');
        li.find('> .icon-delete').hide();
        li.hide();
    } else {
        li.find('> .icon-recycle').hide();
    }
    if (list.id + ':' + task.id in this.account.state.watch) {
        li.find('> .icon-star-off')
        .removeClass('icon-star-off')
        .addClass('icon-star-on');
        task.star = true;
    }
    app.initElements(li);
    li.get(0).addEventListener('dragstart', function(e){
        app.dragging = true;
        app.parts.guide.hide();
        app.parts.listnav.show('drop', {}, c.SPEED);
        e.dataTransfer.setData('Text', list.id + ':' + task.id);
        app.dragtask = task;
    }, false);
    li.get(0).addEventListener('dragend', function(e){
        if (app.dragging) {
            app.dragging = false;
            app.parts.listnav.hide('drop', {}, c.SPEED);
            e.dataTransfer.clearData();
        }
    }, false);
    var key = list.id + '-' + task.id;
    if (key in app.taskli) {
        app.taskli[key].after(li);
        app.taskli[key].remove();
        app.taskli[key] = li;
    } else {
        app.taskli[key] = li;
    }
    return li;
}
function taskActionClick(e) {
    e.stopPropagation();
    var div = $(e.currentTarget);
    var li = div.parent();
    var list_id = li.data('list-id');
    var task_id = li.data('id');
    var list = app.listmap[list_id];
    var task = list.taskmap[task_id];
    var registrant_id = this.findMeFromList(list);
    if (!registrant_id) {
        alert("can't find registrant_id.");
        return;
    }
    if (div.hasClass('icon-delete')) {
        li.addClass('delete');
        div.hide();
        li.find('> .icon-recycle').show();
        this.modifyTask({
            registrant_id: registrant_id,
            list_id: list_id,
            task_id: task_id,
            closed: 1
        });
        li.slideUp(c.SPEED);
    }
    else if (div.hasClass('icon-recycle')) {
        li.removeClass('delete');
        div.hide();
        li.find('> .icon-delete').show();
        this.modifyTask({
            registrant_id: registrant_id,
            list_id: list_id,
            task_id: task_id,
            closed: 0
        });
        li.slideUp(c.SPEED);
    }
    else if (div.hasClass('icon-tasks-off')) {
        li.removeClass('delete');
        li.find('.icon-recycle').removeClass('icon-recycle').addClass('icon-delete');
        div.removeClass('icon-tasks-off');
        div.addClass('icon-progress');
        this.modifyTask({
            registrant_id: registrant_id,
            list_id: list_id,
            task_id: task_id,
            status: 1
        });
    }
    else if (div.hasClass('icon-progress')) {
        li.removeClass('delete');
        li.find('.icon-recycle').removeClass('icon-recycle').addClass('icon-delete');
        div.removeClass('icon-progress');
        div.addClass('icon-tasks-on');
        this.modifyTask({
            registrant_id: registrant_id,
            list_id: list_id,
            task_id: task_id,
            status: 2
        });
    }
    else if (div.hasClass('icon-tasks-on')) {
        li.removeClass('delete');
        li.find('.icon-recycle').removeClass('icon-recycle').addClass('icon-delete');
        div.removeClass('icon-tasks-on');
        div.addClass('icon-tasks-off');
        this.modifyTask({
            registrant_id: registrant_id,
            list_id: list_id,
            task_id: task_id,
            status: 0
        });
    }
    else if (div.hasClass('icon-star-on')) {
        div.removeClass('icon-star-on').addClass('icon-star-off');
        delete this.account.state.watch[list_id + ':' + task_id];
        this.updateAccount({
            ns: 'state',
            method: '-',
            key: 'watch',
            val: list_id + ':' + task_id
        });
        var oldtask = $.extend({}, task);
        task.star = false;
        this.updateCounter(oldtask, task);
    }
    else if (div.hasClass('icon-star-off')) {
        div.removeClass('icon-star-off').addClass('icon-star-on');
        this.account.state.watch[list_id + ':' + task_id] = 1;
        this.updateAccount({
            ns: 'state',
            method: '+',
            key: 'watch',
            val: list_id + ':' + task_id
        });
        var oldtask = $.extend({}, task);
        task.star = true;
        this.updateCounter(oldtask, task);
    }
    else if (div.hasClass('icon-edit') || div.hasClass('due')) {
        this.openClick(e, div);
    }
    else if (div.hasClass('assign')) {
        this.openClick(e, div);
    }
    
    var filter = this.tasksFilterGenerate();
    if (!filter.call(app, li)) {
        li.slideUp(c.SPEED);
    }
}
function submitComment() {
    
    var list_id = app.parts.commentbox.data('list-id');
    var task_id = app.parts.commentbox.data('task-id');
    var comment = app.parts.commentbox.val();
    
    var list = this.listmap[list_id];
    var owner_id = this.findMeFromList(list);
    return this.ajax({
        type: 'post',
        url: '/api/1/comment/create',
        data: {
            list_id: list_id,
            task_id: task_id,
            owner_id : owner_id,
            comment: comment
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            // FIXME
            $.extend(app.listmap[list_id].taskmap[data.task.id], data.task);
            app.taskli[list_id + '-' + data.task.id].data('updated', data.task.updated);
            app.taskli[list_id + '-' + data.task.id].find('.comments').text('(' + data.task.comments.length + ')');
            var li = $('<li/>');
            li.text(comment);
            app.renderComment(list_id, task_id, {
                id: data.comment_id,
                time: (new Date()).getTime(),
                owner_id: owner_id,
                comment: comment
            });
            app.parts.commentbox.val('').css('height', '16px');
        }
    });
}
function renderComment(list_id, task_id, comment) {
    var li = $('<li class="clearfix"/>');
    if (!comment.owner_id) {
        console.log(comment);
    }
    var friend = this.friend_ids[comment.owner_id];
    var img = $('<img>').attr('src', friend.profile_image_url);
    var msg = $('<div/>');
    var name = $('<span class="name"></span>').text(friend.screen_name);
    var date = $('<span class="date"></span>').text(c.timestamp(comment.time));
    var message = $('<span class="comment"/>').html(c.autoLink(comment.comment));
    var del = $('<span class="action icon icon-delete"></span>');
    del.click(function(e){
        e.stopPropagation();
        app.deleteComment(list_id, task_id, comment);
        li.remove();
        // app.parts.commentbox.focus();
    });
    li.append(img);
    li.append(msg);
    msg.append(name);
    msg.append(message);
    msg.append($('<br>'));
    msg.append(date);
    msg.append(del);
    if (this.listReadLastTime(list_id) < comment.time) {
        li.addClass('unread');
        // this.unread_comment_count++;
    }
    app.parts.comment.append(li);
}
function deleteComment(list_id, task_id, comment) {
    var list = this.listmap[list_id];
    var owner_id = this.findMeFromList(list);
    return this.ajax({
        type: 'post',
        url: '/api/1/comment/delete',
        data: {
            owner_id: owner_id,
            list_id: list_id,
            task_id: task_id,
            comment_id: comment.id
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            // FIXME
            $.extend(app.listmap[list_id].taskmap[data.task.id], data.task);
            if (data.task.comments.length) {
                app.taskli[list_id + '-' + data.task.id].find('.comments').text('(' + data.task.comments.length + ')');
            } else {
                app.taskli[list_id + '-' + data.task.id].find('.comments').text('');
            }
        }
    });
}
function renderMember(id) {
    var url = this.getProfileImageUrl(id);
    var li = $(document.createElement('li'));
    var img = $(document.createElement('img'));
    img.attr('src', url);
    li.attr('class', 'twitter_profile_image');
    li.append(img);
    li.data('member-id', id);
    li.data('url', url);
    li.data('bind', 'open');
    li.data('id', 'create-task-window');
    li.data('callback', 'createTaskWithMember');
    li.get(0).addEventListener("click", this, false);
    app.parts.listmembers.append(li);
}

})(this, this, document);
