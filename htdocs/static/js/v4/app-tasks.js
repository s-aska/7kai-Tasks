(function(ns, w, d, $) {

$.extend(ns.app, {
	data: {
		if_modified_since: 0,
		if_modified_lists: '',
		users: {},
		assigns: [],
		current_list: null,
		current_task: null,
		current_tag: null,
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
		messages: null
	},
	list: {},
	task: {},
	comment: {}
});

var app = ns.app;
var win = $(w);
var doc = $(d);

/*
 * windowsリサイズだけじゃなくてhelpのon/offなどでも発火させたいので付けてる
 */
app.addEvents('resize');
app.addEvents('receiveMe');
app.addEvents('registerSubAccount');
app.addEvents('registerList');
app.addEvents('registerTask');
app.addEvents('deleteTask');
app.addEvents('deleteList');
app.addEvents('clearList');
app.addEvents('sortTask');
app.addEvents('showTask');

app.addListener('ready', function(){
	app.setup.init();
	win.on('resize', app.util.debounce(function(e){ app.fireEvent('resize', e) }));
	app.load({ setup: true });
});

doc.ready(function(){
	app.fireEvent('ready');
});
app.addListener('registerList', function(list){
	if (!(list.id in app.data.list_map)) {
		$.each(list.tasks, function(){ app.data.task_map[this.id] = this });
	}
	app.data.list_map[list.id] = list;
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

	task.rate   = Number(task.rate ? task.rate : 0);
	task.status = Number(task.status);
	task.closed = Number(task.closed);

	// 直近の履歴・コメント
	task.pins = [];
	$.each(task.actions.concat().reverse(), function(i, action){
		if (action.is_pinned) {
			task.pins.push(action);
		}
		if (!app.util.findMe([action.account_id])) {
			if (!task.recent && action.message && action.message !== '[like]') {
				task.recent = action;
			}
		}
	});

	// 更新前の状態
	// if (task.id in app.data.task_map) {
	// 	task.before = $.extend({}, app.data.task_map[task.id]);
	// }

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

	app.data.task_map[task.id] = task;
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

var loadId;
app.load = function(option){
	if (!option) { option = {} }
	console.log('[load] me: ' + app.data.if_modified_lists + ' ' + app.data.if_modified_since);
	app.api.account.me({
		data: {
			if_modified_since: app.data.if_modified_since,
			if_modified_lists: app.data.if_modified_lists
		}
	}).done(function(data){

		// ポーリング
		if (loadId) { clearTimeout(loadId) }
		loadId = setTimeout(app.load, 300000);

		if (data) {
			console.log('[load] 200');
			app.env.token = data.token;
			app.data.sign = data.sign;
			app.data.state = data.account.state;
			app.data.sub_accounts = data.sub_accounts;
			app.data.users = data.users;
			app.data.if_modified_lists = data.list_ids;
			app.data.if_modified_since = data.modified_since;
			app.data.holidays = data.holidays;

			if (!('mute' in app.data.state)) {
				app.data.state.mute = {};
			}
			if (!('tags' in app.data.state)) {
				app.data.state.tags = {};
			}
			if (!('star' in app.data.state)) {
				app.data.state.star = {};
			}

			$.each(data.sub_accounts, function(i, sub_account){
				app.fireEvent('registerSubAccount', sub_account);
			});

			data.lists.sort(function(a, b){
				return app.data.state.sort.list[a.id] - app.data.state.sort.list[b.id];
			});

			$.each(data.lists, function(i, list){
				app.fireEvent('registerList', list);
				app.util.sortTask(list.tasks, 'created_on');
				$.each(list.tasks, function(i, task){
					app.fireEvent('registerTask', task, list);
				});
				// app.util.sortTaskView('created_on');
			});

			app.fireEvent('receiveMe', data, option);
		} else {
			console.log('[load] 304 Not Modified');
		}

		/*
		 * 通知から発火した場合showTaskする
		 */
		if (option.task_id in app.data.task_map) {
			app.fireEvent('showTask', app.data.task_map[option.task_id], true);
		}
	});
};

app.list.create = function(data){
	return app.api.list.create(data).done(function(data){
		if (data.success === 1) {
			app.fireEvent('registerList', data.list);
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.list.update = function(data){
	return app.api.list.update(data).done(function(data){
		if (data.success === 1) {
			app.fireEvent('registerList', data.list);
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.list.delete = function(list_id){
	return app.api.list.delete(list_id).done(function(data){
		if (data.success === 1) {
			app.fireEvent('deleteList', app.data.list_map[list_id]);
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.list.clear = function(list_id){
	return app.api.list.clear(list_id).done(function(data){
		if (data.success === 1) {
			app.fireEvent('clearList', app.data.list_map[list_id]);
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.list.leave = function(list_id, account_id){
	return app.api.list.leave(list_id, account_id).done(function(data){
		if (data.success === 1) {
			var list = app.data.list_map[list_id];
			var members = [];
			for (var i = 0, max_i = list.members.length; i < max_i; i++) {
				if (account_id !== list.members[i]) {
					members.push(list.members[i]);
				}
			}
			list.members = members;
			app.fireEvent('registerList', list);
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.list.invite = function(list_id){
	return app.api.list.invite(list_id).done(function(data){
		if (data.success === 1) {
			var list = app.data.list_map[list_id];
			list.invite_code = data.invite_code;
			app.fireEvent('registerList', list);
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.list.disinvite = function(list_id){
	return app.api.list.invite(list_id).done(function(data){
		if (data.success === 1) {
			var list = app.data.list_map[list_id];
			list.invite_code = null;
			app.fireEvent('registerList', list);
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.list.public = function(list_id){
	return app.api.list.public(list_id).done(function(data){
		if (data.success === 1) {
			var list = app.data.list_map[list_id];
			list.public_code = data.public_code;
			app.fireEvent('registerList', list);
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.list.private = function(list_id){
	return app.api.list.private(list_id).done(function(data){
		if (data.success === 1) {
			var list = app.data.list_map[list_id];
			list.public_code = null;
			app.fireEvent('registerList', list);
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.task.create = function(params, list){
	return app.api.task.create(params).done(function(data){
		if (data.success === 1) {
			app.fireEvent('registerTask', data.task, list);
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.task.update_without_action = function(params, list){
	var is_move = app.util.findQuery(params, 'parent_id');
	var is_closed = app.util.findQuery(params, 'closed');
	return app.api.task.update(params).done(function(data){
		if (data.success === 1) {
			app.fireEvent('registerTask', data.task, list, is_move);
			if (is_move || is_closed) {
				app.util.findChildTasks(data.task, function(task){
					app.fireEvent('registerTask', task, task.list);
				});
			}
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.task.update = function(params){
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
		0: 'revert-task',
		1: 'start-task',
		2: 'fix-task'
	};
	if ('status' in params) {
		action = status_map[params.status];
	}
	if ('closed' in params) {
		action = params.closed ? 'close-task' : 'reopen-task';
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
	return app.api.task.update(params).done(function(data){
		if (data.success === 1) {
			$.extend(app.data.task_map[params.task_id], data.task);
			if (app.util.findQuery(params, 'closed')) {
				app.util.findChildTasks(data.task, function(task){
					app.fireEvent('registerTask', task, task.list);
				});
			}
			// if ('parent_id' in params) {
			// 	app.util.sortTaskView();
			// }
			// app.data.task_map[params.task_id].updated_on = data.task.updated_on;
			// app.fireEvent('registerTask', data.task, list); // update updated_on
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
	// .done(function(data){
	// 	if (data.success === 1) {
	// 		$.extend(app.data.task_map[params.task_id], data.task);
	// 		if ("parent_id" in params) {
	// 			app.util.sortTaskView();
	// 		}
	// 		// app.data.task_map[params.task_id].updated_on = data.task.updated_on;
	// 		// app.fireEvent('registerTask', data.task, list); // update updated_on
	// 	} else {
	// 		// 現在 ステータスコード 200 の例外ケースは無い
	// 	}
	// })
	// .fail(function(jqXHR, textStatus, errorThrown){
	// 	if (!jqXHR.status) {
	// 		app.queue.push({
	// 			api: 'task.update',
	// 			req: params,
	// 			updated_on: task.updated_on
	// 		});
	// 		task.salvage = true;
	// 		app.fireEvent('registerTask', task, list);
	// 	}
	// });
};
app.task.move = function(src_list_id, task_id, dst_list_id){
	return app.api.task.move(src_list_id, task_id, dst_list_id).done(function(data){
		if (data.success === 1) {
			$.each(data.tasks, function(i, task){
				app.fireEvent('registerTask', task, app.data.list_map[dst_list_id], true);
			});
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.comment.pin = function(list_id, task_id, comment_id){
	return app.api.comment.pin(list_id, task_id, comment_id).done(function(data){
		if (data.success === 1) {
			app.fireEvent('registerTask', data.task, app.data.list_map[list_id]);
			app.fireEvent('showTask', data.task);
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.comment.unpin = function(list_id, task_id, comment_id){
	return app.api.comment.unpin(list_id, task_id, comment_id).done(function(data){
		if (data.success === 1) {
			app.fireEvent('registerTask', data.task, app.data.list_map[list_id]);
			app.fireEvent('showTask', data.task);
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.comment.delete = function(list_id, task_id, comment_id){
	return app.api.comment.delete(list_id, task_id, comment_id).done(function(data){
		if (data.success === 1) {
			app.fireEvent('registerTask', data.task, app.data.list_map[list_id]);
			// app.fireEvent('showTask', data.task);
		} else {
			// 現在 ステータスコード 200 の例外ケースは無い
		}
	});
};
app.setup.filter = function(ele){
	var body = $(d.body);
	app.on(ele, 'click', function(e){
		if (ele.hasClass('active')) {
			body.attr('data-filter', '');
			ele.removeClass('active');
			// app.fireEvent('filterTask', null);
		} else {
			body.attr('data-filter', ele.data('filter'));
			ele.parent().children().removeClass('active');
			ele.addClass('active');
			// app.fireEvent('filterTask', ele.data('filter'));
		}
	});
	// app.addListener('filterTask', function(filter){
	// 	ele.toggleClass('active', ele.data('filter') === filter);
	// });
	// var count = 0;
	// var condition = ele.data('counter-condition');
	// app.addListener('registerTask', function(task){
	// 	if (app.util.hasChildTask(task)) {
	// 		count = 0;
	// 		for (var task_id in app.data.task_map) {
	// 			if (app.util.taskFilter(app.data.task_map[task_id], condition)) {
	// 				count++;
	// 			}
	// 		}
	// 		ele.text(count);
	// 	} else {
	// 		var before = (task.before && app.util.taskFilter(task.before, condition)) ? 1 : 0;
	// 		var after = app.util.taskFilter(task, condition) ? 1 : 0;
	// 		var add = after - before;
	// 		if (add) {
	// 			count+= add;
	// 			ele.text(count);
	// 		}
	// 	}
	// });
	// app.addListener('checkMute', function(){
	// 	count = 0;
	// 	for (var task_id in app.data.task_map) {
	// 		if (app.util.taskFilter(app.data.task_map[task_id], condition)) {
	// 			count++;
	// 		}
	// 	}
	// 	ele.text(count);
	// });
	// app.addListener('resetCounter', function(list){
	// 	count = 0;
	// 	for (var task_id in app.data.task_map) {
	// 		if (app.util.taskFilter(app.data.task_map[task_id], condition)) {
	// 			count++;
	// 		}
	// 	}
	// 	ele.text(count);
	// });
	// app.addListener('clear', function(){
	// 	count = 0;
	// 	ele.text(count);
	// });
};
app.setup.sort = function(ele){
	app.on(ele, 'click', function(e){
		e.preventDefault();
		e.stopPropagation();
		app.util.sortTaskView(ele.data('sort-column'), ele.data('sort-reverse'));
	});
	app.addListener('sortTask', function(tasks, column, reverse){
		if (column) {
			ele.toggleClass('active', column === ele.data('sort-column'));
		}
	});
	app.addListener('registerTask', function(task, list){
		ele.removeClass('active');
		app.data.current_sort.column = null;
		app.data.current_sort.reverse = null;
	});
};

})(this, window, document, jQuery);