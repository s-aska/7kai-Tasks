(function(ns, w, d, $) {

$.extend(ns.app, { setup: {} });

var app = ns.app;
var win = $(w);
var doc = $(d);

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
		e.stopPropagation();
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
		e.stopPropagation();
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
app.setup.shortcut = function(ele){
	var code = ele.data('shortcut-code');
	doc.keydown(function(e){
		if (d.activeElement.tagName === 'BODY'
			&& !e.shiftKey
			&& !e.ctrlKey
			&& !e.altKey
			&& !e.metaKey
			&& e.keyCode === code
			&& ele.is(':visible')) {
			e.preventDefault();
			e.stopPropagation();
			ele.click();
		}
	});
}
app.setup.tooltip = function(ele){
	var tooltip = $('#tooltip');
	var text = app.util.text(ele);
	var show = function(){
		if (!ele.is(':visible')) {
			return;
		}
		tooltip.removeClass('in');
		tooltip
			.find('.tooltip-inner')
			.text(text);
		tooltip
			.remove()
			.css({ top: 0, left: 0, display: 'block' })
			.appendTo(d.body);
		var pos = ele.offset();
		pos.width = ele.get(0).offsetWidth;
		pos.height = ele.get(0).offsetHeight;
		var left = pos.left + pos.width / 2 - tooltip.get(0).offsetWidth / 2;
		var max = win.width() - tooltip.width() - 10;
		if (left > max) {
			tooltip.find('.tooltip-arrow').css({marginLeft: left - max - 5 + 'px'});
			left = max;
		} else {
			tooltip.find('.tooltip-arrow').css({marginLeft: ''});
		}
		var css = {
			top: pos.top + pos.height,
			left: (left > 0 ? left : 0)
		};
		tooltip.css(css);
		tooltip.addClass('in');
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

})(this, window, document, jQuery);