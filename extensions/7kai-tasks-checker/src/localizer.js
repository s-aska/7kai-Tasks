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
    var lang = $('html').attr('lang');
    if (lang) {
        this.lang = lang;
    }
}
function localize(jQuery) {
    if (!jQuery) {
        jQuery = $;
    }
    var eles = jQuery('*[data-text-' + this.lang + ']');
    for (var i = 0; i < eles.length; i++) {
        var ele = jQuery(eles[i]);
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