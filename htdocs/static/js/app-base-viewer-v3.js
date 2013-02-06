"use strict";
(function(ns, w, d, $) {

var app = ns.app;

app.data.listli_map = {};
app.data.taskli_map = {};
app.data.listtr_map = {};
app.data.current_tag = null;
app.data.current_filter = null;

app.addEvents('registerSubAccount');
app.addEvents('registerFriends');

app.addEvents('registerList');
app.addEvents('openList');
app.addEvents('openNextList');
app.addEvents('openPrevList');
app.addEvents('createList');
app.addEvents('editList');
app.addEvents('editListMember');
app.addEvents('leaveListMember');
app.addEvents('deleteListBegin');
app.addEvents('deleteList');
app.addEvents('clearList');
app.addEvents('publicListBegin');
app.addEvents('publicList');
app.addEvents('privateList');
app.addEvents('collapseList');

app.addEvents('registerTask'); // サーバーから取得又は登録フォームから登録した場合発火
app.addEvents('openTask');
app.addEvents('openTaskInHome');
app.addEvents('openNextTask');
app.addEvents('openPrevTask');
app.addEvents('openTopTask');
app.addEvents('openBottomTask');
app.addEvents('missingTask');
app.addEvents('createTask');    // 登録フォーム表示(新規モード)
app.addEvents('createSubTask'); // 登録フォーム表示(新規モード)
app.addEvents('editTask');      // 登録フォーム表示(編集モード)
app.addEvents('clearTask');
app.addEvents('sortTask');
app.addEvents('filterTask');
app.addEvents('memberTask');
app.addEvents('toggleTag');
app.addEvents('resetTag');

app.addEvents('checkStar');
app.addEvents('checkMute');
app.addEvents('checkTag');
app.addEvents('resetCounter');

app.addEvents('clickNotification');

app.addEvents('receiveMe'); // receive me from api
app.addEvents('receiveNotice');
app.addEvents('receiveInvite');

app.addListener('registerList', function(list){
	app.data.list_map[list.id] = list;
});
app.addListener('deleteList', function(list){
	delete app.data.list_map[list.id];
});
app.addListener('clearList', function(list){
});
app.addListener('collapseList', function(list, collapse){
	var ns = 'state.collapse';
	var method = 'set';
	var key = list.id;
	var val = 1;
	if (!collapse) {
		ns = 'state';
		method = 'off';
		key = 'collapse';
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
			app.data.state.collapse = data.account.state.collapse;
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
});
app.addListener('openTaskInHome', function(task){
	app.fireEvent('selectTab', 'viewer', 'task');
	app.fireEvent('selectTab', 'homemenu', 'task');
	app.fireEvent('openTask', task);
});
app.addListener('missingTask', function(){
	w.location.hash = '';
});
app.addListener('registerTask', function(task, list){
	// リスト
	task.list = list;

	// 期日
	if (task.due) {
		task.due_date = app.date.parse(task.due);
		task.due_epoch = task.due_date.getTime();
	} else {
		task.due_epoch = 0;
	}

	task.status = Number(task.status);
	task.closed = Number(task.closed);

	// 直近の履歴・コメント
	task.pins = [];
	$.each(task.actions.concat().reverse(), function(i, action){
		if (action.is_pinned) {
			task.pins.push(action);
		}
		if (!app.util.findMe([action.account_id])) {
			if (action.message && action.message !== '[like]') {
				task.recent = action;
			}
		}
	});

	// 更新前の状態
	if (task.id in app.data.task_map) {
		task.before = $.extend({}, app.data.task_map[task.id]);
	}

	// 責任者
	if (task.status === 2) {
		task.person = String(task.requester);
	}
	else if (task.assign.length) {
		task.person = String(task.assign.join(','));
	}
	else {
		task.person = String(task.requester);
	}

	$.extend(app.data.task_map[task.id], task);

	app.data.task_map[task.id] = task;

	// if (app.data.current_task && task.id === app.data.current_task.id) {
	//     app.data.current_task = task;
	// }
});
app.addListener('registerSubAccount', function(sub_account){
	var icon = ( sub_account.data && sub_account.data.icon ) ?
				 sub_account.data.icon
			 : /^tw-[0-9]+$/.test(sub_account.code) ?
				 '/api/1/profile_image/'
				 + sub_account.name
			 : /^fb-[0-9]+$/.test(sub_account.code) ?
				'https://graph.facebook.com/'
				+ sub_account.code.substring(3)
				+ '/picture'
			 : '/static/img/address24.png';
	app.data.users[sub_account.code] = {
		name: sub_account.name,
		icon: icon
	};
});
app.addListener('clickNotification', function(option){
	app.fireEvent('selectTab', 'viewer', 'task');
	app.api.account.me(option);
});
app.addListener('filterTask', function(filter){
	app.data.current_filter = filter;
});
app.addListener('toggleTag', function(tag){
	app.data.current_tag = tag;
	app.fireEvent('resetCounter');
	app.fireEvent('filterTask', app.data.current_filter);
});
app.addListener('resetTag', function(){
	app.data.current_tag = null;
	app.fireEvent('resetCounter');
	app.fireEvent('filterTask', app.data.current_filter);
});

// セットアップ
app.addListener('ready', function(){
	// ネスト解除エリア
	document.body.addEventListener('dragover', function(e){
		if (!app.data.dragtask.parent_id) {
			return true;
		}
		e.preventDefault();
		e.stopPropagation();
		return false;
	});
	document.body.addEventListener('dragleave', function(e){
	});
	document.body.addEventListener('drop', function(e){
		app.api.task.update({
			list_id: app.data.dragtask.list.id,
			task_id: app.data.dragtask.id,
			parent_id: ''
		});
	}, false);
});
app.addListener('clear', function(){
	app.data.list_map = {};
	app.data.task_map = {};
	app.data.users = {};
	app.data.assigns = [];
});
app.addListener('reload', function(){
	app.api.account.me({
		data: {
			if_modified_since: app.data.if_modified_since,
			if_modified_lists: app.data.if_modified_lists
		}
	});
});
app.addListener('setup', function(option){
	var option = { setup: true };
	var hash = w.location.hash;
	if (!hash.length) {
		hash = localStorage.getItem('hash');
		if (hash) {
			w.location.hash = hash;
			localStorage.removeItem('hash');
		}
	}
	if (hash) {
		var str = hash.match(/^#(\d+)-(\d+:\d+)$/);
		if (str) {
			option.list_id = str[1];
			option.task_id = str[2];
		}
	}
	if (navigator.onLine){
		app.api.account.me(option);
	} else {
		var data = localStorage.getItem("me");
		if (data) {
			app.util.buildMe(option, JSON.parse(data));
		}
	}
});
app.addListener('receiveSign', function(){
	if (app.state.signin) return;
	app.state.signin = true;
	setInterval(function(){
		app.api.account.me({
			data: {
				if_modified_since: app.data.if_modified_since,
				if_modified_lists: app.data.if_modified_lists
			}
		});
	}, 300000);
});

app.dom.scrollTopFix = function(wrapper, target, forceTop){
	if (target.is(':first-child') || forceTop) {
		target = target.parent().parent();
	}
	var top           = wrapper.scrollTop();
	var bottom        = top + wrapper.height();
	var target_top    = top + target.offset().top - wrapper.offset().top;
	var target_bottom = target_top + target.height();
	if (target_top < top || target_bottom > bottom || forceTop) {
		wrapper.scrollTop(target_top);
	}
}
app.setup.tooltip = function(ele){
	var tooltip = $('#ui-tooltip');
	if (! tooltip.length) {
		return;
	}
	var text = app.dom.text(ele);
	var show = function(){
		if (!ele.is(':visible')) {
			return;
		}
		tooltip
			.find('.tooltip-inner').text(text);
		tooltip
			.remove()
			.css({ top: 0, left: 0, display: 'block' })
			.appendTo(d.body);
		var pos = ele.offset();
		pos.width = ele.get(0).offsetWidth;
		pos.height = ele.get(0).offsetHeight;
		var left = pos.left + pos.width / 2 - tooltip.get(0).offsetWidth / 2;
		var css = {
			top: pos.top + pos.height,
			left: (left > 0 ? left : 0)
		};
		tooltip.css(css);
	};
	var timer;
	ele.hover(function(){
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(function(){
			show();
			timer = null;
		}, 800);
	}, function(){
		if (timer) {
			clearTimeout(timer);
			timer = null;
			tooltip.hide();
		} else {
			tooltip.hide();
		}
	});
}
app.setup.messages = function(ele){
	app.data.messages = ele;
}
app.setup.profile = function(ele){
	var img = ele.find('img');
	var span = ele.find('span:first');
	app.addListener('receiveSign', function(sign){
		img.attr('src', sign.icon);
		span.text(sign.name);
	});
}
app.setup.switchClosed = function(ele){
	app.addListener('filterTask', function(condition){
		ele.toggleClass('active', Boolean(condition && condition.closed));
	});
	ele.click(function(){
		var val = ele.hasClass('active') ? 0 : 1;
		app.fireEvent('filterTask', { closed: val });
		if (val) {
			ele.addClass('active');
		} else {
			ele.removeClass('active');
		}
	});
	app.addListener('openTaskInHome', function(task){
		if (Boolean(task.closed) !== Boolean(ele.hasClass('active'))) {
			if (ele.is(':visible')) {
				ele.click();
			}
		}
	});
}
app.setup.taskCounter = function(ele){
	var count = 0;
	var condition = ele.data('counter-condition');
	app.addListener('registerTask', function(task){
		if (app.util.hasChildTask(task)) {
			count = 0;
			for (var task_id in app.data.task_map) {
				if (app.util.taskFilter(app.data.task_map[task_id], condition)) {
					count++;
				}
			}
			ele.text(count);
		} else {
			var before = (task.before && app.util.taskFilter(task.before, condition)) ? 1 : 0;
			var after = app.util.taskFilter(task, condition) ? 1 : 0;
			var add = after - before;
			if (add) {
				count+= add;
				ele.text(count);
			}
		}
	});
	app.addListener('checkMute', function(){
		count = 0;
		for (var task_id in app.data.task_map) {
			if (app.util.taskFilter(app.data.task_map[task_id], condition)) {
				count++;
			}
		}
		ele.text(count);
	});
	app.addListener('resetCounter', function(list){
		count = 0;
		for (var task_id in app.data.task_map) {
			if (app.util.taskFilter(app.data.task_map[task_id], condition)) {
				count++;
			}
		}
		ele.text(count);
	});
	app.addListener('clear', function(){
		count = 0;
		ele.text(count);
	});
}
app.setup.starCounter = function(ele){
	var count = 0;
	app.addListener('registerTask', function(task){
		if (app.util.hasChildTask(task)) {
			count = 0;
			for (var task_id in app.data.task_map) {
				if (app.util.taskFilter(app.data.task_map[task_id], {star: 1})) {
					count++;
				}
			}
			ele.text(count);
		}
		// 初回かつOn
		else if ((!task.before || !app.util.taskFilter(task.before, {star: 1}))
			&& app.util.taskFilter(task, {star: 1})) {
			count++;
			ele.text(count);
		}
		else if (task.before
			&& app.util.taskFilter(task.before, {star: 1})
			&& !app.util.taskFilter(task, {star: 1})) {
			count--;
			ele.text(count);
		}
	});
	app.addListener('checkStar', function(checked){
		count+= checked ? 1 : -1;
		ele.text(count);
	});
	app.addListener('resetCounter', function(list){
		count = 0;
		for (var task_id in app.data.task_map) {
			if (app.util.taskFilter(app.data.task_map[task_id], {star: 1})) {
				count++;
			}
		}
		ele.text(count);
	});
	app.addListener('clear', function(){
		count = 0;
		ele.text(count);
	});
}
app.setup.displaySwitch = function(ele){
	var display = ele.data('display');
	var body = $('body');
	ele.click(function(e){
		e.preventDefault();
		if (ele.hasClass('active')) {
			ele.removeClass('active');
			body.removeClass('display-' + display);
		} else {
			ele.addClass('active');
			body.addClass('display-' + display);
		}
		app.api.account.update({
			ns: 'state.display',
			method: 'set',
			key: display,
			val: ele.hasClass('active') ? 'on' : 'off',
		})
		.done(function(data){
			if (data.success === 1) {
				app.data.state.display = data.account.state.display;
			} else {
				// 現在 ステータスコード 200 の例外ケースは無い
			}
		});
	});
	if (ele.hasClass('active')) {
		body.addClass('display-' + display);
	} else {
		body.removeClass('display-' + display);
	}
	app.addListener('receiveSign', function(){
		if ("display" in app.data.state) {
			if (!(display in app.data.state.display)) {
				return;
			}
			var on = Boolean(app.data.state.display[display] === 'on');
			if (on !== Boolean(ele.hasClass('active'))) {
				ele.click();
			}
		}
	});
}
app.setup.filterTask = function(ele){
	var orig_condition = ele.data('filter-condition');
	app.addListener('filterTask', function(condition){
		if (!condition) {
			ele.removeClass('active');
			return;
		}
		// if (condition.list_id && condition.list_id !== orig_condition.list_id) {
		//     return;
		// }
		for (var key in orig_condition) {
			if (orig_condition[key] !== condition[key]) {
				ele.removeClass('active');
				return;
			}
		}
		ele.addClass('active');
	});
	app.addListener('clear', function(){
		ele.removeClass('active');
	});
}
app.setup.filterLabel = function(ele){
	var orig_class = ele.attr('class');
	app.addListener('toggleTag', function(tag){
		ele.attr('class', orig_class + ' btn-' + tag);
		ele.find('i').addClass('icon-white');
	});
	app.addListener('resetTag', function(){
		ele.attr('class', orig_class);
		ele.find('i').removeClass('icon-white');
	});
}
app.setup.tags = function(ul){
	ul.find('a[data-tag]').each(function(i, element){
		var ele = $(element);
		var tag = ele.data('tag');
		if (tag) {
			ele.click(function(e){
				if (ele.hasClass('active')) {
					app.fireEvent('resetTag');
				} else {
					app.fireEvent('toggleTag', tag);
				}
				return false;
			});
		}
	});
	app.addListener('toggleTag', function(tag){
		ul.find('a[data-tag]').each(function(i, element){
			var ele = $(element);
			ele.toggleClass('active', tag === ele.data('tag'));
		});
	});
	app.addListener('resetTag', function(){
		ul.find('a[data-tag]').removeClass('active');
	});
}
app.click.filterTask = function(ele){
	if (ele.hasClass('active')) {
		app.fireEvent('filterTask', null);
		ele.removeClass('active');
	} else {
		app.fireEvent('filterTask', ele.data('filter-condition'));
		ele.addClass('active');
	}
}
app.setup.sortTask = function(ele){
	ele.click(function(e){
		e.preventDefault();
		e.stopPropagation();
		app.util.sortTaskView(ele.data('sort-column'), ele.data('sort-reverse'));
	});
	app.addListener('sortTask', function(tasks, column, reverse){
		if (column) {
			ele.toggleClass('active', column === ele.data('sort-column'));
		}
	});
}

})(this, window, document, jQuery);