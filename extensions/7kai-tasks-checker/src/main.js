(function(ns, w, d) {

ns.Tasks = initialize;
ns.Tasks.prototype = {
    
    // 定数
    SIGNED_IN_BADGE_COLOR: {color: [208, 0, 24, 255]},
    ERROR_BADGE_COLOR: {color: [190, 190, 190, 255]},
    INTERVAL: 60 * 1000,
    NORMAL_ICON: 'icon-19.png',
    NOTIFY_ICON: 'icon-19n.png',
    API_URL: 'http://tasks.7kai.org/api/1/',
    VIEWER_URL: 'http://tasks.7kai.org/chrome/viewer',
    default_option: {
        notification_off: 0,
        notification_auto_close: 5
    },
    
    // データ
    parts: {},
    option: {},
    last_history_time: 0,
    
    // メソッド
    refresh: refresh,
    refreshBadge: refreshBadge,
    refreshPopupPage: refreshPopupPage,
    refreshBadgeTimer: refreshBadgeTimer,
    needCount: needCount,
    needHistory: needHistory,
    renderHistories: renderHistories,
    timestamp: timestamp,
    isMe: isMe,
    findMe: findMe,
    findTab: findTab,
    loadOption: loadOption,
    fillOption: fillOption,
    
    // イベント
    openOptionPage: openOptionPage,
    openServicePage: openServicePage,
    openListPage: openListPage,
    saveOption: saveOption,
    
    // 初期化系
    startBackground: startBackground,
    startOptionPage: startOptionPage,
    startNotifyPage: startNotifyPage,
    handleEvent: handleEvent,
    initTimer: initTimer
};

function initialize(options) {
    this.loadOption();
    var last_history_time = localStorage.getItem('org.7kai.tasks.last_history_time');
    if (last_history_time) {
        this.last_history_time = last_history_time;
    }
    this.localizer = new Localizer();
}

// Init
function startBackground() {
    this.parts.text = $('#text');
    this.initTimer();
}
function startOptionPage($) {
    var that = this;
    $('button').each(function(i, ele){
        var ele = $(ele);
        var callback = ele.data('callback');
        if (callback) {
            ele.click(function(e){
                that[callback].call(that, e, $);
            });
        }
    });
    var off = $('#notification-off');
    var auto_close = $('#notification-auto-close');
    off.change(function(){
        if (off.attr('checked')) {
            auto_close.attr('disabled', true);
        } else {
            auto_close.attr('disabled', false);
        }
    });
    this.fillOption($);
}
function startNotifyPage() {
    var notify = this.notify;
    this.parts.notify
        .data('list-id', notify.history.list_id)
        .data('task-id', notify.history.task_id);
    this.parts.notify.find('img').attr('src', notify.friend.profile_image_url);
    this.parts.notify.find('.action').text(notify.action_name);
    this.parts.notify.find('.screen_name').text(notify.friend.screen_name);
    this.parts.notify.find('.date').text('(' + this.timestamp(notify.history.date) + ')');
    this.parts.notify.find('.list').text(notify.history.list_name);
}
function handleEvent(e) {
    var ele = $(e.currentTarget);
    var callback = ele.data('callback');
    if (callback) {
        this[callback].call(this, e, ele);
    }
}
function initTimer() {
    this.refreshBadgeTimer();
}
function refreshBadgeTimer() {
    var that = this;
    this.refreshBadge()
    .always(function(){
        window.setTimeout(function(){
            that.refreshBadgeTimer();
        }, that.INTERVAL);
    });
}
function refresh() {
    return $.ajax({
        type: 'get',
        url: this.API_URL + 'account/',
        dataType: 'json'
    });
}
function refreshBadge(popup) {
    var that = this;
    return this
        .refresh()
        .done(function(data){
            // console.log('refreshBadge done');
            that.localizer.lang = data.account.lang;
            var count = 0,
                last_history_time = 0,
                last_history,
                lists = data.account.lists;
            for (var i = 0, max_i = lists.length; i < max_i; i++) {
                var list = lists[i];
                // badge count
                if (!(list.id in data.account.state.ignore_badge_list)) {
                    var tasks = list.doc.tasks;
                    for (var j = 0, max_j = tasks.length; j < max_j; j++) {
                        var task = tasks[j];
                        if (that.needCount(data.account, task)) {
                            count++;
                        }
                    }
                }
                // notification check
                for (var j = 0, max_j = list.doc.history.length; j < max_j; j++) {
                    var history = list.doc.history[j];
                    if (that.needHistory(data.account, history)) {
                        if (history.date > last_history_time) {
                            history.list_name = list.doc.name;
                            history.list_id = list.id;
                            last_history = history;
                            last_history_time = history.date;
                        }
                    }
                }
            }
            if (count > 0) {
                chrome.browserAction.setBadgeBackgroundColor(that.SIGNED_IN_BADGE_COLOR);
                chrome.browserAction.setBadgeText({text: count.toString()});
            } else {
                chrome.browserAction.setBadgeText({text: ''});
            }
            if (last_history_time > that.last_history_time) {
                that.last_history_time = last_history_time;
                localStorage.setItem('org.7kai.tasks.last_history_time', last_history_time);
                var account = data.account;
                var history = last_history;
                $.ajax({
                    type: 'get',
                    url: that.API_URL + 'contact/lookup_twitter',
                    data: {
                        user_ids: [history.id]
                    },
                    dataType: 'json'
                })
                .done(function(data){
                    var friend = data.friends[0];
                    var key = 'text-' + history.action + '-' + account.lang;
                    var action_name = that.parts.text.data(key);
                    if (!that.option.notification_off) {
                        that.notify = {
                            history: history,
                            action_name: action_name,
                            friend: friend
                        };
                        var notification = webkitNotifications.createHTMLNotification(
                            'notify.html'
                        );
                        notification.show();
                    }
                    if (!popup) {
                        chrome.browserAction.setIcon({path: that.NOTIFY_ICON});
                    }
                });
            }
        })
        .fail(function(){
            chrome.browserAction.setBadgeBackgroundColor(that.ERROR_BADGE_COLOR);
            chrome.browserAction.setBadgeText({text: '-'});
        });
}
function refreshPopupPage(popup) {
    var that = this;
    chrome.browserAction.setIcon({path: that.NORMAL_ICON});
    this.refreshBadge(true)
        .done(function(data){
            // page render.
            var lists = data.account.lists;
            var histories = [];
            for (var i = 0, max_i = lists.length; i < max_i; i++) {
                var list = lists[i];
                for (var j = 0, max_j = list.doc.history.length; j < max_j; j++) {
                    if (that.needHistory(data.account, list.doc.history[j])) {
                        var history = list.doc.history[j];
                        history.list_name = list.doc.name;
                        history.list_id = list.id;
                        histories.push(history);
                    }
                }
            }
            histories.sort(function(a, b){
                return b.date - a.date;
            });
            that.renderHistories(data.account, histories);
        });
}
function openOptionPage() {
    chrome.tabs.create({url: "options.html"});
}
function openServicePage(e, ele, callback) {
    var that = this;
    this.findTab(this.VIEWER_URL, function(tab) {
        if (tab) {
            // Try to reuse an existing Reader tab
            chrome.tabs.update(tab.id, {selected: true}, callback);
        } else {
            if (!callback) {
                callback = function(tab){
                    chrome.tabs.update(tab.id, {selected: true});
                }
            }
            chrome.tabs.create({url: that.VIEWER_URL}, callback);
        }
    });
}
function openListPage(e, ele) {
    var list_id = ele.data('list-id');
    var task_id = ele.data('task-id');
    this.openServicePage(e, ele, function(tab){
        chrome.tabs.update(tab.id, {selected: true});
        chrome.tabs.sendRequest(tab.id, {
            method: 'refresh',
            arguments: [
                {
                    select_list_id: list_id,
                    select_task_id: task_id
                }
            ]
        });
    });
}
function loadOption() {
    this.option.notification_off = localStorage.getItem('org.7kai.tasks.notification.off');
    this.option.notification_auto_close = localStorage.getItem('org.7kai.tasks.notification.auto_close');
    if (typeof this.option.notification_off !== 'number') {
        this.option.notification_off = this.default_option.notification_off;
    }
    if (typeof this.option.notification_auto_close !== 'number') {
        this.option.notification_auto_close = this.default_option.notification_auto_close;
    }
}
function fillOption($) {
    $('#notification-off').val([this.option.notification_off]);
    $('#notification-auto-close').val(this.option.notification_auto_close);
}
function saveOption(e, $) {
    this.option.notification_off = $('#notification-off').attr('checked') ? 1 : 0;
    this.option.notification_auto_close = parseInt($('#notification-auto-close').val(), 10);
    localStorage.setItem('org.7kai.tasks.notification.off', this.option.notification_off);
    localStorage.setItem('org.7kai.tasks.notification.auto_close', this.option.notification_auto_close);
    var msg = $('#msg');
    msg.text('save complete.');
    msg.fadeIn('slow', function(){
        msg.delay(1000).fadeOut('slow');
    });
}
function needCount(account, task) {
    if (task.closed) {
        return false;
    }
    var my_order = this.isMe(account, task.registrant_id);
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
    if (task.assignee_ids.length) {
        return this.findMe(account, task.assignee_ids);
    }
    return my_order;
}
function needHistory(account, history) {
    return !(this.isMe(account, history.id));
}
function renderHistories(account, histories) {
    var that = this;
    var users = {};
    var user_ids = [];
    for (var i = 0, max = histories.length; i < max; i++) {
        if (!users[histories[i].id]) {
            user_ids.push(histories[i].id);
            users[histories[i].id] = true;
        }
    }
    $.ajax({
        type: 'get',
        url: this.API_URL + 'contact/lookup_twitter',
        data: {
            user_ids: user_ids
        },
        dataType: 'json'
    })
    .done(function(data){
        that.parts.notifications.empty();
        var friend_ids = {};
        for (var i = 0, max = data.friends.length; i < max; i++) {
            var friend = data.friends[i];
            friend_ids['tw-' + friend.id] = friend;
        }
        for (var i = 0, max = histories.length; i < max; i++) {
            var history = histories[i];
            if (!history.task_id) {
                history.task_id = 0;
            }
            var friend = friend_ids[history.id];
            var screen_name = $('<span class="screen_name"/>').text(friend.screen_name);
            var icon = $('<img/>').attr('src', friend.profile_image_url);
            var key = 'text-' + history.action + '-' + account.lang;
            var action_name = that.parts.text.data(key);
            var action = $('<span class="action"/>').text(action_name);
            var list = $('<span class="list"/>')
                .text(history.list_name)
            var date = $('<span class="date"/>').text(that.timestamp(history.date));
            $(document.createElement('li'))
            .addClass('clearfix')
            .append(icon)
            .append(screen_name)
            .append(action)
            .append(list)
            .append($('<br>'))
            .append(date)
            .appendTo(that.parts.notifications)
            .data('callback', 'openListPage')
            .data('list-id', history.list_id)
            .data('task-id', history.task_id)
            .get(0).addEventListener("click", that, false);
        }
    });
}
function isMe(account, code) {
    for (var i = 0, max = account.tw_accounts.length; i < max; i++) {
        if (code === 'tw-' + account.tw_accounts[i].user_id) {
            return true;
        }
    }
    return false;
}
function findMe(account, codes) {
    for (var i = 0, max = codes.length; i < max; i++) {
        if (this.isMe(account, codes[i])) {
            return true;
        }
    }
    return false;
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
function findTab(url, callback) {
    var that = this;
    chrome.tabs.getAllInWindow(undefined, function(tabs) {
        for (var i = 0, tab; tab = tabs[i]; i++) {
            if (tab.url && tab.url.substr(0, url.length) === url) {
                callback.call(that, tab);
                return;
            }
        }
        callback(null);
    });
}

})(this, this, document);
