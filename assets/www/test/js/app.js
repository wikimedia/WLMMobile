(function() {

var _loggedIn;
module( 'app.js', {
	setup: function() {
		WLMMobile.app.clearHistory();
		_loggedIn = WLMMobile.api.loggedIn;
		$( '<div id="results" />' ).appendTo( document.body );
	},
	teardown: function() {
		WLMMobile.api.loggedIn = _loggedIn;
		$( '#results' ).remove();
		WLMMobile.app.clearHistory();
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
} );

test( 'toggling view type', function() {
	var app = WLMMobile.app;
	app.showPage( 'results-page' );
	$( '#results-page .toggle-page' ).val( 'map-page-stub' );
	app.showPage( 'results-page' );
	strictEqual( $( '#results-page .toggle-page' ).val(), 'results-page', 'check map view remains selected' );
} );

test( 'back button (select by campaign)', function() {
	var app = WLMMobile.app;
	app.showPage( 'welcome-page' );
	app.showPage( 'country-page' );
	app.showPage( 'results-page' );
	app.showPage( 'map-page' ); // switch to map via dropdown
	app.showPage( 'results-page' );
	app.showPage( 'map-page' );
	app.showPage( 'results-page' );
	var prevPage = app.goBack();
	var prevPage2 = app.goBack();
	var prevPage3 = app.goBack();
	strictEqual( prevPage, 'map-page', 'last page is country page (map not cached)' );
	strictEqual( prevPage2, 'results-page', 'page before is results' );
	strictEqual( prevPage3, 'country-page', 'page before is the country as the user has already been back to the map' );
} );

test( 'back behaviour (use my current location)', function() {
	var app = WLMMobile.app;
	app.showPage( 'welcome-page' );
	app.showPage( 'map-page' );
	app.showPage( 'results-page' ); // switch to results via dropdown
	app.showPage( 'map-page' ); // switch back to map
	app.showPage( 'detail-page' ); // click on marker to select detail
	var prevPage = app.goBack();
	var prevPage2 = app.goBack();
	var prevPage3 = app.goBack();
	strictEqual( prevPage, 'map-page', 'last page is the mapd' );
	strictEqual( prevPage2, 'results-page', 'page before is results' );
	strictEqual( prevPage3, 'map-page' );
} );

test( 'toggling between monuments list and uploads-page', function() {
	var app = WLMMobile.app;
	app.showPage( 'country-page' );
	app.showPage( 'results-page' );
	app.showPage( 'uploads-page' );
	app.showPage( 'results-page' );
	app.showPage( 'uploads-page' );
	app.showPage( 'results-page' );
	var prevPage = app.goBack();
	var prevPage2 = app.goBack();
	var prevPage3 = app.goBack();
	strictEqual( prevPage, 'uploads-page' );
	strictEqual( prevPage2, 'results-page' );
	strictEqual( prevPage3, 'country-page', 'results->upload repeats itself' );
} );


test( 'toggling between map and results', function() {
	var app = WLMMobile.app;
	app.showPage( 'welcome-page' );
	app.showPage( 'country-page' );
	app.showPage( 'results-page' ); // switch to results via dropdown
	app.showPage( 'map-page' );
	app.showPage( 'results-page' ); // switch to results via dropdown
	app.showPage( 'map-page' ); // switch back to map
	app.showPage( 'results-page' ); // switch to results via dropdown
	app.showPage( 'map-page' ); // switch back to map
	var prevPage = app.goBack();
	var prevPage2 = app.goBack();
	var prevPage3 = app.goBack();
	strictEqual( prevPage, 'results-page' );
	strictEqual( prevPage2, 'country-page' );
} );

}());
