(function(ns, w, d, $) {

$.extend(ns.app, {
	date: {
		MONTH_NAMES: [
			'January', 'February', 'March', 'April',
			'May', 'June', 'July', 'August', 'September',
			'October', 'November', 'December'],
		MONTH_NAMES_SHORT: ['Jan', 'Feb', 'Mar', 'Apr', 'May',
			'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		WEEK_NAMES: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		WEEK_NAMES_JA: ['日', '月', '火', '水', '木', '金', '土']
	}
});

var app = ns.app;

app.date.parse = function(str){
	var degits = str.match(/[0-9]+/g);
	if (! degits) {
		return;
	} else if (degits[0].length === 4) {
		return new Date(degits[0], degits[1] - 1, degits[2]);
	} else {
		return new Date(degits[2], degits[0] - 1, degits[1]);
	}
}
app.date.relative = function(epoch){
	var now = new Date();
	var now_epoch = parseInt(now.getTime() / 1000);
	if (epoch > now_epoch) {
		epoch = parseInt(epoch / 1000);
	}
	var diff = now_epoch - epoch;
	if (diff < 0) {
		return '0 sec ago';
	} else if (diff < 60) {
		var s = diff > 1 ? 's' : '';
		return diff + ' sec' + s + ' ago';
	} else if (diff < 3600) {
		var min = parseInt(diff / 60);
		var s = min > 1 ? 's' : '';
		return min + ' minute' + s + ' ago';
	} else if (diff < (3600 * 24)) {
		var hour = parseInt(diff / 3600);
		var s = hour > 1 ? 's' : '';
		return hour + ' hour' + s + ' ago';
	} else if (diff < (3600 * 24 * 365)) {
		var day = parseInt(diff / (3600 * 24));
		var s = day > 1 ? 's' : '';
		return day + ' day' + s + ' ago';
	} else {
		var year = parseInt(diff / (3600 * 24 * 365));
		var s = year > 1 ? 's' : '';
		return year + ' year' + s + ' ago';
	}
}
app.date.delta = function(date1, date2){
	var msec = date1.getTime() - date2.getTime();
	var days = parseInt((msec / 1000 / 60 / 60 / 24), 10);
	return { days: days };
}
app.date.add = function(date, days){
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}
app.date.ymd = function(date, sep){
	var month = date.getMonth() + 1;
	var day   = date.getDate();
	if (month < 10) {
		month = '0' + month;
	}
	if (day < 10) {
		day = '0' + day;
	}
	if (!sep) {
		sep = '-';
	}
	return date.getFullYear() + sep + month + sep + day;
}
app.date.ymdw = function(date){
	if (app.env.lang === 'ja') {
		return date.getFullYear() + '年' + app.date.mdw(date);
	} else {
		return date.getFullYear() + '/' + app.date.mdw(date);
	}
}
app.date.mdw = function(date){
	if (app.env.lang === 'ja') {
		return ( date.getMonth() + 1 ) + '月' + date.getDate()
			+ '日 (' + app.date.WEEK_NAMES_JA[date.getDay()] + ')';
	} else {
		return ( date.getMonth() + 1 ) + '/' + date.getDate()
			+ ' ' + app.date.WEEK_NAMES[date.getDay()];
	}
}
app.date.mdy = function(date){
	return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
}
app.date.is_holiday = function(date){
	if (app.env.lang === 'ja') {
		var ymd = app.date.ymd(date);
		if (ymd in app.data.holidays) {
			return app.data.holidays[ymd];
		}
	}
	return false;
}

})(this, window, document, jQuery);