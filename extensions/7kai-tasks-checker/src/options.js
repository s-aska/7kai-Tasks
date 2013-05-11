(function(ns, w, d, $) {

$(d).ready(function() {
	var bg = chrome.extension.getBackgroundPage();
	bg.app.data.optionWindow = w;
	bg.app.dom.setup(d.body);
});

})(this, window, document, jQuery);
