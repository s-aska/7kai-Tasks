(function($) {

    /*
     * Auto-growing textareas; technique ripped from Facebook
     */
    $.fn.autogrow = function(options) {
        this.filter('textarea').each(function() {
            
            var $this       = $(this),
                minHeight   = $this.height(),
                lineHeight  = $this.css('lineHeight');
            
            var shadow = $('<div></div>').css({
                position:   'absolute',
                top:        -10000,
                left:       -10000,
                width:      $this.width(),
                fontSize:   $this.css('fontSize'),
                fontFamily: $this.css('fontFamily'),
                lineHeight: $this.css('lineHeight'),
                resize:     'none'
            }).appendTo(document.body);
            
            var update = function(e) {
    
                var times = function(string, number) {
                    for (var i = 0, r = ''; i < number; i ++) r += string;
                    return r;
                };
                
                var val = this.value.replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;')
                                    .replace(/&/g, '&amp;')
                                    .replace(/\n$/, '<br/>&nbsp;')
                                    .replace(/\n/g, '<br/>')
                                    .replace(/ {2,}/g, function(space) { return times('&nbsp;', space.length -1) + ' ' });
                
                var margin = val.length === 0 ? 2 : 2;
                if (e && "keyCode" in e && e.keyCode == 13 && e.type == 'keydown') {
                    if (options && options.single && !e.shiftKey) {
                        e.preventDefault();
                    } else {
                        e.preventDefault();
                        shadow.html(val + "<br/>&nbsp;");
                        $(this).css('height', Math.max(shadow.height() + margin, 16));
                        $(this).val($(this).val()+"\n");
                    }
                } else {
                    shadow.html(val);
                    $(this).css('height', Math.max(shadow.height() + margin, 16));
                }
            }
            
            $(this).change(update).keyup(update).keydown(update);
            
            update.apply(this);
            
        });
        
        return this;
        
    }
    
})(jQuery);