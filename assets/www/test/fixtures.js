var NOP = function() {};
// Leaflet stub
var L = {
	Class: {
		extend: NOP
	},
	extend: NOP
};

// SETUP TEMPLATES
var DUMMY_TEMPLATES = {
	'country-list-template': '<div></div>'
};
for( var id in DUMMY_TEMPLATES ) {
	if( DUMMY_TEMPLATES.hasOwnProperty( id ) ) {
		$( '<div />' ).attr( 'id', id ).html( DUMMY_TEMPLATES[ id ] ).appendTo( document.body );
	}
}

// Hack ajax
$.ajax = function( options ) {
	var d = $.Deferred();
	console.log( 'dummy ajax request', options );
	if( options.url === 'messages/messages-en.properties' ) {
		if( options.success ) {
			options.success( 'foo=bar\nx=bar' );
		}
	}
	return d;
};
