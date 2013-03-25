(function(ns, w, d, $) {

var app = ns.app;

app.modal = {
	map: {},
	current: false,
	show: function(name, args){
		if (app.modal.current) {
			app.modal.current.removeClass('in').hide();
		}
		app.modal.backdrop.show().addClass('in');
		app.modal.map[name].show().addClass('in').trigger('show', args);
		app.modal.current = app.modal.map[name];
	},
	hide: function(){
		if (!app.modal.current) {
			return;
		}
		app.modal.current.removeClass('in').hide();
		app.modal.backdrop.removeClass('in').hide();
		app.modal.current = false;
		d.activeElement.blur();
	}
};

app.setup.modal = function(form){
	app.modal.map[form.data('modal')] = form;
	app.on(form.find('.close, .modal-footer span.btn'), 'click', function(e){
		e.preventDefault();
		app.modal.hide();
	});
	form.on('keydown', function(e){
		if (e.keyCode === 27) {
			e.preventDefault();
			app.modal.hide();
		}
	});
	// ele.on(app.support.touchmove, function(e){ e.stopPropagation() });
};

app.addListener('ready', function(){
	app.modal.backdrop = $('.modal-backdrop');
	app.on(app.modal.backdrop, 'click', function(e){
		app.modal.hide();
	})
});

})(this, window, document, jQuery);