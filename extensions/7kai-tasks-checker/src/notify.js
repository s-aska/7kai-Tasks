$(document).ready(function() {
	var bg = chrome.extension.getBackgroundPage();
	bg.app.data.notifyWindow = window;
	bg.app.dom.setup(document.body);
});