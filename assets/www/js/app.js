/*global window, navigator, mw, document, L, alert, Camera*/
/*jslint sloppy: true, white:true, maxerr: 50, indent: 4, plusplus: true, vars:true */

// If you want to prevent dragging, uncomment this section
/*
function preventBehavior(e) 
{ 
  e.preventDefault(); 
};
document.addEventListener("touchmove", preventBehavior, false);
*/

/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app launch.
see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
for more details -jm */
/*
function handleOpenURL(url)
{
	// TODO: do something with the url passed in.
}
*/
require( [ 'jquery', 'l10n', 'geo', 'api', 'templates', 'monuments', 'preferences', 'jquery.localize', 'campaigns-data' ],
	function( $, l10n, geo, Api, templates, MonumentsApi, prefs ) {

	var api = new Api("https://test.wikipedia.org/w/api.php");
	var commonsApi = new Api('https://commons.wikimedia.org/w/api.php');
	var monuments = new MonumentsApi('http://toolserver.org/~erfgoed/api/api.php', commonsApi);
	var wlmapi = 'http://toolserver.org/~erfgoed/api/api.php';
	var nearbyDeg = 1.5; // degree 'radius' approx on the bounding box
	var state = {
		fileUri: null,
		fileKey: null,
		fileSize: null,
		title: null
	};
	var currentSortMethod = 'name';
	var userLocation; // for keeping track of the user

	var mapFocusNeeded = true; // a global for keeping track of when to auto-focus the map

	var curPageName = null;
	var curMonument = null; // Used to store state for take photo, etc

	var pageHistory = []; // TODO: retain history
	function addToHistory( page ) {
		var blacklist = [ 'locationlookup-page', 'login-progress-page' ];
		var blacklisted = blacklist.indexOf( page ) > -1;
		if( !blacklisted &&
			pageHistory[ pageHistory.length - 1 ] !== page ) { // avoid adding the same page twice
			pageHistory.push( page );
		}
	}
	
	function goBack() {
		var pageName;
		if( pageHistory.length > 1 ) {
			pageName = pageHistory.pop(); // this is the current page
			pageName = pageHistory.pop(); // this is the previous page
			if( pageName === 'login-page' && api.loggedIn ) {
				pageName = pageHistory.pop(); // skip the login screen as user is logged in
			}
			showPage( pageName );
		} else {
			console.log( 'Nothing in pageHistory to go back to. Quitting :(' );
			navigator.app.exitApp();
		}
		return pageName;
	}

	function showPage( pageName, deferred ) {
		addToHistory( pageName );
		var $page = $("#" + pageName); 
		$('.page, .popup-container-container').hide(); // hide existing popups
		if(!$page.hasClass('popup-container-container')) {
			curPageName = pageName;
		}
		$page.show();
		$( 'select', $page ).val( '' ); // reset to the top item in the list
		if( deferred ) {
			$page.addClass( 'loading' );
			// TODO: add fail e.g. warning triangle
			deferred.done( function() {
				$page.removeClass( 'loading' );
			} );
		}
		// special casing for specific pages
		var monuments = $( "#results" ).data( 'monuments' );
		if( monuments && pageName === 'results-page' ) {
				showMonumentsList( monuments );
		} else if( monuments && pageName === 'map-page' ) {
			showMonumentsMap( monuments );
		} else if( pageName === 'country-page' ) { // force a refresh of the map on visiting the country page
			mapFocusNeeded = true;
		}
	}

	function showMonumentDetail(monument) {
		var monumentTemplate = templates.getTemplate('monument-details-template');
		var imageFetcher = commonsApi.getImageFetcher(300, 240);
		var $monumentDetail = $(monumentTemplate({monument: monument}));
		$("#monument-detail").html($monumentDetail).localize();
		monument.requestThumbnail(imageFetcher).done(function(imageinfo) {
			$('#monument-detail').find('img.monument-thumbnail').attr('src', imageinfo.thumburl);
		});
		console.log('addressLink is ' + monument.addressLink);
		imageFetcher.send();
		curMonument = monument;
		showPage('detail-page');
	}

	// haversine formula ( http://en.wikipedia.org/wiki/Haversine_formula )
	function calculateDistance( from, to ) {
		var distance, a,
			toRadians = Math.PI / 180,
			deltaLat, deltaLng,
			startLat, endLat,
			haversinLat, haversinLng,
			radius = 6378; // radius of Earth in km

		if( from.latitude === to.latitude && from.longitude === to.longitude ) {
			distance = 0;
		} else {
			deltaLat = ( to.longitude - from.longitude ) * toRadians;
			deltaLng = ( to.latitude - from.latitude ) * toRadians;
			startLat = from.latitude * toRadians;
			endLat = to.latitude * toRadians;

			haversinLat = Math.sin( deltaLat / 2 ) * Math.sin( deltaLat / 2 );
			haversinLng = Math.sin( deltaLng / 2 ) * Math.sin( deltaLng / 2 );

			a = haversinLat + Math.cos( startLat ) * Math.cos( endLat ) * haversinLng;
			return 2 * radius * Math.asin( Math.sqrt( a ) );
		}
		return distance;
	}

	function showMonumentsList(monuments) {
		$( '#results' ).empty();
		var monumentTemplate = templates.getTemplate('monument-list-item-template');	
		var listThumbFetcher = commonsApi.getImageFetcher(64, 64);
		if( monuments.length === 0 ) {
			$( templates.getTemplate( 'monument-list-empty-template' )() ).
				localize().appendTo( '#results' );
		} else {
			$( '#monuments-sort' ).html(
				templates.getTemplate( 'monument-list-heading' )()
			).localize();
			$( '#monuments-sort button' ).click( function() {
				$( '#results' ).empty();
				currentSortMethod = $( this ).data( 'sortby' );
				window.setTimeout( function() { // use timeout for smoother experience
					showMonumentsList( monuments );
				}, 0 );
			}).each( function() {
				if( $( this ).data( 'sortby' ) === currentSortMethod ) {
					$( this ).addClass( 'selected' );
				}
			} );
		}

		// update distances
		if( userLocation ) {
			// TODO: only do this if location has changed recently
			$.each( monuments, function() {
				this.distance = calculateDistance( 
					userLocation.coords,
					{ latitude: this.lat, longitude: this.lon }
				).toFixed( 1 ); // distance fixed to 1 decimal place
			} );
		}

		function sortAlgorithm( m1, m2 ) {
			return m1[ currentSortMethod ] < m2[ currentSortMethod ] ? -1 : 1;
		}

		$.each( monuments.sort( sortAlgorithm ), function( i, monument ) {
			var distance, msg;
			var $monumentItem = $(monumentTemplate({monument: monument}));
			monument.requestThumbnail(listThumbFetcher).done(function(imageinfo) {
				$monumentItem.find('img.monument-thumbnail').attr('src', imageinfo.thumburl);
			});
			
			if( monument.distance ) {
				$( '<div class="distance" />' ).
					text( mw.msg( 'monument-distance-km', this.distance ) ).appendTo( $( 'a', $monumentItem ) );
			}
			$monumentItem.appendTo('#results').click(function() {
				showMonumentDetail(monument);
			});
		});
		listThumbFetcher.send();

		$( "#results" ).data( 'monuments', monuments );
		$("#monuments-list").show();
	}

	function showMonumentsMap(monuments, center, zoom) {
		geo.init();
		geo.clear();
		if( mapFocusNeeded && typeof center === 'undefined' && typeof zoom === 'undefined' ) {
			var centerAndZoom = geo.calculateCenterAndZoom(monuments);
			center = centerAndZoom.center;
			zoom = centerAndZoom.zoom;
			mapFocusNeeded = false;
		}
		if( center && zoom ) {
			geo.setCenterAndZoom( center, zoom );
		}
		$.each(monuments, function(i, monument) {
			if(monument.lat && monument.lon) {
				geo.addMonument(monument, showMonumentDetail);
			}
		});
	}

	function displayError( heading, text ) {
		showPage( 'error-page' );
		var info = $( '.error-information' ).empty()[ 0 ];
		$( '<h3 />' ).text( heading ).appendTo( info );
		$( '<p />' ).text( text ).appendTo( info );
	}

	function showPhotoConfirmation(fileUrl) {
		var comment = 'Uploaded via WLM Mobile App';
		var text = 'Testing WLM';
		var uploadConfirmTemplate = templates.getTemplate('upload-confirm-template');
		var fileName = curMonument.generateFilename();
		console.log("Filename is " + fileName);
		$("#upload-confirm").html(uploadConfirmTemplate({monument: curMonument, fileUrl: fileUrl})).localize();
		$("#confirm-license-text").html(mw.msg('confirm-license-text', api.userName));
		$("#continue-upload").click(function() {
			// reset status message for any previous uploads
			$( '#upload-progress-state' ).html(mw.msg( 'upload-progress-starting' ));
			showPage("upload-progress-page");
			api.startUpload( fileUrl, fileName ).done( function( fileKey, token ) {
				$("#upload-progress-state").html(mw.msg("upload-progress-in-progress"));
				api.finishUpload( fileKey, fileName, comment, text, token ).done(function( imageinfo ) {
					$( '#upload-latest-page img' ).attr( 'src', imageinfo.url );
					$( '#upload-latest-page .share' ).html( mw.msg( 'upload-latest-view' ) );
					$( '#upload-latest-page .share a' ).attr( 'href', imageinfo.descriptionurl );
					goBack(); // undo back button to skip upload progress page
					goBack(); // undo back button to skip upload form
					showPage( 'upload-latest-page' );
				});
			}).fail( function( data ) {
				var code, info;
				if( data.error ) {
					code = data.error.code;
					info = data.error.info;
				}
				$( '#upload-progress-state' ).html( mw.msg( 'upload-progress-failed' ) );
				displayError( code, info );
				console.log( 'Upload failed: ' + code );
			} );
		});
		showPage('upload-confirm-page');
	}

	$( '#settings-login' ).click( function() {
		if(api.loggedIn) {
			api.logout().done( function() {
				$( "#settings-login" ).text( mw.msg( 'settings-login' ) );
				$( "#settings-user-name" ).empty();
				// Clear out user name and password
				prefs.clear( 'username' );
				prefs.clear( 'password' );
				$( "#login-user" ).val( '' );
				$( "#login-pass" ).val( '' );
			});
		} else {
			doLogin(function() {
				showPage( "settings-page" );
			}, function(err) {
			});
		}
	});

	// Need to use callbacks instead of deferreds
	// since callbacks need to be called multiple times
	// For example, when the user tries to login but can not
	// Would have to add a 'cancel' callback in the future
	function doLogin(success, fail) {

		function authenticate( username, password ) {
			showPage( 'login-progress-page' );
			$( "#login-user, #login-pass" ).removeClass( 'error-input-field' );
			$( "#login-page input" ).attr( 'disabled', true );
			api.login( username, password ).done( function( status ) {
				if( status === "Success" )  {
					prefs.set( 'username', username );
					prefs.set( 'password', password );

					$( "#settings-login" ).text( mw.msg( 'settings-logout' ) );
					$( "#settings-user-name" ).html( mw.msg( 'settings-user-name', username ) );

					success();
				} else {
					var errMsg;
					// handle login API errors
					// http://www.mediawiki.org/wiki/API:Login#Errors
					switch( status ) {
						case 'NoName': // lgname param not set
						case 'Illegal': // an illegal username was provided
						case 'NotExists': // username does not exist
							errMsg = mw.msg( 'login-failed-username' );
							$( "#login-user" ).addClass( 'error-input-field' );
							break;
						case 'EmptyPass': // didn't set the lgpass param
						case 'WrongPass': // password is incorrect
						case 'WrongPluginPass': // auth plugin (not MW) rejected pw
							errMsg = mw.msg( 'login-failed-password' );
							$( "#login-pass" ).addClass( 'error-input-field' );
							break;
						case 'CreateBlocked': // IP address blocked from account creation
						case 'Blocked': // User is blocked
							errMsg = mw.msg( 'login-failed-blocked' );
							break;
						case 'Throttled': // Attempting to login too many times in a short time
							errMsg = mw.msg( 'login-failed-throttled' );
							break;
						case 'mustbeposted': // login module requires a 'post' request
						case 'NeedToken': // login token/session cookie missing
							errMsg = mw.msg( 'login-failed-internal' );
							break;
						default:
							errMsg = mw.msg( 'login-failed-default' );
							break;
					}
					$( "#login-status-message" ).empty();
					displayError( mw.msg( 'login-failed'), errMsg );
					fail( status );
				}
			}).fail( function( err, textStatus ) {
				$( "#login-status-message" ).empty();
				displayError( mw.msg( 'login-failed' ), textStatus );
				fail( textStatus );
			}).always( function() {
				$( "#login-status-spinner" ).hide();
				$( "#login-page input" ).attr( 'disabled', false );
			});
		}
		
		function displayLogin() {
			console.log('display login');
			function attemptLogin() {
				console.log('attempt login');
				var username = $( "#login-user" ).val().trim();
				var password = $( "#login-pass" ).val();
				authenticate( username, password );
			}

			$( '#login' ).click( attemptLogin );
			
			if( prefs.get( 'username' ) && prefs.get( 'password' ) ) {
				$( "#login-user" ).val( prefs.get( 'username' ) );
				$( "#login-pass" ).val( prefs.get( 'password' ) );
				attemptLogin();
			} else {
				showPage( 'login-page' );
			}
		}
		displayLogin();
	}

	function showSearchBar( pageName ) {
		var $page = $( "#" + pageName );
		var $searchBar = $page.find( '.searchbar' );
		var $curActionBar = $page.find( '.actionbar:not(".searchbar")' );
		$searchBar.removeClass( 'hidden' );
		$curActionBar.hide();
		$searchBar.find( '.cancel-search' ).unbind( 'click' ).click( function() {
			$searchBar.addClass( 'hidden' );
			$curActionBar.show();
		});
	}

	function init() {
		var timeout, name, countryCode;
		var countriesListTemplate = templates.getTemplate('country-list-template');
		$("#country-list").html(countriesListTemplate({countries: CAMPAIGNS}));
		$("#country-list .country-search").click(function() {
			countryCode = $(this).data('campaign');
			var params = {
				limit: 200
			};
			$("#results").empty();
			var d = monuments.getForCountry( countryCode, params ).done( function( monuments ) {
				showMonumentsList(monuments);
			});
			showPage( 'results-page', d );
		});

		var monumentSearchTimeout = null;
		var monumentSearchReq = null;
		$( '#filter-monuments' ).keyup( function() {
			var value = this.value;
			if( monumentSearchTimeout ) {
				window.clearTimeout( timeout );
				console.log( 'clearing timeout' );
			}

			if( monumentSearchReq ) {
				monumentSearchReq.abort();
				monumentSearchReq = null;
				console.log( 'clearing req' );
			}

			monumentSearchTimeout = window.setTimeout( function() {
				$("#results").empty();
				monumentSearchReq = monuments.filterByNameForCountry( countryCode, value ).done( function( monuments ) {
					showMonumentsList( monuments );
				} ).always( function() {
					monumentSearchReq = null;
				});
				showPage( 'results-page', monumentSearchReq );
				monumentSearchTimeout = null;
			}, 500 );
		});

		$( ".page-link" ).click( function() {
			var toPage = $( this ).data('page');
			if( $( this ).data( 'login' ) === 'required' ) {
				if( api.loggedIn ) {
					showPage( toPage );
				} else {
					doLogin( function() {
						showPage( toPage );
					}, function( err ) {
					} );
				}
			} else {
				showPage( toPage );
			}
			return false;
		});
		
		// FIXME: Have a proper platform specific overrides file that
		// does not have scope issues.
		document.addEventListener( 'backbutton', goBack, false );

		$( 'button.back, a.back' ).click( function() {
			goBack();
		} );

		$('#countries').click(function() {
			showPage('country-page');
		});

		$( '.show-search' ).click( function() {
			var page = $( this ).parents( '.page' ).attr( 'id' );
			showSearchBar( page );
		});

		var campaignSearchTimeout = null;
		$( "#filter-campaign" ).keyup( function() {
			if( campaignSearchTimeout ) {
				window.clearTimeout( campaignSearchTimeout );
			}
			campaignSearchTimeout = window.setTimeout( function() {
				var val = $( "#filter-campaign" ).val().toLowerCase();
				$( ".country-search" ).each( function() {
					var country = $(this).text().toLowerCase();
					if( country.indexOf( val ) !== -1 ) {
						$(this).parent().show();
					} else {
						$(this).parent().hide();
					}
				});
			}, 400);
		});

		$('#nearby').click(function() {
			showPage( 'locationlookup-page' );
			navigator.geolocation.getCurrentPosition(function(pos) {
				$("#results").empty();
				userLocation = pos;
				currentSortMethod = 'distance';
				$( 'html' ).addClass( 'locationAvailable' );
				var d = monuments.getInBoundingBox(pos.coords.longitude - nearbyDeg,
					pos.coords.latitude - nearbyDeg,
					pos.coords.longitude + nearbyDeg,
					pos.coords.latitude + nearbyDeg
				).done(function(monuments) {
					$( '#results' ).data( 'monuments', monuments );
					mapFocusNeeded = true;
					showMonumentsMap(monuments, {
						lat: pos.coords.latitude,
						lon: pos.coords.longitude
					}, 10);
				});
				showPage( 'map-page', d );
			}, function(err) {
				displayError( mw.msg( 'geolocating-failed-heading') , mw.msg( 'geolocating-failed-text' ) );
			},{
				timeout: 20000 // give up looking up location.. maybe they are in airplane mode
			});
		});

		// upload-page
		$('#takephoto').click(function() {
			navigator.camera.getPicture(function(data) {
				// success
				state.fileUri = data;
				showPhotoConfirmation(data);
			}, function(msg) {
				console.log( "TakePhoto cancelled because of " + msg );
				// Do nothing.
			}, {
				// options
				destinationType: Camera.DestinationType.FILE_URI
			});
		});
		$('#selectphoto').click(function() {
			navigator.camera.getPicture(function(data) {
				// success
				state.fileUri = data;
				showPhotoConfirmation(data);
			}, function(msg) {
				console.log( "SelectPhoto cancelled because of " + msg );
				// Do nothing.
			}, {
				// options
				destinationType: Camera.DestinationType.FILE_URI,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY
			});
		});

		$(document).localize();
		showPage('welcome-page');

		// allow cancellation of current api upload request
		$( '#upload-progress-page .back' ).click( function() {
			console.log( 'request to cancel upload' );
			api.cancel();
		});

		// setup dropdowns that allow switching a page
		$( 'select.toggle-page' ).mouseup(function( ev ) {
			var page = $( this ).val();
			showPage( page );
			ev.preventDefault(); // stop the UI changing
		});

		// Display the translated account creation message this way since the
		// HTML in the message can't be rendered via jquery.localize.js
		$('#login-create-account-msg').html( mw.msg( 'login-create-account' ) );

		// Everything has been initialized, so let's show them the UI!
		$( 'body' ).removeClass( 'hidden' );
	}

	l10n.init().done( function() {
		prefs.init().done( init );
	});
	window.WLMMobile = {
		api : api,
		app: {
			goBack: goBack,
			showMonumentsList: showMonumentsList,
			showPage: showPage
		}
	};
});
