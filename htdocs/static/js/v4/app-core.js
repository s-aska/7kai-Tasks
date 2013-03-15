'use strict';

(function(ns, w, d, $) {

if (typeof w.console !== 'object') { console = { log: function(){} } }

var app = ns.app = {
	env: {
		token: '',
		lang: (
			location.search.match(/lang=(ja|en)/) ? RegExp.$1 :
			/^ja/.test(navigator.language || navigator.userLanguage) ? 'ja' : 'en'
		),
		development: (w.location.hostname === '127.0.0.1' ? true : false)
	}
};

/*
 * イベント管理
 */
var events = {};
app.addEvents = function(){
	var args = $.makeArray(arguments);
	for (var i = 0, max_i = args.length; i < max_i; i++) {
		events[args[i]] = [];
	}
}
app.addListener = function(name, fh, context){
	if (!(name in events)) {
		console.log('unknown event ' + name);
		return;
	}
	events[name].push([fh, context]);
}
app.fireEvent = function(){
	var args = $.makeArray(arguments);
	var name = args.shift();
	if (!(name in events)) {
		console.log('unknown event ' + name);
		return;
	}
	for (var i = 0, max_i = events[name].length; i < max_i; i++) {
		events[name][i][0].apply(events[name][i][1] || app, args);
	}
}

app.addEvents('ready'); // document ready

/*
 * トークン埋め込み、例外処理、サルベージを付与
 */
app.ajax = function(option){
	if ('data' in option && 'type' in option && option.type === 'post' && app.env.token) {
		if (typeof option.data === 'object') {
			option.data['csrf_token'] = app.env.token;
		} else {
			option.data = option.data + '&csrf_token=' + app.env.token;
		}
	}
	// if (app.option.show_loading && option.loading !== false) {
	// 	app.loading.start();
	// }

	return $.ajax(option)
	.fail(function(jqXHR, textStatus, errorThrown){
		console.log(option.url);
		console.log(jqXHR.status);

		if (!jqXHR.status) {
			// if (option.salvage) {
			// 	if (!app.state.offline_queue) {
			// 		app.fireEvent('alert', 'offline-queue');
			// 		app.state.offline_queue = true;
			// 	}
			// } else {
			// 	if (!app.state.offline) {
			// 		app.fireEvent('alert', 'offline');
			// 		app.state.offline = true;
			// 	}
			// }
		}

		// Unauthorized
		else if (jqXHR.status === 401) {
			// if (option.setup) {
			// 	app.dom.show($('#signin'));
			// } else {
			// 	app.fireEvent('alert', jqXHR.status);
				setTimeout(function(){
					location.href = '/';
				}, 3000);
			// }
		}

		// Collision
		else if (jqXHR.status === 403 || jqXHR.status === 404) {
			// app.fireEvent('alert', jqXHR.status);
			// setTimeout(function(){
			// 	app.fireEvent('reload');
			// }, 3000);
		}

		// Internal Server Error
		else if (jqXHR.status >= 500) {
			// app.fireEvent('alert', jqXHR.status);
		}
	})
	.done(function(){
		// if (option.url !== '/api/1/account/salvage'
		// 	&& option.url !== '/token') {
		// 	app.util.salvage();
		// }
	})
	.always(function(){
		// if (app.option.show_loading && option.loading !== false) {
		// 	app.loading.stop();
		// }
	});
}

/*
 * タッチデバイスでのクリック高速化
 */
app.on = function(ele, name, callback){
	if (name !== 'click' || !app.support.touch) {
		ele
			.on(name, callback)
			.on($.support.selectstart ? 'selectstart' : 'mousedown', function(e){
				e.preventDefault();
			});
		return ele;
	}
	ele.on(app.support.touchstart, function(e){
		e.stopPropagation();
		ele.on(app.support.touchend, function(e){
			e.preventDefault();
			e.stopPropagation();
			callback.call(this, e);
			ele.off(app.support.touchend);
			ele.off(app.support.touchmove);
			d.activeElement.blur();
			w.focus();
		});
	});
	ele.on(app.support.touchmove, function(){
		ele.off(app.support.touchend);
		ele.off(app.support.touchmove);
	});
	return ele;
}

})(this, this, document, jQuery);