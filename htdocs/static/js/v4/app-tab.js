(function(ns, w, d, $) {

var app = ns.app;

var tabs = {};

app.tab = {
	show: function(tab){
		var body = $(d.body);
		var group = tab.split('-').shift();
		var prefix = 'tab-' + group + '-';
		var classes = body.attr('class').split(/\s+/);
		var new_classes = ['tab-' + tab];
		for (var i = 0, max_i = classes.length; i < max_i; i++) {
			if (classes[i].indexOf(prefix) !== 0) {
				new_classes.push(classes[i]);
			}
		}
		body.attr('class', new_classes.join(' '));
		for (var i = 0, max_i = tabs[group].length; i < max_i; i++) {
			tabs[group][i].parent().toggleClass('active', tabs[group][i].data('tab') === tab);
		}
	}
};

app.setup.tab = function(ele){
	var tab = ele.data('tab');
	var group = tab.split('-').shift();
	if (!(group in tabs)) {
		tabs[group] = [];
	}
	tabs[group].push(ele);
	app.on(ele, 'click', function(e){
		e.preventDefault();
		app.tab.show(tab)
	});
};

})(this, window, document, jQuery);