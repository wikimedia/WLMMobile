(function() {

var app;
var _loggedIn;
module( 'app.js', {
	setup: function() {
		app = WLMMobile.app;
		WLMMobile.app.clearHistory();
		_loggedIn = WLMMobile.api.loggedIn;
		WLMMobile.api.loggedIn = true;
		WLMMobile.db.init();
		$( '<div id="results" />' ).appendTo( document.body );
	},
	teardown: function() {
		WLMMobile.api.loggedIn = _loggedIn;
		$( '#results' ).remove();
		WLMMobile.app.clearHistory();
	}
} );

test( 'back button on geolookup-page', function() {
	var app = WLMMobile.app;
	app.showPage( 'welcome-page' );
	app.showPage( 'locationlookup-page' );
	var page = app.goBack();
	strictEqual( page, 'welcome-page', 'back button should escape location page' );
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

test( 'drill down back behaviour (bug 39354)', function() {
	var page1, page2, page3, page4, page5, page6;
	app.listCampaigns( [] );
	page1 = app.getCurrentPage();
	strictEqual( page1, 'campaign-page', 'check page name' );
	strictEqual( $( '#campaign-list a' ).length, 2, '2 countries listed' );
	$( '#campaign-list a' ).eq( 1 ).trigger( 'click' ); // select united states
	page2 = app.getCurrentPage();
	strictEqual( page2, 'campaign-page/US', 'check page name' );
	$( '#campaign-list a' ).eq( 1 ).trigger( 'click' ); // select ca
	page3 = app.getCurrentPage();
	strictEqual( page3, 'campaign-page/US/US-CA', 'check page name' );
	$( '#campaign-list a' ).eq( 2 ).trigger( 'click' ); // select stumptown which has no sub campaigns so should take user to results page
	page4 = app.getCurrentPage();
	strictEqual( page4, 'results-page', 'check page name is results as we reached the bottom level' );
	page5 = app.goBack(); // go back
	strictEqual( page5, 'campaign-page/US/US-CA', 'check page name after back press' );
	$( '#campaign-list a' ).eq( 2 ).trigger( 'click' ); // select stump town again
	page6 = app.getCurrentPage();
	strictEqual( page6, 'results-page', 'check page name' );
} );

module( 'not logged in', {
	setup: function() {
		app = WLMMobile.app;
		WLMMobile.app.clearHistory();
		_loggedIn = WLMMobile.api.loggedIn;
		WLMMobile.api.loggedIn = false;
		WLMMobile.db.init();
	},
	teardown: function() {
		WLMMobile.api.loggedIn = _loggedIn;
		$( '#results' ).remove();
		WLMMobile.app.clearHistory();
	}
} );

test( 'click uploads and click back from resulting login screen (bug 39347)', function() {
	app.showPage( 'welcome-page' );
	app.showPage( 'uploads-page' );
	var pageName = app.goBack();
	strictEqual( pageName, 'welcome-page' );
} );

test( 'drilling down with non-unique names (arthurs bug)', function() {
	var page1, page2, page3, page4, page5;
	app.listCampaigns( [] );
	page1 = app.getCurrentPage();
	strictEqual( page1, 'campaign-page', 'check page name' );
	strictEqual( $( '#campaign-list a' ).length, 2, '2 countries listed' );
	$( '#campaign-list a' ).eq( 1 ).trigger( 'click' ); // select united states
	page2 = app.getCurrentPage();
	strictEqual( page2, 'campaign-page/US', 'check page name' );
	$( '#campaign-list a' ).eq( 1 ).trigger( 'click' ); // select ca
	page3 = app.getCurrentPage();
	strictEqual( page3, 'campaign-page/US/US-CA', 'check page name' );
	$( '#campaign-list a' ).eq( 3 ).trigger( 'click' ); // select alameda county
	page4 = app.getCurrentPage();
	strictEqual( page4, 'campaign-page/US/US-CA/%5B%5BAlameda%2C%20California%7CAlameda%5D%5D' );
	$( '#campaign-list a' ).eq( 0 ).trigger( 'click' ); // select alameda county sub level
	page5 = app.getCurrentPage();
	strictEqual( page5, 'results-page' );
} );

test( 'drilling down weirdness related to back button (arthurs 2nd bug)', function() {
	var page1, page2, page3, page4, page5, page6;
	app.listCampaigns( [] );
	page1 = app.getCurrentPage();
	strictEqual( page1, 'campaign-page', 'check page name' );
	strictEqual( $( '#campaign-list a' ).length, 2, '2 countries listed' );
	$( '#campaign-list a' ).eq( 1 ).trigger( 'click' ); // select united states
	page2 = app.getCurrentPage();
	strictEqual( page2, 'campaign-page/US', 'check page name' );	
	$( '#campaign-list a' ).eq( 1 ).trigger( 'click' ); // select ca
	page3 = app.getCurrentPage();
	strictEqual( page3, 'campaign-page/US/US-CA', 'check page name' );
	$( '#campaign-list a' ).eq( 4 ).trigger( 'click' ); // select Foo county
	page4 = app.getCurrentPage();
	strictEqual( page4, 'campaign-page/US/US-CA/%5B%5BFoo%20County%2C%20California%5D%5D' );
	$( '#campaign-list a' ).eq( 0 ).trigger( 'click' ); // select Foo, California
	page5 = app.getCurrentPage();
	strictEqual( page5, 'results-page' );
	page6 = app.goBack();
	strictEqual( page6, 'campaign-page/US/US-CA/%5B%5BFoo%20County%2C%20California%5D%5D' );
} );
}());
