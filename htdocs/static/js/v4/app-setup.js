(function(ns, w, d, $) {

$.extend(ns.app, { setup: {} });

var app = ns.app;
var win = $(w);

/*
 * data-setup のDOMを走査し対応するメソッドを叩く
 */
app.setup.init = function(context){
	var callback = function(){
		var ele = $(this);
		var methods = ele.data('setup').split(',');
		for (var i = 0, max_i = methods.length; i < max_i; i++) {
			// var f = app.obj.get(app.setup, methods[i]);
			var f = app.setup[methods[i]];
			if (f) f.apply(app, [ele]);
		}
	};
	if (context && context.data('setup')) {
		callback.call(context);
	}
	$('[data-setup]', context).each(callback);
	return context;
};

/*
 * 国際化
 */
app.setup.localize = function(ele){
	ele.text(ele.data('text-' + app.env.lang));
}

/*
 * 表示切替
 */
app.setup.display = function(ele){
	var display = 'display-' + ele.data('display');
	var active  = ele.data('display-active') || 'active';
	var body = $('body');
	app.on(ele, 'click', function(e){
		e.preventDefault();
		if (ele.hasClass(active)) {
			ele.removeClass(active);
			body.removeClass(display);
		} else {
			ele.addClass(active);
			body.addClass(display);
		}
		app.fireEvent('resize');
		app.api.account.update({
			ns: 'state.display',
			method: 'set',
			key: display,
			val: ele.hasClass(active) ? 'on' : 'off',
		})
		.done(function(data){
			if (data.success === 1) {
				app.data.state.display = data.account.state.display;
			} else {
				// 現在 ステータスコード 200 の例外ケースは無い
			}
		});
	});
	if (ele.hasClass(active)) {
		body.addClass(display);
	} else {
		body.removeClass(display);
	}
	app.addListener('receiveMe', function(data, option){
		if (!option.setup) {
			return;
		}
		if ('display' in app.data.state) {
			if (!(display in app.data.state.display)) {
				return;
			}
			var on = Boolean(app.data.state.display[display] === 'on');
			if (on !== Boolean(ele.hasClass(active))) {
				ele.toggleClass(active, on);
				body.toggleClass(display, on);
			}
		}
	});
}

/*
 * モード切替
 */
app.setup.mode = function(ele){
	var mode = ele.data('mode');
	var active  = 'active';
	var body = $('body');
	app.on(ele, 'click', function(e){
		e.preventDefault();
		// 2回クリックしたら元に戻す
		if (ele.hasClass(active)) {
			var prev = body.data('mode-prev');
			if (prev) {
				ele.parent().children().each(function(){
					$(this).toggleClass(active, $(this).data('mode') === prev);
				});
				body.data('mode-prev', null);
				body.attr('data-mode', prev);
				app.fireEvent('resize');
			}
			return false;
		}
		ele.parent().children().removeClass(active);
		ele.addClass(active);
		body.data('mode-prev', body.attr('data-mode'));
		body.attr('data-mode', mode);
		app.fireEvent('resize');
	});
	body.on('app-mode-' + mode, function(){
		if (ele.hasClass(active)) {
			return false;
		}
		ele.parent().children().removeClass(active);
		ele.addClass(active);
		body.data('mode-prev', body.attr('data-mode'));
		body.attr('data-mode', mode);
		app.fireEvent('resize');
	});
	if (ele.hasClass(active)) {
		body.attr('data-mode', mode);
	}
}
app.setup.stretch = function(ele){
	var option   = ele.data('stretch') || {};
	var padding  = option.padding || 10;
	var callback = function(){
		ele.height(
			win.height()
			- ele.offset().top
			- parseInt(ele.css('paddingTop'), 10)
			- parseInt(ele.css('paddingBottom'), 10)
			- parseInt(ele.css('borderTop').match(/(\d+)px/) ? RegExp.$1 : 0, 10)
			- parseInt(ele.css('borderBottom').match(/(\d+)px/) ? RegExp.$1 : 0, 10)
			- padding
		);
	};
	app.addListener('resize', callback);
	callback.call();
}

})(this, window, document, jQuery);