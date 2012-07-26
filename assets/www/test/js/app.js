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
	app.showPage( 'map-page', null, true ); // switch to map via dropdown
	app.showPage( 'results-page', null, true );
	app.showPage( 'map-page', null, true );
	app.showPage( 'results-page', null, true );
	var prevPage = app.goBack();
	//var prevprevPage = app.goBack();
	strictEqual( prevPage, 'country-page', 'last page is country page (map not cached)' );
	//strictEqual( prevprevPage, 'welcome-page', 'page before is welcome' );
} );

test( 'back behaviour (use my current location)', function() {
	var app = WLMMobile.app;
	app.showPage( 'welcome-page' );
	app.showPage( 'map-page' );
	app.showPage( 'results-page', null, true ); // switch to results via dropdown
	app.showPage( 'map-page', null, true ); // switch back to map
	app.showPage( 'detail-page' ); // click on marker to select detail
	var prevPage = app.goBack();
	//var prevprevPage = app.goBack();
	strictEqual( prevPage, 'map-page', 'last page is the map as that is where we entered' );
	//strictEqual( prevprevPage, 'welcome-page', 'page before is welcome' );
} );

test( 'resolveImageThumbnail', function() {
	var url1 = 'http://upload.wikimedia.org/wikipedia/test/8/88/%28taken_on_25Jul2012_16hrs38mins14secs%29.jpeg'
	var url1r = 'http://upload.wikimedia.org/wikipedia/test/thumb/8/88/%28taken_on_25Jul2012_16hrs38mins14secs%29.jpeg/180px-%28taken_on_25Jul2012_16hrs38mins14secs%29.jpeg'
	var url2 = 'http://upload.wikimedia.org/wikipedia/commons/c/cc/Junonia_hierta_by_kadavoor.JPG';
	var url2r = 'http://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Junonia_hierta_by_kadavoor.JPG/180px-Junonia_hierta_by_kadavoor.JPG';
	var actual1 = WLMMobile.app.resolveImageThumbnail( url1 );
	var actual2 = WLMMobile.app.resolveImageThumbnail( url2 );
	strictEqual( actual1, url1r );
	strictEqual( actual2, url2r );
} );

}());
