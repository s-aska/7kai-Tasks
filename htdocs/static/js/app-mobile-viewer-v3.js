"use strict";
(function(ns, w, d) {

var win = $(w);
var doc = $(d);
var app = ns.app;

app.support = {
	mousedown: 'mousedown',
	mouseup: 'mouseup',
	pageX: function(e){ return e.pageX },
	pageY: function(e){ return e.pageY },
	transitionend: 'transitionEnd'
};

(function(){
	if ('ontouchstart' in d) {
		app.support.mousedown = 'touchstart';
		app.support.mouseup   = 'touchend';
		app.support.pageX     = function(e){ return e.originalEvent.pageX || e.originalEvent.changedTouches[0].pageX };
		app.support.pageY     = function(e){ return e.originalEvent.pageY || e.originalEvent.changedTouches[0].pageY };
	}
	var div = d.createElement('div');
	var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
	for (var i = 0; i < prefixes.length; ++i) {
		var vendorProp = prefixes[i] + 'Transition';
		if (vendorProp in div.style) {
			app.support.transitionend = {
				MozTransition:    'transitionend',
				OTransition:      'oTransitionEnd',
				WebkitTransition: 'webkitTransitionEnd',
				msTransition:     'MSTransitionEnd'
			}[vendorProp];
			break;
		}
	}
	// if ('transition' in div.style) {
	// 	app.support.transitionend = 'transitionEnd';
	// } else {
	// }
})();

app.option.auto_sync_friends = false;

app.addEvents('orientationchange');
app.addEvents('exportMenu');

app.addListener('ready', function(){
	w.addEventListener('online', function(){
		app.api.token();
	});
	w.addEventListener('orientationchange', function(){
		app.fireEvent('orientationchange');
	});
});

app.addListener('setup', function(){
	if (navigator.onLine) {
		app.api.token();
	}
});

// ------------------------------
// スライダー
// ------------------------------
app.slider = {
	map: {},
	cur: null,
	busy: false,
	i: 0,
	register: function(ele){
		var that = this;
		var name = ele.data('slider');
		this.map[name] = ele;
		ele.data('slider-index', this.i++);
		if (ele.hasClass('slider-in')) {
			this.cur = name;
		}
		// Swipe
		ele.on(app.support.mousedown, function(e){
			if (that.busy) return false;
			var initX = app.support.pageX(e);
			var initY = app.support.pageY(e);
			ele.off(app.support.mouseup);
			ele.on(app.support.mouseup, function(e){
				var pageX = app.support.pageX(e);
				var pageY = app.support.pageY(e);
				var diffX = pageX - initX;
				var diffY = Math.abs(pageY - initY);
				if (diffX > 20 && diffX > diffY) {
					e.preventDefault();
					e.stopPropagation();
					ele.off(app.support.mouseup);
					ele.trigger('swipe-prev');
				} else if (diffX < -20 && Math.abs(diffX) > diffY) {
					e.preventDefault();
					e.stopPropagation();
					ele.off(app.support.mouseup);
					ele.trigger('swipe-next');
				}
			});
		});
	},
	show: function(name, back){
		var that       = this;
		var show       = this.map[name];
		if (this.busy || (name === this.cur)) {
			return;
		}
		if (!back && history.pushState) {
			history.pushState(name, '', location.protocol + '//' + location.host + location.pathname + location.search);
		}
		this.busy = true;
		document.activeElement.blur();
		var hide = this.map[this.cur];
		if (show.data('slider-index') > hide.data('slider-index')) {
			// slide in
			show.removeClass('slider-out');
			setTimeout(function(){
				show.on(app.support.transitionend, function(){
					show.off(app.support.transitionend);
					show.addClass('slider-fix');
					hide
						.removeClass('slider-fix')
						.removeClass('slider-in')
						.addClass('slider-out');
					that.cur = name;
					that.busy = false;
				});
				show.scrollTop(0);
				show.addClass('slider-in');
			}, 0);
		} else {
			// slide out
			show
				.removeClass('slider-out')
				.addClass('slider-in')
				.addClass('slider-fix');
			hide
				.on(app.support.transitionend, function(){
					hide.off(app.support.transitionend);
					hide.addClass('slider-out');
					that.cur = name;
					that.busy = false;
				})
				.removeClass('slider-fix')
				.removeClass('slider-in');
		}
	},
	fixed: function(){
		$('section').css({
			height: ((w.innerHeight ? w.innerHeight : win.height()) - 51) + 'px',
			width: win.width() + 'px'
		});
	},
	setup: function(){
		app.addListener('ready', app.slider.fixed);
		app.addListener('resize', app.slider.fixed);
		app.addListener('orientationchange', app.slider.fixed);
		win.on('popstate', function(e){
			if (e.originalEvent.state) {
				e.preventDefault();
				e.stopPropagation();
				app.slider.show(e.originalEvent.state, true);
			}
		});
	}
};

// セットアップ
app.slider.setup.call();

// マッピング
app.setup.slider = function(ele){
	app.slider.register(ele);
};
app.click.slider = function(ele){
	app.slider.show(ele.data('slider'));
};

// ------------------------------
// モーダル
// ------------------------------
app.modal = {
	map: {},
	register: function(ele){
		var that = this;
		var name = ele.data('modal');
		this.map[name] = ele;

	},
	show: function(name, args){
		var backdrop =  $('.modal-backdrop');
		backdrop.on(app.support.transitionend, function(){
			backdrop.on(app.support.mousedown, function(){
				backdrop.off(app.support.mouseup);
				backdrop.on(app.support.mouseup, function(e){
					e.preventDefault();
					backdrop.off(app.support.transitionend);
					app.modal.hide();
				});
			});
		}).show().addClass('in');
		this.map[name].show().addClass('in').trigger('show', args);
	},
	hide: function(){
		var backdrop = $('.modal-backdrop');
		var modal = $('.modal.in');
		modal.removeClass('in').hide();
		backdrop.on(app.support.transitionend, function(){
			backdrop.off(app.support.transitionend);
			backdrop.hide();
		}).removeClass('in');
	}
};

// マッピング
app.setup.modal = function(ele){
	app.modal.register(ele);
};

// ------------------------------
//
// ------------------------------
app.setup.touch = function(ele){
	if (document.ontouchstart === undefined) {
		ele.click(function(e){
			e.preventDefault();
			app.execute(ele, 'click');
		});
		return;
	}
	ele.on('touchstart', function(e){
		e.preventDefault();
		app.execute(ele, 'click');
		window.focus();
		document.activeElement.blur();
	});
}
// fast click
app.setup.click = function(ele){
	app.dom.touch(ele, function(e){
		app.execute(ele, 'click');
	});
}
app.dom.touch = function(ele, callback){
	if (document.ontouchstart === undefined) {
		ele.on('click', function(e){
			e.preventDefault();
			e.stopPropagation();
			callback.call(this, e);
		});
		return ele;
	}
	ele.on('touchstart', function(e){
		ele.off('touchend');
		ele.on('touchend', function(e){
			e.preventDefault();
			e.stopPropagation();
			callback.call(this, e);
			window.focus();
			document.activeElement.blur();
		});
	});
	ele.on('touchmove', function(){
		ele.off('touchend');
	});
	return ele;
}

// ------------------------------
// Sign In
// ------------------------------
app.setup.signin = function(section){
	app.addListener('receiveToken', function(){
		section.find('button').removeAttr('disabled');
	});
	app.addListener('receiveSign', function(){
		app.slider.show('list');
		$('.navbar .nav').show();
	});
}

// ------------------------------
// Task List
// ------------------------------
app.setup.list = function(section){
	var ul = section.find('> ul');
	var list_template = ul.html();
	var task_template = ul.find('> li:first > ul').html();
	ul.empty();

	app.dom.touch(section.find('[data-mode="no-view"]'), function(e){
		e.preventDefault();
		section.attr('data-mode', 'view');
		if (app.data.current_filter && app.data.current_filter.closed) {
			app.fireEvent('filterTask', null);
		}
	});

	var updateSort = function(){
		var sort = {};
		var lists = ul.children();
		var count = lists.length;
		lists.each(function(i, element) {
			var li = $(element);
			if (li.data('id')) {
				sort[li.data('id')] = count;
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
	};

	var listli_toggle = function(li){
		var id = li.data('id');
		var tag = app.data.current_tag;
		if (app.data.current_filter && (!("closed" in app.data.current_filter))) {
			li.toggle(Boolean(li.data('has-visible-tasks')));
		} else if (tag) {
			li.toggle(Boolean((id in app.data.state.tags) && (tag === app.data.state.tags[id])));
		} else {
			li.show();
		}
	};

	app.addListener('toggleTag', function(tag){
		ul.children().each(function(i, element){ listli_toggle($(element)) });
	});

	app.addListener('resetTag', function(){
		ul.children().each(function(i, element){ listli_toggle($(element)) });
	});

	app.addListener('registerList', function(list){

		// if (list.description) {
		// 	li.find('.ui-description').html(app.util.autolink(list.description, 64).replace(/\r?\n/g, '<br />'));
		// 	li.find('> header .name')
		// 		.css('cursor', 'pointer')
		// 		.append($('<i class="icon-info-sign"/>'))
		// 		.click(function(e){
		// 			li.find('.ui-description').slideToggle();
		// 		});
		// }

		if (list.id in app.data.listli_map) {
			var li = app.data.listli_map[list.id];
			li.find('> a.name span').text(list.name);
		} else {
			var li = app.util.parse(list_template);
			li.data('id', list.id);
			li.find('> a.name span').text(list.name);
			li.find('> ul').empty();
			app.dom.setup(li);
			if (list.id in app.data.state.tags) {
				li.attr('data-tag', app.data.state.tags[list.id]);
			}

			// Collapse
			var folder = li.find('.icon-folder-open');
			if ("collapse" in app.data.state && list.id in app.data.state.collapse) {
				folder.removeClass('icon-folder-open').addClass('icon-folder-close');
				li.addClass('closed');
			}
			app.dom.touch(folder.parent(), function(){
				if (folder.hasClass('icon-folder-close')) {
					folder.removeClass('icon-folder-close').addClass('icon-folder-open');
					li.removeClass('closed');
					app.fireEvent('collapseList', list, false);
				} else {
					folder.removeClass('icon-folder-open').addClass('icon-folder-close');
					li.addClass('closed');
					app.fireEvent('collapseList', list, true);
				}
			});

			// Sort
			app.dom.touch(li.find('.icon-chevron-up').parent(), function(){
				var prev = li.prevAll(':first');
				if (prev.length) {
					prev.before(li);
					updateSort();
				}
			});

			app.dom.touch(li.find('.icon-chevron-down').parent(), function(){
				var next = li.nextAll(':first');
				if (next.length) {
					next.after(li);
					updateSort();
				}
			});

			// Tag
			li.find('[data-tag]').each(function(i, element){
				var ele = $(element);
				var tag = ele.data('tag');
				if (tag) {
					if ((list.id in app.data.state.tags) &&
						(tag === app.data.state.tags[list.id])) {
						ele.addClass('active');
						// li.attr('data-tag', tag);
					}
					app.dom.touch(ele, function(e){
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
								app.fireEvent('checkTag', list, tag, ele.hasClass('active'));
							} else {
								// 現在 ステータスコード 200 の例外ケースは無い
							}
						});
					});
				}
			});

			// Clear
			app.dom.touch(li.find('.icon-trash').parent(), function(){
				if (confirm('clear ok?')) {
					app.ajax({
						type: 'POST',
						url: '/api/1/list/clear',
						data: {
							list_id: list.id
						},
						dataType: 'json'
					})
					.done(function(data){
						if (data.success === 1) {
							app.fireEvent('clearList', data.list);
							app.fireEvent('resetCounter');
						} else {
							// 現在 ステータスコード 200 の例外ケースは無い
						}
					});
				}
			});
			li.prependTo(ul);
			app.data.listli_map[list.id] = li;
		}
	});

	app.addListener('deleteList', function(list){
		app.data.listli_map[list.id].remove();
		delete app.data.listli_map[list.id];
	});

	app.addListener('registerTask', function(task, list, slide){
		var ul = app.data.listli_map[list.id].find('> ul');
		if (task.id in app.data.taskli_map) {
			var li = app.data.taskli_map[task.id];
			app.dom.setup(li, task);
			app.setup.task(li, task);
			if (task.parent_id in app.data.taskli_map) {
				app.data.taskli_map[task.parent_id].after(li);
				var paddingLeft = parseInt(app.data.taskli_map[task.parent_id].css('paddingLeft'), 10);
				if (paddingLeft) {
					li.css('paddingLeft', (paddingLeft + 18) + 'px');
				}
			}
		} else {
			var li = app.util.parse(task_template);
			app.dom.setup(li, task);
			app.setup.task(li, task);
			if (task.parent_id in app.data.taskli_map) {
				app.data.taskli_map[task.parent_id].after(li);
				var paddingLeft = parseInt(app.data.taskli_map[task.parent_id].css('paddingLeft'), 10);
				if (paddingLeft) {
					li.css('paddingLeft', (paddingLeft + 18) + 'px');
				}
			} else {
				li.prependTo(ul);
			}
			app.data.taskli_map[task.id] = li;
		}
	});

	app.addListener('sortTask', function(tasks, column, reverse){
		for (var i = 0, max_i = tasks.length; i < max_i; i++) {
			var li = app.data.taskli_map[tasks[i].id];
			var parents = app.util.findParentTasks(tasks[i]);
			if (parents.length) {
				li.css('paddingLeft', ((parents.length * 18) + 10) + 'px');
			} else {
				li.css('paddingLeft', '10px');
			}
			app.data.listli_map[tasks[i].list.id].find('> ul').append(li);
		}
	});

	app.addListener('filterTask', function(condition){
		for (var task_id in app.data.task_map) {
			var task = app.data.task_map[task_id];
			var li = app.data.taskli_map[task_id];
			if (app.util.taskFilter(task, condition)) {
				li.show();
			} else {
				li.hide();
			}
		}
	});

	app.addListener('clearList', function(list){
		var is_remove = function(task){
			if (list.id !== task.list.id) {
				return false;
			}
			if (task.closed) {
				return true;
			}
			if (task.parent_id) {
				var parent = app.data.task_map[task.parent_id];
				if (!parent || parent.closed) {
					return true;
				}
			}
			return false;
		};
		for (var task_id in app.data.task_map) {
			var task = app.data.task_map[task_id];
			var parentTask = app.util.findParentTask(task);
			if (is_remove(task)) {
				if (task_id in app.data.taskli_map) {
					app.data.taskli_map[task_id].remove();
					delete app.data.taskli_map[task_id];
				}
				delete app.data.task_map[task_id];
			}
		}
	});

	app.addListener('clear', function(){
		ul.empty();
		app.data.listli_map = {};
		app.data.taskli_map = {};
	});

	app.addListener('checkStar', function(on, task){
		var li = app.data.taskli_map[task.id];
		var i = li.find('.icon-star');
		if (on) {
			i.removeClass('icon-gray');
		} else {
			i.addClass('icon-gray');
		}
	});

	// Swipe
	section.on('swipe-next', function(){
		app.slider.show('menu');
	});
}
app.click.listMenu = function(ele){
	app.modal.show('list-menu', ele.parent().data('id'));
}
app.click.createTask = function(ele){
	app.fireEvent('createTask', app.data.list_map[ele.parent().data('id')]);
}
app.click.createList = function(ele){
	app.fireEvent('createList');
}
app.setup.task = function(ele, task){
	if (!task) return;
	ele.toggleClass('salvage', !!task.salvage);
	ele.toggleClass('pending', !!task.pending);
	ele.attr('data-mode', task.closed ? 'closed' : 'view');
	ele.toggleClass('single-line', !(task.pins.length > 0 || task.recent || task.due));
	if (! ele.data('id')) {
		ele.data('id', task.id);
		app.dom.touch(ele, function(){
			app.fireEvent('openTask', app.data.task_map[task.id]);
		});
	}
}
app.setup.status = function(ele, task){
	if (!task) return;
	ele.toggleClass('icon-tasks-off', (task.status === 0));
	ele.toggleClass('icon-tasks-half', (task.status === 1));
}
app.setup.star = function(ele, task){
	if (!task) return;
	ele.toggleClass('icon-gray', !(task.id in app.data.state.star));
}
app.setup.assign = function(ele, task){
	if (!task) return;
	if (task.status != 2 && task.assign.length) {
		ele.css('backgroundImage', 'url(' + app.util.getIconUrl(task.assign[0]) + ')');
	} else {
		ele.css('backgroundImage', 'url(' + app.util.getIconUrl(task.requester) + ')');
	}
}
app.setup.name = function(ele, task){
	if (!task) return;
	ele.text(task.name);
}
app.setup.due = function(ele, task){
	if (!task) return;
	if (task.due) {
		var week = app.env.lang === 'ja'
			? app.WEEK_NAMES_JA[task.due_date.getDay()]
			: app.WEEK_NAMES[task.due_date.getDay()];
		var label = (task.due_date.getMonth() + 1) + '/' + task.due_date.getDate();
		var now = new Date();
		if (now.getFullYear() !== task.due_date.getFullYear()) {
			if (app.env.lang === 'ja') {
				label = task.due_date.getFullYear() + '/' + label;
			} else {
				label = label + '/' + task.due_date.getFullYear();
			}
		}
		ele.find('span.date').text(label);
		ele.find('span.week').text(week);
		if (now.getTime() > task.due_date.getTime()) {
			ele.addClass('over');
		}
		ele.show();
	} else {
		ele.hide();
	}
}
app.setup.recent = function(ele, task){
	if (!task) return;
	if (task.recent) {
		var html = app.util.autolink(task.recent.message).replace(/\r?\n/g, '<br />');
		ele.find('span').html(html);
		ele.find('span a').click(function(e){ e.stopPropagation() });
		ele.show();
		task.option = true;
	} else {
		ele.hide();
	}
}
app.setup.pin = function(ul, task){
	if (!task) return;
	if (task.pins.length > 0) {
		var template = ul.data('template');
		if (! template) {
			template = ul.html();
			ul.data('template', template);
		}
		ul.empty();
		for (var i = 0, max_i = task.pins.length; i < max_i; i++) {
			var action = task.pins[i];
			var li = app.util.parse(template);
			var html = app.util.autolink(action.message).replace(/\r?\n/g, '<br />');
			li.find('span')
				.html(html)
				.find('a').click(function(e){ e.stopPropagation() });
			li.appendTo(ul);
		}
		ul.show();
	} else {
		ul.hide();
	}
}

// ------------------------------
// List Menu
// ------------------------------
app.setup.listMenu = function(ele){
	var section = $('#list');
	ele.on('show', function(e, list_id){
		ele.data('id', list_id);
		ele.find('.icon-share-alt').parent().toggle(!!list.original);
		ele.find('.icon-remove').parent().toggle(!!list.original);
		ele.find('.icon-volume-off').parent().toggle(!(list_id in app.data.state.mute));
		ele.find('.icon-volume-up').parent().toggle(list_id in app.data.state.mute);
	});
	app.dom.touch(ele.find('.icon-sort').parent(), function(e){
		e.preventDefault();
		section.attr('data-mode', 'sort');
		app.modal.hide();
	});
	app.dom.touch(ele.find('.icon-tag').parent(), function(e){
		e.preventDefault();
		section.attr('data-mode', 'tag');
		app.modal.hide();
	});
	app.dom.touch(ele.find('.icon-share-alt').parent(), function(e){
		e.preventDefault();
		app.fireEvent('exportMenu', app.data.list_map[ele.data('id')]);
		app.modal.hide();
	});
	app.dom.touch(ele.find('.icon-volume-off').parent(), function(e){
		e.preventDefault();
		var a = $(this);
		app.api.account.update({
			ns: 'state',
			method: 'on',
			key: 'mute',
			val: ele.data('id')
		})
		.done(function(data){
			if (data.success === 1) {
				app.data.state.mute = data.account.state.mute;
				app.fireEvent('checkMute', app.data.list_map[ele.data('id')], false);
				app.fireEvent('filterTask', app.data.current_filter);
				a.hide();
				ele.find('.icon-volume-up').parent().show();
			} else {
				// 現在 ステータスコード 200 の例外ケースは無い
			}
		});
	});
	app.dom.touch(ele.find('.icon-volume-up').parent(), function(e){
		e.preventDefault();
		var a = $(this);
		app.api.account.update({
			ns: 'state',
			method: 'off',
			key: 'mute',
			val: ele.data('id')
		})
		.done(function(data){
			if (data.success === 1) {
				app.data.state.mute = data.account.state.mute;
				app.fireEvent('checkMute', app.data.list_map[ele.data('id')], true);
				app.fireEvent('filterTask', app.data.current_filter);
				a.hide();
				ele.find('.icon-volume-off').parent().show();
			} else {
				// 現在 ステータスコード 200 の例外ケースは無い
			}
		});
	});
	app.dom.touch(ele.find('.icon-user').parent(), function(e){
		e.preventDefault();
		app.fireEvent('editListMember', app.data.list_map[ele.data('id')]);
		app.modal.hide();
	});
	app.dom.touch(ele.find('.icon-edit').parent(), function(e){
		e.preventDefault();
		e.stopPropagation();
		app.modal.hide();
		app.fireEvent('editList', app.data.list_map[ele.data('id')]);
	});
	app.dom.touch(ele.find('.icon-remove').parent(), function(e){
		e.preventDefault();
		e.stopPropagation();
		if (confirm('remove list?')) {
			var list = app.data.list_map[ele.data('id')];
			app.ajax({
				type: 'POST',
				url: '/api/1/list/delete',
				data: {
					list_id: ele.data('id')
				},
				dataType: 'json'
			})
			.done(function(data){
				if (data.success === 1) {
				} else {
					// 現在 ステータスコード 200 の例外ケースは無い
				}
			});
			app.fireEvent('deleteList', list);
			app.modal.hide();
		}
	});
}

// ------------------------------
// Register Task
// ------------------------------
app.setup.registerTask = function(section){
	var slider          = section.data('slider');
	var form            = section.find('form');
	var list_name       = form.find('.list-name');
	var list_id         = form.find('input[name="list_id"]');
	var task_id         = form.find('input[name="task_id"]');
	var name            = form.find('input[name="name"]');
	var due             = form.find('select[name="due"]');
	var duration        = form.find('input[name="duration"]');
	var requester       = form.find('select[name="requester"]');
	var parent_id       = form.find('select[name="parent_id"]');
	var assign_ul       = form.find('ul.assign');
	var close           = form.find('button.btn-inverse');
	var assign_template = assign_ul.html();

	var setup = function(list, task){
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
		if (list.members.length) {
			form.find('.team').show();
			var assigns = [list.owner].concat(list.members);
			for (var i = 0, max_i = assigns.length; i < max_i; i++) {
				var assign = assigns[i];
				var friend = app.data.users[assign];
				if (!friend) {
					continue;
				}
				var li = app.util.parse(assign_template);
				if (friend && friend.icon) {
					li.find('span').css('backgroundImage', 'url(' + friend.icon + ')');
				} else {
					li.find('span').css('backgroundImage', 'url(/static/img/address.png)');
				}
				var name = friend ? friend.name : assign;
				li.find('span').text(name);
				li.find('input').val(assign);
				li.appendTo(assign_ul);
				$('<option/>')
					.attr('value', assign)
					.text(name)
					.appendTo(requester);
			}
			requester.show().prev().show();
			assign_ul.show().prev().show();
		} else {
			requester.hide().prev().hide();
			assign_ul.hide().prev().hide();
		}
		if (list.tasks.length) {
			parent_id.empty();
			parent_id.append(new Option('', ''));
			for (var i = 0, max_i = list.tasks.length; i < max_i; i++) {
				if (!task || list.tasks[i].id.indexOf(task.id) !== 0) {
					parent_id.append(new Option(list.tasks[i].name, list.tasks[i].id));
				}
			}
			parent_id.show().prev().show();
		} else {
			parent_id.hide().prev().hide();
		}
	};

	app.addListener('createTask', function(list){
		list_name.text(list.name);
		list_id.val(list.id);
		task_id.val('');
		name.val('');
		setup(list);
		requester.val(app.data.sign.account_id);
		app.slider.show(slider);
	});

	app.addListener('editTask', function(task){
		list_name.text(task.list.name);
		list_id.val(task.list.id);
		task_id.val(task.id);
		name.val(task.name);
		duration.val(task.duration);
		setup(task.list, task);
		due.val(task.due ? app.date.ymd(task.due_date) : '');
		parent_id.val(task.parent_id);
		requester.val(task.requester);
		assign_ul.find('input[name=assign]').val(task.assign);
		app.slider.show(slider);
	});

	form.submit(function(e){
		e.preventDefault();
		var task_id_val   = task_id.val();
		var list_id_val   = list_id.val();
		var assign_val    = form.find('input[name="assign"]:checked').map(function(){return $(this).val()}).get();
		var requester_val = form.find('select[name="requester"]').val();
		var name_val      = name.val();
		var due_val       = due.val();
		if (due_val) {
			due_val = app.date.mdy(app.date.parse(due_val));
		}
		var duration_val = duration.val();
		var api = task_id_val ? 'task.update' : 'task.create';
		var url = task_id_val ? '/api/1/task/update' : '/api/1/task/create';
		app.ajax({
			type: 'POST',
			url: url,
			data: form.serialize(),
			dataType: 'json',
			salvage: true
		})
		.done(function(data){
			if (data.success === 1) {
				app.fireEvent('registerTask', data.task, app.data.list_map[list_id_val], !task_id);
				app.dom.reset(form);
				if (task_id_val) {
					document.activeElement.blur();
					app.fireEvent('openTask', data.task);
				} else {
					app.data.list_map[list_id_val].tasks.push(data.task);
				}
				var alert = $('#register-task');
				alert.removeClass('in').show();
				setTimeout(function(){
					alert.addClass('in');
				});
				setTimeout(function(){
					alert.on(app.support.transitionend, function(){
						alert.off(app.support.transitionend);
						alert.removeClass('in').hide();
					}).removeClass('in');
				}, 1500);
			} else {
				// 現在 ステータスコード 200 の例外ケースは無い
			}
		})
		.fail(function(jqXHR, textStatus, errorThrown){
			// if (!jqXHR.status) {
			// 	app.queue.push({
			// 		api: api,
			// 		req: form.serializeArray()
			// 	});
			// 	app.dom.reset(form);
			// 	var time = (new Date()).getTime();
			// 	var task = {
			// 		id: (task_id || (list.id + ':' + time)),
			// 		requester: requester,
			// 		registrant: app.data.sign.account_id,
			// 		assign: assign,
			// 		name: name,
			// 		due: due,
			// 		duration: duration,
			// 		status: 0,
			// 		closed: 0,
			// 		actions: [],
			// 		created_on: time,
			// 		updated_on: time,
			// 		salvage: true
			// 	};
			// 	app.fireEvent('registerTask', task, list);
			// 	app.fireEvent('openTask', task);
			// 	app.dom.reset(form);
			// 	if (task_id) {
			// 		app.dom.hide(form);
			// 	} else {
			// 		app.dom.show(app.dom.get('showable', 'create-task-twipsy'));
			// 	}
			// }
		});
	});

	app.dom.touch(close, function(e){
		e.preventDefault();
		app.slider.show(task_id.val() ? 'task' : 'list');
	});

	section.on('swipe-prev', function(){
		app.slider.show(task_id.val() ? 'task' : 'list');
	});
}

// ------------------------------
// Register List
// ------------------------------
app.setup.registerList = function(section){
	var form = section.find('form');
	app.addListener('createList', function(){
		app.slider.show(section.data('slider'));
	});
	app.addListener('editList', function(list){
		form.find('input[name="list_id"]').val(list.id);
		form.find('input[name="name"]').val(list.name);
		form.find('textarea').val(list.description);
		app.slider.show(section.data('slider'));
	});
	form.submit(function(e){
		e.preventDefault();
		var id = form.find('input[name="list_id"]').val();
		var url = id ? '/api/1/list/update' : '/api/1/list/create';
		app.ajax({
			type: 'POST',
			url: url,
			data: form.serialize(),
			dataType: 'json'
		})
		.done(function(data){
			if (data.success === 1) {
				if (data.list.id in app.data.list_map) {
					$.extend(app.data.list_map[data.list.id], data.list);
				}
				app.fireEvent('registerList', data.list);
				app.slider.show('list');
			} else {
				// 現在 ステータスコード 200 の例外ケースは無い
			}
		});
	});
	app.dom.touch(form.find('.btn-inverse'), function(){
		app.slider.show('list');
	});
	section.on('swipe-prev', function(){
		app.slider.show('list');
	});
}

// ------------------------------
// Menu
// ------------------------------
app.setup.desc = function(section){
	var slider   = section.data('slider');
	var p        = section.find('> article > p:first');
	var due      = section.find('> article > div.spec span.due');
	var duration = section.find('> article > div.spec span.duration');
	var human    = section.find('> article > div.spec span.human');
	var form     = section.find('form');
	var pins     = section.find('ul.pins');
	var comments = section.find('ul.comments');
	var list_id  = form.find('input[name="list_id"]');
	var task_id  = form.find('input[name="task_id"]');
	var status   = form.find('input[name="status"]');
	var closed   = form.find('input[name="closed"]');
	var textarea = form.find('textarea');
	var cancel   = form.find('.cancel');
	var button   = form.find('button.comment');
	var edit     = form.find('button.edit');
	var star     = form.find('button.star');
	var pending  = form.find('button.pending');
	var buttons  = form.find('button[data-plus]');
	var counter  = form.find('.counter');
	var template = comments.html();

	var textarea_watch = function(){
		button.attr('disabled', !textarea.val().length);
		counter.text(400 - textarea.val().length);
	};
	textarea
		.change(textarea_watch)
		.keydown(textarea_watch)
		.keyup(textarea_watch)
		.on('paste', textarea_watch);

	app.dom.touch(cancel, function(){
		app.slider.show('list');
	});

	app.dom.touch(edit, function(){
		app.fireEvent('editTask', app.data.task_map[task_id.val()]);
	});

	app.dom.touch(star, function(){
		star.toggleClass('active');
		var task = app.data.task_map[task_id.val()];
		var method = 'on';
		if (task.id in app.data.state.star) {
			method = 'off';
			delete app.data.state.star[task.id];
		} else {
			app.data.state.star[task.id] = 1;
		}
		app.fireEvent('checkStar', method === 'on', task);
		app.api.account.update({
			ns: 'state',
			method: method,
			key: 'star',
			val: task.id
		});
	});

	app.dom.touch(pending, function(){
		pending.toggleClass('active');
		var task = app.data.task_map[task_id.val()];
		app.api.task.update({
			list_id: task.list.id,
			task_id: task.id,
			pending: (task.pending ? 0 : 1)
		});
	});

	app.dom.touch(button, function(){
		form.submit();
	});

	app.dom.touch(buttons, function(){
		var plus = $(this).data('plus');
		if (plus === 'start') {
			status.val(1);
		} else if (plus === 'fix') {
			status.val(2);
		} else if (plus === 'revert') {
			status.val(0);
		} else if (plus === 'close') {
			closed.val(1);
		}
		form.submit();
	});

	// Pinned comments
	var render_pin = function(task){
		pins.empty();
		for (var i = 0, max_i = task.pins.length; i < max_i; i++) {
			$('<li>')
				.html(app.util.autolink(task.pins[i].message).replace(/\r?\n/g, '<br />'))
				.prepend($('<i class="icon icon-pin"></i>'))
				.appendTo(pins);
		}
	};

	app.addListener('openTask', function(task){
		p.text(task.name);
		list_id.val(task.list.id);
		task_id.val(task.id);
		star.toggleClass('active', Boolean(task.id in app.data.state.star));
		pending.toggleClass('active', !!task.pending);
		textarea.val('');
		status.val('');
		closed.val('');
		textarea.attr('disabled', false);
		button.attr('disabled', true);
		counter.text(400);
		buttons.each(function(i, element){
			var ele = $(element);
			var plus = ele.data('plus');
			if (plus === 'start') {
				ele.attr('disabled', !(!task.closed && task.status === 0));
			} else if (plus === 'fix') {
				ele.attr('disabled', !(!task.closed && task.status !== 2));
			} else if (plus === 'revert') {
				ele.attr('disabled', !(task.closed || task.status !== 0));
			} else if (plus === 'close') {
				ele.attr('disabled', Boolean(task.closed));
			}
		});

		due.text( task.due ? app.date.ymd(task.due_date) : '-' );
		duration.text( task.duration ? task.duration + ' days' : '-' );

		render_pin(task);

		// Comments
		comments.empty();
		$.each(task.actions, function(i, comment){
			var li = app.util.parse(template);
			var i  = li.find('i:first');
			var x  = li.find('i:last').parent();

			li.find('.name').text(app.util.getName(comment.account_id));
			li.find('img').attr('src', app.util.getIconUrl(comment.account_id));
			// if (comment.salvage) {
			// 	li.addClass('salvage');
			// 	li.find('.icon:last').remove();
			// }
			if (comment.action !== 'comment') {
				li.find('.message').text(
					app.data.messages.data('text-' + comment.action + '-' + app.env.lang));
				if (comment.action === 'start-task') {
					i.attr('class', 'icon-play');
				} else if (comment.action === 'fix-task') {
					i.attr('class', 'icon-forward');
				} else if (comment.action === 'close-task') {
					i.attr('class', 'icon-remove');
				} else if (comment.action === 'reopen-task') {
					i.attr('class', 'icon-backward');
				}
			}
			if (! comment.message) {
				li.find('.menu').remove();
				x.remove();
			} else {
				if (comment.message === '[like]') {
					i.attr('class', 'icon-heart');
				} else {
					li.find('.message').html(app.util.autolink(comment.message).replace(/\r?\n/g, '<br />'));
				}
				app.dom.touch(x, function(e){
					e.preventDefault();
					if (! confirm(app.dom.text(x) + "\n[" + comment.message + ']')) {
						return false;
					}
					app.ajax({
						type: 'POST',
						url: '/api/1/comment/delete',
						data: {
							list_id: task.list.id,
							task_id: task.id,
							comment_id: comment.id
						},
						dataType: 'json'
					})
					.done(function(data){
						if (data.success === 1) {
							x.parent().parent().remove();
							app.fireEvent('registerTask', data.task, task.list);
							render_pin(data.task);
						} else {
							// 現在 ステータスコード 200 の例外ケースは無い
						}
					});
					return false;
				});
				var a = li.find('.menu a');
				if (a) {
					if (comment.is_pinned) {
						a.text('Unpinned');
					}
					app.dom.touch(a, function(e){
						var method = a.text() === 'Pin' ? 'pin' : 'unpin';
						app.ajax({
							type: 'POST',
							url: '/api/1/comment/' + method,
							data: {
								list_id: task.list.id,
								task_id: task.id,
								comment_id: comment.id
							},
							dataType: 'json'
						})
						.done(function(data){
							if (data.success === 1) {
								a.text(a.text() === 'Pin' ? 'Unpinned' : 'Pin');
								app.fireEvent('registerTask', data.task, task.list);
								render_pin(data.task);
							} else {
								// 現在 ステータスコード 200 の例外ケースは無い
							}
						});
					});
				}
			}
			li.find('.date').text(app.date.relative(comment.time));
			li.prependTo(comments);
		});
		app.slider.show(slider);
	});

	form.submit(function(e){
		e.preventDefault();
		var task_id_val = task_id.val();
		var list_id_val = list_id.val();
		var list = app.data.list_map[list_id_val];
		if (! list) {
			alert('unknown list ' + list_id_val);
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
			type: 'POST',
			url: url,
			data: form.serialize(),
			dataType: 'json',
			salvage: true
		})
		.done(function(data){
			if (data.success === 1) {
				app.dom.reset(form);
				document.activeElement.blur();
				app.fireEvent('registerTask', data.task, list);
				app.fireEvent('openTask', data.task);
			} else {
				// 現在 ステータスコード 200 の例外ケースは無い
			}
		})
		.fail(function(jqXHR, textStatus, errorThrown){
			if (!jqXHR.status) {
				// app.queue.push({
				// 	api: 'comment.create',
				// 	req: form.serializeArray()
				// });
				// app.dom.reset(form);
				// var task = app.data.task_map[task_id];
				// if (task) {
				// 	task.actions.push({
				// 		action: 'comment',
				// 		account_id: app.data.sign.account_id,
				// 		message: message,
				// 		time: (new Date()).getTime(),
				// 		salvage: true
				// 	});
				// 	app.fireEvent('registerTask', task, list);
				// 	app.fireEvent('openTask', task);
				// }
				// document.activeElement.blur();
			}
		});
	});

	section.on('swipe-prev', function(){
		app.slider.show('list');
	});
}

// ------------------------------
// Member
// ------------------------------
app.setup.member = function(section){
	var form = section.find('form');
	var ul = form.find('ul');
	var template = ul.html();

	app.dom.touch(form.find('.btn-primary'), function(){
		var id = form.data('id');
		app.api.list.invite(id).done(function(data){
			var url = location.protocol + '//'
				+ location.host
				+ '/join/'
				+ id
				+ '/'
				+ data.invite_code;
			form.find('input[name="invite_code"]').val(url);
			app.data.list_map[id].invite_code = data.invite_code;
		});
	});

	app.dom.touch(form.find('.btn-danger'), function(){
		var id = form.data('id');
		app.api.list.disinvite(id).done(function(){
			form.find('input[name="invite_code"]').val('');
			app.data.list_map[id].invite_code = null;
		});
	});

	app.addListener('editListMember', function(list){
		form.data('id', list.id);
		form.find('> p > span:first').text(list.name);
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
		ul.empty();
		for (var i = 0, max_i = list.members.length; i < max_i; i++) {
			var account_id = list.members[i];
			if (!(account_id in app.data.users)) {
				continue;
			}
			var user = app.data.users[account_id];
			app.util.parse(template)
				.find('img').attr('src', app.util.getIconUrl(account_id)).end()
				.find('span').text(user.name).end()
				.find('a')
					.data('id', account_id)
					.data('name', user.name)
					.click(function(e){
						e.preventDefault();
						var a = $(this);
						if (confirm(app.dom.text(a) + "\n[" + a.data('name') + ']')) {
							app.api.list.leave(list.id, a.data('id')).done(function(data){
								list.members = $.grep(list.members, function(account_id){
									return account_id !== a.data('id');
								});
								a.parent().remove();
							});
						}
					}).end()
				.appendTo(ul);
		}
		app.slider.show(section.data('slider'));
	});
	section.on('swipe-prev', function(){
		app.slider.show('list');
	});
	app.dom.touch(section.find('.btn-inverse'), function(){
		app.slider.show('list');
	});
}

// ------------------------------
// Export
// ------------------------------
app.setup.export = function(section){
	section.on('show', function(e, list){
		section.find('input').each(function(){
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
	app.addListener('exportMenu', function(list){
		section.data('id', list.id);
		section.trigger('show', list);
		app.slider.show(section.data('slider'));
	});
	app.dom.touch(section.find('.btn-public'), function(){
		var id = section.data('id');
		app.ajax({
			type: 'POST',
			url: '/api/1/list/public',
			data: {
				list_id: id
			},
			dataType: 'json'
		}).done(function(data){
			app.data.list_map[id].public_code = data.public_code;
			section.trigger('show', app.data.list_map[id]);
		});
	});
	app.dom.touch(section.find('.btn-private'), function(){
		var id = section.data('id');
		app.ajax({
			type: 'POST',
			url: '/api/1/list/private',
			data: {
				list_id: id
			},
			dataType: 'json'
		}).done(function(data){
			app.data.list_map[id].public_code = null;
			section.trigger('show', app.data.list_map[id]);
		});
	});
	section.on('swipe-prev', function(){
		app.slider.show('list');
	});
	app.dom.touch(section.find('.btn-inverse'), function(){
		app.slider.show('list');
	});
}

// ------------------------------
// Menu
// ------------------------------
app.setup.menu = function(section){
	section.on('swipe-next', function(){
		app.slider.show('diary');
	});
	section.on('swipe-prev', function(){
		app.slider.show('list');
	});
}

// ------------------------------
// Diary
// ------------------------------
app.setup.diary = function(section){
	var article = section.find('article');
	var ul = section.find('ul');
	var template = ul.html();
	ul.empty();
	var current_ymd;
	app.addListener('receiveMe', function(data){
		article.empty();
		var actions = [];
		$.each(data.lists, function(i, list){
			$.each(list.tasks, function(ii, task){
				task.list = list;
				if (task.due) {
					var degits = task.due.match(/[0-9]+/g);
					task.due_epoch = (new Date(degits[2], degits[0] - 1, degits[1])).getTime();
				}
				actions.push({
					task: task,
					action: 'create-task',
					account_id: task.registrant,
					time: task.created_on
				});
				$.each(task.actions, function(iii, action){
					action.task = task;
					actions.push(action);
				});
			});
		});
		actions.sort(function(a, b){
			return b.time - a.time;
		});
		if (! actions.length) {
			article.append($('<h1/>').text(article.data('text-empty-' + app.env.lang)));
		}
		$.each(actions, function(i, action){
			var li = app.util.parse(template);
			var i = li.find('i');
			li.find('.list').text(action.task.list.name);
			li.find('.task').text(action.task.name);
			li.find('.name').text(app.util.getName(action.account_id));
			li.find('img').attr('src', app.util.getIconUrl(action.account_id));
			if (action.action !== 'comment') {
				li.find('.message').text(
					app.data.messages.data('text-' + action.action + '-' + app.env.lang));
				if (action.action === 'start-task') {
					i.attr('class', 'icon-play');
				} else if (action.action === 'fix-task') {
					i.attr('class', 'icon-forward');
				} else if (action.action === 'close-task') {
					i.attr('class', 'icon-remove');
				} else if (action.action === 'reopen-task') {
					i.attr('class', 'icon-backward');
				}
			}
			if (action.message) {
				if (action.message === '[like]') {
					i.attr('class', 'icon-heart');
				} else {
					li.find('.message').html(app.util.autolink(action.message).replace(/\r?\n/g, '<br />'));
				}
			}
			// li.find('.date').text(app.date.relative(action.time));
			var ymd = app.date.ymd(new Date(action.time));
			if (current_ymd !== ymd) {
				if (current_ymd) {
					$('<hr>').appendTo(article);
				}
				$('<h1/>').text(ymd).appendTo(article);
				ul = $('<ul class="unstyled comments"/>').appendTo(article);
				current_ymd = ymd;
			}
			li.appendTo(ul);
			if (i > 100) {
				return false;
			}
		});
	});

	section.on('swipe-prev', function(){
		app.slider.show('menu');
	});
}

app.setup.invite = function(section){
	app.dom.touch(section.find('.btn-primary'), function(){
		var list_id = section.find('input[name="list_id"]').val();
		var invite_code = section.find('input[name="invite_code"]').val();
		app.api.list.join(list_id, invite_code).done(function(data){
			app.fireEvent('reload');
			app.modal.hide();
		});
	});
	app.dom.touch(section.find('.btn-danger'), function(){
		app.modal.hide();
	});
	app.addListener('receiveInvite', function(invite){
		section.find('strong').text(invite.list_name);
		section.find('input[name="list_id"]').val(invite.list_id);
		section.find('input[name="invite_code"]').val(invite.invite_code);
		app.modal.show(section.data('modal'));
	});
}

// ------------------------------
// その他
// ------------------------------
app.setup.logo = function(ele){
	ele.click(function(e){
		// w.location.reload();
		e.preventDefault();
		app.fireEvent('reload');
		app.fireEvent('resize');
	});
};
app.setup.switchClosed = function(ele){
	app.addListener('filterTask', function(condition){
		ele.toggleClass('active', Boolean(condition && condition.closed));
	});
	var list = $('#list');
	ele.click(function(){
		var val = ele.hasClass('active') ? 0 : 1;
		app.fireEvent('filterTask', { closed: val });
		if (val) {
			ele.addClass('active');
			list.attr('data-mode', 'closed');
		} else {
			ele.removeClass('active');
			list.attr('data-mode', 'view');
		}
	});
}
app.setup.tags = function(ul){
	ul.find('a[data-tag]').each(function(i, element){
		var ele = $(element);
		var tag = ele.data('tag');
		if (tag) {
			app.dom.touch(ele, function(){
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

})(this, this, document);