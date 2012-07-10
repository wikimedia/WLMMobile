(function() {

module( 'api.js', {
	setup: function() {
		delete WLMMobile.api.loggedIn;
	}
} );

test( 'Check failed login', function() {
	var api = WLMMobile.api;
	api.login( 'bad', 'bad' );
	strictEqual( typeof api.loggedIn, 'undefined', 'user should remain logged out' );
});

test( 'Check successful login', function() {
	var api = WLMMobile.api;
	api.login( 'good', 'good' );
	strictEqual( api.loggedIn, true, 'user now logged in' );
});

}());
