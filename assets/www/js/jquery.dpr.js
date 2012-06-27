/*global define, L, mw, $, chrome*/
/*jslint sloppy: true, white:true, maxerr: 50, indent: 4, plusplus: true, vars:true */
// Replaces {{DPR}} in the 'src' attribute of 'img' tags with actual device pixel ratio
( function( $ ) {
	var devicePixelRatio = window.devicePixelRatio;
	$.fn.dprize = function( options ) {
		return this.find( 'img' ).each( function() {
			var fullSrc = $( this ).attr( 'src' ).replace( '{{DPR}}', devicePixelRatio );
			$(this).attr( 'src', fullSrc );
		}).end();
	}
} )( jQuery );
