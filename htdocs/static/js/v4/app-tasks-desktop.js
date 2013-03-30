(function(ns, w, d, $) {

var app = ns.app;
var win = $(w);
var doc = $(d);
var now = new Date();

app.data.listli_map = {};
app.data.taskli_map = {};
app.data.listtr_map = {};
app.data.gantt_start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
app.data.gantt_width = 0;
app.data.flow_switch = null;

var editableFix = $('<input style="width:1px;height:1px;border:none;margin:0;padding:0;position:absolute;" tabIndex="-1">').appendTo('html');

app.addEvents('initGanttchart');

app.addListener('showTask', function(task, is_notification){
	if (is_notification) {
		app.tab.show('main-home');
		var body = $('body');
		body.trigger(task.closed ? 'app-mode-closed' : 'app-mode-task');
		// TODO: 表示条件との確認
		if (body.attr('data-filter')) {
			$('header [data-filter].active').click();
		}
		// TODO: 表示条件との確認
		if (body.attr('data-tag')) {
			$('header [data-tag].active').click();
		}
	}
});

app.setup.nav = function(ele){
	ele.find('.settings').click(function(e){
		e.preventDefault();
		e.stopPropagation();
		app.modal.show('settings');
	});
	ele.find('.feedback').click(function(e){
		e.preventDefault();
		e.stopPropagation();
		app.modal.show('feedback');
	});
	ele.find('.logo, .about').click(function(e){
		e.preventDefault();
		e.stopPropagation();
		app.modal.show('about');
	});
};
app.setup.home = function(section){

	/*
	 * 関係ないところをクリックしたらタスク選択解除
	 */
	section.find('> header, ul.list').click(function(e){
		app.fireEvent('showTask');
	});

	app.on(section.find('> header .icon-plus').parent(), 'click', function(){
		app.modal.show('register-list');
	});

	app.on(section.find('> header [data-tag]'), 'click', function(){
		var body = $('body');
		var ele = $(this);
		if (ele.hasClass('active')) {
			body.removeAttr('data-tag');
			ele.removeClass('active');
		} else {
			section.find('> header [data-tag]').removeClass('active');
			ele.addClass('active');
			body.attr('data-tag', ele.data('tag'));
		}
	});

	var ul = section.find('ul.list');
	var html_list = ul.html();
	var html_task = section.find('table.task tbody').html();

	ul.empty();

	// ソート更新
	ul.on('app.draggable.update', function(){
		var sort = {};
		var lists = ul.children();
		var count = lists.length;
		lists.each(function(i, element) {
			var li = $(element);
			if (li.data('list')) {
				sort[li.data('list').id] = count;
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
	});

	app.draggable.setup(ul);

	app.addListener('registerList', function(list){
		if (list.id in app.data.listli_map) {
			app.setup.init(app.data.listli_map[list.id].data('list', list));
		} else {
			app.data.listli_map[list.id] = app.setup.init(
				app.util.parseHTML(html_list).data('list', list)
			).prependTo(ul);
		}
	});

	app.addListener('deleteList', function(list){
		app.data.listli_map[list.id].remove();
		delete app.data.listli_map[list.id];
	});

	app.addListener('registerTask', function(task, list, is_move){
		var tbody = app.data.listli_map[list.id].find('> table tbody');
		if (task.id in app.data.taskli_map) {
			var tr = app.data.taskli_map[task.id].data('task', task);
			app.setup.init(tr);
			/*
			 * D&Dで他のリストやタスクにドロップしたとき
			 */
			if (is_move) {
				if (task.parent_id in app.data.taskli_map) {
					app.data.taskli_map[task.parent_id].after(tr);
				} else {
					tr.appendTo(tbody);
				}
			}
		} else {
			var tr = app.util.parseHTML(html_task).data('task', task);
			app.data.taskli_map[task.id] = app.setup.init(tr);
			if (task.parent_id in app.data.taskli_map) {
				app.data.taskli_map[task.parent_id].after(tr);
				if (task.name === '-') {
					tr
						.attr('draggable', 'false')
						.find('div.name')
							.text('')
							.attr('contenteditable', 'true').focus();
				}
			} else {
				tr.hide();
				tr.appendTo(tbody);
				tr.slideDown('fast', function(){
					tr.css('display', '');
				});
			}
		}
	});

	app.addListener('sortTask', function(tasks, column, reverse){
		for (var i = 0, max_i = tasks.length; i < max_i; i++) {
			var tr = app.data.taskli_map[tasks[i].id];
			var parents = app.util.findParentTasks(tasks[i]);
			if (parents.length) {
				tr.find('td.main > div').css('paddingLeft', parents.length * 16 + 'px');
			} else {
				tr.find('td.main > div').css('paddingLeft', '0');
			}
			app.data.listli_map[tasks[i].list.id].find('tbody').append(tr);
		}
	});

	app.addListener('showTask', function(task){
		ul.find('tr.selected').removeClass('selected');
		ul.find('tr[draggable="false"]').attr('draggable', 'true');
		ul.find('div.name[contenteditable="true"]').attr('contenteditable', 'false');

		if (! task) { return }
		app.data.taskli_map[task.id]
			.addClass('selected')
			.attr('draggable', 'false')
			.find('td.main div.name')
				.attr('contenteditable', 'true');
	});

	app.addListener('initGanttchart', function(){
		ul.find('table.task tr').trigger('app.resize.gantt');
	});

	app.addListener('clearList', function(list){
		var delete_ids = [];
		for (var task_id in app.data.task_map) {
			var task = app.data.task_map[task_id];
			if ((list.id === task.list.id) && ( task.closed || app.util.hasCloseParentTask(task) )) {
				delete_ids.push(task_id);
			}
		}
		$.each(delete_ids, function(i, task_id){
			if (task_id in app.data.taskli_map) {
				app.data.taskli_map[task_id].remove();
				delete app.data.taskli_map[task_id];
			}
			delete app.data.task_map[task_id];
		});
	});

	/*
	 * 次のリスト
	 */
	var nextList = function(){
		var tr = ul.find('tr.selected');
		var next;
		if (tr.length) {
			var li = tr.parent().parent().parent();
			li.nextAll(':visible').each(function(){
				var tr = $(this).find('tr:visible:first');
				if (tr.length) {
					next = tr;
					return false;
				}
			});
		}
		if (! next) {
			next = ul.find('tr:visible:first');
		}
		if (next.length) {
			next.click();
		}
	};

	/*
	 * 前のリスト
	 */
	var prevList = function(){
		var tr = ul.find('tr.selected');
		var prev;
		if (tr.length) {
			var li = tr.parent().parent().parent();
			li.prevAll(':visible').each(function(){
				var tr = $(this).find('tr:visible:last');
				if (tr.length) {
					prev = tr;
					return false;
				}
			});
		}
		if (! prev) {
			prev = ul.find('tr:visible:last');
		}
		if (prev.length) {
			prev.click();
		}
	};

	/*
	 * 次のタスク
	 */
	 var nextTask = function(){
		var tr = ul.find('tr.selected:first');
		if (tr.length) {
			var next = tr.nextAll(':visible:first');
			if (next.length) {
					next.click();
			} else {
				nextList.call();
			}
		} else {
			tr = ul.find('tr:visible:first');
			if (tr.length) {
				tr.click();
			}
		}
	 };

	/*
	 * 前のタスク
	 */
	 var prevTask = function(){
		var tr = ul.find('tr.selected:first');
		var prev = tr.prevAll(':visible:first');
		if (prev.length) {
				prev.click();
		} else {
			prevList.call();
		}
	 };




	doc.keydown(function(e){
		if (d.activeElement.tagName !== 'BODY'
			|| e.ctrlKey
			|| e.altKey
			|| e.metaKey
		) {
			return;
		}
		if (e.shiftKey) {
			if (e.keyCode === 38 || e.keyCode === 75) { // Up
				prevList.call();
			} else if (e.keyCode === 40 || e.keyCode === 74) { // Down
				nextList.call();
			} else {
				return;
			}
			return false;
		}

		if (e.keyCode === 38 || e.keyCode === 75) { // Up
			prevTask.call();
		} else if (e.keyCode === 40 || e.keyCode === 74) { // Down
			nextTask.call();
		} else if (e.keyCode === 37 || e.keyCode === 72) { // Left / H
			var task = ul.find('tr.selected').data('task');
			if (! task) { return }
			var today = new Date();
			var due;
			if (task.due_date && task.due_date.getTime() > today.getTime()) {
				due = app.date.mdy(new Date(task.due_date.getTime() - (24 * 60 * 60 * 1000)));
			} else {
				due = '';
			}
			app.task.update({
				list_id: task.list.id,
				task_id: task.id,
				due: due
			});
		} else if (e.keyCode === 39 || e.keyCode === 76) { // Right / L
			var task = ul.find('tr.selected').data('task');
			if (! task) { return }
			var today = new Date();
			var date;
			if (task.due_date && task.due_date.getTime() > today.getTime()) {
				date = new Date(task.due_date.getTime() + (24 * 60 * 60 * 1000));
			} else {
				date = new Date(today.getTime() + (24 * 60 * 60 * 1000));
			}
			var due = app.date.mdy(date);
			app.task.update({
				list_id: task.list.id,
				task_id: task.id,
				due: due
			});
		} else if (e.keyCode === 8) { // Delete
			var tr = ul.find('tr.selected');
			if (tr.length) {
				var div = tr.find('div.name');
				div.focus();
				/*
				 * カーソル位置を末尾に移動
				 * TODO: utilへ
				 */
				if (d.selection) {
					var sel = d.selection.createRange();
					sel.moveStart('character', div.text().length);
					sel.select();
				} else {
					var sel = w.getSelection();
					sel.collapse(div.get(0).firstChild, div.text().length);
				}
			}
		} else if (e.keyCode === 32) { // Space
			var task = ul.find('tr.selected').data('task');
			if (! task) { return }
			var status = task.status >= 2 ? 0 : task.status + 1;
			app.task.update({
				list_id: task.list.id,
				task_id: task.id,
				status: status
			});
		} else if (e.keyCode === 13) { // Enter
			var task = ul.find('tr.selected').data('task');
			if (! task) { return }
			var closed = task.closed ? 0 : 1;
			app.task.update({
				list_id: task.list.id,
				task_id: task.id,
				closed: closed
			}).done(function(){
				nextTask.call();
			});
		} else if (e.keyCode === 82) { // r
			var task = ul.find('tr.selected').data('task');
			if (! task) { return }
			var rate = task.rate >= 5 ? 0 : task.rate + 1;
			app.task.update({
				list_id: task.list.id,
				task_id: task.id,
				rate: rate
			});
		} else {
			return;
		}
		return false;
	});
};
app.setup.list = function(li){
	var list = li.data('list');

	// テンプレートとして読まれた時
	if (!list) { return }

	// 新規、更新時共通

	// name
	li.find('> header > span.name').text(list.name);

	if (list.description) {
		li.find('.description').html(app.util.autolink(list.description, 64).replace(/\r?\n/g, '<br />'));
		if (! li.data('init')) {
			li.find('.description').hide();
			app.on(li.find('.icon-info-circle').parent().show(), 'click', function(e){
				e.preventDefault();
				e.stopPropagation();
				li.find('.description').slideToggle('fast');
			});
		}
	} else {
		li.find('.icon-info-circle').parent().hide();
	}

	var span_members = li.find('> div > span.members');
	if (list.members.length) {
		span_members.html('<i class="icon-right"></i>');
		var members = [list.owner].concat(list.members);
		var find = false;
		$.each(members, function(i, member){
			var img = app.util.getIcon(member).appendTo(span_members);
			img.data('id', member);
			img.click(function(e){
				if (img.hasClass('active')) {
					img.removeClass('active');
				} else {
					span_members.find('.active').removeClass('active');
					img.addClass('active');
				}
				li.find('> div div').focus();
			});
		});
	} else {
		span_members.empty();
	}

	// tag
	if (list.id in app.data.state.tags) {
		li.attr('data-tag', app.data.state.tags[list.id]);
	}

	li.find('[data-tag]').each(function(i, element){
		var ele = $(element);
		var tag = ele.data('tag');
		if ((list.id in app.data.state.tags) && (tag === app.data.state.tags[list.id])) {
			ele.addClass('active');
		}
	});

	// 1回だけ
	if (li.data('init')) { return }

	li.find('tbody').empty();

	app.draggable.handle(li.find('i.icon-sort').get(0));

	var folder = li.find('.icon-folder-open');
	app.on(folder, 'click', function(e){
		e.preventDefault();
		if (folder.hasClass('icon-folder')) {
			folder.attr('class', 'icon-folder-open');
			li.removeClass('closed');
		} else {
			folder.attr('class', 'icon-folder');
			li.addClass('closed');
		}
	});

	app.on(li.find('.icon-plus'), 'click', function(e){
		li.find('> div [contenteditable]').focus();
	});

	app.on(li.find('.icon-edit').parent(), 'click', function(e){
		app.modal.show('register-list', li.data('list'));
	});

	app.on(li.find('.icon-cancel').parent(), 'click', function(e){
		app.modal.show('delete-list', li.data('list'));
	});

	app.on(li.find('.icon-users').parent(), 'click', function(e){
		app.modal.show('assign-list', li.data('list'));
	});

	app.on(li.find('.icon-upload').parent(), 'click', function(e){
		app.modal.show('export-list', li.data('list'));
	});

	app.on(li.find('.icon-trash').parent(), 'click', function(e){
		app.modal.show('clear-list', li.data('list'));
	});

	li.find('[data-tag]').each(function(i, element){
		var ele = $(element);
		var tag = ele.data('tag');
		app.on(ele, 'click', function(e){
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
					// app.fireEvent('checkTag', list, tag, ele.hasClass('active'));
				} else {
					// 現在 ステータスコード 200 の例外ケースは無い
				}
			});
		});
	});

	/*
	 * リスト間移動／ネスト解除
	 */
	li.get(0).addEventListener('dragover', function(e){
		e.stopPropagation();
		/*
		 * トップレベルタスクは自リストにドロップできない
		 */
		if (list.id === app.data.dragtask.list.id && !app.data.dragtask.parent_id) {
			return true;
		}
		e.preventDefault();
		return false;
	}, false);
	li.get(0).addEventListener('drop', function(e){
		e.stopPropagation();
		/*
		 * 自リストにドロップするとネスト解除
		 */
		if (list.id === app.data.dragtask.list.id) {
			app.task.update_without_action({
				list_id: app.data.dragtask.list.id,
				task_id: app.data.dragtask.id,
				parent_id: ''
			}, app.data.dragtask.list);
		} else {
			app.task.move(app.data.dragtask.list.id, app.data.dragtask.id, list.id);
		}
	}, false);

	var register = li.find('> div div');

	register
		.on('focus', function(e){
			$(this).parent().addClass('editing');
		})
		.on('blur', function(e){
			$(this).parent().removeClass('editing');
			editableFix[0].setSelectionRange(0, 0);
			editableFix.blur();
			// var ele = $(this);
			// var list = li.data('list');
			// var name = ele.text();
			// if (name.length) {
			// 	app.task.create({
			// 		list_id: list.id,
			// 		name: name
			// 	}, list);
			// 	ele.text('');
			// }
		})
		.on('keydown', function(e){
			e.stopPropagation();
			if (e.keyCode === 13) {
				e.preventDefault();
				var list = li.data('list');
				var ele = $(this);
				var name = ele.text();
				var assign = [];
				span_members.find('img.active').each(function(){
					assign.push($(this).data('id'));
				});
				var parent_id = '';
				if (app.data.flow_switch.hasClass('active') &&
					app.data.flow_switch.data('list_id') === list.id) {
					parent_id = app.data.flow_switch.data('task_id');
				}
				if (name.length) {
					app.task.create({
						list_id: list.id,
						name: name,
						assign: assign,
						parent_id: parent_id
					}, list);
					ele.text('');
				}
			} else if (e.keyCode === 27) { // ESC
				e.preventDefault();
				$(this).blur();
			} else if (e.keyCode === 9) { // TAB
				var next = li.next();
				if (next.length) {
					e.preventDefault();
					// alert('next');
					// $(this).blur();
					next.find('> div div').focus();
				} else {
					e.preventDefault();
					// alert('top');
					// $(this).blur();
					top_li = li.parent().find('> li:first');
					top_li.find('> div div').focus();
				}
			}
		})
		.on('click dblclick', function(e){
			e.preventDefault();
			e.stopPropagation();
		});

	li.data('init', true);
};
app.setup.task = function(tr){
	var task = tr.data('task');

	// テンプレートとして読まれた時
	if (!task) { return }

	// 新規、更新時共通

	// todo
	tr.toggleClass('filter-inbox',
		task.assign.length > 0 ? !!app.util.findMe(task.assign) : !!app.util.findMe([task.requester])
	);

	tr.toggleClass('filter-sent',
		task.assign.length > 0 && app.util.findMe([task.requester])
	);

	tr.toggleClass('filter-received',
		!app.util.findMe([task.requester]) && app.util.findMe(task.assign)
	);

	tr.toggleClass('closed', task.closed ? true : false);
	tr.toggleClass('in-closed', app.util.hasCloseParentTask(task) ? true : false);

	if (task.closed || app.util.hasCloseParentTask(task)) {
		tr.attr('data-mode-show', 'closed');
	} else {
		tr.attr('data-mode-show', app.util.hasCloseChildTask(task) ? 'task,gantt,closed' : 'task,gantt');
	}

	// task status
	tr.find('.action-ok i').attr('class',
		task.status === 0 ? 'icon-ok open' :
		task.status === 1 ? 'icon-play' : 'icon-ok'
	);

	// task name
	tr.find('td.main div.name').text(task.name);

	// assign
	var assign = tr.find('td.assign span.user');
	assign.empty();
	if (task.assign.length) {
		assign.append(
			$('<img/>').attr('src', app.util.getIconUrl(task.requester)).attr('data-mode-hide', 'gantt')
		).append(
			$('<i class="icon-right"></i>').attr('data-mode-hide', 'gantt')
		);
		for (var i = 0, max_i = task.assign.length; i < max_i; i++) {
			var icon = $('<img/>').attr('src', app.util.getIconUrl(task.assign[i]));
			if (i > 0) {
				icon.attr('data-mode-hide', 'gantt');
			}
			assign.append(icon);
		}
	} else if (task.list.members.length) {
		var icon = $('<img/>').attr('src', app.util.getIconUrl(task.requester));
		assign.append(icon);
	}

	// task due
	if (task.due) {
		tr.find('.due').text(app.date.mdw(task.due_date));
	} else {
		tr.find('.due').text('');
	}

	//
	var back = tr.find('.back');
	var handle = tr.find('.handle');
	if (task.duration > 1) {
		back.css('width', (task.duration * 21) - 9 + 'px');
	} else {
		back.css('width', '12px');
	}

	// task rate
	tr.find('.rate i').each(function(i){
		if (i > 0 && i <= task.rate) {
			$(this).attr('class', 'icon-star');
		} else {
			$(this).attr('class', 'icon-star-empty');
		}
	});

	// recent
	var ul_comment = tr.find('ul.comment');
	if (task.recent) {
		ul_comment.empty();
		$('<li><i class="icon-comment"></i><span></span></li>')
			.find('span').text(task.recent.message)
			.end()
			.appendTo(ul_comment);
	} else {
		ul_comment.remove();
	}

	// pin
	var ul_pin = tr.find('ul.pin');
	if (task.pins.length) {
		ul_pin.empty();
		for (var i = 0, max_i = task.pins.length; i < max_i; i++) {
			$('<li><i class="icon-pin"></i><span></span></li>')
				.find('span').text(task.pins[i].message)
				.end()
				.appendTo(ul_pin);
		}
	} else {
		ul_pin.remove();
	}

	if (task.parent_id in app.data.taskli_map) {
		var paddingLeft = parseInt(app.data.taskli_map[task.parent_id].find('td.main > div').css('paddingLeft'), 10);
		tr.find('td.main > div').css('paddingLeft', (paddingLeft + 16) + 'px');
		// app.data.taskli_map[task.parent_id].after(tr);
	} else {
		tr.find('td.main > div').css('paddingLeft', '');
	}

	tr.trigger('app.resize');

	if (tr.data('init')) {
		tr.trigger('app.resize');
		return;
	}

	// return ;

	tr.data('init', true);

	var body = $('body');

	tr.find('div.name')
		.on('focus', function(e){
			console.log('focus');
			tr.addClass('editing');
			var ele = $(this);
			if (ele.text() === '-') {
				ele.text('');
			}
		})
		.on('blur', function(e){
			console.log('blur');
			editableFix[0].setSelectionRange(0, 0);
			editableFix.blur();
			tr.removeClass('editing');
			var ele = $(this);
			var task = tr.data('task');
			var name = ele.text();
			if (name === task.name) {
				return;
			}
			if (name.length) {
				app.task.update_without_action({
					list_id: task.list.id,
					task_id: task.id,
					name: name
				}, task.list);
			} else {
				ele.text(task.name);
			}
		})
		.on('keydown', function(e){
			e.stopPropagation();
			if (e.keyCode === 13) {
				e.preventDefault();
				this.blur();
			}
		})
		.on('mousedown', function(e){
			if (tr.hasClass('selected')) {
				e.stopPropagation();
			}
		})
		.on('dblclick', function(e){
			e.preventDefault();
			e.stopPropagation();
		});

	/*
	 * D&Dによる階層変更
	 */
	tr.get(0).addEventListener('dragstart', function(e){
		tr.addClass('dragging');
		var task = tr.data('task');
		app.data.dragtask = task;
		e.dataTransfer.setData('text', task.id);
	}, false);
	tr.get(0).addEventListener('dragend', function(e){
		tr.removeClass('dragging');
		app.data.dragtask = null;
	}, false);
	tr.get(0).addEventListener('dragover', function(e){
		e.stopPropagation();
		var task = tr.data('task');
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
	}, false);
	tr.get(0).addEventListener('drop', function(e){
		e.preventDefault();
		e.stopPropagation();
		var task = tr.data('task');
		// 念の為
		if (task.id === app.data.dragtask.id) {
			return true;
		}
		app.task.update_without_action({
			list_id: app.data.dragtask.list.id,
			task_id: app.data.dragtask.id,
			parent_id: task.id
		}, app.data.dragtask.list);
	}, false);





	/*
	 * アイコン位置調整
	 */
	var due_span = tr.find('td.assign > span');
	tr.on('app.resize.gantt', function(e, due_date){
		var task = tr.data('task');
		if (task.due || due_date) {
			var days = app.date.delta(due_date || task.due_date, app.data.gantt_start).days + 1;
			if (days > 0 && days <= app.data.gantt_width) {
				if (task.duration > 1) {
					days = days - ( task.duration - 1 );
				}
				due_span.css('left', 303 + days * 21 + 'px');
				due_span.addClass('draggable');
			} else if (days > 0) {
				due_span.css('left', 303 + (app.data.gantt_width + 1) * 21 + 'px');
				due_span.removeClass('draggable');
			} else {
				due_span.css('left', '303px');
				due_span.removeClass('draggable');
			}
		} else {
			due_span.css('left', '303px');
		}
	});
	tr.trigger('app.resize.gantt');

	/*
	 * D&Dによる所要日数変更
	 */
	var dragmode = false;
	handle.mousedown(function(e){
		e.preventDefault();
		e.stopPropagation();
		var task  = tr.data('task');
		if (!task.due) {
			return;
		}
		dragmode  = true;
		var x     = back.offset().left + back.width();
		var diff  = 0;
		var min   = 1 + ( task.duration || 1 ) * -1;
		var max   = app.data.gantt_width - app.date.delta(task.due_date, app.data.gantt_start).days - 1;
		body.addClass('resize');
		doc.off('mousemove.gantt-handle');
		doc.on('mousemove.gantt-handle', function(e){
			e.preventDefault();
			var move = e.pageX > x ? parseInt((e.pageX - x + 12) / 21) : Math.ceil((e.pageX - x) / 21);
			if (move === diff) {
				return;
			}
			if (move > max) {
				return;
			}
			diff = move > min ? move : min;
			var duration = ( task.duration || 1 ) + diff;
			if (duration > 1) {
				back.css('width', (duration * 21) - 9 + 'px');
			} else {
				back.css('width', '12px');
			}
		});
		doc.off('mouseup.gantt-handle');
		doc.on('mouseup.gantt-handle', function(e){
			e.preventDefault();
			body.removeClass('resize');
			doc.off('mousemove.gantt-handle');
			doc.off('mouseup.gantt-handle');
			if (diff) {
				app.task.update_without_action({
					list_id: task.list.id,
					task_id: task.id,
					due: app.date.mdy(
						new Date(
							task.due_date.getFullYear()
							, task.due_date.getMonth()
							, task.due_date.getDate() + diff
						)
					),
					duration: ( task.duration || 1 ) + diff
				}, task.list);
			}
			dragmode = false;
		});
	});

	/*
	 * D&Dによる期日変更
	 */
	var bar = due_span;
	bar.mousedown(function(e){
		e.preventDefault();
		e.stopPropagation();
		var task  = tr.data('task');
		if (!bar.hasClass('draggable')) {
			return;
		}
		if (!task.due_date) {
			return;
		}
		dragmode  = true;
		var x     = e.pageX;
		var diff  = 0;
		var days  = app.date.delta(task.due_date, app.data.gantt_start).days;
		body.addClass('move');
		doc.off('mousemove.gantt-handle');
		doc.on('mousemove.gantt-handle', function(e){
			e.preventDefault();
			var move = e.pageX > x ? parseInt((e.pageX - x) / 21) : Math.ceil((e.pageX - x) / 21);
			if (move === diff) {
				return;
			}
			if ((days + move) < 0) {
				return;
			}
			if ((days + move) > app.data.gantt_width) {
				return;
			}
			diff = move;
			tr.trigger('app.resize.gantt',
				new Date(
					task.due_date.getFullYear()
					, task.due_date.getMonth()
					, task.due_date.getDate() + diff
				)
			);
		});
		doc.off('mouseup.gantt-handle');
		doc.on('mouseup.gantt-handle', function(e){
			e.preventDefault();
			e.stopPropagation();
			body.removeClass('move');
			doc.off('mousemove.gantt-handle');
			doc.off('mouseup.gantt-handle');
			if (diff) {
				app.task.update_without_action({
					list_id: task.list.id,
					task_id: task.id,
					due: app.date.mdy(
						new Date(
							task.due_date.getFullYear()
							, task.due_date.getMonth()
							, task.due_date.getDate() + diff
						)
					)
				}, task.list);
			}
			dragmode = false;
		});
	});

	/*
	 * ここで止めないとli.clickが発火してしまう
	 */
	bar.click(function(e){ return false });

	tr.on('click', function(e){
		e.preventDefault();
		e.stopPropagation();
		if (body.attr('data-mode') === 'gantt') {
			var delta = parseInt((app.support.pageX(e) - 313) / 21) - 1;
			if (delta >= 0 && delta < app.data.gantt_width) {
				var date = app.date.add(app.data.gantt_start, delta);
				app.task.update_without_action({
					list_id: task.list.id,
					task_id: task.id,
					due: app.date.ymd(date)
				}, task.list);
			} else if (delta === -1) {
				app.task.update_without_action({
					list_id: task.list.id,
					task_id: task.id,
					due: '',
					duration: ''
				}, task.list);
			}
		} else {
			app.fireEvent('showTask', tr.data('task'));
		}
	});
	tr.on('dblclick', function(e){
		e.preventDefault();
		e.stopPropagation();
		app.modal.show('register-task', [tr.data('task').list, tr.data('task')]);
	});
	app.on(tr.find('.action-ok'), 'click dblclick', function(e){
		e.preventDefault();
		e.stopPropagation();
		var task = tr.data('task');
		app.task.update({
				list_id: task.list.id,
				task_id: task.id,
				status: task.status >= 2 ? 0 : task.status + 1
		});
	});
	app.on(tr.find('i.icon-cancel'), 'click dblclick', function(e){
		e.preventDefault();
		e.stopPropagation();
		app.task.update({
				list_id: task.list.id,
				task_id: task.id,
				closed: 1
		});
	});
	app.on(tr.find('i.icon-ccw'), 'click dblclick', function(e){
		e.preventDefault();
		e.stopPropagation();
		app.task.update({
				list_id: task.list.id,
				task_id: task.id,
				closed: 0
		});
	});
	app.on(tr.find('span[data-rate]'), 'click dblclick', function(e){
		e.preventDefault();
		e.stopPropagation();
		app.task.update({
				list_id: task.list.id,
				task_id: task.id,
				rate: $(this).data('rate')
		});
	});
};
app.setup.aside = function(aside){
	var name            = aside.find('> div > div > p > strong');
	var due             = aside.find('> div > .due');
	var duration        = aside.find('> div > .duration');
	var user            = aside.find('> div > .user');
	var pin             = aside.find('ul.pins');
	var comments        = aside.find('ul.comments');
	var form            = aside.find('form');
	var textarea        = aside.find('textarea');
	var flow            = aside.find('.icon-flow-cascade').parent();
	var status          = form.find('input[name="status"]');
	var closed          = form.find('input[name="closed"]');
	var group_open      = form.find('.btn-group-open');
	var group_closed    = form.find('.btn-group-closed');
	var group_in_closed = form.find('.btn-group-in-closed');
	var html_pin        = pin.html();
	var html_comment    = comments.html();

	textarea.prop('disabled', true);
	aside.find('.btn').attr('disabled', 'true');

	pin.empty();
	comments.empty();

	group_open.hide();
	group_closed.hide();
	group_in_closed.hide();

	flow.click(function(e){
		e.preventDefault();
		e.stopPropagation();
		if (flow.attr('disabled')) {
			;
		} else {
			app.task.create({
				list_id: flow.data('list_id'),
				parent_id: flow.data('task_id'),
				name: '-'
			}, app.data.list_map[ flow.data('list_id') ]);
		}
	});

	app.data.flow_switch = flow;

	app.on(form.find('span.btn[data-plus]'), 'click', function(e){
		var plus = $(this).data('plus');
		if (plus === 'start') {
			status.val(1);
		} else if (plus === 'fix') {
			status.val(2);
		} else if (plus === 'revert') {
			status.val(0);
		} else if (plus === 'close') {
			closed.val(1);
		} else if (plus === 'reopen') {
			closed.val(0);
		}
		form.submit();
	});

	app.on(aside.find('.icon-edit').parent(), 'click', function(e){
		e.preventDefault();
		e.stopPropagation();
		var task = aside.data('task');
		if (task) {
			app.modal.show('register-task', [task.list, task]);
		}
	});

	form.submit(function(e){
		e.preventDefault();
		var task = aside.data('task');
		if (! task) {
			return false;
		}
		var message = textarea.val();
		var url = '/api/1/comment/create';
		if (! message.length) {
			if (status.val() || closed.val()) {
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
			type: 'post',
			url: url,
			data: form.serialize(),
			dataType: 'json',
			salvage: true
		})
		.done(function(data){
			if (data.success === 1) {
				form.get(0).reset();
				document.activeElement.blur();
				app.fireEvent('registerTask', data.task, task.list);
				app.fireEvent('showTask', data.task);
			} else {
				// 現在 ステータスコード 200 の例外ケースは無い
			}
		});
		// .fail(function(jqXHR, textStatus, errorThrown){
		// 	if (!jqXHR.status) {
		// 		app.queue.push({
		// 			api: 'comment.create',
		// 			req: form.serializeArray()
		// 		});
		// 		app.dom.reset(form);
		// 		var task = app.data.task_map[task_id];
		// 		if (task) {
		// 			task.actions.push({
		// 				action: 'comment',
		// 				account_id: app.data.sign.account_id,
		// 				message: message,
		// 				time: (new Date()).getTime(),
		// 				salvage: true
		// 			});
		// 			app.fireEvent('registerTask', task, list);
		// 			app.fireEvent('openTask', task);
		// 		}
		// 		document.activeElement.blur();
		// 	}
		// });
	});

	aside.on('show', function(e, task){
		if (! task) {
			aside.data('task', null);
			form.find('input[name="list_id"]').val('');
			form.find('input[name="task_id"]').val('');
			form.find('input[name="status"]').val('');
			form.find('input[name="closed"]').val('');
			name.text('');
			due.text('-');
			duration.text('-');
			group_open.hide();
			group_closed.hide();
			group_in_closed.hide();
			user.empty();
			pin.empty();
			comments.empty();
			textarea.prop('disabled', true);
			flow.data('task_id', '');
			flow.data('list_id', '');
			flow.removeClass('active');
			aside.find('.btn').attr('disabled', 'true');
			return;
		}
		aside.find('.btn').removeAttr('disabled');
		aside.data('task', task);
		form.find('input[name="list_id"]').val(task.list.id);
		form.find('input[name="task_id"]').val(task.id);
		form.find('input[name="status"]').val('');
		form.find('input[name="closed"]').val('');
		name.text(task.name);
		due.text(task.due ? app.date.mdw(task.due_date) : '-');
		duration.text(task.duration ? task.duration + ' days' : '-');
		textarea.prop('disabled', false);
		flow.data('task_id', task.id);
		flow.data('list_id', task.list.id);
		flow.removeClass('active');

		var mode = app.util.hasCloseParentTask(task) ? 2 : task.closed ? 1 : 0;
		group_open.toggle( mode === 0 );
		group_closed.toggle( mode === 1 );
		group_in_closed.toggle( mode === 2 );

		form.find('span.btn[data-plus="start"]').attr('disabled', task.status !== 0);
		form.find('span.btn[data-plus="fix"]').attr('disabled', task.status === 2);
		form.find('span.btn[data-plus="revert"]').attr('disabled', task.status === 0);

		user.empty();
		if (task.assign.length) {
			user.append(
				$('<img/>').attr('src', app.util.getIconUrl(task.requester))
			).append(
				$('<i class="icon-right"></i>')
			);
			for (var i = 0, max_i = task.assign.length; i < max_i; i++) {
				var icon = $('<img/>').attr('src', app.util.getIconUrl(task.assign[i]));
				user.append(icon);
			}
		} else {
			var icon = $('<img/>').attr('src', app.util.getIconUrl(task.requester));
			user.append(icon);
		}

		pin.empty();
		pin.toggle(task.pins.length > 0);
		for (var i = 0, max_i = task.pins.length; i < max_i; i++) {
			app.util.parseHTML(html_pin)
				.appendTo(pin)
				.find('span')
				.html(app.util.autolink(task.pins[i].message));
		}

		comments.empty();
		$.each(task.actions, function(i, comment){
			var li = app.util.parseHTML(html_comment);
			var i  = li.find('.message i');
			var x  = li.find('i.icon-cancel').parent();

			li.find('.name').text(app.util.getName(comment.account_id));
			li.find('img').attr('src', app.util.getIconUrl(comment.account_id));
			// if (comment.salvage) {
			// 	li.addClass('salvage');
			// 	li.find('.icon:last').remove();
			// }
			if (comment.action !== 'comment') {
				li.find('.message span').text(comment.action);
					// app.data.messages.data('text-' + comment.action + '-' + app.env.lang));
				if (comment.action === 'start-task') {
					i.attr('class', 'icon-play');
				} else if (comment.action === 'fix-task') {
					i.attr('class', 'icon-ok');
				} else if (comment.action === 'close-task') {
					i.attr('class', 'icon-cancel');
				} else if (comment.action === 'reopen-task' || comment.action === 'rereopen-task') {
					i.attr('class', 'icon-ccw');
				}
			}
			if (! comment.message) {
				li.find('.menu').remove();
				x.remove();
			} else {
				if (comment.message === '[like]') {
					i.attr('class', 'icon-heart');
				} else {
					li.find('.message span').html(app.util.autolink(comment.message).replace(/\r?\n/g, '<br />'));
				}
				app.on(x, 'click', function(e){
					e.preventDefault();
					if (! confirm("delete comment? \n[" + comment.message + ']')) {
						return false;
					}
					app.comment.delete(task.list.id, task.id, comment.id).done(function(data){
						app.fireEvent('showTask', data.task);
					});
					return false;
				});
				var a = li.find('.menu a');
				if (a) {
					if (comment.is_pinned) {
						a.text('Unpinned');
					}
					app.on(a, 'click', function(e){
						e.preventDefault();
						var method = a.text() === 'Pin' ? 'pin' : 'unpin';
						app.comment[method](task.list.id, task.id, comment.id);
					});
				}
			}
			li.find('.date').text(app.date.relative(comment.time));
			li.prependTo(comments);
		});
	});
	app.addListener('registerTask', function(task){
		var showTask = aside.data('task');
		if (showTask && showTask.id === task.id) {
			aside.trigger('show', app.data.task_map[task.id]);
		}
	});
	app.addListener('showTask', function(task){
		aside.trigger('show', task);
	});

	// app.addListener('clearList', function(list){
	// 	var task = aside.data('task');
	// 	if (!task || task.closed) {
	// 		form.find('input[name="list_id"]').val('');
	// 		form.find('input[name="task_id"]').val('');
	// 		form.find('input[name="status"]').val('');
	// 		form.find('input[name="closed"]').val('');
	// 		name.text('');
	// 		due.text('-');
	// 		duration.text('-');
	// 		group_open.hide();
	// 		group_closed.hide();
	// 		group_in_closed.hide();
	// 		user.empty();
	// 		pin.empty();
	// 		comments.empty();
	// 		textarea.prop('disabled', true);
	// 	}
	// });
};
app.setup.gantt = function(ele){
	var blank = ele.html();
	var now   = new Date();
	var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	var day_array = [];
	var createMonth = function(date, width){
		var label = width > 3
					? $('<h1/>').text(app.date.MONTH_NAMES[date.getMonth()] + ' ' + date.getFullYear())
					: width > 0
					? $('<h1/>').text(app.date.MONTH_NAMES_SHORT[date.getMonth()])
					: $('<h1/>').html('&nbsp;')
		return $('<div class="month"></div>').append(label);
	};
	app.data.gantt_width = parseInt((win.width() - ele.offset().left - 42) / 21, 10);
	app.addListener('initGanttchart', function(){
		var start = app.data.gantt_start;
		ele.html(blank);
		day_array = [];
		var date = new Date(start.getFullYear(), start.getMonth(), start.getDate());
		var days = $('<div class="days"></div>');
		var width =
			(new Date(start.getFullYear(), start.getMonth() + 1, 0)).getDate()
			- start.getDate();
		createMonth.call(app, date, width).append(days).appendTo(ele);
		for (var i = 0, max_i = app.data.gantt_width; i < max_i; i++) {
			if (i > 0 && date.getDate() === 1) {
				days = $('<div class="days"></div>');
				createMonth.call(app, date, max_i - i).append(days).appendTo(ele);
			}
			var day = $('<div><h2>' + date.getDate() + '</h2></div>');
			day.appendTo(days);
			if (i === 0 || date.getDate() === 1) {
				day.addClass('firstday');
			}
			if (today.getTime() === date.getTime()) {
				day.addClass('today');
			} else if (date.getDay() === 0 || date.getDay() === 6) {
				day.addClass('holiday');
			}
			var holiday = app.date.is_holiday(date);
			if (holiday) {
				day.addClass('holiday');
				var h2 = day.find('h2');
				h2.data('text-ja', holiday);
				app.setup.tooltip(h2);
			}
			date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
			day_array.push(day);
		}
		ele.append(app.util.parseHTML(blank));
	});
	app.fireEvent('initGanttchart');
	app.addListener('resize', function(){
		app.data.gantt_width = parseInt((win.width() - ele.offset().left - 42) / 21, 10);
		app.fireEvent('initGanttchart');
	});
};
app.setup.analysis = function(section){

	/*
	 * 日別
	 */
	var render_ul = function(ul, actions){
		$.each(actions, function(){
			var li = $($.parseHTML('<li><img><i class="icon-comment"></i><span>hoge</span></li>'));
			li.find('i').attr('class', this.icon);
			li.find('img').attr('src', app.util.getIconUrl(this.account_id));
			li.find('span').text(this.task);
			if (this.message && this.message !== '[like]') {
				$('<span class="comment"/>').text(this.message).appendTo(li);
			}
			li.appendTo(ul);
		});
	};

	/*
	 * 日別
	 */
	var render_daily = function(lists, actions){
		var div = section.find('.tab-analysis-daily');
		div.empty();
		var data = {};
		var days = [];
		$.each(actions, function(){
			var mdw = app.date.mdw(this.date, '/');
			if (!(mdw in data)) {
				days.push(mdw);
				data[mdw] = {};
			}
			if (!(this.list in data[mdw])) {
				data[mdw][this.list] = [];
			}
			data[mdw][this.list].push(this);
		});
		$.each(days, function(i, mdw){
			div.append($('<h2/>').text(mdw));
			$.each(data[mdw], function(list, actions){
				$('<h3/>').text(list).appendTo(div);
				var ul = $('<ul class="unstyled actions"/>').appendTo(div);
				render_ul(ul, actions);
			});
		});
	};

	/*
	 * リスト別
	 */
	var render_list = function(lists, actions){
		var div = section.find('.tab-analysis-list');
		div.empty();
		var data = {};
		$.each(actions, function(){
			var mdw = app.date.mdw(this.date, '/');
			if (!(this.list in data)) {
				data[this.list] = {
					days: [],
					data: {}
				};
			}
			if (!(mdw in data[this.list].data)) {
				data[this.list].days.push(mdw);
				data[this.list].data[mdw] = [];
			}
			data[this.list].data[mdw].push(this);
		});
		$.each(data, function(list){
			div.append($('<h2/>').text(list));
			$.each(data[list].days, function(ii, mdw){
				$('<h3/>').text(mdw).appendTo(div);
				var ul = $('<ul class="unstyled actions"/>').appendTo(div);
				render_ul(ul, data[list].data[mdw]);
			});
		});
	};

	/*
	 * ユーザー別
	 */
	var render_user = function(lists, actions){
		var div = section.find('.tab-analysis-user');
		div.empty();
		var data = {};
		// var users = [];
		$.each(actions, function(){
			if (!(this.account_id in data)) {
				data[this.account_id] = {
					days: [],
					data: {}
				};
			}
			var mdw = app.date.mdw(this.date, '/');
			if (!(mdw in data[this.account_id].data)) {
				data[this.account_id].days.push(mdw);
				data[this.account_id].data[mdw] = {};
			}
			if (!(this.list in data[this.account_id].data[mdw])) {
				data[this.account_id].data[mdw][this.list] = [];
			}
			data[this.account_id].data[mdw][this.list].push(this);
		});
		$.each(data, function(account_id, account_data){
			div.append($('<h2/>').text(app.util.getName(account_id)));
			$.each(account_data.days, function(i, mdw){
				$('<h3/>').text(mdw).appendTo(div);
				$.each(account_data.data[mdw], function(list, list_data){
					$('<h4/>').text(list).appendTo(div);
					var ul = $('<ul class="unstyled actions"/>').appendTo(div);
					render_ul(ul, list_data);
				});
			});
		});
	};

	var icon_map = {
		'comment': 'icon-comment',
		'start-task': 'icon-play',
		'fix-task': 'icon-ok',
		'close-task': 'icon-cancel',
		'reopen-task': 'icon-to-start'
	};
	app.addListener('receiveMe', function(data){
		var actions = [];
		var expire = $.now() - ( 7 * 24 * 60 * 60 * 1000 );
		$.each(data.lists, function(i, list){
			$.each(list.tasks, function(ii, task){
				if (task.created_on > expire) {
					actions.push({
						list: list.name,
						task: task.name,
						action: 'create-task',
						account_id: task.registrant,
						time: task.created_on,
						date: new Date(task.created_on),
						icon: 'icon-plus'
					});
				}
				$.each(task.actions, function(iii, action){
					if (action.time < expire) { return }
					action.list = list.name;
					action.task = task.name;
					action.date = new Date(action.time);
					if (action.message === '[like]') {
						action.icon = 'icon-heart';
					} else if (action.action in icon_map) {
						action.icon = icon_map[action.action];
					} else {
						action.icon = 'icon-ccw';
					}
					actions.push(action);
				});
			});
		});
		actions.sort(function(a, b){ return b.time - a.time });
		render_daily(data.lists, actions);
		render_list(data.lists, actions);
		render_user(data.lists, actions);
	});
};
app.setup.profile = function(a){
	app.addListener('receiveMe', function(data){
		a.find('span').text(data.sign.name);
		a.find('i').replaceWith(
			$('<img style="width:16px;height:16px;margin-right:2px"/>')
				.attr('src', data.sign.icon)
		);
	})
};
app.setup.registerTask = function(form){
	var h1              = form.find('h1');
	var name            = form.find('input[name="name"]');
	var task_id         = form.find('input[name="task_id"]');
	var list_id         = form.find('input[name="list_id"]');
	var due             = form.find('select[name="due"]');
	var duration        = form.find('input[name="duration"]');
	var requester       = form.find('select[name="requester"]');
	var parent_id       = form.find('select[name="parent_id"]');
	var assign_ul       = form.find('ul.assign');
	var assign_template = assign_ul.html();

	form.submit(function(e){
		e.preventDefault();
		app.task[ task_id.val() ? 'update_without_action' : 'create' ](form.serialize(), form.data('list'));
		form.get(0).reset();
		if (task_id.val()) {
			app.modal.hide();
		}
	});
	form.on('show', function(e, list, task){
		var task = app.data.task_map[task.id];
		form.find('[data-tab="task-basic"]').click();
		form.data('list', list);
		list_id.val(list.id);
		task_id.val(task ? task.id : '');
		name.val(task ? task.name : '');
		duration.val(task && task.duration ? task.duration : '');
		h1.text(list.name);
		name.focus();

		due.empty();
		assign_ul.empty();
		requester.empty();

		due.append(new Option('', ''));
		var due_date = new Date();
		var now = new Date();
		for (var i = 0, max_i = 90; i < max_i; i++) {
			due.append(new Option(
				now.getFullYear() === due_date.getFullYear()
					? app.date.mdw(due_date)
					: app.date.ymdw(due_date),
				app.date.ymd(due_date)
			));
			due_date.setTime(due_date.getTime() + (24 * 60 * 60 * 1000));
		}
		due.val(task && task.due ? app.date.ymd(task.due_date) : '');

		if (list.members.length) {
			form.find('.team').show();
			var assigns = [list.owner].concat(list.members);
			for (var i = 0, max_i = assigns.length; i < max_i; i++) {
				var assign = assigns[i];
				var friend = app.data.users[assign];
				if (!friend) {
					continue;
				}
				var li = app.util.parseHTML(assign_template);
				if (friend && friend.icon) {
					li.find('span').css('backgroundImage', 'url(' + friend.icon + ')');
				} else {
					li.find('span').css('backgroundImage', 'url(/static/img/address.png)');
				}
				var friend_name = friend ? friend.name : assign;
				li.find('span').text(friend_name);
				li.find('input').val(assign);
				li.appendTo(assign_ul);
				$('<option/>')
					.attr('value', assign)
					.text(friend_name)
					.appendTo(requester);
			}
			requester.val(task ? task.requester : app.util.findMe(assigns).account_id);
			if (task && task.assign.length) {
				form.find('input[name="assign"]').val(task.assign);
			}
			form.find('[data-tab="task-assign"]').parent().show();
		} else {
			form.find('[data-tab="task-assign"]').parent().hide();
		}
		parent_id.empty();
		if (list.tasks.length) {
			parent_id.append(new Option('', ''));
			for (var i = 0, max_i = list.tasks.length; i < max_i; i++) {
				if (!task || !app.util.isChildTask(task, list.tasks[i])) {
					parent_id.append(new Option(list.tasks[i].name, list.tasks[i].id));
				}
			}
			parent_id.val(task && task.parent_id ? task.parent_id : '');
			form.find('[data-tab="task-parent"]').parent().show();
		} else {
			form.find('[data-tab="task-parent"]').parent().hide();
		}
	});
};
app.setup.registerList = function(form){
	var name        = form.find('input[name="name"]');
	var description = form.find('textarea');
	var list_id     = form.find('input[name="list_id"]');
	form.submit(function(e){
		e.preventDefault();
		app.list[ list_id.val() ? 'update' : 'create' ](form.serialize());
		form.get(0).reset();
		app.modal.hide();
	});
	form.on('show', function(e, list){
		list_id.val(list ? list.id : '');
		name.val(list ? list.name : '');
		description.val(list ? list.description : '');
	});
};
app.setup.deleteList = function(form){
	var h1 = form.find('h1');
	var list_id = form.find('input[name="list_id"]');
	form.submit(function(e){
		e.preventDefault();
		app.list.delete(list_id.val());
		form.get(0).reset();
		app.modal.hide();
	});
	form.on('show', function(e, list){
		h1.text(list.name);
		list_id.val(list.id);
	});
};
app.setup.assignList = function(form){
	var name = form.find('p span:first');
	var ul   = form.find('ul');
	var html = ul.html();
	form.on('show', function(e, list){
		form.data('id', list.id);
		name.text(list.name);
		ul.empty();
		if (list.members.length) {
			for (var i = 0, max_i = list.members.length; i < max_i; i++) {
				list.members[i];
				var li = app.util.parseHTML(html);
				li.find('img').attr('src', app.util.getIconUrl(list.members[i]));
				li.find('span.name').text(app.util.getName(list.members[i]));
				li.find('span.delete').data('id', list.members[i]);
				app.on(li.find('span.delete'), 'click', function(e){
					e.preventDefault();
					var id = $(this).data('id');
					var name = app.util.getName(id);
					if (confirm('delete ' + name + '?')) {
						app.list.leave(list.id, id);
						form.get(0).reset();
						app.modal.hide();
					}
				});
				li.appendTo(ul);
			}
		}
		if (list.invite_code) {
			var url = location.protocol + '//'
				+ location.host
				+ '/join/'
				+ list.id
				+ '/'
				+ list.invite_code;
			form.find('input[name="invite_code"]').val(url);
		} else {
			form.find('input[name="invite_code"]').val('');
		}
	});
	app.on(form.find('.btn-primary'), 'click', function(){
		var id = form.data('id');
		app.list.invite(id).done(function(){
			form.trigger('show', app.data.list_map[id]);
		});
	});
	app.on(form.find('.btn-danger'), 'click', function(){
		var id = form.data('id');
		app.list.disinvite(id).done(function(){
			form.trigger('show', app.data.list_map[id]);
		});
	});
};
app.setup.exportList = function(form){
	form.on('show', function(e, list){
		form.data('id', list.id);
		form.find('input').each(function(){
			var input = $(this);
			if (! list.public_code) {
				input.val('');
			} else if (input.attr('name') === 'rss' && app.env.lang === 'ja') {
				input.val(location.protocol + '//' + location.host + '/public/'
					+ list.public_code + '/rss?lang=ja');
			} else {
				input.val(location.protocol + '//' + location.host + '/public/'
					+ list.public_code + '/' + input.attr('name'));
			}
		});
	});
	app.on(form.find('.btn-public'), 'click', function(){
		var id = form.data('id');
		app.list.public(id).done(function(){
			form.trigger('show', app.data.list_map[id]);
		});
	});
	app.on(form.find('.btn-private'), 'click', function(){
		var id = form.data('id');
		app.list.private(id).done(function(){
			form.trigger('show', app.data.list_map[id]);
		});
	});
};
app.setup.clearList = function(form){
	var h1 = form.find('h1');
	var list_id = form.find('input[name="list_id"]');
	form.submit(function(e){
		e.preventDefault();
		app.list.clear(list_id.val());
		form.get(0).reset();
		app.modal.hide();
	});
	form.on('show', function(e, list){
		h1.text(list.name);
		list_id.val(list.id);
	});
};
app.setup.settings = function(form){
	var ul_icon = form.find('.tab-settings-name ul');
	var html_icon = ul_icon.html();
	var ul_account = form.find('.tab-settings-account ul:last');
	var html_account = ul_account.html();
	app.addListener('receiveMe', function(data){
		ul_icon.empty();
		ul_account.empty();
		$.each(data.sub_accounts, function(i, sub_account){
			var li_account = app.util.parseHTML(html_account);
			li_account.find('img').attr('src', app.util.getIconUrl(sub_account.code));
			li_account.find('.name').text(sub_account.name);
			li_account.find('button').click(function(e){
				e.preventDefault();
				e.stopPropagation();
				if (confirm(app.util.text($(this), 'confirm'))) {
					;
				}
			});
			app.setup.init(li_account).appendTo(ul_account);
			var li_icon = app.util.parseHTML(html_icon);
			li_icon.find('img').attr('src', app.util.getIconUrl(sub_account.code));
			li_icon.find('span').text(sub_account.name);
			li_icon.find('input').val(sub_account.data.icon);
			var url = /^tw-[0-9]+$/.test(sub_account.code) ? 'https://twitter.com/settings/profile'
							: /^fb-[0-9]+$/.test(sub_account.code) ? 'https://www.facebook.com/me'
							: app.env.lang === 'ja' ? 'https://ja.gravatar.com/' : 'https://gravatar.com/';
			li_icon.find('a').attr('href', url);
			app.setup.init(li_icon).appendTo(ul_icon);
		});
	});
	form.submit(function(e){
		e.preventDefault();
		var name = form.find('input[name="name"]').val();
		var icon = form.find('input[name="icon"]:checked').val();
		app.api.account.update_profile({
			name: name,
			icon: icon
		}).done(function(){
			app.modal.hide();
			app.load();
		});
	});
	form.on('show', function(e){
		form.find('input[name="name"]').val(app.data.sign.name);
		form.find('input[name="icon"]').val([app.data.sign.icon]);
	});
	form.find('.btn-connect-with-twitter').click(function(e){
		e.preventDefault();
		e.stopPropagation();
		$('#connect-with-twitter').submit();
	})
	form.find('.btn-connect-with-facebook').click(function(e){
		e.preventDefault();
		e.stopPropagation();
		$('#connect-with-facebook').submit();
	})
	form.find('.btn-connect-with-google').click(function(e){
		e.preventDefault();
		e.stopPropagation();
		$('#connect-with-google').submit();
	})
};
app.setup.feedback = function(form){
	form.submit(function(e){
		e.preventDefault();
		var message = form.find('textarea').val();
		app.api.feedback.send({
			message: message
		}).done(function(){
			form.find('textarea').val('');
			app.modal.hide();
		});
	});
	form.on('show', function(){
		form.find('textarea').focus();
	});
};
app.setup.about = function(form){
	var url = location.protocol + '//' + location.host + '/';
	var title = '7kai Tasks';
	app.on(form.find('.tweet'), 'click', function(e){
		e.preventDefault();
		e.stopPropagation();
		window.tweet = window.tweet || {};
		var D=550,A=450,C=screen.height,B=screen.width,H=Math.round((B/2)-(D/2)),G=0,F=document,E;
		if(C>A)
			G=Math.round((C/2)-(A/2));
		window.tweet.shareWin = window.open(
			'http://twitter.com/share?url=' + url + '&text=' + title,
			'','left='+H+',top='+G+',width='+D+',height='+A+',personalbar=0,toolbar=0,scrollbars=1,resizable=1'
		);
	});
	app.on(form.find('.share'), 'click', function(e){
		e.preventDefault();
		e.stopPropagation();
		window.share = window.share || {};
		var D=550,A=450,C=screen.height,B=screen.width,H=Math.round((B/2)-(D/2)),G=0;
		if(C>A)
			G=Math.round((C/2)-(A/2));
		window.fbshare.shareWin = window.open('http://www.facebook.com/sharer.php?u=' + url,
			'','left='+H+',top='+G+',width='+D+',height='+A+',personalbar=0,toolbar=0,scrollbars=1,resizable=1');
	});
};

})(this, window, document, jQuery);