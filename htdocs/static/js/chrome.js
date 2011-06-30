(function(ns, w, d) {

var w = $(w);

ns.Tasks = initialize;
ns.Tasks.prototype = {
    
    // 定数
    token_name: 'csrf_token',
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
    
    // データ
    lang: 'en',
    guide: true,
    current_list: null,
    current_filter: null,
    account: null,
    assignee: [],
    modals: {},
    parts: {},
    friends: {},
    taskli: {},
    listli: {},
    unread_comment_count: 0,
    
    // 初期化系
    run: run,
    initParts: initParts,
    initEvent: initEvent,
    initEventGuide: initEventGuide,
    initWindow: initWindow,
    initAccount: initAccount,
    
    // イベント
    handleEvent: handleEvent,
    windowResizeEvent: windowResizeEvent,
    
    // General
    ajax: ajax,
    ajaxFailure: ajaxFailure,
    message: message,
    statusUpdate: statusUpdate,
    getTwitterProfileImageUrl: getTwitterProfileImageUrl,
    syncTwitterContact: syncTwitterContact,
    updateAccount: updateAccount,
    refresh: refresh,
    submitFinalize: submitFinalize,
    showTimeline: showTimeline,
    renderTimeline: renderTimeline,
    switchList: switchList,
    switchFilterList: switchFilterList,
    renderList: renderList,
    renderBadge: renderBadge,
    renderCommentBadge: renderCommentBadge,
    createList: createList,
    modifyList: modifyList,
    deleteList: deleteList,
    sortList: sortList,
    sortUpdateList: sortUpdateList,
    createTask: createTask,
    modifyTask: modifyTask,
    deleteTask: deleteTask,
    filterTask: filterTask,
    sortTask: sortTask,
    sortUpdateTask: sortUpdateTask,
    readComment: readComment,
    isMe: isMe,
    findMe: findMe,
    findMeByList: findMeByList,
    listReadLastRev: listReadLastRev,
    listReadLastTime: listReadLastTime,
    clickStatebleCheckbox: clickStatebleCheckbox,
    timestamp: timestamp,
    
    // GrobalMenu
    clickOpenButton: clickOpenButton,
    clickSignInTwitter: clickSignInTwitter,
    clickSyncTwitterContact: clickSyncTwitterContact,
    clickAccountSync: clickAccountSync,
    clickRefresh: clickRefresh,
    clickGuideSwitch: clickGuideSwitch,
    
    // SideMenu
    clickListDisplaySwitch: clickListDisplaySwitch,
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
    registAssignee: registAssignee,
    createAssigneeLabel: createAssigneeLabel,
    createAssigneeList: createAssigneeList,
    renderTask: renderTask,
    createTaskElement: createTaskElement,
    clickTaskAction: clickTaskAction,
    submitComment: submitComment,
    deleteComment: deleteComment,
    renderComment: renderComment,
    renderMember: renderMember
    
};

function initialize(options) {
    if (typeof window.console != 'object') {
        console.log = function(){};
    }
    this.lang = $('html').attr('lang');
    this.token = $('input[name=' + this.token_name + ']:first').val();
}

// Init
function run() {
    this.initParts();
    this.initEvent();
    this.initWindow();
    this.initAccount();
}
function initParts() {
    this.parts.header      = $('body > header');
    this.parts.aside       = $('body > div > aside');
    this.parts.article     = $('body > div > article');
    this.parts.footer      = $('body > footer');
    
    this.parts.status      = this.parts.header.find('p');
    this.parts.console     = this.parts.footer.find('ul');
    this.parts.sidemenu    = this.parts.aside.find('> header > nav > ul');
    this.parts.lists       = this.parts.aside.find('> nav > ul');
    this.parts.mainmenu    = this.parts.article.find('> header > nav > ul');
    this.parts.tasks       = this.parts.article.find('> section > ul.task');
    this.parts.timeline    = this.parts.article.find('> section > ul.timeline');
    this.parts.listname    = this.parts.article.find('> section > header > h1');
    this.parts.listmembers = this.parts.article.find('> section > header > ul');
    
    this.parts.lswt        = $('#list-settings-window table');
    this.parts.owners      = $('#create-list-window select[name=owner]');
    this.parts.guide       = $('#guide');
    
    this.parts.listonly    = $('#create-task-button, #free-sort-task-button, #clear-trash-button');
    this.parts.connectacs  = $('#connect-accounts');
    
    this.template.task     = this.parts.tasks.html();
}
function initEvent() {
    var that = this;
    
    /* window */
    w.resize($.proxy(this.windowResizeEvent, this));
    
    this.initEventGuide($(d));
    
    /* header */
    
    
    /* aside */
    this.parts.lists.find('li.timeline').click($.proxy(this.showTimeline, this));
    this.parts.lists.find('li.filter').click($.proxy(this.switchFilterList, this));
    
    $('textarea').autogrow();
    
    /* article */
    /* article nav */
    $('button, a, span.action, input[data-method]').each(function(i, ele){
        ele.addEventListener("click", that, false);
    });
    
    var f_disp = false;
    var footer = $('body > footer');
    var ul = $('body > footer > ul');
    var footer_default_height = footer.height();
    $('body > footer > div').click(function(){
        var div = $(this);
        if (f_disp) {
            footer.animate({ height: footer_default_height + 'px' });
            div.removeClass('disp');
            f_disp = false;
        } else {
            var h = ul.height() - 12;
            footer.animate({ height: footer_default_height + h + 'px' });
            div.addClass('disp');
            f_disp = true;
        }
    });
    
    // 
    $('article .tasks > ul > li').each(function(i, ele){
        // addEvent($(ele), 'click', function (event) {
        //     console.log('click');
        //     // event.dataTransfer.setData('Text', box.attr('id'));
        // }, false);
        ele.setAttribute('draggable', 'true');
        addEvent(ele, 'dragstart', function (event) {
            console.log(ele);
            // event.dataTransfer.setData('Text', box.attr('id'));
        }, false);
    });
    
    this.parts.tasks.sortable({
        handle: 'div.grip',
        cursor: 'url(/static/img/openhand.cur), move',
        update: function(e, ui) {
            that.sortUpdateTask();
        }
    });
    
    
    this.parts.lists.sortable({
        cursor: 'url(/static/img/openhand.cur), move',
        update: function(e, ui) {
            that.sortUpdateList();
        }
    });
    
    // Modal Window
    $('form.modal').each(function(i, ele){
        var form = $(ele);
        form.find('button.cancel').click(function(){
            form.fadeOut(that.speed);
            return false;
        });
        form.bind('submit', function(){
            // form.find('input:first').val('').get(0).focus();
            
            var submit = form.data('submit');
            if (submit) {
                that[submit].call(that, form);
            }
            // FIXME: keep
            
            return false;
        });
        that.modals[form.attr('id')] = form;
        // form.disableSelection();
        // form.draggable();
        form.draggable({ handle: 'h1' });
        form.find('footer input[type=checkbox]').click($.proxy(that.clickStatebleCheckbox, that));
    });
    
    // Create Task Window
    $('#create-task-date').datepicker();
    $('#create-list-assignee').autocomplete({
		source: function(request, response) {
		    response($.ui.autocomplete.filter(that.assignee, request.term));
		},
		select: function(event, ui) {
		    that.createAssigneeList(that.friends[ui.item.value]).prependTo($('#create-list-members'));
        }
	}).data('autocomplete')._renderItem = function(ul, item) {
        return $(document.createElement('li'))
            .data('item.autocomplete', item)
            .append("<a>"+ item.label + "</a>")
            .appendTo(ul);
    };
	$('#create-list-assignee').bind('autocompleteclose', function(event, element){
	    $('#create-list-assignee').val('');
	});

    
}
function initEventGuide(ele) {
    var that = this;
    ele.find('*[data-guide-' + that.lang + ']').each(function(i, ele){
        var ele = $(ele);
        var msg = ele.data('guide-' + that.lang);
        ele.hover(function(){
            if (!that.guide) {
                return;
            }
            var top = ele.offset().top + ele.height();
            var left = ele.offset().left;
            that.parts.guide.text(msg);
            that.parts.guide.show();
            that.parts.guide.css('top', top + 'px');
            that.parts.guide.css('left', left + 'px');
        }, function() {
            that.parts.guide.hide();
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
    this.refresh(true);
    this.parts.mainmenu.find('.icon-trash').parent().fadeOut('slow');
}

// Event
function handleEvent(e) {
    var ele = $(e.currentTarget);
    if (ele.data('method')) {
        // e.preventDefault();
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
        break
    case 'accountSync':
        this.clickAccountSync(e, ele);
        break
    case 'refresh':
        this.clickRefresh(e, ele);
        break
    case 'signinTwitter':
        this.clickSignInTwitter(e, ele);
        break
    case 'createTaskDuePlus':
        this.clickCreateTaskDuePlus(e, ele);
        break
    case 'createTaskDueMinus':
        this.clickCreateTaskDueMinus(e, ele);
        break
    case 'createTaskDueDelete':
        this.clickCreateTaskDueDelete(e, ele);
        break
    case 'createTaskDueToday':
        this.clickCreateTaskDueToday(e, ele);
        break
    case 'listDisplaySwitch':
        this.clickListDisplaySwitch(e, ele);
        break
    }
}
function windowResizeEvent() {
    // FIXME: スクロールが発生した場合にボタンを有効化する
    var w_height = w.height();
    $('aside > nav').height(w_height - 97);
    $('article > section').height(w_height - 117);
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
    this.parts.status.text(message);
    this.parts.console.prepend($(document.createElement('li')).text(message));
    // FIXME: 一定件数で消す
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
    var that = this;
    if (!cursor || cursor === -1) {
        if (user_id in that.account.tw) {
            that.account.tw[user_id].friends = [];
        } else {
            that.account.tw[user_id] = {friends: []};
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
            that.statusUpdate('sync contact list '
            + screen_name + ' ' + data.sync_count + '/' + data.friends_count);
            that.registAssignee(data.friends);
            $.merge(that.account.tw[user_id].friends, data.friends);
            if (data.next_cursor) {
                that.syncTwitterContact(user_id, data.next_cursor, screen_name);
            } else {
                that.statusUpdate('sync contact list ' + screen_name + ' fin.');
                that.refresh();
            }
        }
    });
}
function updateAccount(params, refresh) {
    var that = this;
    this.ajax({
        type: 'post',
        url: '/api/1/account/update',
        data: params,
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            that.statusUpdate('update a account.');
            if (refresh) {
                that.refresh();
            }
        }
    });
}
function refresh(syncContact) {
    var that = this;
    return this.ajax({
        type: 'get',
        url: '/api/1/account/',
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            that.statusUpdate('refresh.');
            that.account = data.account;
            that.assignee = [];
            that.parts.owners.empty();
            that.parts.tasks.empty();
            that.parts.connectacs.empty();
            var is_first = true;
            for (var user_id in data.account.tw) {
                var tw = data.account.tw[user_id];
                that.registAssignee(tw.friends);
                $('<option/>')
                    .attr('value', '@' + tw.screen_name)
                    .text('@' + tw.screen_name)
                    .appendTo(that.parts.owners);
                $('<li>Twitter: '
                    + tw.screen_name
                    + ' <!-- span class="icon icon-delete"></span --></li>')
                    .appendTo(that.parts.connectacs);
                if (is_first) {
                    is_first = false;
                    $('#member-name').text(tw.screen_name);
                }
                syncContact = false;
            }
            that.listmap = [];
            that.parts.lists.find('.project').remove();
            that.parts.lswt.find('.project').remove();
            
            that.unread_comment_count = 0;
            var lists = that.account.lists;
            for (var i = 0; i < lists.length; i++) {
                var list = lists[i];
                that.registList(list);
            }
            that.sortList();
            that.renderCommentBadge();
            that.renderTimeline();
            
            if ("last_read_list" in that.account.state) {
                var id = that.account.state.last_read_list;
                that.parts.lists.find('> li[data-list-id="' + id + '"]:first').click();
            } else {
                that.parts.lists.find('li.project:first').click();
            }
            that.sortTask('updated');
            
            for (var i = 0, max = that.filters.length; i < max; i++) {
                var filter = that.filters[i];
                if (filter in that.account.state.hide_list) {
                    that.parts.lswt.find('tr[data-list-id=' + filter + ']').each(function(i, ele){
                        $(ele).find('input').attr('checked', false);
                    });
                    that.parts.lists.find('li[data-list-id=' + filter + ']').hide();
                } else {
                    that.parts.lists.find('li[data-list-id=' + filter + ']').show();
                }
            }
            // checkox state 
            for (var id in that.account.state.checkbox) {
                document.getElementById(id).checked =
                    that.account.state.checkbox[id] ? true : false;
            }
            for (var id in that.account.state.button) {
                var button = $(document.getElementById(id));
                if (that.account.state.button[id]) {
                    button.removeClass('on');
                    button.data('val', 1);
                } else {
                    button.addClass('on');
                    button.data('val', 0);
                }
            }
            if ($('#guide-switch').data('val') == 1) {
                that.guide = false;
                $('#guide-switch').text($('#guide-switch').data('text-off'));
            } else {
                that.guide = true;
                $('#guide-switch').text($('#guide-switch').data('text-on'));
            }
            
            // 
            var my = that.parts.mainmenu.find('.my:first');
            var url = my.data('url');
            var img = $('<img/>').attr('src', url).attr('width', 16);
            my.empty().append(img);
        }
        if (syncContact) {
            that.clickSyncTwitterContact();
        }
    });
}
function submitFinalize(form) {
    // keep
    if (form.find('input[name=keep]:checked').length) {
        form.find('*[data-no-keep=1]').val('');
        form.find('input[type=text]:first').get(0).focus();
    } else {
        var reset = form.data('reset');
        this[reset].call(this, form);
        // continue
        if (form.find('input[name=continue]:checked').length) {
            form.find('input[type=text]:first').get(0).focus();
        } else {
            form.fadeOut(this.speed);
        }
    }
}
function showTimeline(e) {
    this.parts.timeline.show();
    this.parts.tasks.hide();
    this.parts.lists.find('.selected').removeClass('selected');
    var li = $(e.currentTarget);
    li.addClass('selected');
    this.parts.mainmenu.find('button').attr('disabled', true);
    this.parts.listname.text(li.text());
    this.parts.listmembers.empty();
    this.updateAccount({
        ns: 'state',
        method: 'set',
        key: 'last_read_list',
        val: 'list-timeline'
    });
}
function renderTimeline() {
    var lists = this.account.lists;
    var timeline_items = [];
    for (var i = 0; i < lists.length; i++) {
        var list = lists[i];
        for (var j = 0; j < list.doc.history.length; j++) {
            var item = list.doc.history[j];
            item.list = list;
            timeline_items.push(item);
        }
    }
    timeline_items.sort(function(a, b){ return b.date - a.date });
    this.parts.timeline.empty();
    for (var i = 0; i < timeline_items.length; i++) {
        var item = timeline_items[i];
        if (this.isMe(item.code)) continue;
        var code = $('<span class="code"/>');
        if (item.code) {
            var url = this.getTwitterProfileImageUrl(item.code.substring(1));
            code.css('background-image', 'url(' + url + ')');
            code.attr('title', item.code);
        } else {
            
        }
        var action_msg = this.localizer.text(this.parts.timeline, item.action);
        var action = $('<span class="action"/>').text(action_msg);
        var list = $('<span class="list"/>').text(item.list.doc.name);
        list.data('list-id', item.list.id);
        list.click($.proxy(this.switchList, this));
        var date = $('<span class="date"/>').text(this.timestamp(item.date));
        var li = $('<li class="clearfix"/>')
            .append(code)
            .append(action)
            .append(list)
            .append(date);
        this.parts.timeline.append(li);
    }
}
function switchList(e) {
    var that = this;
    var li = $(e.currentTarget);
    var id = li.data('list-id');
    var list = this.listmap[id];
    this.current_list = list;
    this.current_filter = null;
    this.parts.lists.find('.selected').removeClass('selected');
    this.listli[list.id].addClass('selected');
    this.parts.mainmenu.find('button').attr('disabled', false);
    this.parts.listname.text(list.doc.name);
    this.parts.listmembers.empty();
    // FIXME: 最終的に消す
    if ("owner" in list.doc) {
        this.renderMember(list.doc.owner);
    }
    if ('members' in list.doc && list.doc.members.length) {
        var members = list.doc.members;
        members.sort();
        for (var i = 0; i < members.length; i++) {
            this.renderMember(members[i]);
        }
    }
    this.filterTask(true);
    this.sortTask();
    // 未読があった場合更新
    if (li.hasClass('updated')) {
        li.removeClass('updated');
        this.updateAccount({
            ns: 'state.read.list',
            method: 'set',
            key: id,
            val: list.value.rev + ',' + (new Date()).getTime()
        });
    }
    this.updateAccount({
        ns: 'state',
        method: 'set',
        key: 'last_read_list',
        val: list.id
    });
}
function switchFilterList(e) {
    var that = this;
    var li = $(e.currentTarget);
    var id = li.data('list-id');
    this.current_list = null;
    this.current_filter = id;
    this.parts.lists.find('.selected').removeClass('selected');
    li.addClass('selected');
    this.parts.mainmenu.find('button').attr('disabled', false);
    this.parts.listonly.attr('disabled', true);
    this.parts.listname.text(this.localizer.text(li));
    this.parts.listmembers.empty();
    this.filterTask(true);
    this.updateAccount({
        ns: 'state',
        method: 'set',
        key: 'last_read_list',
        val: id
    });
}
function renderList(list) {
    var that = this;
    var badge = $('<span class="badge"></span>');
    var li = $('<li data-list-id="' + list.id + '"></li>');
    li.attr('class', 'project');
    li.text(list.doc.name);
    li.append(badge);
    if (this.findMe([list.doc.owner])) {
        var settings = $('<span class="icon icon-settings" '
            + 'data-method="open" data-id="create-list-window" '
            + 'data-callback="editList"></span>');
        settings.data('list-id', list.id);
        settings.get(0).addEventListener("click", that, false);
        li.append(settings);
    }
    this.listmap[list.id] = list;
    this.listli[list.id] = li;
    li.click($.proxy(that.switchList, that));
    list.taskmap = {};
    for (var j = 0; j < list.doc.tasks.length; j++) {
        list.taskmap[list.doc.tasks[j].id] = list.doc.tasks[j];
    }
    list.badge = badge;
    this.renderBadge(list);
    
    if (this.listReadLastRev(list.id) != list.value.rev) {
        li.addClass('updated');
    }
    
    var old = this.parts.lists.find('li[data-list-id="' + list.id + '"]');
    if (old.length) {
        if (old.hasClass('selected')) {
            old.replaceWith(li);
            li.click();
        } else {
            old.replaceWith(li);
        }
    } else {
        this.parts.lists.append(li);
    }
    
    // 設定画面
    var tr = $('<tr class="project" data-list-id="'
     + list.id
     + '">'
     + '<td><input type="checkbox" checked="checked" data-method="listDisplaySwitch"></td>'
     + '</tr>')
    .prepend($('<td></td>').text(list.doc.name));
    if (this.findMe([list.doc.owner])) {
        tr.append($(
            '<td><span class="icon icon-delete" data-method="open" '
            + 'data-id="delete-list-window" data-callback="deleteList"></span></td>'
        ));
    }
    var update = false;
    var old = this.parts.lswt.find('tr[data-list-id="' + list.id + '"]');
    if (old.length) {
        update = true;
        old.replaceWith(tr);
    } else {
        this.parts.lswt.append(tr);
    }
    
    tr.find('span, input').each(function(i, ele){
        ele.addEventListener("click", that, false);
    });
    
    // Task
    if (list.id in that.account.state.hide_list) {
        li.hide();
        tr.find('input').attr('checked', false);
    } else if (!update) {
        var tasks = list.doc.tasks;
        for (var i = 0; i < tasks.length; i++) {
            var li = this.renderTask(list, tasks[i]);
            li.hide();
        }
    }
}
function renderBadge(list) {
    var count = 0;
    for (var j = 0; j < list.doc.tasks.length; j++) {
        if (!list.doc.tasks[j].closed && list.doc.tasks[j].status < 2) {
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
    var that = this;
    
    // sidebar
    var lis = [];
    this.parts.lists.find('> li').each(function(i, ele) {
        lis.push($(ele));
    });
    var val = function(ele){
        var list_id = ele.data('list-id');
        if (list_id in that.account.state.sort.list) {
            return parseInt(that.account.state.sort.list[list_id]);
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
    var that = this;
    return this.ajax({
        type: 'post',
        url: '/api/1/task/update',
        data: params,
        dataType: 'json'
    })
    .done(function(data){
        // console.log(data);
        if (data.success) {
            that.statusUpdate('update a task.');
            $.extend(that.listmap[params.list_id].taskmap[data.task.id], data.task);
            that.renderBadge(that.listmap[params.list_id]);
            that.taskli[params.list_id + '-' + data.task.id].data('updated', data.task.updated);
            
        }
    });
}
function deleteTask(params) {
    
}
function filterTask(readComment) {
    var that = this;
    var filter = this.tasksFilterGenerate();
    this.parts.timeline.hide();
    this.parts.tasks.show();
    this.parts.tasks.find('> li').each(function(i, ele){
        var ele = $(ele);
        if (filter(ele)) {
            ele.slideDown(that.speed);
            if (readComment) {
                that.readComment(ele);
            }
        } else {
            ele.slideUp(that.speed);
        }
    });
    this.renderCommentBadge();
}
function readComment(li) {
    var that = this;
    li.find('ul.comments > li').each(function(i, ele){
        var comment = $(ele);
        if (comment.data('read')) {
            comment.removeClass('unread');
            comment.removeData('read');
        }
        if (comment.hasClass('unread')) {
            comment.data('read', 1);
            that.unread_comment_count--;
        }
    });
}
function sortTask(id) {
    if (!id) {
        id = this.parts.mainmenu.find('button.on[data-method=taskmenuSort]:first').data('id');
    } else {
        this.parts.mainmenu.find('button[data-method=taskmenuSort]').each(function(i, ele){
            var button = $(ele);
            if (button.data('id') === id) {
                button.addClass('on');
            } else {
                button.removeClass('on');
            }
        });
    }
    if (id === "sort") {
        this.parts.tasks.sortable("enable");
        this.parts.tasks.addClass('sortable');
    } else {
        this.parts.tasks.sortable("disable");
        this.parts.tasks.removeClass('sortable');
    }
    var lis = [];
    this.parts.tasks.find('> li').each(function(i, ele) {
        lis.push($(ele));
    });
    lis.sort(function(a, b) {
        var a_val = parseInt(a.data(id)) || 0;
        var b_val = parseInt(b.data(id)) || 0;
        if (a_val != b_val) {
            return b_val - a_val;
        } else {
            return b.data('updated') - a.data('updated');
        }
    });
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
function isMe(code) {
    for (var i = 0; i < this.account.tw_accounts.length; i++) {
        var tw_account = this.account.tw_accounts[i];
        if ('@' + tw_account.screen_name === code) {
            return true;
        }
    }
    return false;
}
function findMe(codes) {
    for (var i = 0; i < codes.length; i++) {
        if (this.isMe(codes[i])) {
            return codes[i];
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
        return diff + ' sec';
    } else if (diff < 3600) {
        return parseInt(diff / 60) + ' minutes ago';
    } else if (diff < (3600 * 24)) {
        return parseInt(diff / 3600) + ' hours ago';
    } else {
        return parseInt(diff / (3600 * 24)) + ' days ago';
    }
}

// GrobalMenu
function clickOpenButton(e, ele) {
    var form = this.modals[ele.data('id')];
    form.css('top', $(w).scrollTop() + ($(w).height() / 2) + 'px');
    form.show();
    var input = form.find('input');
    if (input.length) {
        input.get(0).focus();
    }
    var callback = ele.data('callback');
    if (callback) {
        var func = callback.charAt(0).toUpperCase() + callback.substr(1);
        this['openCallback' + func].call(this, e, ele);
    }
}
function clickSignInTwitter(e, ele) {
    location.href = '/signin/twitter/oauth';
}
function clickSyncTwitterContact(e, ele) {
    var that = this;
    
    // FIXME: statusbar update
    this.statusUpdate('sync contact list begin.');
    this.assignee = [];
    return this.ajax({
        type: 'get',
        url: '/api/1/account/',
        dataType: 'json'
    })
    .done(function(data){
        for (var i = 0; i < data.account.tw_accounts.length; i++) {
            var tw = data.account.tw_accounts[i];
            that.syncTwitterContact(tw.user_id, -1, tw.screen_name);
        }
    });
    
}
function clickAccountSync(e, ele) {
    var that = this;
    
    return this.ajax({
        type: 'get',
        url: '/api/1/account/',
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            that.account = data.doc;
            
            that.assignee = [];
            for (user_id in data.doc.tw) {
                that.registAssignee(data.doc.tw[user_id].friends);
            }
            console.log(that.account);
        }
    });
}
function clickRefresh(e, ele) {
    this.refresh();
}
function clickGuideSwitch(e, ele) {
    if (this.guide) {
        this.guide = false;
        ele.removeClass('on').text(ele.data('text-off'));
        this.parts.guide.fadeOut('slow');
    } else {
        this.guide = true;
        ele.addClass('on').text(ele.data('text-on'));
    }
    this.updateAccount({
        ns: 'state.button',
        method: 'set',
        key: ele.attr('id'),
        val: (this.guide ? 0 : 1)
    });
}

// SideMenu
function clickListDisplaySwitch(e, ele) {
    var that = this;
    var list_id = ele.parent().parent().data('list-id');
    var method = ele.attr('checked') ? '-' : '+';
    
    if (ele.attr('checked')) {
        this.parts.lists.find('li').each(function(i, ele){
            if (list_id === $(ele).data('list-id')) {
                $(ele).slideDown(that.speed);
            }
        });
    } else {
        this.parts.lists.find('li').each(function(i, ele){
            if (list_id === $(ele).data('list-id')) {
                $(ele).slideUp(that.speed);
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

    var createListMembers = $('#create-list-members');
    createListMembers.empty();
    if ("members" in list.doc) {
        var members = list.doc.members;
        for (var i = 0; i < members.length; i++) {
            var code = members[i];
            if (code in this.friends) {
                createListMembers.append(this.createAssigneeList(this.friends[code]));
            } else {
                console.log(code);
            }
        }
    }
}
function openCallbackDeleteList(e, ele) {
    var tr = ele.parent().parent();
    var list = this.listmap[tr.data('list-id')];
    var form = $('#delete-list-window');
    form.data('list-id', list.id);
    $('#delete-list-name').text(list.doc.name);
    form.find('button').get(0).focus();
}
function submitCreateList(form) {
    var that = this;
    
    var list_id = form.data('list-id');
    var url = list_id ? '/api/1/list/update' : '/api/1/list/create';
    var name = form.find('input[name=name]').val();
    var privacy = form.find('select[name=privacy]').val();
    var owner = form.find('select[name=owner]').val();
    var members = [];
    if (!name.length) {
        alert('please input list name.');
        return;
    }
    form.find('li.member').each(function(i, ele){
       members.push($(ele).data('code'));
    });
    if (list_id) {
        form.fadeOut(this.speed);
    } else {
        that.submitFinalize(form);
    }
    return this.ajax({
        type: 'post',
        url: url,
        data: {
            list_id: list_id,
            name: name,
            privacy: privacy,
            owner: owner,
            members: members
        },
        dataType: 'json'
    })
    .pipe(function(data){
        if (data.success) {
            that.statusUpdate('create list ' + data.list_id);
            return that.ajax({
                type: 'get',
                url: '/api/1/list/' + data.list_id,
                dataType: 'json'
            });
        }
    })
    .done(function(data){
        if (data.success) {
            that.statusUpdate('get list ' + data.list.doc.name);
            that.registList(data.list);
        }
    });
}
function submitDeleteList(form) {
    var that = this;
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
            that.statusUpdate('delete list ' + data.list_id);
            that.refresh();
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
function tasksFilterGenerate() {
    var that = this;
    var my = this.parts.mainmenu.find('.my').parent().data('val');
    var star = this.parts.mainmenu.find('.icon-star-on').parent().data('val');
    var tasksOn = this.parts.mainmenu.find('.icon-tasks-on').parent().data('val');
    var tasksOff = this.parts.mainmenu.find('.icon-tasks-off').parent().data('val');
    var progress = this.parts.mainmenu.find('.icon-progress').parent().data('val');
    var recycle = this.parts.mainmenu.find('.icon-recycle').parent().data('val');
    var selectors = {
        my: '.my',
        star: '.icon-star-on',
        tasksOn: '.icon-tasks-on',
        tasksOff: '.icon-tasks-off',
        recycle: '.icon-recycle',
        progress: '.icon-progress'
    };
    var func = function(ul){
        if (that.current_list) {
            if (ul.data('list-id') !== that.current_list.id) {
                return false;
            }
        }
        else if (that.current_filter) {
            var list_id = ul.data('list-id');
            var task_id = ul.data('id');
            var list = that.listmap[list_id];
            var task = that.listmap[list_id].taskmap[task_id];
            if (that.current_filter == "list-comment") {
                if (!that.tasksCommentFilter(ul)) {
                    return false;
                }
            } else if (that.current_filter === "list-todo") {
                if (!that.tasksTodoFilter(list, task)) {
                    return false;
                }
            } else if (that.current_filter === "list-request") {
                if (!that.tasksRequestFilter(list, task)) {
                    return false;
                }
            }
            else if (that.current_filter === 'list-watch') {
                star = 0;
            }
        }
        else {
            // ERROR
        }
        
        if (!my && ul.find(selectors["my"]).length === 0) {
            return false;
        }
        if (!star && ul.find(selectors["star"]).length === 0) {
            return false;
        }
        if (!tasksOn && ul.find(selectors["tasksOn"]).length === 0) {
            return false;
        }
        if (!tasksOff && ul.find(selectors["tasksOff"]).length === 0) {
            return false;
        }
        if (!progress && ul.find(selectors["progress"]).length === 0) {
            return false;
        }
        if (recycle && ul.find(selectors["recycle"]).length > 0) {
            return false;
        }
        if (!recycle && ul.find(selectors["recycle"]).length === 0) {
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
    // fixed, closed
    if (task.status === 2 || task.closed) {
        return false;
    }
    var isAssigneeMe = false;
    var isOwnerMe = this.isMe(list.doc.owner);
    if ("assignee" in task) {
        for (var i = 0; i < task.assignee.length; i++) {
            var assignee = task.assignee[i];
            if (this.isMe(assignee)) {
                isAssigneeMe = true;
                break;
            }
        }
    }
    // 自分以外が担当者
    if (task.assignee.length && !isAssigneeMe) {
        return false;
    }
    // 担当者未定で自分以外がオーナー
    if (!task.assignee.length && !isOwnerMe) {
        return false;
    }
    return true;
}
function tasksRequestFilter(list, task) {
    // closed
    if (task.closed) {
        return false;
    }
    // 自分以外が登録
    if ("registrant" in task) {
        if (!this.isMe(task.registrant)) {
            return false;
        }
    }
    // 自分が担当
    if (task.assignee) {
        if (this.findMe(task.assignee)) {
            return false;
        }
    }
    return true;
}
function clickTaskmenuSort(e, ele) {
    this.sortTask(ele.data('id'));
}
function clickTaskmenuSwitch(e, ele) {
    var type = ele.data('id');
    var val = ele.data('val');
    var id = ele.attr('id');
    var selectors = {
        description: '.content',
        comment: 'ul.comments'
    };
    var selector = selectors[type];
    if (val) {
        ele.data('val', 0);
        ele.addClass('on');
        this.parts.tasks.find(selector).slideUp(this.speed);
    }
    else {
        ele.data('val', 1);
        ele.removeClass('on');
        this.parts.tasks.find(selector).slideDown(this.speed);
    }
    this.updateAccount({
        ns: 'state.button',
        method: 'set',
        key: id,
        val: ele.data('val')
    });
}
function clickTaskmenuFilter(e, ele) {
    var that = this;
    var id = ele.data('id');
    var val = ele.data('val');
    var selectors = {
        my: '',
        star: '.icon-star-on',
        tasksOn: '.icon-tasks-on',
        tasksOff: '.icon-tasks-off',
        progress: '.icon-progress',
        recycle: '.icon-recycle'
    };
    var selector = selectors[id];
    if (id === 'recycle') {
        this.parts.mainmenu.find('.icon-star-on').parent().removeClass('on').data('val', 1);
        this.parts.mainmenu.find('.icon-tasks-on').parent().removeClass('on').data('val', 1);
        this.parts.mainmenu.find('.icon-tasks-off').parent().removeClass('on').data('val', 1);
        if (val) {
            this.parts.mainmenu.find('.icon-trash').parent().fadeIn('slow');
        } else {
            this.parts.mainmenu.find('.icon-trash').parent().fadeOut('slow');
        }
    }
    if (id === 'tasksOn') {
        this.parts.mainmenu.find('.icon-progress').parent().removeClass('on').data('val', 1);
        this.parts.mainmenu.find('.icon-tasks-off').parent().removeClass('on').data('val', 1);
    } else if (id === 'tasksOff') {
        this.parts.mainmenu.find('.icon-progress').parent().removeClass('on').data('val', 1);
        this.parts.mainmenu.find('.icon-tasks-on').parent().removeClass('on').data('val', 1);
    } else if (id === 'progress') {
        this.parts.mainmenu.find('.icon-tasks-on').parent().removeClass('on').data('val', 1);
        this.parts.mainmenu.find('.icon-tasks-off').parent().removeClass('on').data('val', 1);
    }
    if (val) {
            ele.data('val', '');
            ele.addClass('on');
    }
    else {
            ele.data('val', 1);
            ele.removeClass('on');
    }
    this.filterTask();
}
function clickTaskmenuTrash(e, ele) {
    
}
function clickCreateTaskDuePlus(e, ele) {
    var due = $('#create-task-date');
    var date = due.datepicker("getDate") || new Date();
    date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
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
    var list = this.listmap[list_id];
    var ul = $('#create-task-assignee');
    ul.html('<li>Assignee:</li>');
    var members = list.doc.members.concat(list.doc.owner);
    for (var i = 0, max = members.length; i < max; i++) {
        var code = members[i];
        var url = this.getTwitterProfileImageUrl(code.substring(1));
        var li = $('<li></li>');
        var input = $('<input type="checkbox" name="assignee" value="">');
        input.val(code);
        li.append(input)
        if (url) {
            $('<img>')
            .attr('src', url)
            .attr('class', 'twitter_profile_image')
            .appendTo(li);
        }
        li.append($('<span></span>').text(code));
        ul.append(li);
    }
    if (!members.length) {
        ul.append($('<li>no member.</li>'));
    }
    var form = $('#create-task-window');
    form.find('footer input[type=checkbox], footer label').show();
    var h1 = form.find('h1:first');
    h1.text(h1.data('text-default'));
    this.resetCreateTask(form);
    form.find('input[type=text]:first').get(0).focus();
    form.find('input[type=text]').val('');
    form.data('list-id', list.id);
    form.data('task-id', 0);
}
function openCallbackCreateTaskWithMember(e, ele) {
    this.openCallbackCreateTask(e, ele);
    var code = $(ele).data('code');
    var ul = $('#create-task-assignee');
    ul.find('input[value="' + code + '"]').attr('checked', true);
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
    form.data('list-id', list_id);
    form.data('task-id', task_id);
    form.find('input[name=title]').val(task.title || '');
    form.find('textarea[name=description]').val(task.description || '');
    form.find('input[name=due]').val(task.due || '');
    if ('assignee' in task) {
        for (var i = 0; i < task.assignee.length; i++) {
            var code = task.assignee[i];
            form.find('input[value="' + code + '"]').attr('checked', true);
        }
    }
}
function openCallbackClearTrash(e, ele) {
    var form = $('#clear-trash-window');
    form.data('list-id', this.current_list.id);
    form.find('button').get(0).focus();
}
function submitCreateTask(form) {
    var that = this;
    
    var list = this.current_list;
    var task_id = form.data('task-id');
    var url = task_id ? '/api/1/task/update' : '/api/1/task/create';
    var title = form.find('input[name=title]').val();
    var description = form.find('textarea[name=description]').val();
    var due = form.find('input[name=due]').val();
    if (!title.length) {
        alert('please input task title.');
        return;
    }
    var assignee = [];
    var registrant = this.findMe([list.doc.owner]) || this.findMe(list.doc.members);
    if (!registrant) {
        alert("can't find registrant.");
        return;
    }
    form.find('input[name=assignee]:checked').each(function(i, ele){
        assignee.push(ele.value);
    });
    if (task_id) {
        form.fadeOut(this.speed);
    } else {
        that.submitFinalize(form);
    }
    // console.log({
    //     list_id: list.id,
    //     task_id: task_id,
    //     registrant: registrant,
    //     title: title,
    //     description: description,
    //     due: due,
    //     assignee: (assignee.length ? assignee : 0)
    // });
    return this.ajax({
        type: 'post',
        url: url,
        data: {
            list_id: list.id,
            task_id: task_id,
            registrant: registrant,
            title: title,
            description: description,
            due: due,
            assignee: (assignee.length ? assignee : 0)
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            // FIXME: 
            if (!task_id) {
                that.statusUpdate('create a task.');
                var task = data.task;
                list.taskmap[task.id] = task;
                list.doc.tasks.push(task);
                var li = that.renderTask(list, task);
                that.taskli[list.id + '-' + task.id] = li;
                var filter = that.tasksFilterGenerate();
                if (!filter(li)) {
                    li.delay(500).slideUp('slow');
                }
            }
            else {
                that.statusUpdate('update a task.');
                // FIXME
                var task = data.task;
                $.extend(that.listmap[list.id].taskmap[task.id], data.task);
                var li = that.taskli[list.id + '-' + task.id];
                var li2 = that.createTaskElement(list, task);
                li.replaceWith(li2);
            }
        }
    });
}
function submitClearTrash(form) {
    var that = this;
    var list_id = form.data('list-id');
    var list = this.listmap[list_id];
    var owner = this.findMe([list.doc.owner]) || this.findMe(list.doc.members);
    return this.ajax({
        type: 'post',
        url: '/api/1/list/clear',
        data: {
            list_id: list_id,
            owner: owner
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            that.statusUpdate('clear trash ' + data.count + ' tasks remove.');
            var list = that.listmap[list_id];
            var tasks = [];
            for (var i = 0; i < list.doc.tasks.length; i++) {
                var task = list.doc.tasks[i];
                if (task.closed) {
                    that.taskli[list.id + '-' + task.id].remove();
                    delete list.taskmap[task.id];
                } else {
                    tasks.push(task);
                }
            }
            list.doc.tasks = tasks;
        }
        form.fadeOut(that.speed, function(){
            $('#recycle-button').click();
        });
    });
}
function resetCreateTask(form) {
    form.find('input[type=text], textarea').val('');
    $('#create-task-assignee').find('input[type=checkbox].').attr('checked', false);
}

// MainContents
function registAssignee(friends) {
    for (var i = 0; i < friends.length; i++) {
        this.friends['@' + friends[i].screen_name] = friends[i];
        var label = this.createAssigneeLabel(friends[i]);
        this.assignee.push({
            value: '@' + friends[i].screen_name,
            label: label
        });
    }
}
function createAssigneeLabel(friend) {
    var url = this.getTwitterProfileImageUrl(friend.screen_name);
    var html =
        '<span><img class="twitter_profile_image" src="'
        + url
        + '">'
        + friend.name + '(' + friend.screen_name + ')'
        + '</span>';
    // var html =
    //     $('<span></span>')
    //     .text(friend.name + '(' + friend.screen_name + ')')
    //     .prepend($('<img class="twitter_profile_image">').attr('src', url))
    //     .html();
    return html;
}
function createAssigneeList(friend) {
    var del = $('<span class="icon icon-delete"></span>');
    var li =
        $('<li></li>')
        .append(this.createAssigneeLabel(friend))
        .data('code', '@' + friend.screen_name)
        .attr('class', 'member')
        .append(del);
    del.click(function(){li.remove()});
    return li;
}
function renderTask(list, task) {
    var li = this.createTaskElement(list, task);
    this.parts.tasks.prepend(li);
    return li;
}
function createTaskElement(list, task) {
    var that = this;
    var li = $(this.template.task);
    li.data('list-id', list.id);
    li.data('id', task.id);
    li.data('updated', task.updated);
    var due = 0;
    if (task.due) {
        var mdy = task.due.split('/');
        due = mdy[2] * 10000 + mdy[0] * 100 + mdy[1];
    }
    li.data('due', due);
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
    li.find('.due').text(task.due);
    if ("assignee" in task && task.assignee && task.assignee.length) {
        for (var i = 0; i < task.assignee.length; i++) {
            var assignee = task.assignee[i];
            var url = that.getTwitterProfileImageUrl(assignee.substring(1));
            var img = $('<img/>').attr('src', url);
            li.find('.assignee')
                .removeClass('icon-address-off')
                .append(img);
            if (this.findMe(task.assignee)) {
                li.find('.assignee').addClass('my');
            }
        }
    }
    
    
    var content = $('<div class="content"></div>');
    if (task.description) {
        var make_link = function(href, text) {
            var a = document.createElement('a');
            a.href = href;
            a.target = '_blank';
            a.appendChild(document.createTextNode(text));
            var div = document.createElement('div');
            div.appendChild(a);
            return div.innerHTML;
        };
        var pre = $('<pre class="description"></pre>').text(task.description);
        var re = new RegExp('(?:https?://[\\x21-\\x7e]+)', 'g');
        pre.html(pre.html().replace(re, function(m0){ return make_link(m0, m0) }));
        content.append(pre);
    }
    var comments = $('<ul class="comments"></ul>');
    if (task.comments) {
        for (var i = 0; i < task.comments.length; i++) {
            var comment = task.comments[i];
            this.renderComment(list.id, task.id, comment, comments);
        }
    }
    var commentBox = $(document.createElement('div'));
    var form = $(document.createElement('form'));
    var text = $(document.createElement('textarea'));
    form.append(text);
    commentBox.attr('class', 'commentBox');
    commentBox.append(form);
    commentBox.hide();
    text.keydown(function(e){
        if (e.keyCode === 13) {
            e.stopPropagation();
            e.preventDefault();
            if (text.val().length) {
                that.submitComment(list.id, task.id, text, form, comments);
            }
        } else {
            
        }
    });
    text.keypress(function(e){
        if (e.keyCode === 13) {
            e.preventDefault();
        }
    })
    text.keyup(function(e){
        if (e.keyCode === 13) {
            e.preventDefault();
        }
    })
    text.autogrow({single: true});
    text.click(function(e){
        e.stopPropagation();
    });
    
    // form.bind('submit', function(){
    //     try {
    //         that.submitComment(list.id, task.id, text, form, comments);
    //     } catch(e) {
    //         console.log(e);
    //     }
    //     return false;
    // });
    
    li.click(function(){
        if (content.css('display') === 'none') {
            content.show();
        }
        commentBox.slideToggle(that.speed, function(){
            if (commentBox.css('display') !== 'none') {
                text.get(0).focus();
            }
        });
    });
    content.append(comments);
    content.append(commentBox);
    if ("mainmenu-switch-description" in this.account.state.button) {
        if (!this.account.state.button["mainmenu-switch-description"]) {
            content.hide();
        }
    }
    li.append(content);
    li.find('> .action').click($.proxy(this.clickTaskAction, this));
    li.find('.grip').click(function(e){
        e.stopPropagation();
    });
    if (task.status === 1) {
        li.find('.icon-tasks-off')
        .removeClass('icon-tasks-off')
        .addClass('icon-progress');
    }
    else if (task.status === 2) {
        li.find('.icon-tasks-off')
        .removeClass('icon-tasks-off')
        .addClass('icon-tasks-on');
    }
    if (task.closed) {
        li.addClass('delete');
        li.find('.icon-delete')
        .removeClass('icon-delete')
        .addClass('icon-recycle');
        li.hide();
    }
    if (list.id + ':' + task.id in this.account.state.watch) {
        li.find('.icon-star-off')
        .removeClass('icon-star-off')
        .addClass('icon-star-on');
    }
    this.initEventGuide(li);
    return li;
}
function clickTaskAction(e) {
    var that = this;
    e.stopPropagation();
    var div = $(e.currentTarget);
    var li = div.parent();
    var list_id = li.data('list-id');
    var task_id = li.data('id');
    var list = that.listmap[list_id];
    var registrant = this.findMe([list.doc.owner]) || this.findMe(list.doc.members);
    if (!registrant) {
        alert("can't find registrant.");
        return;
    }
    if (div.hasClass('icon-delete')) {
        li.addClass('delete');
        div.addClass('icon-recycle').removeClass('icon-delete');
        this.modifyTask({
            registrant: registrant,
            list_id: list_id,
            task_id: task_id,
            closed: 1
        });
        li.slideUp(that.speed);
    }
    else if (div.hasClass('icon-recycle')) {
        li.removeClass('delete');
        div.addClass('icon-delete').removeClass('icon-recycle');
        this.modifyTask({
            registrant: registrant,
            list_id: list_id,
            task_id: task_id,
            closed: 0
        });
        li.slideUp(that.speed);
    }
    else if (div.hasClass('icon-tasks-off')) {
        li.removeClass('delete');
        li.find('.icon-recycle').removeClass('icon-recycle').addClass('icon-delete');
        div.removeClass('icon-tasks-off');
        div.addClass('icon-progress');
        this.modifyTask({
            registrant: registrant,
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
            registrant: registrant,
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
            registrant: registrant,
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
    }
    else if (div.hasClass('icon-edit')) {
        this.clickOpenButton(e, div);
    }
    else if (div.hasClass('assignee')) {
        this.clickOpenButton(e, div);
    }
    
    var filter = this.tasksFilterGenerate();
    if (!filter(li)) {
        li.slideUp(that.speed);
    }
}
function findMeByList(list) {
    for (user_id in this.account.tw) {
        var tw = this.account.tw[user_id];
        var code = '@' + tw.screen_name;
        if (code === list.doc.owner) {
            return code;
        } else {
            for (var i = 0; i < list.doc.members.length; i++) {
                if (code === list.doc.members[i]) {
                    return code;
                }
            }
        }
    }
}
function submitComment(list_id, task_id, text, form, comments) {
    var that = this;
    
    var list = this.listmap[list_id];
    var owner = this.findMeByList(list);
    var comment = text.val();
    return this.ajax({
        type: 'post',
        url: '/api/1/comment/create',
        data: {
            list_id: list_id,
            task_id: task_id,
            owner  : owner,
            comment: comment
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            // FIXME: 
            that.statusUpdate('create a comment.');
            // FIXME
            $.extend(that.listmap[list_id].taskmap[data.task.id], data.task);
            that.taskli[list_id + '-' + data.task.id].data('updated', data.task.updated);
            var li = $('<li/>');
            li.text(comment);
            that.renderComment(list_id, task_id, {
                id: data.comment_id,
                time: (new Date()).getTime(),
                owner: owner,
                comment: comment
            }, comments);
            text.delay(500).val('');
        }
    });
}
function renderComment(list_id, task_id, comment, comments) {
    var that = this;
    var li = $('<li/>');
    var name = $('<span class="name"></span>').text(comment.owner);
    var date = $('<span class="date"></span>').text(this.timestamp(comment.time));
    var message = $('<span class="comment"/>').text(comment.comment);
    var del = $('<span class="action icon icon-delete"></span>');
    del.click(function(e){
        e.stopPropagation();
        that.deleteComment(list_id, task_id, comment);
        li.remove();
    });
    li.append(name);
    li.append(message);
    li.append($('<br>'));
    li.append(date);
    li.append(del);
    if (this.listReadLastTime(list_id) < comment.time) {
        li.addClass('unread');
        this.unread_comment_count++;
    }
    comments.append(li);
}
function deleteComment(list_id, task_id, comment) {
    var that = this;
    var list = this.listmap[list_id];
    var owner = this.findMeByList(list);
    return this.ajax({
        type: 'post',
        url: '/api/1/comment/delete',
        data: {
            owner: owner,
            list_id: list_id,
            task_id: task_id,
            comment_id: comment.id
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success) {
            // FIXME: 
            that.statusUpdate('delete a comment.');
            // FIXME
            $.extend(that.listmap[list_id].taskmap[data.task.id], data.task);
        }
    });
}
function renderMember(code) {
    var url = this.getTwitterProfileImageUrl(code.substring(1));
    var li = $(document.createElement('li'));
    var img = $(document.createElement('img'));
    img.attr('src', url);
    li.attr('class', 'twitter_profile_image');
    li.append(img);
    li.data('code', code);
    li.data('url', url);
    li.data('method', 'open');
    li.data('id', 'create-task-window');
    li.data('callback', 'createTaskWithMember');
    li.data('code', code);
    li.get(0).addEventListener("click", this, false);
    this.parts.listmembers.append(li);
}

})(this, this, document);
