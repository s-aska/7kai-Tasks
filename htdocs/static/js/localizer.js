// before html
// <html lang="ja">
// <span data-text-ja="タイムライン">Timeline</span>
// 
// var localizer = new Localizer();
// localizer.localize();
// 
// after html
// <span data-text-ja="タイムライン">タイムライン</span>

(function(ns, w, d) {

ns.Localizer = initialize;
ns.Localizer.prototype = {
    text: text,
    lang: 'en',
    localize: localize
};

function initialize(){
    this.lang = $('html').attr('lang');
}
function localize() {
    var eles = $('*[data-text-' + this.lang + ']');
    for (var i = 0; i < eles.length; i++) {
        var ele = $(eles[i]);
        ele.text(ele.data('text-' + this.lang));
    }
}
function text(ele, key){
    if (key) {
        return ele.data('text-' + key + '-' + this.lang);
    } else {
        return ele.data('text-' + this.lang);
    }
}

})(this, this, document);