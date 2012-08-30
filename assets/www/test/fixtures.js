var NOP = function() {};
// Leaflet stub
var L = {
	Class: {
		extend: NOP
	},
	extend: NOP
};

// clear autologin from localstorage
localStorage.clear( 'username' );
localStorage.clear( 'password' );

var EMPTY_TEMPLATE = '<div></div>';

// SETUP TEMPLATES
var DUMMY_TEMPLATES = {
	'country-list-template': '<% _.each( campaigns, function( campaign ) { %><li><a data-campaign="<%= campaign.code %>"><%= campaign.code %></a></li><% }); %>',
	'map-page-stub': '<div></div>',
	'monument-list-item-template': '<li>foo</li>',
	'monument-list-empty-template': '<div>empty</div>',
	'monument-list-heading': '<div></div>',
	'upload-list-empty-template': EMPTY_TEMPLATE,
	'results-page': [ '<select class="toggle-page"><option value="results-page">list</option>',
	 	'<option value="map-page-stub">map</option></select>' ].join( '' ),
	'welcome-page': EMPTY_TEMPLATE,
	'country-page': EMPTY_TEMPLATE,
	'detail-page' : EMPTY_TEMPLATE,
	'map-page': EMPTY_TEMPLATE,
	'upload-page': EMPTY_TEMPLATE,
	'uploads-page': EMPTY_TEMPLATE,
	'campaign-page': EMPTY_TEMPLATE,
	'login-page': EMPTY_TEMPLATE,
	'upload-photo-description': EMPTY_TEMPLATE
};
var DUMMY_TEMPLATE_SCRIPTS = [ 'country-list-template' ]

for( var id in DUMMY_TEMPLATES ) {
	if( DUMMY_TEMPLATES.hasOwnProperty( id ) ) {
		if( DUMMY_TEMPLATE_SCRIPTS.indexOf( id ) > -1 ) {
			$( '<script type="text/html"></script>' ).attr( 'id', id ).html( DUMMY_TEMPLATES[ id ] ).appendTo( document.body );
		} else {
			$( '<div />' ).attr( 'id', id ).html( DUMMY_TEMPLATES[ id ] ).appendTo( document.body );
		}
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
	var data, admintree;
	var d = $.Deferred();
	console.log( 'dummy ajax request', options );
	if( options && options.data && options.data.prop === 'imageinfo' ) {
		data = { query: '' };
		return d.resolve( data );
	} else if ( options.url === WLMConfig.MONUMENT_API ) {
		if ( options.data && options.data.action === 'adminlevels' ) {
			admintree = options.data.admtree;
			if ( admintree === '' ) {
				d.resolve( { admin_levels: [
					{ name: 'FR', value: 'FR' },
					{ name: 'US', value: 'US' }
				] } );
			} else if ( admintree === 'US' ) {
				d.resolve( { admin_levels: [
					{ name: 'US-AZ', value: 'US-AZ' },
					{ name: 'US-CA', value: 'US-CA' }
				] } );
			} else if ( admintree === 'US|US-CA' ) {
				d.resolve( { admin_levels: [
					{ name: 'Los Angeles County, California' },
					{ name: 'San Francisco, California' },
					{ name: 'Stump Town' },
					{ name: '[[Alameda, California|Alameda]]' },
					{ name: '[[Foo County, California]]' }
				] } );
			} else if( admintree === 'US|US-CA|[[Alameda, California|Alameda]]' ) {
				d.resolve( { admin_levels: [
					{ name: '[[Alameda, California|Alameda]]' }
				] } );
			} else if( admintree === 'US|US-CA|[[Foo County, California]]' ) {
				d.resolve( { admin_levels: [
					{ name: '[[Foo, California|Foo]]' }
				] } );
			} else if( admintree === 'US|US-CA|[[Foo County, California]]|[[Foo, California|Foo]]' ) {
				d.resolve( { admin_levels: [] } );
			} else if( admintree === 'US|US-CA|[[Alameda, California|Alameda]]|[[Alameda, California|Alameda]]' ) {
				d.resolve( { admin_levels: [] } );
			} else if ( admintree === 'US|US-CA|Los Angeles County, California' ) {
				d.resolve( { admin_levels: [ { name: 'ok' } ] } );
			} else if( admintree === 'US|US-CA|Stump Town' ) { // bottom of treee
				d.resolve( { admin_levels: [] } );
			}
		} else if( options.data.action === 'search' ) {
			if ( options.data.sradm2 === 'San Francisco' &&
				options.data.sradm1 === 'US-CA' && options.data.sradm0 === 'US' ) {
				d.resolve( [ { country: 'us', id: 2, name: 'Golden Gate Bridge' } ] );
			}
		} else if ( options.success ) {
			options.success( [] );
		}
	} else if( options.url === 'messages/messages-en.properties' ) {
		if( options.success ) {
			options.success( 'foo=bar\nx=bar' );
		}
	} else if ( options.url = WLMConfig.WIKI_API && options.data ) {
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
