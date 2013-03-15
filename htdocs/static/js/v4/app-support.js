(function(ns, w, d, $) {

$.extend(ns.app, {
	support: {
		prefix: ['webkit', 'moz', 'o', 'ms'],
		touch: ('ontouchstart' in w),
		mspointer: w.navigator.msPointerEnabled
	}
});

var app = ns.app;
var div = d.createElement('div');

var prop = function(props){
	for (var i = 0, max_i = props.length; i < max_i; i++) {
		if (props[i] in div.style) {
			return props[i];
		}
	}
};

app.support.transform3d = prop([
	'perspectiveProperty',
	'WebkitPerspective',
	'MozPerspective',
	'OPerspective',
	'msPerspective'
]);
app.support.transform = prop([
	'transformProperty',
	'WebkitTransform',
	'MozTransform',
	'OTransform',
	'msTransform'
]);
app.support.transition = prop([
	'transitionProperty',
	'WebkitTransitionProperty',
	'MozTransitionProperty',
	'OTransitionProperty',
	'msTransitionProperty'
]);
app.support.transitionDuration = prop([
	'transitionDuration',
	'WebkitTransitionDuration',
	'MozTransitionDuration',
	'OTransitionDuration',
	'msTransitionDuration'
]);

app.support.cssAnimation = (app.support.transform3d || app.support.transform) && app.support.transition;
app.support.touchstart = app.support.mspointer ? 'MSPointerDown' : app.support.touch ? 'touchstart' : 'mousedown';
app.support.touchmove = app.support.mspointer ? 'MSPointerMove' : app.support.touch ? 'touchmove' : 'mousemove';
app.support.touchend = app.support.mspointer ? 'MSPointerUp' : app.support.touch ? 'touchend' : 'mouseup';
app.support.pageX = function(e){ return e.pageX || e.changedTouches[0].pageX };
app.support.pageY = function(e){ return e.pageY || e.changedTouches[0].pageY };
app.support.translate = app.support.transform3d
	? function(x){ return 'translate3d(' + x + 'px, 0, 0)' }
	: function(x){ return 'translate(' + x + 'px, 0)' };

})(this, window, document, jQuery);