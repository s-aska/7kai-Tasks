(function(ns, w, d, $) {

var app = ns.app;

// ------------------------------
// ドラッグ＆ドロップ
// ------------------------------
app.draggable = {
	map: {},
	handleEvent: function(e){
		switch (e.type) {
			case app.support.touchstart:
				this.touchstart(e);
				break;
			case app.support.touchmove:
				this.touchmove(e);
				break;
			case app.support.touchend:
				this.touchend(e);
				break;
			case 'click':
				this.click(e);
				break;
		}
	},
	touchstart: function(e){
		e.preventDefault();
		e.stopPropagation();
		app.draggable.dragging   = true;
		app.draggable.moveReady  = false;
		app.draggable.moveI      = 0;
		app.draggable.startPageX = app.support.pageX(e);
		app.draggable.startPageY = app.support.pageY(e);
		app.draggable.target     = $(e.target).parents('li').addClass('dragging');
		app.draggable.height     = app.draggable.target.height();
		app.draggable.refresh();
		$('body').addClass('move');
	},
	touchmove: function(e){
		if (! app.draggable.dragging) {
			return;
		}
		if (app.draggable.moveReady) {
				e.preventDefault();
				e.stopPropagation();
				var deltaY = app.support.pageY(e) - app.draggable.startPageY;
				var deltaI = parseInt(deltaY / app.draggable.height);
				if (deltaI === app.draggable.moveI) {
					return;
				}
				if (deltaI > 0) {
					// 下方向
					var i = app.draggable.target.data('i') + deltaI;
					var o = app.draggable.map[i];
					if (o) {
						o.after(app.draggable.target);
						app.draggable.moveI = deltaI;
					}
				} else if (deltaI < 0) {
					// 上方向
					var i = app.draggable.target.data('i') + deltaI;
					var o = app.draggable.map[i];
					if (o) {
						o.before(app.draggable.target);
						app.draggable.moveI = deltaI;
					}
				} else {
					// 元の位置に戻す
					var prev = app.draggable.map[app.draggable.target.data('i') - 1];
					var next = app.draggable.map[app.draggable.target.data('i') + 1];
					if (prev) {
						prev.after(app.draggable.target);
						app.draggable.moveI = 0;
					} else if (next) {
						next.before(app.draggable.target);
						app.draggable.moveI = 0;
					}
				}
		} else {
			e.preventDefault();
			e.stopPropagation();
			app.draggable.moveReady = true;
		}
	},
	touchend: function(e){
		if (! app.draggable.dragging) {
			return;
		}
		app.draggable.dragging = false;
		app.draggable.target.removeClass('dragging');
		$('body').removeClass('move');
		if (app.draggable.moveI !== 0) {
			app.draggable.moveI = 0;
			app.draggable.refresh();
			app.draggable.ul.trigger('app.draggable.update');
		}
	},
	click: function(e){
		e.preventDefault();
		e.stopPropagation();
	},
	setup: function(ul){
		w.addEventListener(app.support.touchend, app.draggable, false);
		app.draggable.ul = ul;
		app.draggable.ul.get(0).addEventListener(app.support.touchmove, app.draggable, false);
	},
	handle: function(handle){
		handle.addEventListener(app.support.touchstart, app.draggable, false);
	},
	refresh: function(){
		app.draggable.ul.children().each(function(i, element){
			var ele = $(element);
			ele.data('i', i);
			app.draggable.map[i] = ele;
		});
	}
};

})(this, window, document, jQuery);