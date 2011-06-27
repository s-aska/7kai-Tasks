//   Copyright 2010 Marc BUILS
//
//   @version       1.0.1
//   @lastchange    04/11/2010 - Marc BUILS - Chrome compatibility
//   
//   This file is part of Kamak.
//
//    Kamak is free software: you can redistribute it and/or modify
//    it under the terms of the GNU Lesser General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    Kamak is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU Lesser General Public License for more details.
//
//    You should have received a copy of the GNU Lesser General Public License
//    along with Kamak.  If not, see <http://www.gnu.org/licenses/>.

(function($){
    $.Html5Sortable = function( ){
        $.Html5Sortable.s_currentID = Math.floor(Math.random()*10000001);
    }
    $.Html5Sortable.DRAGANDDROP_DEFAULT_TYPE = "fr.marcbuils.html5sortable";
    $.Html5Sortable.s_currentID = 0;
    
    $.Html5Sortable.defaultOptions = {
        drag_target:        function( p_src ){ return $( p_src ); },
        text:               function( p_srcLine ){ return $('<div></div>').append( $( p_srcLine ).clone() ).html(); },
        css:                'html5sortable-state-highlight',
        type:               $.Html5Sortable.DRAGANDDROP_DEFAULT_TYPE,
        drop:               function( p_srcLine, p_targetLine ) { return false; }
    };
    
    
    /**
     * Constructor
     */
    $.fn.Html5Sortable = function( p_options ) {
	    var _options = $.extend( {}, $.Html5Sortable.defaultOptions, p_options );
	        
	    // Set current ID
        $.Html5Sortable.s_currentID++;
            
	    // specific type
	    if ( _options.type == $.Html5Sortable.DRAGANDDROP_DEFAULT_TYPE ){
	       _options.type = _options.type + '_' + $.Html5Sortable.s_currentID;
	    }
        
        return this.each(function(){
            var $this = $(this);
            
            var _initLi = function( $li ){
	            _options.drag_target( $li ).attr('draggable', true).bind('dragstart', function(ev) {
	                var dt = ev.originalEvent.dataTransfer;
	                dt.setData("Text", JSON.stringify({
	                   html:   _options.text( $li ),
	                   type:   _options.type
	                }) );
	                //dt.setData("URL", _options.type );
	                $('._dragging').removeClass('_dragging');
	                $li.addClass('_dragging');
	                return true;
	            }).bind('dragend', function(ev) {
	                $('._dragging').removeClass('_dragging');
	                $('li.'+_options.css).remove();
	                try {if (JSON.parse( ev.originalEvent.dataTransfer.getData("Text") ).type!= _options.type) { return true; }}catch(e){return true;}
	                return false;
	            });
	            
	            $li.bind('dragenter', function(ev) {
	                try {if (ev.originalEvent.dataTransfer.getData("Text") && JSON.parse( ev.originalEvent.dataTransfer.getData("Text") ).type!= _options.type) { return true; }}catch(e){return true;}
	                return false;
	            }).bind('dragleave', function(ev) {
	                try {if (ev.originalEvent.dataTransfer.getData("Text") && JSON.parse( ev.originalEvent.dataTransfer.getData("Text") ).type!= _options.type) { return true; }}catch(e){return true;}
	                $('li.'+_options.css).remove();
	                return false;
	            }).bind('drop', function(ev) {
	                try {if (JSON.parse( ev.originalEvent.dataTransfer.getData("Text") ).type!= _options.type) { return true; }}catch(e){return true;}
	                
	                var $src = $('._dragging');
	                $('li.'+_options.css).remove();
	                
	                var $line = $( JSON.parse( ev.originalEvent.dataTransfer.getData('Text') ).html ).hide();
	                
	                if ( ev.pageY - $(this).position().top > $(this).height() ) {
	                    $line.insertAfter( this );
	                } else {
	                    $line.insertBefore( this );
	                }
	                _initLi( $line );
	                
	                // data not saved
	                if ( !_options.drop( $src.get(0), $line.get(0) ) ) {
	                    $line.remove();
	                    return false;
	                }
	                $src.remove();
	                $line.fadeIn();
	                return false;
	            }).bind('dragover', function(ev) { 
	                try {if (ev.originalEvent.dataTransfer.getData("Text") && JSON.parse( ev.originalEvent.dataTransfer.getData("Text") ).type!= _options.type) { return true; }}catch(e){return true;}
	                $('li.'+_options.css).remove();
	                if ( ev.pageY - $(this).position().top > $(this).height() ) {
	                    $('<li class="'+_options.css+'"></li>').insertAfter( this );
	                } else {
	                    $('<li class="'+_options.css+'"></li>').insertBefore( this );
	                }
	                return false; 
	            });
            };
            $this.children('li').each( function(){ 
                _initLi( $(this) ); 
            } );
            
            $this.bind('dragenter', function(ev) {
                try {if (ev.originalEvent.dataTransfer.getData("Text") && JSON.parse( ev.originalEvent.dataTransfer.getData("Text") ).type!= _options.type) { return true; }}catch(e){return true;}
                return false;
            }).bind('dragleave', function(ev) {
                try {if (ev.originalEvent.dataTransfer.getData("Text") && JSON.parse( ev.originalEvent.dataTransfer.getData("Text") ).type!= _options.type) { return true; }}catch(e){return true;}
                $('li.'+_options.css).remove();
                return false;
            }).bind('drop', function(ev) {
                try {if (JSON.parse( ev.originalEvent.dataTransfer.getData("Text") ).type!= _options.type) { return true; }}catch(e){return true;}
                
                var $src = $('._dragging');
                $('li.'+_options.css).remove();
                
                var $line = $( JSON.parse( ev.originalEvent.dataTransfer.getData('Text') ).html ).hide();
                
                $line.appendTo( this );
                _initLi( $line );
                
                // data not saved
                if ( !_options.drop( $src.get(0), $line.get(0) ) ) {
                    $line.remove();
                    return false;
                }
                $src.remove();
                $line.fadeIn();
                return false;
            }).bind('dragover', function(ev) { 
                try {if (ev.originalEvent.dataTransfer.getData("Text") && JSON.parse( ev.originalEvent.dataTransfer.getData("Text") ).type!= _options.type) { return true; }}catch(e){return true;}
                $('li.'+_options.css).remove();
                $('<li class="'+_options.css+'"></li>').appendTo( this );
                return false; 
            });
        });
        
        return $this;
    }

})(jQuery)