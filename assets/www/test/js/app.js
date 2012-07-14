(function() {

var _loggedIn;
module( 'app.js', {
	setup: function() {
		_loggedIn = WLMMobile.api.loggedIn;
		$( '<div id="results" />' ).appendTo( document.body );
	},
	teardown: function() {
		WLMMobile.api.loggedIn = _loggedIn;
		$( '#results' ).remove();
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

test( 'empty monuments list', function() {
	var app = WLMMobile.app;
	app.showMonumentsList( [] );
	app.showMonumentsList( [] );
	strictEqual( $( '#results' ).text(), 'empty' );
} )

test( 'toggling view type', function() {
	var app = WLMMobile.app;
	app.showResultsPage();
	$( '#toggle-result-view' ).val( 'map-view' );
	app.showPage( 'geo-stub' );
	app.goBack();
	app.showResultsPage();
	strictEqual( $( '#toggle-result-view' ).val(), 'list-view', 'check map view remains selected' );
} );

}());
