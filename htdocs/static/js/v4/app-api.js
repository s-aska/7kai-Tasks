(function(ns, w, d, $) {

$.extend(ns.app, {
	api: {
		account: {},
		list: {},
		task: {},
		comment: {},
		feedback: {}
	}
});

var app = ns.app;

app.api.token = function(){
	return app.ajax({
		url: '/token',
		dataType: 'json',
		loading: false
	});
}
app.api.account.me = function(option){
	if (! navigator.onLine) {
		console.log('offline');
		return $.Deferred();
	}
	return app.ajax({
		url: '/api/1/account/me',
		data: option.data,
		dataType: 'json',
		loading: false,
		setup: option.setup
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
	});
	// .fail(function(jqXHR, textStatus, errorThrown){
	// 	if (!jqXHR.status) {
	// 		app.queue.push({
	// 			api: 'account.update',
	// 			req: params
	// 		});
	// 	}
	// });
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
app.api.list.create = function(data){
	return app.ajax({
		type: 'post',
		url: '/api/1/list/create',
		data: data,
		dataType: 'json',
		salvage: false,
		loading: false
	});
}
app.api.list.update = function(data){
	return app.ajax({
		type: 'post',
		url: '/api/1/list/update',
		data: data,
		dataType: 'json',
		salvage: false,
		loading: false
	});
}
app.api.list.delete = function(list_id){
	return app.ajax({
		type: 'post',
		url: '/api/1/list/delete',
		data: {
			list_id: list_id
		},
		dataType: 'json',
		salvage: false,
		loading: false
	});
}
app.api.list.clear = function(list_id){
	return app.ajax({
		type: 'post',
		url: '/api/1/list/clear',
		data: {
			list_id: list_id
		},
		dataType: 'json',
		salvage: false,
		loading: false
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
app.api.list.public = function(list_id){
	return app.ajax({
		type: 'post',
		url: '/api/1/list/public',
		data: {
			list_id: list_id
		},
		dataType: 'json',
		salvage: false,
		loading: false
	});
}
app.api.list.private = function(list_id){
	return app.ajax({
		type: 'post',
		url: '/api/1/list/private',
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
app.api.task.create = function(data){
	return app.ajax({
		type: 'post',
		url: '/api/1/task/create',
		data: data,
		dataType: 'json',
		traditional: true,
		salvage: true,
		loading: false
	});
}
app.api.task.update = function(data){
	return app.ajax({
		type: 'post',
		url: '/api/1/task/update',
		data: data,
		dataType: 'json',
		salvage: true,
		loading: false
	});
}
app.api.task.move = function(src_list_id, task_id, dst_list_id){
	if (src_list_id === dst_list_id) {
		alert("Can't be moved to the same list.");
		return $.Deferred();
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
	});
}
app.api.comment.pin = function(list_id, task_id, comment_id){
	return app.ajax({
		type: 'post',
		url: '/api/1/comment/pin',
		data: {
			list_id: list_id,
			task_id: task_id,
			comment_id: comment_id
		},
		dataType: 'json'
	});
}
app.api.comment.unpin = function(list_id, task_id, comment_id){
	return app.ajax({
		type: 'post',
		url: '/api/1/comment/unpin',
		data: {
			list_id: list_id,
			task_id: task_id,
			comment_id: comment_id
		},
		dataType: 'json'
	});
}
app.api.comment.delete = function(list_id, task_id, comment_id){
	return app.ajax({
		type: 'post',
		url: '/api/1/comment/delete',
		data: {
			list_id: list_id,
			task_id: task_id,
			comment_id: comment_id
		},
		dataType: 'json'
	});
}
app.api.feedback.send = function(params){
	return app.ajax({
		type: 'post',
		url: '/api/1/feedback/send',
		data: params,
		dataType: 'json',
		salvage: false,
		loading: false
	});
}

})(this, window, document, jQuery);