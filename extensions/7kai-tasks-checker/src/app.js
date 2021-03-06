(function(ns, w, d) {

var app = ns.app = {
	REGEXP: {
		URL: new RegExp('(?:https?://[\\x21-\\x7e]+)', 'g')
	},
	option: {
		signed_in_badge_color: {color: [208, 0, 24, 255]},
		error_badge_color: {color: [190, 190, 190, 255]},
		normal_icon: ( w.devicePixelRatio >= 2 ? {38:'icon-38.png'} : {19:'icon-19.png'} ),
		notify_icon: ( w.devicePixelRatio >= 2 ? {38:'icon-38n.png'} : {19:'icon-19n.png'} ),
		api_url: 'https://tasks.7kai.org/api/1/account/me',
		site_url: 'https://tasks.7kai.org/',
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

app.data.text = $($.parseHTML('<div data-setup="messages"'
	+ ' data-text-create-task-en="create the task of the"'
	+ ' data-text-create-task-ja="タスクを作成"'
	+ ' data-text-update-task-en="update the task of the"'
	+ ' data-text-update-task-ja="タスクを更新"'
	+ ' data-text-reopen-task-en="revert the task of the"'
	+ ' data-text-reopen-task-ja="タスクを差戻"'
	+ ' data-text-start-task-en="start the task of the"'
	+ ' data-text-start-task-ja="タスクに着手"'
	+ ' data-text-fix-task-en="fix the task of the"'
	+ ' data-text-fix-task-ja="タスクを処理"'
	+ ' data-text-close-task-en="close the task of the"'
	+ ' data-text-close-task-ja="タスクを完了"'
	+ ' data-text-rereopen-task-en="update (close => open) the task of the"'
	+ ' data-text-rereopen-task-ja="タスクを更新 (完了 => 未着手)"'
	+ ' data-text-restart-task-en="update (close => start) the task of the"'
	+ ' data-text-restart-task-ja="タスクを更新 (処理済 => 着手)"'
	+ ' data-text-refix-task-en="update (close => fix) the task of the"'
	+ ' data-text-refix-task-ja="タスクを更新 (完了 => 処理済)"'
	+ ' data-text-create-list-en="create a"'
	+ ' data-text-create-list-ja="リストを作成"'
	+ ' data-text-update-list-en="updated the"'
	+ ' data-text-update-list-ja="リストを更新"'
	+ ' data-text-comment-en="commented on a task in"'
	+ ' data-text-comment-ja="コメント"'
	+ '></div>'));

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
			if (tab.url && tab.url.replace(/#.*$/, '') === url) {
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
		app.data.users = data.users;

		if (!('mute' in app.data.state)) {
			app.data.state.mute = {};
		}

		var actions = [];
		var count = 0;
		$.each(data.lists, function(i, list){
			// if (list.id in app.data.state.mute) {
			// 	return;
			// }
			$.each(list.tasks, function(ii, task){
				app.data.task_map[task.id] = task;
			});
			$.each(list.tasks, function(ii, task){
				task.list = list;
				if (task.due) {
					var degits = task.due.match(/[0-9]+/g);
					task.due_epoch = (new Date(degits[2], degits[0] - 1, degits[1])).getTime();
				}
				if (app.util.isCount(task)) {
					count++;
				}
				task.action     = 'create-task';
				task.account_id = task.registrant;
				task.time       = task.created_on;
				if (app.util.isNoticeTask(task)) {
					actions.push(task);
				}
				$.each(task.actions, function(iii, comment){
					comment.task = task;
					if (app.util.isNoticeAction(comment)) {
						actions.push(comment);
					}
				});
			});
			if (list.actioned_on > app.data.if_modified_since) {
				app.data.if_modified_since = list.actioned_on;
				localStorage.setItem('org.7kai.tasks.if_modified_since', list.actioned_on);
			}
		});
		actions.sort(function(a, b){
			return b.time - a.time;
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
			var friend = app.data.users[recent.account_id];
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
	if (app.util.isCloseTask(task)) {
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
	if (task.pending) {
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
	if (app.util.findMe([action.account_id])) {
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
app.util.findMe = function(account_ids){
	for (var i = 0, max_i = account_ids.length; i < max_i; i++) {
		if (Number(app.data.sign.account_id) === Number(account_ids[i])) {
			return app.data.sign.account_id;
		}
	}
	return false;
}
app.util.findOthers = function(account_ids){
	for (var i = 0, max_i = account_ids.length; i < max_i; i++) {
		if (app.data.sign.account_id !== account_ids[i]) {
			return account_ids[i];
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
app.util.autolink = function(text){
	return text
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(app.REGEXP.URL, function(url){
		var a = d.createElement('a');
		a.href = url;
		a.target = '_blank';
		a.appendChild(d.createTextNode(url));
		var div = d.createElement('div');
		div.appendChild(a);
		return div.innerHTML;
	});
}
app.util.isCloseTask = function(task){
	if (task.closed) {
		return true;
	};
	var parents = app.util.findParentTasks(task);
	for (var i = 0, max_i = parents.length; i < max_i; i++) {
		if (parents[i].closed) {
			return true;
		}
	}
	return false;
}
app.util.findParentTasks = function(task){
	var parents = [], current = task;
	while (current.parent_id && current.parent_id.length && app.data.task_map[current.parent_id]) {
		var parent = app.data.task_map[current.parent_id];
		parents.push(parent);
		current = parent;
	}
	return parents;
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
	app.chrome.findTab(app.option.site_url, function(tab){
		if (tab) {
			chrome.tabs.update(tab.id, {selected: true}, function(tab){
				chrome.tabs.sendRequest(tab.id, {
					event: 'clickNotification',
					option: {
						list_id: list_id,
						task_id: task_id
					}
				});
			});
		} else {
			chrome.tabs.create({url: app.option.site_url + '#' + list_id + '-' + task_id});
		}
	});
}

// options
app.setup.option = function(ele){
	var off = ele.find('input[name="notification-off"]');
	var auto_close = ele.find('input[name="notification-auto-close"]');
	off.val([app.option.notification_off]);
	auto_close.val(app.option.notification_auto_close);
	app.addListener('save', function(){
		app.option.notification_off = off.prop('checked') ? 1 : 0;
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
	var template = ul.html().replace(/^\s+/g, '').replace(/\s+$/g, '');
	ul.empty();
	app.api.fetch({callback: function(actions){
		if (actions.length) {
			$.each(actions, function(i, action){
				if (i >= 10) {
					return false;
				}
				var li = $($.parseHTML(template));
				var friend = app.data.users[action.account_id];
				var key = 'text-' + action.action + '-' + app.option.lang;
				var action_name = app.data.text.data(key);
				var task = action.task ? action.task : action;
				li.data('list-id', task.list.id);
				li.data('task-id', task.id);
				li.find('img').attr('src', friend.icon);
				li.find('.name').text(friend.name);
				li.find('.task').text(task.name);
				li.find('.list').text(task.list.name);
				li.find('.action').text(action_name).addClass(action.action);
				if ("message" in action) {
					if (action.message === '[like]') {
						li.find('.message').html('<img src="icon-heart.png" class="feeling">');
					} else {
						li.find('.message').html('"' + app.util.autolink(action.message) + '"');
					}
					li.find('.message').prepend($('<br/>'));
				} else {
					li.find('.message').remove();
				}
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
