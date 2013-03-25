"use strict";
(function(ns, w, d, $) {

var app = ns.app;

$.extend(app, {
	option: {
		friends_reload_threshold: 24 * 60 * 60 * 1000,
		auto_sync_friends: true,
		show_loading: false
	},
	data: {
		if_modified_since: 0,
		if_modified_lists: '',
		users: {},
		assigns: [],
		current_list: null,
		current_task: null,
		current_sort: {
			column: null,
			reverse: null
		},
		current_filter: null,
		last_list_id: null,
		list_map: {},
		task_map: {},
		taskli_map: {},
		sub_accounts: [],
		holidays: {},
		messages: null,
		animation: true
	},
	state: {
		signin: false,
		offline: false,
		offline_queue: false,
		tab: {},
		animation: true
	},
	queue: {}, // Queue Manager
	loading: {
		wrapper: null,
		spinner: null,
	},
	api: {
		account: {},
		task: {},
		list: {},
		twitter: {}
	},
	sortable: {}
});

app.addEvents('ready');        // document ready
app.addEvents('setup');        // application setup
app.addEvents('clear');        // memory and dom clear
app.addEvents('reload');       // reset => setup
app.addEvents('resize');       // window resize
app.addEvents('alert');        // trouble
app.addEvents('notice');       // notice
app.addEvents('selectTab');    // tag component
app.addEvents('receiveSign');  // receive sign from api
app.addEvents('receiveToken'); // receive token from api

app.addListener('ready', function(){
	if (location.search.indexOf('lang=en') !== -1) {
		app.env.lang = 'en';
	}
	app.dom.disableSelection($('a'));
	app.dom.setup();
	$(w).resize(app.func.debounce(function(e){
		app.fireEvent('resize', e);
	}));
});
app.addListener('receiveToken', function(token){
	app.env.token = token;
});

$(d).ready(function(){
	app.run();
});

app.run = function(){
	app.fireEvent('ready');
	app.fireEvent('setup');
}
app.execute = function(ele, type){
	var methods = ele.data(type).split(',');
	for (var i = 0, max_i = methods.length; i < max_i; i++) {
		if (!(methods[i] in app[type])) {
			console.log({
				message: "missing method.",
				ele: ele,
				type: type,
				key: methods[i]
			});
		}
		app[type][methods[i]].call(app, ele);
	}
}
app.ajax = function(option){
	if ("data" in option && "type" in option && option.type.toLowerCase() === 'post' && app.env.token) {
		if (typeof option.data === 'object') {
			option.data[app.CSRF_TOKEN_NAME] = app.env.token;
		} else {
			option.data = option.data + '&' + app.CSRF_TOKEN_NAME + '=' + app.env.token;
		}
	}
	if (app.option.show_loading && option.loading !== false) {
		app.loading.start();
	}
	return $.ajax(option)
	.fail(function(jqXHR, textStatus, errorThrown){
		console.log(option.url);
		console.log(jqXHR.status);

		if (!jqXHR.status) {
			if (option.salvage) {
				if (!app.state.offline_queue) {
					app.fireEvent('alert', 'offline-queue');
					app.state.offline_queue = true;
				}
			} else {
				if (!app.state.offline) {
					app.fireEvent('alert', 'offline');
					app.state.offline = true;
				}
			}
		}

		// Unauthorized
		else if (jqXHR.status === 401) {
			if (option.setup) {
				app.dom.show($('#signin'));
			} else {
				app.fireEvent('alert', jqXHR.status);
				setTimeout(function(){
					location.href = '/';
				}, 3000);
			}
		}

		// Collision
		else if (jqXHR.status === 403 || jqXHR.status === 404) {
			app.fireEvent('alert', jqXHR.status);
			setTimeout(function(){
				app.fireEvent('reload');
			}, 3000);
		}

		// Internal Server Error
		else if (jqXHR.status >= 500) {
			app.fireEvent('alert', jqXHR.status);
		}
	})
	.done(function(){
		if (option.url !== '/api/1/account/salvage'
			&& option.url !== '/token') {
			app.util.salvage();
		}
	})
	.always(function(){
		if (app.option.show_loading && option.loading !== false) {
			app.loading.stop();
		}
	});
}

app.api.token = function(){
	return app.ajax({
		url: '/token',
		dataType: 'json',
		loading: false
	})
	.done(function(data){
		app.fireEvent('receiveToken', data.token);
	});
}

app.queue.push = function(queue){
	var queues = app.queue.load() || [];
	queues.push(queue);
	localStorage.setItem('queues', JSON.stringify(queues));
}
app.queue.load = function(){
	var queues = localStorage.getItem('queues');
	if (queues) {
		return JSON.parse(queues);
	} else {
		return null;
	}
}
app.queue.clear = function(){
	localStorage.removeItem('queues');
}

app.loading.start = function(){
	if (!app.loading.wrapper) {
		app.loading.wrapper = $('<div id="loading"></div>');
		app.loading.wrapper.appendTo($('body'));
		app.loading.spinner = new Spinner({
			color: '#fff'
		}).spin(app.loading.wrapper.get(0));
	}
	app.loading.spinner.spin(app.loading.wrapper.get(0));
	app.loading.wrapper.show();
}
app.loading.stop = function(){
	app.loading.spinner.stop();
	app.loading.wrapper.hide();
}

app.util.salvage = function(){
	var queues = app.queue.load();
	if (!queues) {
		return;
	}

	return app.ajax({
		url: '/api/1/account/salvage',
		type: 'post',
		data: { queues: JSON.stringify(queues) },
		dataType: 'json'
	})
	.done(function(data){
		if (data.success === 1) {
			app.queue.clear();
			app.dom.show(app.dom.get('showable', 'notice-succeeded-salvage'));
			app.fireEvent('reload');
			app.state.offline = false;
			app.state.offline_queue = false;
		}
	});
}

app.dom.setup = function(){
	var args = $.makeArray(arguments);
	var context = args.shift();
	$('[data-setup]', context).each(function(){
		var ele = $(this);
		var methods = ele.data('setup').split(',');
		for (var i = 0, max_i = methods.length; i < max_i; i++) {
			var f = app.obj.get(app.setup, methods[i]);
			if (f) f.apply(app, [$(this)].concat(args));
		}
	});
}
app.dom.show = function(target){
	if (!target || target.is(':visible')) {
		return;
	}
	var data     = target.data('showable');
	var show     = data.show     || {};
	var effect   = show.effect   || 'drop';
	var option   = show.option   || {};
	var speed    = show.speed    || null;
	var callback = show.callback || null;
	var timeout  = show.timeout  || null;
	if (target.hasClass('modal')) {
		var height = target.height();
		target.css('marginTop', Number(height / 2) * -1 + 'px');
	}
	if (callback) {
		callback = (function(func){
			return function(){
				func.call(app, target);
			}
		})(app.obj.get(app, callback));
	}
	if (timeout) {
		setTimeout(function(){
			app.dom.hide(target);
		}, timeout);
	}
	if (effect === 'none') {
		target.show();
	}
	target.show(effect, option, speed, callback);
	target.trigger('app.dom.show');
	return target;
}
app.dom.hide = function(target){
	if (!target) {
		return;
	}
	var data     = target.data('showable');
	var hide     = data.hide     || {};
	var effect   = hide.effect   || 'drop';
	var option   = hide.option   || {};
	var speed    = hide.speed    || null;
	var callback = hide.callback || null;
	if (callback) {
		callback = (function(func){
			return function(){
				func.call(app, target);
			}
		})(app.obj.get(app, callback));
	}
	if (effect === 'none') {
		target.hide();
	}
	return target.hide(effect, option, speed, callback);
}
app.dom.toggle = function(target){
	if (target.is(':visible')) {
		app.dom.hide(target);
	} else {
		app.dom.show(target);
	}
}
app.dom.reset = function(form){
	form.get(0).reset();
}
app.dom.autofocus = function(form){
	form.find('[data-autofocus]').focus();
}
app.dom.blur = function(form){
	document.activeElement.blur();
}
app.dom.hover = function(ele, over, out, delay){
	var timer;
	ele.hover(function(){
		if (timer) {
			clearTimeout(timer);
			timer = null;
		} else {
			over.apply(this, arguments);
		}
	}, function(){
		var that = this,
			args = $.makeArray(arguments);
		timer = setTimeout(function(){
			out.apply(that, args);
			timer = null;
		}, delay);
	});
}
app.dom.get = function(type, id){
	if (!(type in app.dom.cache)) {
		console.log('missing app.dom.cache.' + type);
		return;
	}
	if (!(id in app.dom.cache[type])) {
		console.log('missing app.dom.cache.' + type + '.' + id);
		return;
	}
	return app.dom.cache[type][id];
}
app.dom.set = function(type, id, ele){
	if (!(type in app.dom.cache)) {
		app.dom.cache[type] = {};
	}
	app.dom.cache[type][id] = ele;
}
app.dom.disableSelection = function(ele){
	ele.on($.support.selectstart ? 'selectstart' : 'mousedown', function(e){
		e.preventDefault();
	});
}

app.setup.localize = function(ele){
	ele.text(ele.data('text-' + app.env.lang));
}
app.setup.click = function(ele){
	ele.click(function(e){
		e.preventDefault();
		app.execute(ele, 'click');
	});
}
app.setup.submit = function(ele) {
	ele.submit(function(e){
		e.preventDefault(); // stop submit
		app.execute(ele, 'submit');
	});
}
app.setup.menu = function(ele){
	var ul = ele.find('> ul');
	app.dom.hover(ele, function(){
		ul.slideDown('fast');
	}, function(){
		ul.slideUp('fast');
	}, 250);
	ul.on('click', 'a', function(){
		ul.slideUp('fast');
	});
}
app.setup.stretch = function(ele){
	var option   = ele.data('stretch') || {};
	var padding  = option.padding || 0;
	var offset   = option.offset  || ele.offset().top;
	var callback = function(){
		ele.height(
			$(w).height()
			- offset
			- parseInt(ele.css('paddingTop'), 10)
			- parseInt(ele.css('paddingBottom'), 10)
			- padding
		);
	};
	app.addListener('resize', callback);
	callback.call();
}
app.setup.ui = function(ele){
	var uis = ele.data('ui').split(',');
	for (var i = 0, max_i = uis.length; i < max_i; i++) {
		var ui = uis[i];
		if (ui in ele) {
			ele[ui].call(ele);
		}
	}
}
app.setup.escclose = function(ele){
	ele.on('keydown', function(e){
		if (e.keyCode === 27) {
			app.dom.hide(ele);
		}
	});
}
app.setup.shortcut = function(ele){
	var option = ele.data('shortcut');
	$(d).keydown(function(e){
		if (document.activeElement.tagName === 'BODY'
			&& !e.shiftKey
			&& !e.ctrlKey
			&& !e.altKey
			&& !e.metaKey
			&& e.keyCode === option.code
			&& ele.is(':visible')) {
			ele.click();
		}
	});
}
app.setup.tab = {};
app.setup.tab.menu = function(ele){
	var option = ele.data('tab');
	ele.click(function(){
		if (ele.hasClass('active') &&
			option.toggle) {
				app.fireEvent('selectTab', option.group, option.toggle);
				app.state.tab[option.group] = option.toggle;
		} else {
			app.fireEvent('selectTab', option.group, option.id);
			app.state.tab[option.group] = option.id;
		}
	});
	app.addListener('selectTab', function(group, id){
		if (group !== option.group) {
			return;
		}
		if (id === option.id) {
			if (ele.hasClass('btn')) {
				ele.addClass('active');
			} else {
				ele.parent().addClass('active');
			}
			app.state.tab[group] = id;
		} else {
			if (ele.hasClass('btn')) {
				ele.removeClass('active');
			} else {
				ele.parent().removeClass('active');
			}
		}
	});
}
app.setup.tab.content = function(ele){
	var option = ele.data('tab');
	app.addListener('selectTab', function(group, id){
		if (group !== option.group) {
			return;
		}
		if (id === option.id) {
			if (option.effect) {
				ele.show(option.effect, 'fast');
			} else {
				ele.show();
			}
		} else {
			if (option.effect) {
				ele.hide();
				// ele.hide(option.effect, 'fast');
			} else {
				ele.hide();
			}
		}
	});
	if (option.group in app.state.tab) {
		if (app.state.tab[option.group] !== option.id) {
			ele.hide();
		} else {
			ele.show();
		}
	}
}
app.setup.uiSortable = function(ele){
	var option = ele.data('ui-sortable');
	ele.sortable({
		cancel: '.nosortable',
		cursor: 'move',
		start: function (e, ui) {
		},
		stop: function (e, ui) {
		},
		update: function(e, ui) {
			(app.obj.get(app, option.update))(ele);
		}
	});
}
app.setup.alert = function(ele){
	var p = ele.find('p:first');
	app.addListener('alert', function(status){
		p.text(p.data('text-error-' + status + '-' + app.env.lang));
		app.dom.show(ele);
	});
}
app.setup.notice = function(ele){
	var p = ele.find('p:first');
	app.addListener('notice', function(status){
		var text = p.data('text-' + status + '-' + app.env.lang);
		if (text) {
			p.text(text);
			app.dom.show(ele);
		}
	});
}
app.setup.form = function(form){
	app.addListener('receiveToken', function(token){
		$('<input type="hidden"/>')
			.attr('name', app.CSRF_TOKEN_NAME)
			.val(token)
			.appendTo(form);
	});
}
app.setup.showable = function(ele){
	var val = ele.attr('data-showable'), option;
	if (val) {
		var json = val.replace(/\s|\n/g, '');
		option = JSON.parse(json);
		ele.attr('data-showable', json);
	}
	app.dom.set('showable', option.id, ele);
}
app.setup.show = function(ele){
	var option = ele.data('show');
	ele.click(function(e){
		e.preventDefault();
		app.dom.show(app.dom.get('showable', option.id));
	});
}
app.setup.hide = function(ele){
	var option = ele.data('hide');
	ele.click(function(e){
		e.preventDefault();
		app.dom.hide(app.dom.get('showable', option.id));
	});
}
app.setup.toggle = function(ele){
	var option = ele.data('toggle');
	ele.click(function(e){
		e.preventDefault();
		app.dom.toggle(app.dom.get('showable', option.id));
	});
}
app.setup.guide = function(ele){
	var option = ele.data('guide');
	app.dom.hover(ele, function(){
		var guide = app.dom.get('showable', option.id);
		var offset = ele.offset();
		if (option.top) {
			guide.css('top', offset.top + option.top + 'px');
		}
		if (option.left) {
			guide.css('left', offset.left + option.left + 'px');
		}
		app.dom.show(guide);
	}, function(){
		app.dom.hide(app.dom.get('showable', option.id));
	}, 500);
}

app.api.account.me = function(option){
	if (!navigator.onLine) {
		console.log('offline');
		return;
	}
	return app.ajax({
		url: '/api/1/account/me',
		data: option.data,
		dataType: 'json',
		loading: false,
		setup: option.setup
	})
	.done(function(data){
		if (data) {
			// console.log(data);
			// localStorage.setItem("me", JSON.stringify(data));
			app.util.buildMe(option, data);
		}
	});
}
app.api.account.update = function(params){
	return app.ajax({
		type: 'post',
		url: '/api/1/account/update',
		data: params,
		dataType: 'json',
		salvage: true,
		loading: false
	})
	.fail(function(jqXHR, textStatus, errorThrown){
		if (!jqXHR.status) {
			app.queue.push({
				api: 'account.update',
				req: params
			});
		}
	});
}
app.api.account.update_profile = function(params){
	return app.ajax({
		type: 'post',
		url: '/api/1/account/update_profile',
		data: params,
		dataType: 'json',
		salvage: false,
		loading: false
	});
}
app.api.task.update = function(params){
	var list = app.data.list_map[params.list_id];
	if (!list) {
		alert('unknown list ' + params.list_id);
		return;
	}
	if (!(params.task_id in app.data.task_map)) {
		// FIXME
		return;
	}
	var action;
	var status_map = {
		0: 'reopen-task',
		1: 'start-task',
		2: 'fix-task'
	};
	if ("status" in params) {
		action = status_map[params.status];
	}
	if ("closed" in params) {
		action = params.closed ? 'close-task' : 're' +
			status_map[app.data.task_map[params.task_id].status];
	}
	if (action) {
		var time = (new Date()).getTime();
		app.data.task_map[params.task_id].actions.push({
			account_id: app.data.sign.account_id,
			action: action,
			time: time
		});
		app.data.task_map[params.task_id].updated_on = time;
	}
	var task = $.extend({}, app.data.task_map[params.task_id], params);
	app.fireEvent('registerTask', task, list);
	app.ajax({
		type: 'POST',
		url: '/api/1/task/update',
		data: params,
		dataType: 'json',
		salvage: true,
		loading: false
	})
	.done(function(data){
		if (data.success === 1) {
			$.extend(app.data.task_map[params.task_id], data.task);
			if ("parent_id" in params) {
				app.util.sortTaskView();
			}
			// app.data.task_map[params.task_id].updated_on = data.task.updated_on;
			// app.fireEvent('registerTask', data.task, list); // update updated_on
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	})
	.fail(function(jqXHR, textStatus, errorThrown){
		if (!jqXHR.status) {
			app.queue.push({
				api: 'task.update',
				req: params,
				updated_on: task.updated_on
			});
			task.salvage = true;
			app.fireEvent('registerTask', task, list);
		}
	});
}
app.api.task.move = function(src_list_id, task_id, dst_list_id){
	if (src_list_id === dst_list_id) {
		alert("Can't be moved to the same list.");
		return;
	}
	return app.ajax({
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
		if (data.success === 1) {
			$.each(data.tasks, function(i, task){
				app.fireEvent('registerTask', task, app.data.list_map[dst_list_id]);
				// if (app.data.current_task && app.data.current_task.id === task.id) {
				//     app.fireEvent('openTask', task);
				// }
			});
		}
	});
}
app.api.list.invite = function(list_id){
	return app.ajax({
		type: 'post',
		url: '/api/1/list/invite',
		data: {
			list_id: list_id
		},
		dataType: 'json',
		salvage: false,
		loading: false
	});
}
app.api.list.disinvite = function(list_id){
	return app.ajax({
		type: 'post',
		url: '/api/1/list/disinvite',
		data: {
			list_id: list_id
		},
		dataType: 'json',
		salvage: false,
		loading: false
	});
}
app.api.list.join = function(list_id, invite_code){
	return app.ajax({
		type: 'post',
		url: '/api/1/list/join',
		data: {
			list_id: list_id,
			invite_code: invite_code
		},
		dataType: 'json',
		salvage: false,
		loading: false
	});
}
app.api.list.leave = function(list_id, account_id){
	return app.ajax({
		type: 'post',
		url: '/api/1/list/leave',
		data: {
			list_id: list_id,
			account_id: account_id
		},
		dataType: 'json',
		salvage: false,
		loading: false
	});
}

app.util.getIconUrl = function(account_id, size){
	if (!navigator.onLine) {
		return '/static/img/address.png';
	}
	var user = app.data.users[account_id];
	if (user) {
		return user.icon;
	}
	return size === 16 ? '/static/img/address.png' : '/static/img/address24.png';
}
app.util.getIcon = function(account_id, size){
	var src = app.util.getIconUrl(account_id, size);
	if (!src) {
		src = '/static/img/address.png';
	}
	return $('<img/>').attr('src', src).addClass('sq' + size);
}
app.util.getName = function(account_id){
	var user = app.data.users[account_id];
	if (user) {
		return user.name;
	} else {
		return account_id;
	}
}
app.util.findMe = function(account_ids){
	for (var i = 0, max_i = account_ids.length; i < max_i; i++) {
		if (Number(app.data.sign.account_id) === Number(account_ids[i])) {
			return app.data.sign.account_id;
		}
	}
	return false;
}
app.util.findAccount = function(account_id, account_ids){
	for (var i = 0, max_i = account_ids.length; i < max_i; i++) {
		if (Number(account_id) === Number(account_ids[i])) {
			return account_id;
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
app.util.taskFilter = function(task, condition){
	if (app.data.current_tag) {
		if (!((task.list.id in app.data.state.tags)
			&& (app.data.current_tag === app.data.state.tags[task.list.id]))) {
			return false;
		}
	}
	if (!condition) {
		return !app.util.isCloseTask(task);
	}
	if (condition.none) {
		return false;
	}
	if (condition.closed) {
		if (!app.util.isCloseTask(task)) {
			return false;
		}
	} else {
		if (app.util.isCloseTask(task)) {
			return false;
		}
	}
	if (condition.turn) {
		if (task.list.id !== condition.list_id) {
			return false;
		}
		// if (task.pending) {
		//     return false;
		// }
		if (task.status === 2) {
			if (Number(condition.turn) !== Number(task.requester)) {
				return false;
			}
		} else {
			// if (task.due_epoch && task.due_epoch > (new Date()).getTime()) {
			//     return false;
			// }
			if (task.assign.length) {
				if (!app.util.findAccount(condition.turn, task.assign)) {
					return false;
				}
			} else {
				if (Number(condition.turn) !== Number(task.requester)) {
					return false;
				}
			}
		}
		return true;
	}
	if (condition.todo) {
		if (task.list.id in app.data.state.mute) {
			return false;
		}
		if (task.pending) {
			return false;
		}
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
	}
	if (condition.verify) {
		if (!app.util.findMe([task.requester])) {
			return false;
		}
		if (!app.util.findOthers(task.assign)) {
			return false;
		}
		if (task.status !== 2) {
			return false;
		}
	}
	if (condition.request) {
		if (!app.util.findMe([task.requester])) {
			return false;
		}
		if (!app.util.findOthers(task.assign)) {
			return false;
		}
		if (task.status === 2) {
			return false;
		}
	}
	if (condition.star) {
		if (!(task.id in app.data.state.star)) {
			return false;
		}
	}
	return true;
}
app.util.buildMe = function(option, data){
	var friends
		, friends_data
		, sub_account
		, reload
		, user_id
		, diff
		, status;

	if (data.list_ids !== app.data.if_modified_lists) {
		option.reset = true;
	}

	if (option.reset) {
		app.fireEvent('clear');
	}

	app.fireEvent('receiveToken', data.token);

	app.data.sign = data.sign;
	app.data.state = data.account.state;
	app.data.sub_accounts = data.sub_accounts;
	app.data.users = data.users;
	app.data.if_modified_lists = data.list_ids;
	app.data.holidays = data.holidays;

	app.fireEvent('receiveSign', app.data.sign);

	if (data.notice) {
		app.fireEvent('notice', data.notice);
	}

	if (data.invite) {
		app.fireEvent('receiveInvite', data.invite);
	}

	if (!('mute' in app.data.state)) {
		app.data.state.mute = {};
	}
	if (!('tags' in app.data.state)) {
		app.data.state.tags = {};
	}
	if (!('star' in app.data.state)) {
		app.data.state.star = {};
	}

	for (var i = 0, max_i = data.sub_accounts.length; i < max_i; i++) {
		app.fireEvent('registerSubAccount', data.sub_accounts[i]);
	}

	data.lists.sort(function(a, b){
		return app.data.state.sort.list[a.id] - app.data.state.sort.list[b.id];
	});

	app.state.animation = false;

	var tasks = 0;
	$.each(data.lists, function(i, list){
		if (list.actioned_on > app.data.if_modified_since) {
			app.data.if_modified_since = list.actioned_on;
		}
		app.fireEvent('registerList', list);
		$.each(list.tasks, function(i, task){
			tasks++;
			app.fireEvent('registerTask', task, list);
		});
	});

	app.fireEvent('filterTask', app.data.current_filter);

	app.state.animation = true;

	if (option.setup && !tasks) {
		setTimeout(function(){
			app.dom.show(app.dom.get('showable', 'welcome'));
		}, 600);
	}

	if (option.setup || option.reset) {
		app.util.sortTaskView('due_epoch', false);
	}

	if (option.task_id in app.data.task_map) {
		app.fireEvent('openTaskInHome', app.data.task_map[option.task_id]);
	}

	app.fireEvent('receiveMe', data);
}
app.util.findChildTasks = function(task, callback, tasks){
	if (!tasks) {
		tasks = [];
	}
	for (var id in app.data.task_map) {
		if (app.data.task_map[id].parent_id === task.id) {
			var child = app.data.task_map[id];
			tasks.push(child);
			if (callback) {
				callback(child);
			}
			app.util.findChildTasks(child, callback, tasks);
		}
	}
	return tasks;
}
app.util.isChildTask = function(task, child){
	var childs = app.util.findChildTasks(task);
	for (var i = 0, max_i = childs.length; i < max_i; i++) {
		if (childs[i].id === child.id) {
			return true;
		}
	}
	return false;
}
app.util.findParentTask = function(task){
	return app.data.task_map[task.parent_id];
}
app.util.findParentTasks = function(task){
	var parents = [], current = task;
	var i = 0;
	while (current.parent_id && current.parent_id.length && app.data.task_map[current.parent_id]) {
		var parent = app.data.task_map[current.parent_id];
		if (parent.id === task.id || i > 10) {
			console.log('Circular reference.');
			break; // loop
		}
		parents.push(parent);
		current = parent;
		i++;
	}
	return parents;
}
app.util.hasChildTask = function(task){
	for (var task_id in app.data.task_map) {
		if (app.data.task_map[task_id].parent_id === task.id) {
			return true;
		}
	}
	return false;
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
app.util.sortTask = function(tasks, column, reverse){
	var compareAttribute;
	if (column === 'name') {
		compareAttribute = function(a, b){
			return a.name.localeCompare(b.name);
		};
	} else if (column === 'person') {
		compareAttribute = function(a, b){
			if (a.person === b.person) {
				if (reverse) {
					return (Number(a.updated_on) || 0) - (Number(b.updated_on) || 0);
				} else {
					return (Number(b.updated_on) || 0) - (Number(a.updated_on) || 0);
				}
			}
			return a.person.localeCompare(b.person);
		};
	} else {
		compareAttribute = function(a, b){
			if (a[column] === b[column]) {
				if (reverse) {
					return (Number(a.updated_on) || 0) - (Number(b.updated_on) || 0);
				} else {
					return (Number(b.updated_on) || 0) - (Number(a.updated_on) || 0);
				}
			}
			return (Number(a[column]) || 0) - (Number(b[column]) || 0);
		};
	}
	var compareTask = function(a, b){
		// root直下同士
		if (!a.parent_id && !b.parent_id) {
			return compareAttribute(a, b);
		}
		// 兄弟
		else if (a.parent_id === b.parent_id) {
			return compareAttribute(a, b);
		}
		// A親 - B子
		else if (a.id === b.parent_id) {
			return reverse ? 1 : -1;
		}
		// B親 - A子
		else if (a.parent_id === b.id) {
			return reverse ? -1 : 1;
		}
		else {
			var parentsA = [a].concat(app.util.findParentTasks(a)),
				parentsB = [b].concat(app.util.findParentTasks(b)),
				compareTaskA = parentsA.pop(),
				compareTaskB = parentsB.pop();
			// 共通の親から離れるまでドリルダウン
			for (var i = 0, max_i = 10; i < max_i; i++) {
				if (compareTaskA.id !== compareTaskB.id) {
					break;
				}
				// A親 - B子
				if (!parentsA.length) {
					return reverse ? 1 : -1;
				}
				// B親 - A子
				else if (!parentsB.length) {
					return reverse ? -1 : 1;
				}
				compareTaskA = parentsA.pop();
				compareTaskB = parentsB.pop();
			}

			// 兄弟
			return compareAttribute(compareTaskA, compareTaskB);
		}
	};
	tasks.sort(function(a, b){
		return compareTask(a, b);
	});
	if (reverse) {
		tasks.reverse();
	}
	return tasks;
}
app.util.sortTaskView = function(column, reverse){
	var tasks = [],
		resort = false;
	reverse = Boolean(reverse);
	for (var task_id in app.data.task_map) {
		tasks.push(app.data.task_map[task_id]);
	}
	if (!column) {
		column = app.data.current_sort.column;
		reverse = app.data.current_sort.reverse;
		resort = true;
	}
	if (!resort
		&& app.data.current_sort.column === column
		&& app.data.current_sort.reverse === reverse) {
		reverse = reverse ? false : true;
	}
	app.data.current_sort.column = column;
	app.data.current_sort.reverse = reverse;
	app.fireEvent('sortTask', app.util.sortTask(tasks, column, reverse), column, reverse);
}

})(this, window, document, jQuery);