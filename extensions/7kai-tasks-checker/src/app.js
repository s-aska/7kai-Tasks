(function(ns, w, d) {

var app = ns.app = {
    
    option: {
        signed_in_badge_color: {color: [208, 0, 24, 255]},
        error_badge_color: {color: [190, 190, 190, 255]},
        normal_icon: 'icon-19.png',
        notify_icon: 'icon-19n.png',
        api_url: 'https://tasks.7kai.org/api/1/account/me',
        site_url: 'https://tasks.7kai.org',
        interval: 300000,
        lang: (/^ja/.test(navigator.language) ? 'ja' : 'en')
    },
    
    default_option: {
        notification_off: 0,
        notification_auto_close: 5
    },
    
    data: {
        if_modified_since: 0,
        if_modified_lists: '',
        option: {},
        users: {},
        list_map: {},
        task_map: {},
        taskli_map: {},
        sub_accounts: []
    },

    events: {
        
    },

    // Utility
    util: {
        
    },
    
    date: {
        
    },
    
    chrome: {
        
    },
    
    // API Call
    api: {
        
    },

    // DOM methods
    dom: {
        
    },
    
    // DOM setup methods
    // data-setup="hoge" => app.setup.hoge(element)
    setup: {
        
    },
    
    // DOM click methods
    // data-setup="click" data-click="hoge" => app.click.hoge(element)
    click: {
        
    }
};

app.addEvents = function(name){
    app.events[name] = [];
}
app.addListener = function(name, fh, context){
    app.events[name].push([fh, context]);
}
app.fireEvent = function() {
    var args = $.makeArray(arguments);
    var name = args.shift();
    for (var i = 0, max_i = app.events[name].length; i < max_i; i++) {
        app.events[name][i][0].apply(app.events[name][i][1] || app, args);
    }
}
app.calls = function(ele, type){
    var methods = ele.data(type).split(',');
    for (var i = 0, max_i = methods.length; i < max_i; i++) {
        app[type][methods[i]].call(app, ele);
    }
}
app.setup.click = function(ele){
    ele.click(function(e){
        e.preventDefault();
        app.calls(ele, 'click');
    });
}
app.setup.localize = function(ele){
    ele.text(ele.data('text-' + app.option.lang));
}
app.dom.setup = function(context){
    $('[data-setup]', context).each(function(){
        var ele = $(this);
        var methods = ele.data('setup').split(',');
        for (var i = 0, max_i = methods.length; i < max_i; i++) {
            if (!(methods[i] in app.setup)) {
                continue;
            }
            app.setup[methods[i]].call(app, $(this));
        }
    });
}
app.util.openSite = function(callback){
    app.chrome.findTab(app.option.site_url, function(tab){
        if (tab) {
            // Try to reuse an existing Reader tab
            chrome.tabs.update(tab.id, {selected: true}, callback);
        } else {
            if (!callback) {
                callback = function(tab){
                    chrome.tabs.update(tab.id, {selected: true});
                }
            }
            chrome.tabs.create({url: app.option.site_url}, callback);
        }
    });
}
app.click.openSiteMini = function(){
    window.open(app.option.site_url + '?mobile=1', '',
        'width=320,height=480,left=100,top=100');
}
app.chrome.findTab = function(url, callback) {
    chrome.tabs.getAllInWindow(undefined, function(tabs) {
        for (var i = 0, tab; tab = tabs[i]; i++) {
            if (tab.url && tab.url.substr(0, url.length) === url) {
                callback(tab);
                return;
            }
        }
        callback();
    });
}

app.addEvents('save');

// background
app.setup.background = function(){
    app.option.notification_off =
        localStorage.getItem('org.7kai.tasks.notification.off');
    app.option.notification_auto_close =
        localStorage.getItem('org.7kai.tasks.notification.auto_close');
    if (typeof app.option.notification_off !== 'number') {
        app.option.notification_off = app.default_option.notification_off;
    }
    if (typeof app.option.notification_auto_close !== 'number') {
        app.option.notification_auto_close = app.default_option.notification_auto_close;
    }
    app.data.if_modified_since =
        Number(localStorage.getItem('org.7kai.tasks.if_modified_since') || 0);
    app.api.fetch({});
    window.setInterval(function(){
        app.api.fetch({
            data: {
                if_modified_since: app.data.if_modified_since,
                if_modified_lists: app.data.if_modified_lists
            }
        });
    }, app.option.interval);
    
}
app.setup.messages = function(ele){
    app.data.text = ele;
}
app.api.fetch = function(option){
    if (!option.data) {
        option.data = {
            if_modified_since: 0
        };
    }
    return $.ajax({
        url: app.option.api_url,
        data: option.data,
        dataType: 'json'
    })
    .done(function(data){
        
        if (!data) {
            return;
        }
        
        if (data.lists.length === 0) {
            return;
        }

        app.data.sign = data.sign;
        app.data.state = data.account.state;
        app.data.sub_accounts = data.sub_accounts;
        app.data.if_modified_lists = data.list_ids;

        if (!('mute' in app.data.state)) {
            app.data.state.mute = {};
        }

        $.each(data.sub_accounts, function(i, sub_account){
            if (/^tw-[0-9]+$/.test(sub_account.code)) {
                if (!("friends" in sub_account.data)) {
                    return;
                }
                $.each(sub_account.data.friends, function(iii, friend){
                    app.data.users[friend.code] = {
                        name: friend.screen_name + ' (' + friend.name + ')',
                        icon: friend.icon
                    };
                });
            } else if (/^fb-[0-9]+$/.test(sub_account.code)) {
                $.each(sub_account.data.friends, function(iii, friend){
                    app.data.users[friend.code] = {
                        name: friend.name,
                        icon: 'https://graph.facebook.com/'
                            + friend.code.substring(3) + '/picture'
                    };
                });
            }
        });

        var actions = [];
        var count = 0;
        $.each(data.lists, function(i, list){
            if (list.id in app.data.state.mute) {
                return;
            }
            $.each(list.tasks, function(ii, task){
                task.list = list;
                if (task.due) {
                    var degits = task.due.match(/[0-9]+/g);
                    task.due_epoch = (new Date(degits[2], degits[0] - 1, degits[1])).getTime();
                }
                if (app.util.isCount(task)) {
                    count++;
                }
                task.action = 'create-task';
                task.code   = task.registrant;
                task.time   = task.created_on;
                if (app.util.isNoticeTask(task)) {
                    actions.push(task);
                }
                $.each(task.comments, function(iii, comment){
                    comment.task = task;
                    comment.action = 'create-comment';
                    if (app.util.isNoticeAction(comment)) {
                        actions.push(comment);
                    }
                });
                $.each(task.history, function(iii, history){
                    history.task = task;
                    if (app.util.isNoticeAction(history)) {
                        actions.push(history);
                    }
                });
            });
            if (list.actioned_on > app.data.if_modified_since) {
                app.data.if_modified_since = list.actioned_on;
                localStorage.setItem('org.7kai.tasks.if_modified_since', list.actioned_on);
            }
        });
        actions.sort(function(a, b){
            return Number(b.time) - Number(a.time);
        });
        var notifications = $.grep(actions, function(action){
            return (Number(action.time) > option.data.if_modified_since);
        });
        if (data.modified_on > app.data.if_modified_since) {
            app.data.if_modified_since = data.modified_on;
            localStorage.setItem('org.7kai.tasks.if_modified_since', data.modified_on);
        }
        if (option.data.if_modified_since && notifications.length) {
            var recent = notifications[0];
            var key = 'text-' + recent.action + '-' + app.option.lang;
            var action_name = app.data.text.data(key);
            var friend = app.data.users[recent.code];
            if (!app.option.notification_off) {
                app.data.notify = {
                    action: recent,
                    action_name: action_name,
                    friend: friend
                };
                var notification = webkitNotifications.createHTMLNotification(
                    'notify.html'
                );
                notification.show();
            }
            chrome.browserAction.setIcon({path: app.option.notify_icon});
        }
        if (option.callback) {
            option.callback(actions);
        }
        if (count) {
            chrome.browserAction.setBadgeBackgroundColor(app.option.signed_in_badge_color);
            chrome.browserAction.setBadgeText({text: count.toString()});
        } else {
            chrome.browserAction.setBadgeText({text: ''});
        }
    })
    .fail(function(jqXHR, textStatus, errorThrown){
        chrome.browserAction.setBadgeBackgroundColor(app.option.error_badge_color);
        chrome.browserAction.setBadgeText({text: '-'});
    });
}
app.util.isCount = function(task){
    if (task.closed) {
        return false;
    }
    if (
        app.util.isTodoTask(task) ||
        app.util.isRequestTask(task)
    ) {
        return true;
    }
    return false;
}
app.util.isTodoTask = function(task){
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
    return true;
}
app.util.isRequestTask = function(task){
    if (!app.util.findMe([task.requester])) {
        return false;
    }
    if (!app.util.findOthers(task.assign)) {
        return false;
    }
    if (task.status !== 2) {
        return false;
    }
    return true;
}
app.util.isNoticeTask = function(task){
    if (app.util.findMe([task.registrant])) {
        return false;
    }
    if (app.util.findMe(task.assign)) {
        return true;
    }
    return false;
}
app.util.isNoticeAction = function(action){
    if (app.util.findMe([action.code])) {
        return false;
    }
    var task = action.task;
    if (app.util.findMe([task.requester])) {
        return true;
    }
    if (app.util.findMe(task.assign)) {
        return true;
    }
    if (task.id in app.data.state.star) {
        return true;
    }
    return false;
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
app.date.relative = function(epoch){
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

// notify
app.setup.notify = function(ele){
    ele.click(function(e){
        app.data.notifyWindow.close();
        app.click.notification(ele);
    });
    if (app.option.notification_auto_close) {
        var timer = setTimeout(function(){
            app.data.notifyWindow.close();
        }, app.option.notification_auto_close * 1000);
        ele.mousemove(function(){
            clearTimeout(timer);
        });
    }
    var notify = app.data.notify;
    var task = notify.action.task ? notify.action.task : notify.action;
    ele.data('list-id', task.list.id);
    ele.data('task-id', task.id);
    ele.find('img').attr('src', notify.friend.icon);
    ele.find('.action').text(notify.action_name);
    ele.find('.screen_name').text(notify.friend.name);
    ele.find('.date').text('(' + app.date.relative(notify.action.time) + ')');
    ele.find('.list').text(task.list.name);
}
app.click.notification = function(ele){
    var list_id = ele.data('list-id');
    var task_id = ele.data('task-id');
    app.util.openSite(function(tab){
        chrome.tabs.update(tab.id, {selected: true});
        chrome.tabs.sendRequest(tab.id, {
            event: 'clickNotification',
            option: {
                list_id: list_id,
                task_id: task_id
            }
        });
    });
}

// options
app.setup.option = function(ele){
    var off = ele.find('input[name="notification-off"]');
    var auto_close = ele.find('input[name="notification-auto-close"]');
    off.val([app.option.notification_off]);
    auto_close.val(app.option.notification_auto_close);
    app.addListener('save', function(){
        app.option.notification_off = off.attr('checked') ? 1 : 0;
        app.option.notification_auto_close = parseInt(auto_close.val(), 10);
        localStorage.setItem('org.7kai.tasks.notification.off',
            app.option.notification_off);
        localStorage.setItem('org.7kai.tasks.notification.auto_close',
            app.option.notification_auto_close);
    });
}
app.click.save = function(ele){
    app.fireEvent('save');
    app.data.optionWindow.close();
}

// popup
app.setup.popup = function(ele){
    chrome.browserAction.setIcon({path: app.option.normal_icon});
    var ul = ele.find('ul.actions');
    var template = ul.html();
    ul.empty();
    app.api.fetch({callback: function(actions){
        if (actions.length) {
            $.each(actions, function(i, action){
                if (i >= 10) {
                    return false;
                }
                var li = $(template);
                var friend = app.data.users[action.code];
                var key = 'text-' + action.action + '-' + app.option.lang;
                var action_name = app.data.text.data(key);
                var task = action.task ? action.task : action;
                li.data('list-id', task.list.id);
                li.data('task-id', task.id);
                li.find('img').attr('src', friend.icon);
                li.find('.name').text(friend.name);
                li.find('.action').text(action_name);
                li.find('.list').text(task.list.name);
                li.find('.date').text(app.date.relative(action.time));
                li.appendTo(ul);
            })
            app.dom.setup(ul);
        } else {
            ul.append($('<li>no notification.</li>'));
        }
    }});
}
app.click.openSite = function(){
    app.data.popupWindow.close();
    app.util.openSite();
}
app.click.openOption = function(){
    app.data.popupWindow.close();
    chrome.tabs.create({url: "options.html"});
}

})(this, this, document);
