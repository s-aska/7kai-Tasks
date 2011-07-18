(function(ns, w, d) {

var w = $(w);

var app = {
    
    // 定数
    token_name: 'csrf_token',
    url_re: new RegExp('(?:https?://[\\x21-\\x7e]+)', 'g'),
    valid: {
        list_name_max_length: 20
    },
    speed: 'fast',
    filters: [
        'list-timeline',
        'list-comment',
        'list-all',
        'list-todo',
        'list-request',
        'list-watch'
    ],
    template: {},
    localizer: null,
    counters: [],
    
    // データ
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
    cond: {},
    sort: null,
    unread_comment_count: 0,
    notifications: [],
    busy: false,
    
    // 初期化系
    run: run,
    initParts: initParts,
    initEvent: initEvent,
    initEventGuide: initEventGuide,
    initCounter: initCounter,
    initWindow: initWindow,
    initAccount: initAccount,
    
    // イベント
    handleEvent: handleEvent,
    windowResizeEvent: windowResizeEvent,
    commentHeightResize: commentHeightResize,
    
    // General
    ajax: ajax,
    ajaxFailure: ajaxFailure,
    message: message,
    statusUpdate: statusUpdate,
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
    switchFilterList: switchFilterList,
    switchClosed: switchClosed,
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
    clickStatebleCheckbox: clickStatebleCheckbox,
    timestamp: timestamp,
    updateCounter: updateCounter,
    resetCounter: resetCounter,
    autoLink: autoLink,
    needNotification: needNotification,
    notificationCheck: notificationCheck,
    notificationCheckDone: notificationCheckDone,
    
    // GrobalMenu
    clickOpenButton: clickOpenButton,
    clickSignInTwitter: clickSignInTwitter,
    clickSyncTwitterContact: clickSyncTwitterContact,
    clickAccountSync: clickAccountSync,
    clickRefresh: clickRefresh,
    clickGuideSwitch: clickGuideSwitch,
    
    // SideMenu
    clickListDisplaySwitch: clickListDisplaySwitch,
    clickListBadgeSwitch: clickListBadgeSwitch,
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
    tasksRequestFilter: tasksRequestFilter,
    clickTaskmenuSort: clickTaskmenuSort,
    clickTaskmenuSwitch: clickTaskmenuSwitch,
    clickTaskmenuFilter: clickTaskmenuFilter,
    clickTaskmenuTrash: clickTaskmenuTrash,
    clickCreateTaskDuePlus: clickCreateTaskDuePlus,
    clickCreateTaskDuePlusMonth: clickCreateTaskDuePlusMonth,
    clickCreateTaskDueMinus: clickCreateTaskDueMinus,
    clickCreateTaskDueDelete: clickCreateTaskDueDelete,
    clickCreateTaskDueToday: clickCreateTaskDueToday,
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
    clickTaskAction: clickTaskAction,
    submitComment: submitComment,
    deleteComment: deleteComment,
    renderComment: renderComment,
    renderMember: renderMember
    
};

$(d).ready(function() {
    var localizer = new Localizer();
    if (localizer.lang != 'en') {
      localizer.localize();
    }
    app.localizer = localizer;
    app.run();
});

// Init
function run() {
    
    if (typeof window.console !== 'object') {
        console = {
            log: function(){}
        };
    }
    this.lang = $('html').attr('lang');
    this.token = $('input[name=' + this.token_name + ']:first').val();
    if (
        (navigator.userAgent.indexOf('Chrome') != -1) ||
        (navigator.userAgent.indexOf('Safari') != -1)
    ) {
        this.is_webkit = true;
    }
    
    this.initParts();
    this.initEvent();
    this.initCounter();
    this.initWindow();
    this.initAccount();
}
function initParts() {
    this.parts.header      = $('body > header');
    this.parts.aside       = $('body > div > aside');
    this.parts.article     = $('body > div > article');
    this.parts.right       = $('body > div > div');
    this.parts.comment     = $('body > div > div > ul');
    this.parts.footer      = $('body > footer');
    
    this.parts.badge       = $('#notification-badge');
    
    this.parts.status      = this.parts.header.find('p');
    
    this.parts.sidemenu    = this.parts.aside.find('> header');
    this.parts.listnav     = this.parts.aside.find('> header > ul');
    this.parts.lists       = this.parts.listnav;
    this.parts.listname    = this.parts.aside.find('#current-list-name');
    this.parts.listmembers = this.parts.aside.find('#list-members');
    this.parts.listmenu    = this.parts.aside.find('> article li.action');
    this.parts.listonly    = this.parts.aside.find('[data-listonly]');
    this.parts.listsort    = this.parts.aside.find('> article ul.sort');
    
    this.parts.infomation  = $('#infomation');
    
    this.parts.tasks       = this.parts.article.find('> section > ul.task');
    this.parts.timeline    = this.parts.article.find('> section > ul.timeline');
    
    this.parts.lswt        = $('#list-settings-window table');
    this.parts.owners      = $('#create-list-window select[name=owner]');
    this.parts.guide       = $('#guide');
    this.parts.commentform = $('#comment-box');
    this.parts.commentbox  = $('#comment-box textarea');
    
    this.parts.connectacs  = $('#connect-accounts');
    
    this.template.task     = this.parts.tasks.html();
    this.template.assign   = $('#create-task-assign').html();
    
    this.offset.commment   = $('body > div > div').offset();
}
function initEvent() {
    // var app = this;
    
    /* window */
    w.resize($.proxy(this.windowResizeEvent, this));
    
    this.initEventGuide($(d));
    
    /* header */
    $('.pulldown').each(function(i, ele){
        var pulldown = $(ele);
        var menu = pulldown.find('> .pulldown-menu');
        var timer;
        pulldown.hover(function(){
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
            menu.slideDown(app.speed);
        }, function(){
            timer = setTimeout(function(){
                menu.slideUp(app.speed);
            }, 500);
        });
    });
    
    
    
    /* aside */
    (function(){
        var timer;
        app.parts.sidemenu.hover(function(){
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
            if (app.parts.listnav.css('display') === 'none') {
                app.parts.listnav.show('drop', {}, app.speed);
            }
        }, function(){
            if (!app.dragging) {
                timer = setTimeout(function(){
                    app.parts.listnav.hide('drop', {}, app.speed);
                }, 500);
            }
        });
    })();
    
    $('button, a, span.action, li.action, input[data-method]').each(function(i, ele){
        ele.addEventListener("click", app, false);
    });
    
    this.parts.tasks.sortable({
        handle: 'div.grip',
        cursor: 'url(/static/img/openhand.cur), move',
        start: function (e, ui) {
            app.dragging = true;
            app.parts.guide.hide();
        },
        stop: function (e, ui) {
            app.dragging = false;
        },
        update: function(e, ui) {
            app.sortUpdateTask();
        }
    });
    
    this.parts.lists.sortable({
        cursor: 'url(/static/img/openhand.cur), move',
        start: function (e, ui) {
            app.dragging = true;
            app.parts.guide.hide();
        },
        stop: function (e, ui) {
            app.dragging = false;
        },
        update: function(e, ui) {
            app.sortUpdateList();
        }
    });
    
    // Modal Window
    $('form.modal').each(function(i, ele){
        var form = $(ele);
        form.find('button.cancel').click(function(){
            form.hide('drop');
            return false;
        });
        form.find('input[type=text]:first').keydown(function(e){
            if (e.keyCode == 27) {
                if (e.shiftKey) {
                    var reset = form.data('reset');
                    if (reset) {
                        app[reset].call(this, form);
                    } else {
                        form.find('*[data-no-keep=1]').val('');
                        form.find('input[type=text]:first').get(0).focus();
                    }
                } else {
                    document.activeElement.blur();
                    form.hide('drop');
                }
            }
        });
        form.bind('submit', function(){
            // form.find('input:first').val('').get(0).focus();
            
            var submit = form.data('submit');
            if (submit) {
                app[submit].call(app, form);
            }
            // FIXME: keep
            
            return false;
        });
        app.modals[form.attr('id')] = form;
        // form.disableSelection();
        // form.draggable();
        form.draggable({ handle: 'h1' });
        form.find('footer input[type=checkbox]').click($.proxy(app.clickStatebleCheckbox, app));
    });
    $('form.fillin').each(function(i, ele){
        var form = $(ele);
        form.find('button.cancel').click(function(){
            form.find('input[type=text]:first').val('');
            form.find('> div').slideUp(app.speed);
            return false;
        });
        form.find('input[type=text]:first').keydown(function(e){
            if (e.keyCode == 27) {
                if (e.shiftKey) {
                    var reset = form.data('reset');
                    if (reset) {
                        app[reset].call(this, form);
                    } else {
                        form.find('*[data-no-keep=1]').val('');
                        form.find('input[type=text]:first').get(0).focus();
                    }
                } else {
                    document.activeElement.blur();
                    form.find('> div').slideUp(app.speed);
                }
            }
        });
        form.bind('submit', function(){
            var submit = form.data('submit');
            if (submit) {
                app[submit].call(app, form);
            }
            return false;
        });
        app.modals[form.attr('id')] = form;
    });
    
    // Create Task Window
    var datepicker_option = {};
    if (this.lang === 'ja') {
        datepicker_option.dateFormat = 'yy/mm/dd';
        var ymd = $.datepicker.formatDate('yy/mm/dd', new Date());
        $('#create-task-date').attr('placeholder', ymd);
    }
    $('#create-task-date').datepicker(datepicker_option);
    
    $('#create-task-date-controller').disableSelection();
    
    var bindAutocomplete = function(selector, prependTo){
        selector.autocomplete({
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
        selector.bind('autocompleteclose', function(event, element){
    	    selector.val('');
    	});
    };
    bindAutocomplete.call(this, $('#create-list-members-input'), $('#create-list-members'));
    
    document.getElementById('extentionsEventDiv').addEventListener('extentionsEvent', function() {
        var eventText = document.getElementById('extentionsEventDiv').innerText;
        var eventData = JSON.parse(eventText);
        app[eventData.method].apply(app, eventData.arguments);
    }, false);
    
    $(document).keypress(function(e){
        if (e.shiftKey || e.ctrlKey) {
            return true;
        }
        if (document.activeElement.tagName === 'BODY') {
            if (e.keyCode === 99) { // c
                $('#create-task-button').click();
                return false;
            } else if (e.keyCode === 114) { // r
                // app.refresh();
                app.notificationCheck();
            }
        }
        return true;
    });
    
    this.parts.commentbox.attr('disabled', true);
    this.parts.commentbox.keydown(function(e){
        if (e.keyCode === 13 && !e.shiftKey) {
            e.stopPropagation();
            e.preventDefault();
            if (app.parts.commentbox.val().length) {
                app.submitComment();
            }
        } else if (e.keyCode === 27) {
            app.parts.commentbox.blur();
        }
    });
    this.parts.commentbox.autogrow({single: true});
    this.parts.commentbox.focus(function(){
        app.parts.commentform.val('');
    }).blur(function(){
        app.parts.commentform.slideUp(app.speed, function(){
            app.parts.commentbox.val('');
        });
    });
    
    
    var timer;
    this.parts.badge.hover(function(){
        // if (timer) {
        //     clearInterval(timer);
        // }
        // var ul = app.parts.badge.find('> div');
        // ul.slideDown(app.speed);
        if (app.parts.badge.find('> span').hasClass('active')) {
            app.parts.badge.find('> span').removeClass('active').text(0);
            app.account.state.last_history_time = (new Date()).getTime();
            app.updateAccount({
                ns: 'state',
                method: 'set',
                key: 'last_history_time',
                val: app.account.state.last_history_time
            });
        }
    }, function(){
        // timer = setTimeout(function(){
        //     app.parts.badge.find('> div').slideUp(app.speed);
        // }, 1000);
    });
    
}
function initEventGuide(ele) {
    // var app = this;
    ele.find('*[data-guide-' + app.lang + ']').each(function(i, ele){
        var ele = $(ele);
        var msg = ele.data('guide-' + app.lang);
        ele.hover(function(){
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
    });
}
function initCounter() {
    // var app = this;
    this.parts.infomation.find('li').each(function(i, ele){
        var li = $(ele);
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
    });
}
function initWindow() {
    
    this.windowResizeEvent();
    
    // アカウント情報の取得
    
    // Twitter Contact List の初期化
    
    // リスト取得、無い場合作成
    // aside構築
    // article構築
    
    
    
    
    
}
function initAccount() {
    // var app = this;
    this.refresh();
    setTimeout(function(){
        app.notificationCheck(true);
    }, 60 * 1000);
}

// Event
function handleEvent(e) {
    var ele = $(e.currentTarget);
    if (ele.data('method')) {
        e.stopPropagation();
    }
    switch (ele.data('method')) {
    case 'guideSwitch':
        this.clickGuideSwitch(e, ele);
        break;
    case 'taskmenuSort':
        this.clickTaskmenuSort(e, ele);
        break;
    case 'taskmenuSwitch':
        this.clickTaskmenuSwitch(e, ele);
        break;
    case 'taskmenuFilter':
        this.clickTaskmenuFilter(e, ele);
        break;
    case 'open':
        this.clickOpenButton(e, ele);
        break;
    case 'syncTwitterContact':
        this.clickSyncTwitterContact(e, ele);
        break;
    case 'accountSync':
        this.clickAccountSync(e, ele);
        break;
    case 'refresh':
        this.clickRefresh(e, ele);
        break;
    case 'signinTwitter':
        this.clickSignInTwitter(e, ele);
        break;
    case 'createTaskDuePlus':
        this.clickCreateTaskDuePlus(e, ele);
        break;
    case 'createTaskDuePlusMonth':
        this.clickCreateTaskDuePlusMonth(e, ele);
        break;
    case 'createTaskDueMinus':
        this.clickCreateTaskDueMinus(e, ele);
        break;
    case 'createTaskDueDelete':
        this.clickCreateTaskDueDelete(e, ele);
        break;
    case 'createTaskDueToday':
        this.clickCreateTaskDueToday(e, ele);
        break;
    case 'listDisplaySwitch':
        this.clickListDisplaySwitch(e, ele);
        break;
    case 'listBadgeSwitch':
        this.clickListBadgeSwitch(e, ele);
        break;
    case 'switchFilterList':
        this.switchFilterList(e);
        break;
    case 'switchClosed':
        this.switchClosed(e);
        break;
    case 'showTimeline':
        this.showTimeline(e);
        break;
    }
}
function windowResizeEvent() {
    // FIXME: スクロールが発生した場合にボタンを有効化する
    var w_height = w.height();
    var h_height = this.parts.footer.height();
    if (h_height > 0) {
        h_height+= 8;
    }
    $('body > div > aside > header > ul').height(w_height - h_height - 70);
    $('body > div > aside').height(w_height - h_height - 35);
    $('body > div > article > section').height(w_height - h_height - 93 + 17);
    $('body > div > div').width(w.width() - this.offset.commment.left - 24);
    this.commentHeightResize();
}
function commentHeightResize() {
    var w_height = w.height();
    var h_height = this.parts.footer.height();
    if (h_height > 0) {
        h_height+= 8;
    }
    $('body > div > div > ul').height(w_height - h_height - $('body > div > div > ul').offset().top - 19);
}

// General
function ajax(option) {
    //this.statusUpdate('ajax: begin url=' + option.url);
    option.error = $.proxy(this.ajaxFailure, this);
    if ("data" in option && "type" in option && option.type.toLowerCase() === 'post') {
        option.data[this.token_name] = this.token;
        option.data["request_time"] = (new Date()).getTime();
    }
    return $.ajax(option);
}
function ajaxFailure(jqXHR, textStatus, errorThrown) {
    this.statusUpdate('ajax error: ' + jqXHR.status + ' ' + errorThrown);
}
function message(message) {
    alert(message);
}
function statusUpdate(message) {
    // this.parts.status.text(message);
    // this.parts.console.prepend($(document.createElement('li')).text(message));
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
    // var app = this;
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
            app.statusUpdate('sync contact list '
            + screen_name + ' ' + data.sync_count + '/' + data.friends_count);
            app.registAssign(data.friends);
            $.merge(app.account.tw[user_id].friends, data.friends);
            if (data.next_cursor) {
                app.syncTwitterContact(user_id, data.next_cursor, screen_name);
            } else {
                app.statusUpdate('sync contact list ' + screen_name + ' fin.');
                app.refresh();
            }
        }
    });
}
function lookupUnknownMembers(unknownMembers, callback) {
    // var app = this;
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
        }
    });
}
function updateAccount(params, refresh) {
    // var app = this;
    return this.ajax({
        type: 'post',
        url: '/api/1/account/update',
        data: params,
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            app.statusUpdate('update a account.');
            if (refresh) {
                app.refresh();
            }
        }
    });
}
function refresh(option) {
    // var app = this;
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
            app.parts.lswt.find('.project').remove();
            
            app.unread_comment_count = 0;
            var lists = app.account.lists;
            
            var humanmap = {};
            var unknownCheck = function(id){
                if (!(id in app.friend_ids) && !(id in humanmap)) {
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
                    app.parts.lists.find('> li[data-list-id="' + id + '"]:first').click();
                    if (option.select_task_id) {
                        var taskli = app.taskli[id + '-' + option.select_task_id];
                        var display = taskli.css('display');
                        if (taskli) {
                            if (display === 'none') {
                                taskli.removeClass('delete');
                            }
                            taskli.effect("highlight", {}, 3000, function(){
                                if (display === 'none') {
                                    taskli.slideUp(app.speed, function(){
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
                    app.parts.lists.find('li.project:first').click();
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
    // var app = this;
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
    // var app = this;
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
        var date = $('<span class="date"/>').text(app.timestamp(history.date));
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
    // var app = this;
    var li = this.listli[id];
    var list = this.listmap[id];
    this.cond = $.extend({}, this.cond_default);
    this.cond.list_id = id;
    this.current_list = list;
    this.current_filter = null;
    $('#closed-task-switch').removeClass('selected');
    this.parts.listname.text(list.doc.name);
    this.parts.listmenu.data('list-id', id);
    this.parts.listmembers.empty();
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
    this.showList(id);
    this.parts.listonly.show();
}
function switchFilterList(e) {
    // var app = this;
    var li = $(e.currentTarget);
    var pli = li.parent().parent().parent().find('> span.action:first');
    var listname = li.text();
    if (pli.length) {
        listname = pli.text();
    }
    this.cond = $.extend({}, this.cond_default);
    for (var key in this.cond) {
        var val = li.data(key.replace('_', '-'));
        if (typeof val !== 'undefined') {
            this.cond[key] = val;
        }
    }
    if (!this.cond.list_id) {
        this.parts.listonly.hide();
        this.parts.listname.text(listname);
        this.current_list = null;
    }
    this.filterTask();
}
function switchClosed(e) {
    this.switchFilterList(e);
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
    // var app = this;
    var badge = $('<span class="badge"></span>');
    var li = $('<li data-list-id="' + list.id + '"></li>');
    li.attr('class', 'project');
    li.text(list.doc.name);
    li.append(badge);
    this.listmap[list.id] = list;
    this.listli[list.id] = li;
    li.click($.proxy(app.switchList, app));
    list.taskmap = {};
    for (var j = 0; j < list.doc.tasks.length; j++) {
        list.doc.tasks[j].list = list;
        list.taskmap[list.doc.tasks[j].id] = list.doc.tasks[j];
    }
    list.badge = badge;
    this.renderBadge(list);
    
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
        app.parts.listnav.hide('drop', {}, app.speed);
        var data = e.dataTransfer.getData('Text').split(':');
        app.moveTask(data[1], data[0], list.id)
    }, false);
    
    var old = this.parts.lists.find('li[data-list-id="' + list.id + '"]');
    if (old.length) {
        if (old.hasClass('selected')) {
            old.replaceWith(li);
            // li.click();
            this.showList(list.id);
        } else {
            old.replaceWith(li);
        }
    } else {
        this.parts.lists.append(li);
        var tasks = list.doc.tasks;
        for (var i = 0; i < tasks.length; i++) {
            var li = this.renderTask(list, tasks[i]);
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
    var my_order = this.isMe(task.registrant_id);
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
    // var app = this;
    
    // sidebar
    var lis = [];
    this.parts.lists.find('> li').each(function(i, ele) {
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
        lis[i].appendTo(this.parts.lists);
    }
    
    // list setting window
    var trs = [];
    this.parts.lswt.find('tr[data-list-id]').each(function(i, ele) {
        trs.push($(ele));
    });
    trs.sort(function(a, b) {
        return val(b) - val(a);
    });
    for (var i = 0; i < trs.length; i++) {
        trs[i].appendTo(this.parts.lswt);
    }
}
function sortUpdateList() {
    var sort = {};
    var lists = this.parts.lists.find('> li');
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
    // var app = this;
    return this.ajax({
        type: 'post',
        url: '/api/1/task/update',
        data: params,
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            app.statusUpdate('update a task.');
            var oldtask = $.extend({}, app.listmap[params.list_id].taskmap[data.task.id]);
            var newtask = $.extend(app.listmap[params.list_id].taskmap[data.task.id], data.task);
            app.renderBadge(app.listmap[params.list_id]);
            app.taskli[params.list_id + '-' + data.task.id].data('updated', data.task.updated);
            app.updateCounter(oldtask, newtask);
        }
    });
}
function moveTask(task_id, src_list_id, dst_list_id) {
    // var app = this;
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
            app.statusUpdate('move a task.');
            
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
                li.slideUp(app.speed);
            } else {
                if (app.current_filter.call(app, li)) {
                    li.slideDown(app.speed);
                } else {
                    li.slideUp(app.speed);
                }
            }
            
        }
    });
}
function deleteTask(params) {
    
}
function filterTask() {
    // var app = this;
    var filter = this.tasksFilterGenerate();
    this.current_filter = filter;
    // this.parts.timeline.hide();
    // this.parts.tasks.show();
    this.parts.tasks.find('> li').each(function(i, ele){
        var ele = $(ele);
        if (filter(ele)) {
            if (app.is_webkit) {
                ele.slideDown(app.speed);
            } else {
                ele.show();
            }
            // if (readComment) {
            //     app.readComment(ele);
            // }
        } else {
            if (app.is_webkit) {
                ele.slideUp(app.speed);
            } else {
                ele.hide();
            }
        }
    });
    this.renderCommentBadge();
}
function readComment(li) {
    // var app = this;
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
    this.parts.tasks.find('> li').each(function(i, ele) {
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
        this.parts.tasks.sortable("enable");
        this.parts.tasks.addClass('sortable');
    } else {
        this.parts.tasks.sortable("disable");
        this.parts.tasks.removeClass('sortable');
    }
    for (var i = 0; i < lis.length; i++) {
        lis[i].appendTo(this.parts.tasks);
    }
}
function sortUpdateTask() {
    var list_id = this.current_list.id;
    var task_ids = [];
    var task_ids_sort = [];
    var sort = {};
    this.parts.tasks.find('> li').each(function(i, ele) {
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
function clickStatebleCheckbox(e) {
    var ele = $(e.currentTarget);
    var val = ele.attr('checked') ? 1 : 0;
    this.updateAccount({
        ns: 'state.checkbox',
        method: 'set',
        key: ele.attr('id'),
        val: val
    })
}
function timestamp(epoch) {
    var now = new Date();
    var now_epoch = parseInt(now.getTime() / 1000);
    if (epoch > now_epoch) {
        epoch = parseInt(epoch / 1000);
    }
    var diff = now_epoch - epoch;
    if (diff < 60) {
        var s = diff > 1 ? 's' : '';
        return diff + ' sec' + s + ' ago';
    } else if (diff < 3600) {
        var min = parseInt(diff / 60);
        var s = min > 1 ? 's' : '';
        return min + ' minute' + s + ' ago';
    } else if (diff < (3600 * 24)) {
        var hour = parseInt(diff / 3600);
        var s = hour > 1 ? 's' : '';
        return hour + ' hour' + s + ' ago';
    } else {
        var day = parseInt(diff / (3600 * 24));
        var s = day > 1 ? 's' : '';
        return day + ' day' + s + ' ago';
    }
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
function autoLink(text) {
    return text.replace(this.url_re, function(url){
        var a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.appendChild(document.createTextNode(url));
        var div = document.createElement('div');
        div.appendChild(a);
        return div.innerHTML;
    });
}
function showNotifications() {
    
}

// GrobalMenu
function clickOpenButton(e, ele) {
    // var app = this;
    var form = this.modals[ele.data('id')];
    if (form.css('display') === 'none') {
        $('#create-task-assign').hide();
        form.show('drop', {}, app.speed, function(){
            var input = form.find('input[type=text]:first');
            if (input.length) {
                input.get(0).focus();
            }
            var callback = ele.data('callback');
            if (callback) {
                var func = callback.charAt(0).toUpperCase() + callback.substr(1);
                app['openCallback' + func].call(app, e, ele);
            }
        });
    }
}
function clickSignInTwitter(e, ele) {
    location.href = '/signin/twitter/oauth';
}
function clickSyncTwitterContact(e, ele) {
    // var app = this;
    
    // FIXME: statusbar update
    this.statusUpdate('sync contact list begin.');
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
function clickAccountSync(e, ele) {
    // // var app = this;
    // 
    // return this.ajax({
    //     type: 'get',
    //     url: '/api/1/account/',
    //     dataType: 'json'
    // })
    // .done(function(data){
    //     if (data.success) {
    //         app.account = data.doc;
    //         
    //         app.assign = [];
    //         for (user_id in data.doc.tw) {
    //             app.registAssign(data.doc.tw[user_id].friends);
    //         }
    //         console.log(app.account);
    //     }
    // });
}
function clickRefresh(e, ele) {
    this.refresh();
}
function clickGuideSwitch(e, ele) {
    if (this.account.state.noguide) {
        delete this.account.state["noguide"];
        ele.addClass('on').text(ele.data('text-on'));
    } else {
        this.account.state.noguide = true;
        ele.removeClass('on').text(ele.data('text-off'));
        this.parts.guide.fadeOut('slow');
    }
    this.updateAccount({
        ns: '',
        method: (this.account.state.noguide ? '+' : '-'),
        key: 'state',
        val: 'noguide'
    });
}

// SideMenu
function clickListDisplaySwitch(e, ele) {
    // var app = this;
    var list_id = ele.parent().parent().data('list-id');
    var method = ele.attr('checked') ? '-' : '+';
    
    if (ele.attr('checked')) {
        this.parts.lists.find('li').each(function(i, ele){
            if (list_id === $(ele).data('list-id')) {
                $(ele).slideDown(app.speed);
            }
        });
    } else {
        this.parts.lists.find('li').each(function(i, ele){
            if (list_id === $(ele).data('list-id')) {
                $(ele).slideUp(app.speed);
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
function clickListBadgeSwitch(e, ele) {
    // var app = this;
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
    for (var i = 0, max = list.doc.member_ids.length; i < max; i++) {
        var member_id = list.doc.member_ids[i];
        if (member_id in this.friend_ids) {
            var member = this.friend_ids[member_id];
            createListMembers.append(this.createAssignList(member));
        } else {
            // console.log(member_id);
        }
    }
}
function openCallbackDeleteList(e, ele) {
    var list = this.listmap[ele.data('list-id')];
    var form = $('#delete-list-window');
    form.data('list-id', list.id);
    $('#delete-list-name').text(list.doc.name);
    form.find('button').get(0).focus();
}
function submitCreateList(form) {
    // var app = this;
    
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
        form.fadeOut(this.speed);
        this.parts.listmembers.empty();
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
            // app.statusUpdate('create list ' + data.list_id);
            return app.ajax({
                type: 'get',
                url: '/api/1/list/' + data.list_id,
                dataType: 'json'
            });
        }
    })
    .done(function(data){
        if (data.success) {
            // app.statusUpdate('get list ' + data.list.doc.name);
            app.registList(data.list);
        }
    });
}
function submitDeleteList(form) {
    // var app = this;
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
            app.statusUpdate('delete list ' + data.list_id);
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
    // var app = this;
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
        if (cond.registrant && !app.isMe(task.registrant_id)) {
            return false;
        }
        if (typeof cond.assign === 'boolean') {
            var assign;
            if (task.assign_ids.length) {
                assign = app.findMe(task.assign_ids) ? true : false;
            } else {
                assign = app.isMe(task.registrant_id);
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
function tasksRequestFilter(list, task) {
    // closed
    if (task.closed) {
        return false;
    }
    // 自分以外が登録
    if ("registrant" in task) {
        if (!this.isMe(task.registrant_id)) {
            return false;
        }
    }
    // 自分が担当
    if (task.assign_ids) {
        if (this.findMe(task.assign_ids)) {
            return false;
        }
    }
    return true;
}
function clickTaskmenuSort(e, ele) {
    this.sortTask(ele.data('id'));
}
function clickTaskmenuSwitch(e, ele) {
    // var type = ele.data('id');
    // var val = ele.data('val');
    // var id = ele.attr('id');
    // var selectors = {
    //     description: '.content',
    //     comment: 'ul.comments'
    // };
    // var selector = selectors[type];
    // if (val) {
    //     ele.data('val', 0);
    //     ele.addClass('on');
    //     this.parts.tasks.find(selector).slideUp(this.speed);
    // }
    // else {
    //     ele.data('val', 1);
    //     ele.removeClass('on');
    //     this.parts.tasks.find(selector).slideDown(this.speed);
    // }
    // this.updateAccount({
    //     ns: 'state.button',
    //     method: 'set',
    //     key: id,
    //     val: ele.data('val')
    // });
}
function clickTaskmenuFilter(e, ele) {
    // // var app = this;
    // var id = ele.data('id');
    // var val = ele.data('val');
    // var selectors = {
    //     my: '',
    //     star: '.icon-star-on',
    //     tasksOn: '.icon-tasks-on',
    //     tasksOff: '.icon-tasks-off',
    //     progress: '.icon-progress',
    //     recycle: '.icon-recycle'
    // };
    // var selector = selectors[id];
    // if (id === 'recycle') {
    //     this.parts.mainmenu.find('.icon-star-on').parent().removeClass('on').data('val', 1);
    //     this.parts.mainmenu.find('.icon-tasks-on').parent().removeClass('on').data('val', 1);
    //     this.parts.mainmenu.find('.icon-tasks-off').parent().removeClass('on').data('val', 1);
    //     if (val) {
    //         this.parts.mainmenu.find('.icon-trash').parent().fadeIn('slow');
    //     } else {
    //         this.parts.mainmenu.find('.icon-trash').parent().fadeOut('slow');
    //     }
    // }
    // if (id === 'tasksOn') {
    //     this.parts.mainmenu.find('.icon-progress').parent().removeClass('on').data('val', 1);
    //     this.parts.mainmenu.find('.icon-tasks-off').parent().removeClass('on').data('val', 1);
    // } else if (id === 'tasksOff') {
    //     this.parts.mainmenu.find('.icon-progress').parent().removeClass('on').data('val', 1);
    //     this.parts.mainmenu.find('.icon-tasks-on').parent().removeClass('on').data('val', 1);
    // } else if (id === 'progress') {
    //     this.parts.mainmenu.find('.icon-tasks-on').parent().removeClass('on').data('val', 1);
    //     this.parts.mainmenu.find('.icon-tasks-off').parent().removeClass('on').data('val', 1);
    // }
    // if (val) {
    //         ele.data('val', '');
    //         ele.addClass('on');
    // }
    // else {
    //         ele.data('val', 1);
    //         ele.removeClass('on');
    // }
    // this.filterTask();
}
function clickTaskmenuTrash(e, ele) {
    
}
function clickCreateTaskDuePlus(e, ele) {
    var due = $('#create-task-date');
    var date = due.datepicker("getDate") || new Date();
    date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
    due.datepicker("setDate", date);
}
function clickCreateTaskDuePlusMonth(e, ele) {
    var due = $('#create-task-date');
    var date = due.datepicker("getDate") || new Date();
    date.setMonth(date.getMonth() + 1);
    due.datepicker("setDate", date);
}
function clickCreateTaskDueMinus(e, ele) {
    var due = $('#create-task-date');
    var date = due.datepicker("getDate") || new Date();
    date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
    due.datepicker("setDate", date);
}
function clickCreateTaskDueDelete(e, ele) {
    $('#create-task-date').val('');
}
function clickCreateTaskDueToday(e, ele) {
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
    save.text(this.localizer.text(save, 'default'));
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
    save.text(this.localizer.text(save, 'edit'));
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
    // var app = this;
    
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
        form.hide('drop', {}, this.speed);
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
                app.statusUpdate('create a task.');
                task = data.task;
                task.list = list;
                list.taskmap[task.id] = task;
                list.doc.tasks.push(task);
                li = app.renderTask(list, task);
                app.taskli[list.id + '-' + task.id] = li;
            }
            else {
                app.statusUpdate('update a task.');
                task = $.extend(app.listmap[list.id].taskmap[data.task.id], data.task);
                task.list = list;
                li = app.taskli[list.id + '-' + task.id];
                li.replaceWith(app.createTaskElement(list, task));
                app.taskli[list.id + '-' + task.id].effect("highlight", {}, app.speed);
            }
            if (!app.current_filter.call(app, null, task)) {
                app.taskli[list.id + '-' + task.id].delay(500).slideUp('slow');
            }
            app.renderBadge(list);
        }
    });
}
function submitClearTrash(form) {
    // var app = this;
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
            app.statusUpdate('clear trash ' + data.count + ' tasks remove.');
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
        form.fadeOut(app.speed);
        var li = $('#closed-task-switch');
        if (!li.data('closed')) {
            app.switchClosed({
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
    this.parts.tasks.prepend(li);
    this.updateCounter(null, task);
    return li;
}
function createTaskElement(list, task) {
    // var app = this;
    var li = $(this.template.task);
    li.data('list-id', list.id);
    li.data('id', task.id);
    li.data('updated', task.updated);
    var due_epoch = 0;
    if (task.due) {
        var mdy = task.due.split('/');
        var label = mdy[0] + '/' + mdy[1];
        var now = new Date();
        if (now.getFullYear() != mdy[2]) {
            if (this.lang === 'ja') {
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
    li.find('.comment').click(function(){
        app.parts.commentform.slideDown(app.speed, function(){
            app.parts.commentbox.focus();
        });
    });
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
    this.taskli[list.id + '-' + task.id] = li;
    li.find('.title').text(task.title);
    if ("requester_id" in task) {
        $('<img data-guide-en="Requester" data-guide-ja="依頼者"/>')
            .attr('src', app.getProfileImageUrl(task.requester_id))
            .addClass('twitter_profile_image')
            .appendTo(li.find('.assign'))
        li.data('requester-id', task.requester_id);
    }
    if (task.assign_ids.length) {
        li.find('.assign').prepend($('<span class="icon icon-left"/>'));
        for (var i = 0; i < task.assign_ids.length; i++) {
            var assign_id = task.assign_ids[i];
            var url = app.getProfileImageUrl(assign_id);
            var img = $('<img data-guide-en="Assignee" data-guide-ja="担当者"/>')
                .attr('src', url)
                .addClass('twitter_profile_image');
            li.find('.assign').prepend(img);
        }
    }
    if (task.status === 2 && task.assign_ids.length) {
        var url = app.getProfileImageUrl(task.requester_id);
        var img = $('<img data-guide-en="Approver" data-guide-ja="承認者"/>')
            .attr('src', url)
            .addClass('twitter_profile_image');
        li.find('.assign').prepend($('<span class="icon icon-left"/>')).prepend(img);
    }
    li.mouseover(function(){
        if (app.active === 'comment') {
            return;
        }
        app.parts.commentbox.blur();
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
        app.parts.commentbox.val('').css('height', '16px');
        app.parts.comment.scrollTop(app.parts.comment.height());
        app.commentHeightResize();
    });
    li.find('> .action, > .due').click($.proxy(this.clickTaskAction, this));
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
    this.initEventGuide(li);
    li.get(0).addEventListener('dragstart', function(e){
        app.dragging = true;
        app.parts.guide.hide();
        app.parts.listnav.show('drop', {}, app.speed);
        e.dataTransfer.setData('Text', list.id + ':' + task.id);
        app.dragtask = task;
    }, false);
    li.get(0).addEventListener('dragend', function(e){
        if (app.dragging) {
            app.dragging = false;
            app.parts.listnav.hide('drop', {}, app.speed);
            e.dataTransfer.clearData();
        }
    }, false);
    return li;
}
function clickTaskAction(e) {
    // var app = this;
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
        li.slideUp(app.speed);
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
        li.slideUp(app.speed);
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
        this.clickOpenButton(e, div);
    }
    else if (div.hasClass('assign')) {
        this.clickOpenButton(e, div);
    }
    
    var filter = this.tasksFilterGenerate();
    if (!filter(li)) {
        li.slideUp(app.speed);
    }
}
function submitComment() {
    // var app = this;
    
    var list_id = this.parts.commentbox.data('list-id');
    var task_id = this.parts.commentbox.data('task-id');
    var comment = this.parts.commentbox.val();
    
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
            // FIXME: 
            app.statusUpdate('create a comment.');
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
    // var app = this;
    var li = $('<li class="clearfix"/>');
    var friend = this.friend_ids[comment.owner_id];
    var img = $('<img>').attr('src', friend.profile_image_url);
    var msg = $('<div/>');
    var name = $('<span class="name"></span>').text(friend.screen_name);
    var date = $('<span class="date"></span>').text(this.timestamp(comment.time));
    var message = $('<span class="comment"/>').html(this.autoLink(comment.comment));
    var del = $('<span class="action icon icon-delete"></span>');
    del.click(function(e){
        e.stopPropagation();
        app.deleteComment(list_id, task_id, comment);
        li.remove();
        app.parts.commentbox.focus();
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
    this.parts.comment.append(li);
}
function deleteComment(list_id, task_id, comment) {
    // var app = this;
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
            // FIXME: 
            app.statusUpdate('delete a comment.');
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
    li.data('method', 'open');
    li.data('id', 'create-task-window');
    li.data('callback', 'createTaskWithMember');
    li.get(0).addEventListener("click", this, false);
    this.parts.listmembers.append(li);
}

})(this, this, document);
