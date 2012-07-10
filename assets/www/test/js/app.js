(function() {

var _loggedIn;
module( 'app.js', {
	setup: function() {
		_loggedIn = WLMMobile.api.loggedIn;
	},
	teardown: function() {
		WLMMobile.api.loggedIn = _loggedIn;
	}
} );

test( 'Skip login page on a back button press when user is authenticated', function() {
	var app = WLMMobile.app;
	app.showPage( 'detail-page' );
	app.showPage( 'login-page' );
	WLMMobile.api.loggedIn = true; // simulate login
	app.showPage( 'upload-page' );
	var page = app.goBack();
	strictEqual( page, 'detail-page', 'when logged in login-page should not be in the history' );
});

}());
