(function(ns, w, d, $) {

$.extend(ns.app, { util: {} });

var app = ns.app;

var REGEXP_URL = new RegExp('(?:https?://[\\x21-\\x7e]+)', 'g');

app.util.debounce = function(f, threshold){
	var timeout;

	return function(){
		var self = this;
		var args = arguments;

		if (timeout)
			clearTimeout(timeout);

		timeout = setTimeout(function(){
			f.apply(self, args);
			timeout = null;
		}, threshold || 100);
	};
}
app.util.autolink = function(text, truncate){
	return text
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(REGEXP_URL, function(url){
		var a = d.createElement('a');
		a.href = url;
		a.target = '_blank';
		if (truncate && url.length > truncate) {
			a.appendChild(d.createTextNode(url.substring(0, truncate) + '...'));
		} else {
			a.appendChild(d.createTextNode(url));
		}
		var div = d.createElement('div');
		div.appendChild(a);
		return div.innerHTML;
	});
}
app.util.parseHTML = function(template){
	return $($.parseHTML(template.replace(/^\s+/, '').replace(/\s+$/, '')));
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
	return $('<img/>').attr('src', src);
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
app.util.findChildTasks = function(task, callback, tasks){
	if (!tasks) {
		tasks = [];
	}
	for (var id in app.data.task_map) {
		if (app.data.task_map[id].parent_id === task.id) {
			var child = app.data.task_map[id];
			tasks.push(child);
			if (callback) {
				if (callback(child) === false) {
					break;
				}
			}
			app.util.findChildTasks(child, callback, tasks);
		}
	}
	return tasks;
}
app.util.isChildTask = function(task, child){
	var ret = false;
	app.util.findParentTasks(child, function(parent){
		if (parent.id === task.id) {
			ret = true;
			return false;
		}
	});
	return ret;
}
app.util.findParentTask = function(task){
	return app.data.task_map[task.parent_id];
}
app.util.findParentTasks = function(task, callback){
	var parents = [], current = task;
	var i = 0;
	while (current.parent_id && current.parent_id.length && app.data.task_map[current.parent_id]) {
		var parent = app.data.task_map[current.parent_id];
		if (parent.id === task.id || i > 10) {
			console.log('Circular reference.');
			break; // loop
		}
		if (callback) {
			if (callback(parent) === false) {
				break;
			}
		}
		parents.push(parent);
		current = parent;
		i++;
	}
	return parents;
}
app.util.hasCloseParentTask = function(task){
	var ret = false;
	app.util.findParentTasks(task, function(parent){
		if (parent.closed) {
			ret = true;
			return false;
		}
	});
	return ret;
}
app.util.hasChildTask = function(task){
	for (var task_id in app.data.task_map) {
		if (app.data.task_map[task_id].parent_id === task.id) {
			return true;
		}
	}
	return false;
}
app.util.hasCloseChildTask = function(task){
	var ret = false;
	app.util.findChildTasks(task, function(child){
		if (child.closed) {
			ret = true;
			return false;
		}
	});
	return ret;
}
app.util.hasOpenChildTask = function(task){
	var ret = false;
	app.util.findChildTasks(task, function(child){
		if (! child.closed) {
			ret = true;
			return false;
		}
	});
	return ret;
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
app.util.findQuery = function(data, key){
	return Boolean((typeof data === 'object') ? (key in data) : (data.indexOf(key) !== -1));
}
app.util.text = function(ele, key){
	if (key) {
		return ele.data('text-' + key + '-' + app.env.lang);
	} else {
		return ele.data('text-' + app.env.lang);
	}
}
app.util.scrollTopFix = function(wrapper, target, forceTop){
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

})(this, window, document, jQuery);