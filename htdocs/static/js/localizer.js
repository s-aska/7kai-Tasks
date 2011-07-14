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
    var that = this;
    $('*[data-text-' + this.lang + ']').each(function(i, ele){
        var ele = $(ele);
        ele.text(ele.data('text-' + that.lang));
    });
    $('*[data-text-placeholder-' + this.lang + ']').each(function(i, ele){
        var ele = $(ele);
        ele.attr('placeholder', ele.data('text-placeholder-' + that.lang));
    });
}
function text(ele, key){
    if (key) {
        return ele.data('text-' + key + '-' + this.lang);
    } else {
        return ele.data('text-' + this.lang);
    }
}

})(this, this, document);