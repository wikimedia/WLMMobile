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
require( [ 'jquery', 'l10n', 'geo', 'api', 'templates', 'monuments', 'preferences', 'jquery.localize', 'jquery.dpr' ],
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
	var countries = {
		'ad': 'Andorra',
		'at': 'Austria',
		'be-bru': 'Belgium (Brussels)',
		'be-vlg': 'Belgium (Flanders)',
		'be-wal': 'Belgium (Wallonia)',
		'by': 'Belarus',
		'ch': 'Switzerland',
		'de-by': 'Germany (Bavaria)',
		'de-he': 'Germany (Hesse)',
		'de-nrw-bm': 'Germany (nrw-bm)',
		'de-nrw-k': 'Germany (nrw-k)',
		'dk-bygning': 'Denmark (bygning)',
		'dk-fortids': 'Denmark (fortids)',
		'ee': 'Estonia',
		'es': 'Spain',
		'es-ct': 'Catalonia',
		'es-vc': 'Valencia',
		'fr': 'France',
		'ie': 'Ireland',
		'it-88': 'Italy (88)',
		'it-bz': 'Italy (bz)',
		'lu': 'Luxemburg',
		'mt': 'Malta',
		'nl': 'Netherlands',
		'no': 'Norway',
		'pl': 'Poland',
		'pt': 'Portugal',
		'ro': 'Romania',
		'se': 'Sweden',
		'sk': 'Slovakia',
		'us': 'United States'
	};

	var curPageName = null;
	var curMonument = null; // Used to store state for take photo, etc

	var pageHistory = []; // TODO: retain history
	function addToHistory( page ) {
		if( pageHistory[ pageHistory.length - 1 ] !== page ) { // avoid adding the same page twice
			pageHistory.push( page );
		}
	}
	
	function goBack() {
		var pageName;
		if( pageHistory.length > 1 ) {
			pageName = pageHistory.pop(); // this is the current page
			pageName = pageHistory.pop(); // this is the previous page
			showPage( pageName );
		} else {
			console.log( 'Nothing in pageHistory to go back to' );
		}
	}

	function showPage(pageName) {
		addToHistory( pageName );
		var $page = $("#" + pageName); 
		$('.page, .popup-container-container').hide(); // hide existing popups
		if(!$page.hasClass('popup-container-container')) {
			curPageName = pageName;
		}
		$page.show();
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

	function showMonumentsList(monuments) {
		$("#results").empty();
		var monumentTemplate = templates.getTemplate('monument-list-item-template');	
		var listThumbFetcher = commonsApi.getImageFetcher(64, 64);
		if( monuments.length === 0 ) {
			$( templates.getTemplate( 'monument-list-empty-template' )() ).
				localize().appendTo( '#results' );
		}
		$.each(monuments, function(i, monument) {
			var $monumentItem = $(monumentTemplate({monument: monument}));
			monument.requestThumbnail(listThumbFetcher).done(function(imageinfo) {
				$monumentItem.find('img.monument-thumbnail').attr('src', imageinfo.thumburl);
			});
			$monumentItem.appendTo('#results').click(function() {
				showMonumentDetail(monument);
			});
		});
		listThumbFetcher.send();

		var mapPopulated = false;
		$("#toggle-result-view").unbind("change").change(function() {
			var mapVisible = $("#toggle-result-view").val() !== "map-view";
			if(mapVisible) {
				$("#monuments-list").show();
				geo.hideMap();
			} else {
				if(!mapPopulated) {
					showMonumentsMap(monuments);
					mapPopulated = true;
				} 
				geo.showMap();
				$("#monuments-list").hide();
			}
		});
		showPage('results-page');
		$("#monuments-list").show();
		geo.hideMap();
	}


	function showMonumentsMap(monuments, center, zoom) {
		geo.init();
		geo.clear();
		if(typeof center === "undefined" && typeof zoom === "undefined") {
			var centerAndZoom = geo.calculateCenterAndZoom(monuments);
			center = centerAndZoom.center;
			zoom = centerAndZoom.zoom;
		}
		geo.setCenterAndZoom(center, zoom);
		$.each(monuments, function(i, monument) {
			if(monument.lat && monument.lon) {
				geo.addMonument(monument, showMonumentDetail);
			}
		});
	}

	function displayError( heading, text ) {
		showPage( 'error-page' );
		$( '#error-page textarea' ).val( heading + ':\n' + text );
	}

	function showPhotoConfirmation(fileUrl) {
		var uploadConfirmTemplate = templates.getTemplate('upload-confirm-template');
		var fileName = curMonument.generateFilename();
		console.log("Filename is " + fileName);
		$("#upload-confirm").html(uploadConfirmTemplate({monument: curMonument, fileUrl: fileUrl})).localize();
		$("#confirm-license-text").html(mw.msg('confirm-license-text', api.userName));
		$("#continue-upload").click(function() {
			// reset status message for any previous uploads
			$( '#upload-progress-state' ).html(mw.msg( 'upload-progress-starting' ));
			showPage("upload-progress-page");
			api.startUpload(fileUrl, fileName, 'Uploaded via WLM Mobile App', 'Testing WLM').done(function(fileKey) {
				$("#upload-progress-state").html(mw.msg("upload-progress-in-progress"));
				api.finishUpload(fileKey, fileName, 'Uploaded via WLM Mobile App', 'Testing WLM').done(function(imageinfo) {
					console.log(JSON.stringify(imageinfo));
					$("#upload-progress-state").html(mw.msg("upload-progress-done"));
					setTimeout(function() {
						showPage('detail-page');
					}, 2 * 1000);
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

	// Need to use callbacks instead of deferreds
	// since callbacks need to be called multiple times
	// For example, when the user tries to login but can not
	// Would have to add a 'cancel' callback in the future
	function doLogin(success, fail) {
		var prevPage = curPageName;

		function authenticate( username, password ) {
			$( "#login-status" ).show();
			$( "#login-page input" ).attr( 'disabled', true );
			$( "#login-status-message" ).text( mw.msg( 'login-in-progress' ) );
			api.login( username, password ).done( function( status ) {
				if( status === "Success" )  {
					showPage( prevPage );
					prefs.set( 'username', username );
					prefs.set( 'password', password );
					$( "#login-status-message" ).html( mw.msg( 'login-success' ) );
					setTimeout( function() {
						$( "#login-status" ).hide();
						success();
					}, 3 * 1000 );
				} else {
					$( "#login-status-message" ).html( mw.msg( 'login-failed', status ) );
					fail( status );
				}
			}).fail( function( err, textStatus ) {
				$( "#login-status-message" ).html( mw.msg( 'login-failed', textStatus ) );
				fail( textStatus );
			}).always( function() {
				$( "#login-status-spinner" ).hide();
				$( "#login-page input" ).attr( 'disabled', false );
			});
		}

		if( prefs.get( 'username' ) && prefs.get( 'password' ) ) {
			$( "#login-user" ).val( prefs.get( 'username' ) );
			$( "#login-pass" ).val( prefs.get( 'password' ) );
			authenticate( prefs.get( 'username' ), prefs.get( 'password' ) );
		}
		$("#login").unbind('click').click(function() {
			var username = $( "#login-user" ).val().trim();
			var password = $( "#login-pass" ).val();
			authenticate( username, password );
		});
		showPage("login-page");
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
		$("#country-list").html(countriesListTemplate({countries: countries}));
		$("#country-list .country-search").click(function() {
			countryCode = $(this).data('campaign');
			var params = {
				limit: 200
			};
			monuments.getForCountry( countryCode, params ).done( function( monuments ) {
				showMonumentsList(monuments);
			});
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
				monumentSearchReq = monuments.filterByNameForCountry( countryCode, value ).done( function( monuments ) {
					showMonumentsList( monuments );
				} ).always( function() {
					monumentSearchReq = null;
				});
				monumentSearchTimeout = null;
			}, 500 );
		});

		$(".page-link").click(function() {
			var toPage = $(this).data('page');
			if($(this).data('login') === 'required') {
				if(api.loggedIn) {
					showPage(toPage);
				} else {
					doLogin(function() {
						showPage(toPage);
					}, function(err) {
					});
				}
			} else {
				showPage(toPage);
			}
			return false;
		});
		
		$( 'button.back' ).click( function() {
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
			navigator.geolocation.getCurrentPosition(function(pos) {
				monuments.getInBoundingBox(pos.coords.longitude - nearbyDeg,
					pos.coords.latitude - nearbyDeg,
					pos.coords.longitude + nearbyDeg,
					pos.coords.latitude + nearbyDeg
				).done(function(monuments) {
					showMonumentsList(monuments);
					showMonumentsMap(monuments, {
						lat: pos.coords.latitude,
						lon: pos.coords.longitude
					}, 10);
				});
			}, function(err) {
				alert('Error in geolocation');
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

		$(document).localize().dprize();
		showPage('welcome-page');

		// Everything has been initialized, so let's show them the UI!
		$( 'body' ).removeClass( 'hidden' );
	}

	l10n.init().done( function() {
		prefs.init().done( init );
	});
});
