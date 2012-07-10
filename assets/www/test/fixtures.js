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
API_NEED_TOKEN = {
	login: {
		result:'NeedToken', token:'621'
	}
};
API_WRONG_PASS = { login: { result: 'WrongPass' } };
API_SUCCESS = { login: { result: 'Success' } };

var _firstLoginRequest = true;
$.ajax = function( options ) {
	var data;
	var d = $.Deferred();
	console.log( 'dummy ajax request', options );
	if( options.url === 'messages/messages-en.properties' ) {
		if( options.success ) {
			options.success( 'foo=bar\nx=bar' );
		}
	} else if( options.url = 'https://test.wikipedia.org/w/api.php' ) {
		var user = options.data.lgname;
		var pass = options.data.lgpassword;
		if( user === 'bad' && pass === 'bad' ) {
			if( _firstLoginRequest ) {
				data = API_NEED_TOKEN;
				_firstLoginRequest = false;
			} else {
				data = API_WRONG_PASS;
				_firstLoginRequest = true;
			}
		} else if( user === 'good' && pass === 'good' ) {
			if( _firstLoginRequest ) {
				data = API_NEED_TOKEN;
				_firstLoginRequest = false;
			} else {
				data = API_SUCCESS;
				_firstLoginRequest = true;
			}
		}
		return d.resolve( data );
	}
	return d;
};
