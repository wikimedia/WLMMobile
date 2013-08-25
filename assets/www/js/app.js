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
require( [ 'jquery', 'l10n', 'geo', 'api', 'templates', 'monuments', 'monument', 'preferences', 'database', 'admintree', 'photo',
		'page-uploads',
		'jquery.localize', 'campaigns-data', 'campaign-loader', 'licenses-data', 'utils' ],
	function( $, l10n, geo, Api, templates, MonumentsApi, Monument, prefs, db, AdminTreeApi, Photo, UploadPage ) {

	var api = new Api( WLMConfig.WIKI_API, {
		onProgressChanged: function( percent ) {
				$( '#upload-progress-bar' ).empty();
				$( '<div>' ).css( 'width', percent + '%').
				appendTo( '#upload-progress-bar' );
		}
	} );
	var hrefStylesheet = 'app.css';
	var CURRENT_LANGUAGE;
	var PHOTO_TEMPLATE = templates.getTemplate( 'upload-photo-description', true );
	var commonsApi = new Api( WLMConfig.COMMONS_API );
	var monuments = new MonumentsApi( WLMConfig.MONUMENT_API, commonsApi );
	var wlmapi = 'https://tools.wmflabs.org/heritage/api/api.php';
	var admintree = new AdminTreeApi( WLMConfig.MONUMENT_API );
	var nearbyDeg = 1.5; // degree 'radius' approx on the bounding box
	var state = {
		fileUri: null,
		fileKey: null,
		fileSize: null,
		title: null
	};
	var currentSortMethod = 'name';
	var watchId;
	var userLocation; // for keeping track of the user
	function setUserLocation( pos ) {
		userLocation = pos;
		geo.setLocationPointer( pos );
	}

	var mapFocusNeeded = true; // a global for keeping track of when to auto-focus the map

	var curPageName = null;
	var curMonument = null; // Used to store state for take photo, etc

	var thumbSize = WLMConfig.THUMB_SIZE;

	var pageHistory = []; // TODO: retain history
	var blacklist = [];
	$( '.blacklistedPage' ).each( function() {
		blacklist.push( $( this ).attr( 'id' ) );
	} );

	function getCurrentPage() {
		return curPageName;
	}

	function clearHistory() {
		pageHistory = [];
	}

	function addToHistory( page ) {

		function trimRepeats() {
			var newHistory = [], i, thisEven, thisOdd, nextEven, nextOdd,
				isRepeatPattern;

			for( i = 0; i < pageHistory.length; i+=1 ) {
				thisItem = pageHistory[ i ];
				nextItem = pageHistory[ i + 1 ];
				finalItem = pageHistory[ i + 3 ];
				// only add i in situation where not the case that i+1 === i+3 && i+2 !== i
				isRepeatPattern = nextItem && finalItem &&
					nextItem === finalItem &&
					thisItem === pageHistory[ i + 2 ];
				if ( isRepeatPattern ) { // skip repeats
					newHistory.push( thisItem );
					if( nextItem ) {
						newHistory.push( nextItem );
					}
					i += 4;
				} else {
					newHistory.push( thisItem );
				}
			}
			pageHistory = newHistory;
		}

		var blacklisted = blacklist.indexOf( page ) > -1;
		if( !blacklisted &&
			pageHistory[ pageHistory.length - 1 ] !== page ) { // avoid adding the same page twice
			pageHistory.push( page );
		}
		trimRepeats();
	}
	
	function goBackHooks( pageName ) {
		var data, campaigns = [];
		if( pageName === 'login-page' && api.loggedIn ) {
			pageName = pageHistory.pop(); // skip the login screen as user is logged in
		}
		data = pageName.split( '/' );
		showPage( pageName );

		// special casing for specific pages
		// TODO: provide generic mechanism for this
		if( data[ 0 ] === 'campaign-page' ) {
			campaigns = data.slice( 1 );
			// campaigns are currently url encoded so we must decode
			campaigns.forEach( function( el, i ) {
				campaigns[ i ] = decodeURIComponent( el );
			} );
			listCampaigns( campaigns );
		}
		return pageName;
	}

	function goBack() {
		var pageName;
		if( blacklist.indexOf( curPageName ) > -1 ) {
			pageName = pageHistory.pop(); // go back one page
			pageName = goBackHooks( pageName );
		} else if( pageHistory.length > 1 ) {
			pageName = pageHistory.pop(); // this is the current page
			pageName = pageHistory.pop(); // this is the previous page
			pageName = goBackHooks( pageName );
		} else {
			console.log( 'Nothing in pageHistory to go back to. Quitting :(' );
			navigator.app.exitApp();
		}
		return pageName;
	}

	var translatedPageNames = {};
	function translatePageName( name ) {
		return translatedPageNames[ name ] || stripWikiText( name );
	}

	var showHooks = [];
	function showPageHooks( pageName, deferred ) {
		showHooks.forEach( function( fn ) {
			fn( pageName, deferred );
		} );
	}

	function registerPageHook( fn ) {
		showHooks.push( fn );
	}

	function showPage( pageName, deferred ) {
		var subPage, heading;
		addToHistory( pageName );
		curPageName = pageName;
		if( pageName.indexOf( '/' ) > -1 ) {
			pageName = pageName.split( '/' );
			subPage = pageName[ pageName.length - 1 ];
			pageName = pageName[ 0 ];
		}

		var $page = $("#" + pageName); 
		$('.page, .popup-container-container').hide(); // hide existing popups
		$page.show()[ 0 ].scrollIntoView();
		$( 'select', $page ).val( pageName ); // reset to the top item in the list
		if( deferred ) {
			$page.addClass( 'loading' );
			// TODO: add fail e.g. warning triangle
			deferred.done( function() {
				$page.removeClass( 'loading' );
			} );
		}
		// special casing for specific pages
		// TODO: provide generic mechanism for this
		navigator.geolocation.clearWatch( watchId );
		var monuments = $( "#results" ).data( 'monuments' );
		if( monuments && pageName === 'results-page' ) {
			showMonumentsList( monuments );
			mapFocusNeeded = true; // force a refresh of the map
		} else if ( pageName === 'map-page' ) {
			// keep an eye on location for the map
			if ( userLocation ) {
				watchId = navigator.geolocation.watchPosition(
					function( pos ) {
						console.log( 'watching' );
						setUserLocation( pos );
					}, function() {
						console.log( 'issue watching location' );
					}, {
						enableHighAccuracy: true,
						maximumAge: 0
					} );
			}

			if ( monuments ) {
				showMonumentsMap( monuments );
			}
		} else if( pageName === 'campaign-page' ) {
			// TODO: translate subpage
			mapFocusNeeded = true; // force a refresh of the map on visiting the country page
			heading = subPage ? mw.msg( 'choose-region' ) + ' (' + translatePageName( decodeURIComponent( subPage ) ) + ')' :
				mw.msg( 'choose-country' );
			$page.find( 'h3' ).text( heading );
			$( '#filter-campaign' ).attr( 'placeholder', subPage ?
				mw.msg( 'search-region-placeholder' ) : mw.msg( 'search-country-placeholder' ) );
		}
		showPageHooks( pageName, deferred );
	}

	function showMonumentDetail(monument) {
		var monumentTemplate = templates.getTemplate('monument-details-template');
		 // @FIXME remove dependency on CAMPAIGNS[monument.country].desc
		var imageFetcher = commonsApi.getImageFetcher( 300 * window.devicePixelRatio, 240 * window.devicePixelRatio );
		var $monumentDetail = $( monumentTemplate( { monument: monument } ) );
		$( '#monument-detail' ).html( $monumentDetail ).localize();
		translateLevelsForMonument( monument ).done( function( names ) {
			$( '#monument-detail .campaign' ).text( names.reverse().join( ', ' ) );
		} );
		if ( monument.image ) {
			$( '#monument-detail' ).find( 'img.monument-thumbnail' ).removeAttr( 'src' );
			$( '#monument-detail' ).addClass( 'loading' );
		}
		monument.requestThumbnail(imageFetcher).done(function(imageinfo) {
			$( '#monument-detail' ).find( 'img.monument-thumbnail' ).
				attr( 'src', imageinfo.thumburl );
			$( '#monument-detail' ).removeClass( 'loading' );
		});
		imageFetcher.send();
		
		if( monument.articleLink ) {
			$( '#monument-detail' ).find( '.monument-article' ).html( buildMonumentLink( monument ) );
			// Run an existence check on the article...
			var apiUrl = WLMConfig.WIKIPEDIA_API.replace( '$1', monument.lang ),
				api = new Api( apiUrl );
			api.request( 'get', {
				action: 'query',
				prop: 'revisions',
				titles: monument.monument_article, // yes titles, API can take multiple values :)
				rvlimit: 1
			} ).done( function( data ) {
				if ( 'query' in data && 'pages' in data.query ) {
					var pageId;
					$.each( data.query.pages, function( i, item ) {
						pageId = i;
					});
					if ( pageId > 0 ) {
						// Page exists!
					} else {
						// No existy.
						$( '#monument-detail .monument-article a' )
							.addClass( 'broken' )
							.click( function( event ) {
								alert( mw.message( 'article-does-not-exist', monument.monument_article.replace( /_/g, ' ' ) ).plain() );
								event.preventDefault();
							});
					}
				} else {
					// Error in API check.
					// Silently ignore it for now.
				}
			} );
		}

		curMonument = monument;
		showPage('detail-page');
	}
	
	function buildMonumentLink( monument ) {
		var $link = $( '<a>' )
			.attr( 'class', 'external' )
			.attr( 'href', monument.articleLink )
			.text( (monument.monument_article + '').replace(/_/g, ' ' ) );
		var $stub = $( '<span>' ).append( $link );
		var html = mw.message( 'monument-article-link', $stub.html() ).plain();
		return html;
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

	function getPosition( callback, errback ) {
		var page = getCurrentPage();
		showPage( 'locationlookup-page' );
		navigator.geolocation.getCurrentPosition( function( pos ) {
			setUserLocation( pos );
			currentSortMethod = 'distance';
			$( 'html' ).addClass( 'locationAvailable' );
			if ( getCurrentPage() === 'locationlookup-page' ) { // check user didn't escape page
				showPage( page );
				callback( pos );
			}
		}, function( err ) {
			if ( getCurrentPage() === 'locationlookup-page' ) { // check user didn't escape page
				displayError( mw.msg( 'geolocating-failed-heading') , mw.msg( 'geolocating-failed-text' ) );
			}
			if ( errback ) {
				errback();
			}
		}, {
			enableHighAccuracy: true,
			maximumAge: 1000,
			timeout: 20000 // give up looking up location.. maybe they are in airplane mode
		} );
	}

	function showMonumentsList(monuments) {

		var infiniteScrollAjax;
		function infiniteScroll() {
			var footer = $( '#results .footer' )[ 0 ];
			if( footer && monuments.next ) {
				$( footer ).addClass( 'loading' );
				if ( infiniteScrollAjax ) {
					return;
				} else {
					infiniteScrollAjax = monuments.next().done( function( newMonuments ) {
						$( footer ).removeClass( 'loading' );
						var m = monuments.concat( newMonuments );
						m.next = newMonuments.next;
						showMonumentsList( m );
						infiniteScrollAjax = false;
					} ).error( function() {
						infiniteScrollAjax = false;
					} );
				}
			}
		}
		// setup scroll to bottom
		$( '#results' ).unbind( 'hit-bottom' ).bind( 'hit-bottom', infiniteScroll );

		$( '#results' ).empty();
		var monumentTemplate = templates.getTemplate('monument-list-item-template');	
		var listThumbFetcher = commonsApi.getImageFetcher( thumbSize, thumbSize );
		$( '#results' ).data( 'monuments', monuments );
		if( monuments.length === 0 ) {
			$( templates.getTemplate( 'monument-list-empty-template' )() ).
				localize().appendTo( '#results' );
		}
		$( '#monuments-sort' ).html(
			templates.getTemplate( 'monument-list-heading' )()
		).localize();

		function sort() {
			window.setTimeout( function() { // use timeout for smoother experience
				showMonumentsList( $( '#results' ).data( 'monuments' ) );
			}, 0 );
		}

		$( '#monuments-sort button' ).click( function() {
			$( '#results' ).empty();
			currentSortMethod = $( this ).data( 'sortby' );
			if ( $( this ).hasClass( 'requires-location' ) ) {
				getPosition( function( pos ) {
					sort();
				} );
			} else {
				sort();
			}
		}).each( function() {
			if( $( this ).data( 'sortby' ) === currentSortMethod ) {
				$( this ).addClass( 'selected' );
			}
		} );

		// update distances
		if( userLocation ) {
			// TODO: only do this if location has changed recently
			$.each( monuments, function() {
				this.distance = calculateDistance( 
					userLocation.coords,
					{ latitude: this.lat, longitude: this.lon }
				).toFixed( 1 ); // distance fixed to 1 decimal place
				this.distance = parseFloat( this.distance, 10 ); // toFixed returns a string (bug 39475)
			} );
		}

		function sortAlgorithm( m1, m2 ) {
			return m1[ currentSortMethod ] < m2[ currentSortMethod ] ? -1 : 1;
		}

		$.each( monuments.sort( sortAlgorithm ), function( i, monument ) {
			var distance, msg;
			var $monumentItem = $(monumentTemplate({monument: monument}));
			if ( monument.image ) {
				$monumentItem.find( 'img.monument-thumbnail' ).removeAttr( 'src' );
				$monumentItem.addClass( 'loading' );
			}
			monument.requestThumbnail(listThumbFetcher).done(function(imageinfo) {
				$monumentItem.find( 'img.monument-thumbnail' ).
					attr( 'src', imageinfo.thumburl );
				$monumentItem.removeClass( 'loading' );
			});
			
			if( monument.distance ) {
				msg = monument.distance > 200 ? mw.msg( 'monument-distance-tofar' ) : mw.msg( 'monument-distance-km', this.distance );
				$( '<div class="distance" />' ).
					text( msg ).appendTo( $( 'a', $monumentItem ) );
			}
			$monumentItem.appendTo('#results').click(function() {
				showMonumentDetail(monument);
			});
		});
		listThumbFetcher.send();

		$( "#results" ).data( 'monuments', monuments );
		// if next property is set then there are more results so allow access to them
		if ( monuments.next && monuments.length > 0 && currentSortMethod !== 'distance' ) {
			$( '#results' ).addClass( 'incomplete' );
			$( '<li class="footer"></li>' ).appendTo( '#results' );
		} else {
			$( '#results' ).removeClass( 'incomplete' );
		}
		$("#monuments-list").show();
	}

	function addMonuments( monuments ) {
		$.each( monuments, function( i, monument ) {
			if ( monument.lat && monument.lon ) {
				geo.addMonument( monument, showMonumentDetail );
			}
		} );
	}

	function initMap() {
		showPage( 'map-page' );
		var searchTimeout, lastRequest;
		function ping( ev ) {
			if ( mapFocusNeeded ) {
				mapFocusNeeded = false;
				return;
			}
			$( '#map-page .mapLoader' ).addClass( 'loading' );
			console.log( 'update map with new monuments' );
			var pos = ev.target.getBounds(),
				nw = pos.getNorthWest(),
				se = pos.getSouthEast();
			if( lastRequest ) {
				lastRequest.abort();
			}
			window.clearTimeout( searchTimeout );
			searchTimeout = window.setTimeout( function() {
				lastRequest = monuments.getInBoundingBox( nw.lng, se.lat, se.lng, nw.lat ).done( function( monuments ) {
					$( '#map-page .mapLoader' ).removeClass( 'loading' );
					geo.clear();
					if ( monuments.length > 0 ) {
						addMonuments( monuments );
						$( '#results' ).data( 'monuments', monuments );
					}
				}, 500 ); // delaying search to prevent stressing out server
			} );
		}
		geo.init( ping );
	}

	function showMonumentsMap( monumentList, center, zoom ) {
		if( !geo.getMap() ) {
			return;
		}
		geo.clear();
		if( mapFocusNeeded && typeof center === 'undefined' && typeof zoom === 'undefined' ) {
			var centerAndZoom = geo.calculateCenterAndZoom( monumentList );
			center = centerAndZoom.center;
			zoom = centerAndZoom.zoom;
		}
		if( center && zoom ) {
			geo.setCenterAndZoom( center, zoom );
		} else {
			geo.onResize(); // hack to ensure resize on re-show after orientation change (bug 38933)
		}
		addMonuments( monumentList );
	}

	function displayError( heading, text, hidePreamble ) {
		showPage( 'error-page' );
		var info = $( '.error-information' ).empty()[ 0 ];
		var $preamble = $( '#error-page .generic-error-msg' );
		$( '<h3 />' ).text( heading ).appendTo( info );
		$( '<p />' ).html( text ).appendTo( info );
		if ( hidePreamble ) {
			$preamble.hide();
		} else {
			$preamble.show();
		}
		return info;
	}

	function resolveImageThumbnail( url ) {
		var parts = url.split( '/' );
		// slot thumb 3 levels down
		return parts.slice(0, 5).join( '/' ) + '/thumb/'  + parts.slice( 5 ).join( '/' ) + '/180px-' + parts[ parts.length - 1 ];
	}

	function uploadErrorHandler( data ) {
		var code, info;
		console.log( 'Run error handler on ' + JSON.stringify( data ) );
		if( data.error ) {
			code = data.error.code;
			info = data.error.info;
		}
		/*
		error codes: http://www.mediawiki.org/wiki/API:Errors_and_warnings
		*/
		switch ( code ) {
			case 'permissiondenied':
				code = mw.msg( 'failure-upload-permissiondenied-heading' );
				info = mw.msg( 'failure-upload-permissiondenied-text' );
				break;
			case 'badtoken':
				code = mw.msg( 'failure-upload-token-heading' );
				info = mw.msg( 'failure-upload-token-text' );
				break;
			case 'verification-error':
				if ( data.error.details && data.error.details[ 0 ] === 'filetype-mime-mismatch' ) {
					code = mw.msg( 'failure-upload-filetype-heading' );
					info = mw.msg( 'failure-upload-filetype-text' );
				}
				break;
		}
		goBack(); // exit upload progress bar screen
		return displayError( code, info, info ? true : false );
	}

	function uploadProgressHandler( state ) {
		$( '#upload-progress-page .back' ).attr( 'disabled', false );
		if( state === 'starting' ) {
			$( '#upload-progress-state' ).html( mw.msg( 'upload-progress-starting' ) );
			showPage( 'upload-progress-page' );
		} else if ( state === 'in-progress' ) {
			$( '#upload-progress-page .back' ).attr( 'disabled', true );
			$( '#upload-progress-state' ).html( mw.msg( 'upload-progress-in-progress' ) );
		}
	}

	function showPhotoConfirmation(fileUrl) {
		var comment = mw.msg( 'upload-comment', WLMConfig.VERSION_NUMBER );
		var uploadConfirmTemplate = templates.getTemplate('upload-confirm-template');
		var fileName = curMonument.generateFilename();
		console.log("Filename is " + fileName);
		var licenseText = formatLicenseText( CAMPAIGNS[ curMonument.country ].config );

		$("#upload-confirm").html(uploadConfirmTemplate({monument: curMonument, fileUrl: fileUrl})).localize();
		$( '#confirm-license-text' ).html(
			mw.msg( 'confirm-license-text', '', licenseText )
		);

		var photo = new Photo( {
			campaignConfig: CAMPAIGNS[ curMonument.country ].config,
			contentURL: fileUrl,
			fileTitle: fileName,
			monument: curMonument
		} );
		$( '#upload-later-button' ).click( function() {
			db.addUpload( api.userName, curMonument, photo, false );
			$( '#upload-later .content a.incomplete' ).click( function() {
				showPage( 'incomplete-uploads-page' );
			} );
			$( '#upload-later .content a.welcome' ).click( function() {
				showPage( 'welcome-page' );
			} );
			goBack(); // escape the confirmation screen
			showPage( 'upload-later' );
		} );
		function continueUpload() {
			// reset status message for any previous uploads
			photo.uploadTo( api, comment, PHOTO_TEMPLATE ).done( function( imageinfo ) {
				$( '#upload-latest-page img' ).attr( 'src', resolveImageThumbnail( imageinfo.url ) );
				$( '#upload-latest-page .share a' ).attr( 'href', imageinfo.descriptionurl );

				db.addUpload( api.userName,curMonument, photo, true );
				goBack(); // undo back button to skip upload progress page
				goBack(); // undo back button to skip upload form
				showPage( 'upload-latest-page' );
			} ).progress( uploadProgressHandler ).fail( function( data ) {
				var container;
				if (data == "Aborted") {
					// no-op
					console.log( "Upload got aborted." );
				} else {
					container = uploadErrorHandler( data );
					$( 'a.logout', container ).click( function() {
						showPage( 'logout-progress-page' );
						api.logout().done(function() {
							var noPageChange = getCurrentPage() === 'logout-progress-page';
							if ( noPageChange ) {
								prefs.clear( 'username' );
								prefs.clear( 'password' );
								doLogin( function() {
									goBack(); // escape error popup
									goBack(); // escape progress bar
									showPage( 'detail-page' );
								});
							}
						} );
					} );
					console.log( 'Upload failed: ' + code );
				}
			} );
		}
		$('#continue-upload' ).click( function() {
			doLogin( continueUpload );
		} );
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

		if( typeof fail === 'undefined' ) {
			fail = function() { };
		}

		function authenticate( username, password ) {
			showPage( 'login-progress-page' );
			$( "#login-user, #login-pass" ).removeClass( 'error-input-field' );
			$( "#login-page input" ).attr( 'disabled', true );
			api.login( username, password ).done( function( status ) {
				var noPageChange = getCurrentPage() === 'login-progress-page';
				if ( status === "Success" && noPageChange )  {
					prefs.set( 'username', username );
					prefs.set( 'password', password );

					$( "#settings-login" ).text( mw.msg( 'settings-logout' ) );
					$( "#settings-user-name" ).html( mw.msg( 'settings-user-name', username ) );

					success();
				} else if ( noPageChange ) {
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
							errMsg = mw.msg( 'login-failed-blocked', WLMConfig.BLOCKING_POLICY.replace( '$1', lang ) );
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
					displayError( mw.msg( 'login-failed'), errMsg, errMsg ? true : false );
					fail( status );
				}
			}).fail( function( err, textStatus ) {
				var noPageChange = getCurrentPage() === 'login-progress-page';
				if ( noPageChange ) {
					$( "#login-status-message" ).empty();
					displayError( mw.msg( 'login-failed' ), textStatus );
					fail( textStatus );
				}
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

	function formatLicenseText( campaignConfig ) {
		var key = campaignConfig.defaultOwnWorkLicence, // note the typo in the API field
			text = key,
			$stub = $( '<span>' );
		if (key in LICENSES && 'url' in LICENSES[key] ) {
			var $link = $( '<a>' )
				.text( text )
				.attr( 'class', 'external' )
				.attr( 'href', LICENSES[key].url )
				.appendTo( $stub );
		} else {
			$stub.text( text );
		}
		return $stub.html();
	}
	
	function translateLevelsForMonument( monument ) {
		var levels = [];
		if ( monument.adm0 ) {
			levels.push( monument.adm0 );
		}
		if ( monument.adm1 ) {
			levels.push( monument.adm1 );
		}
		if ( monument.adm2 ) {
			levels.push( monument.adm2 );
		}
		if ( monument.adm3 ) {
			levels.push( monument.adm3 );
		}
		return admintree.getLeaves( levels, CURRENT_LANGUAGE, /* translate */ true ).pipe( function( tree ) {
			var names = [];
			$.each( tree, function( i, level ) {
				var name = stripWikiText( level.name );
				names.push(name);
			} );
			return names;
		});
	}

	function translateAdminLevels( $uploadItem, monument ) {
		// Translate administrative level codes into proper text
		var $name = $uploadItem.find( '.monument-location' );
		translateLevelsForMonument( monument ).done( function( names ) {
			$name.text( names.join( ' > ' ) );
		} );
	}

	/**
	* Returns the current bounding box as a string
	* @return {array} the bounding box in order [ minLon, minLat, maxLon, maxLat ]
	*/
	function getCurrentBoundingBox() {
		return $( '#results' ).data( 'bbox' ) || [];
	}

	/**
	* Sets the current bounding box
	* @param bbox {array} An array representing the bounding box [ minLon, minLat, maxLon, maxLat ]
	*/
	function setCurrentBoundingBox( bbox ) {
		$( '#results' ).data( 'bbox', bbox );
	}

	function showMonumentsForPosition( latitude, longitude, zoomLevel ) {
		var d, map, bounds, nw, se,
			maxZoom,
			pos = { lat: latitude, lon: longitude };

		map = geo.getMap();
		maxZoom = map.getMaxZoom();
		zoomLevel = zoomLevel || maxZoom;
		geo.setCenterAndZoom( pos, zoomLevel, true );
		bounds = map.getBounds();
		nw = bounds.getNorthWest();
		se = bounds.getSouthEast();
		setCurrentBoundingBox( [ nw.lng, se.lat, se.lng, nw.lat ] );
		d = monuments.getInBoundingBox( nw.lng, se.lat, se.lng, nw.lat ).
			done( function( monuments ) {
				if( monuments.length === 0 && zoomLevel > maxZoom - 5 ) {
					showMonumentsForPosition( latitude, longitude, zoomLevel - 1 );
				} else {
					showMonumentsMap( monuments );
					showPage( 'map-page' );
				}
			} ).fail( function() {
				displayError( mw.msg( 'server-issue-heading'),
					mw.msg( 'server-issue-text' ) );
			} );
	}

	/**
	* Sets the current campaign
	* @param campaignTree {array} An array of codes representing the tree of a campaign. First item is the root node.
	*/
	function setCurrentCampaign( campaign ) {
		$( '#results' ).data( 'campaign', campaign );
	}

	function getCurrentCampaign() {
		return $( '#results' ).data( 'campaign' ) || [];
	}

	/**
	* Lists the campaigns listed under the existing campaign trail
	* if bottom of tree lists monuments
	* @param campaignTree {array} An array of codes representing the tree of a campaign. First item is the root node.
	*/
	function listCampaigns( campaignTree ) {
		var pageName, d,
			$clist = $( '#campaign-list' ),
			lang = prefs.get( 'uiLanguage' );

		function constructCampaignTrailPageName( tree ) {
			var page = [ 'campaign-page' ], i;
			for ( i = 0; i < tree.length; i++ ) {
				page.push( encodeURIComponent( tree[ i ] ) );
			}
			return page.join( '/' );
		}

		pageName = constructCampaignTrailPageName( campaignTree );

		d = admintree.getLeaves( campaignTree, lang );
		$clist.empty()
		
		function listMonuments( tree ) {
			$( '#results' ).empty();
			setCurrentCampaign( tree );
			var d = monuments.getForAdminLevel( tree ).
					done( function( monuments ) {
						showMonumentsList( monuments );
					});
			showPage( 'results-page', d );
		}
		showPage( pageName, d );

		d.done( function( campaigns ) {
			if ( getCurrentPage() !== pageName ) { // the user pressed back so abort any further changes
				console.log( 'silently dying due to a back button press' );
			} else if ( campaigns.length === 0 ) {
				goBack(); // kill the last campaign page request (seems hacky...)
				listMonuments( campaignTree );
			} else {
				var countriesListTemplate = templates.getTemplate( 'country-list-template' );
				$clist.empty().html(
					countriesListTemplate( { campaigns: campaigns } )
				);

				// setup links
				$( 'a', $clist ).
					each( function() {
						var campaign = $( this ).data( 'campaign' );
						translatedPageNames[ campaign ] = $( this ).text();
						var tree = [].concat( campaignTree );
						tree.push( campaign );
						$( this ).data( 'tree', tree );
					} ).
					click( function() {
						var tree = $( this ).data( 'tree' );
						listCampaigns( tree );
					} );
			}
		} );
	}

	function init() {
		$( '#version' ).text( WLMConfig.VERSION_NUMBER + ' (' + WLMConfig.VERSION_NAME + ')');
		var timeout, name, lang = prefs.get( 'uiLanguage' );
		var wikipedia_url = WLMConfig.WIKIPEDIA.replace( '$1', lang );
		var wlm_url = WLMConfig.WIKI_LOVES_MONUMENTS_HOMEPAGE;

		var monumentSearchTimeout = null;
		var monumentSearchReq = null;

		if( l10n.isLangRTL( lang ) ) {
			$( 'body' ).attr( 'dir', 'rtl' );
			hrefStylesheet = 'app-rtl.css';
		}
		// load styles
		$.ajax( {
			url: hrefStylesheet, dataType: 'text'
		} ).done( function( css ) {
			$( document.documentElement ).removeClass( 'loading' );
			$( '<style type="text/css" >' ).text( css ).appendTo( document.head );
			initMap();
			clearHistory();
			showPage('welcome-page');
		} );
		CURRENT_LANGUAGE = lang;

		function filterMonuments() {
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
				var campaign = getCurrentCampaign();
				$("#results").empty();

				console.log( 'searching with campaign ' + campaign.join( ',' ) );
				monumentSearchReq = monuments.getForAdminLevel( campaign, value );

				monumentSearchReq.done( function( monuments ) {
					showMonumentsList( monuments );
				} ).always( function() {
					monumentSearchReq = null;
				});
				showPage( 'results-page', monumentSearchReq );
				monumentSearchTimeout = null;
			}, 500 );
		}
		$( '#filter-monuments' ).on( 'input', filterMonuments );

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
			var times = $( this ).data( 'back' ), i;
			times = times ? parseInt( times, 10 ) : 1;
			for( i = 0; i < times; i++ ) {
				goBack();
			}
		} );

		$('#countries').click(function() {
			translatedPageNames = {};
			listCampaigns( [] );
		});

		$( '.show-search' ).click( function() {
			var page = $( this ).parents( '.page' ).attr( 'id' );
			showSearchBar( page );
		});

		var campaignSearchTimeout = null;
		function filterCampaigns() {
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
		};
		$( "#filter-campaign" ).on( 'input', filterCampaigns );

		$('#nearby').click(function() {
			getPosition( function( pos ) {
				showPage( 'map-page' );
				$("#results").empty();
				showMonumentsForPosition( pos.coords.latitude, pos.coords.longitude );
			} );
		});

		// upload-page
		$('#takephoto').click(function() {
			// Attempt to clear memory from giant image preview of prior image
			$( 'img.preview-image' ).removeAttr( 'src' );

			navigator.camera.getPicture(function(data) {
				// success
				state.fileUri = data;
				showPhotoConfirmation(data);
			}, function(msg) {
				console.log( "TakePhoto cancelled because of " + msg );
				// Do nothing.
			}, {
				// options
				destinationType: Camera.DestinationType.FILE_URI,
				saveToPhotoAlbum: true,
				quality: 100 // don't recompress
			});
		});
		$('#selectphoto').click(function() {
			// Attempt to clear memory from giant image preview of prior image
			$( 'img.preview-image' ).removeAttr( 'src' );

			navigator.camera.getPicture(function(data) {
				// success
				state.fileUri = data;
				showPhotoConfirmation(data);
			}, function(msg) {
				console.log( "SelectPhoto cancelled because of " + msg );
				if (msg == 'Cannot read this image type.') {
					// for our hack around https://issues.apache.org/jira/browse/CB-1293
					// failure to load picasa images
					displayError( mw.msg( 'cannot-load-photo' ) , mw.msg( 'cannot-load-photo-text' ) );
				}
				// Do nothing.
			}, {
				// options
				destinationType: Camera.DestinationType.FILE_URI,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY
			});
		});

		$(document).localize();
		$( '#about-page-text a' ).eq( 0 ).attr( 'href', wlm_url );
		$( '#about-page-text a' ).eq( 1 ).attr( 'href', wikipedia_url );

		// allow cancellation of current api upload request
		$( '#upload-progress-page .back' ).click( function() {
			console.log( 'request to cancel upload' );
			if ( !$( this ).is( ':disabled' ) ) {
				api.cancel();
			}
		});

		// setup dropdowns that allow switching a page
		$( 'select.toggle-page' ).change( function( ev ) {
			var page = $( this ).val();
			showPage( page );
			ev.preventDefault(); // stop the UI changing
		} );

		// Display the translated account creation message this way since the
		// HTML in the message can't be rendered via jquery.localize.js
		$( '#login-create-account-msg a' ).attr( 'href', WLMConfig.SIGNUP_PAGE.replace( '$1', lang ) );

		// Everything has been initialized, so let's show them the UI!
		$( 'body' ).removeClass( 'hidden' );

		$( window ).scroll( function() {
			var max = $( document.body ).height() + $( document.body ).scrollTop();
			var threshold = 50;
			if ( document.body.scrollHeight > max - threshold ) {
				$( '#results' ).trigger( 'hit-bottom' );
			}
		} );
	}

	window.WLMMobile = {
		admintree: admintree,
		api : api,
		app: {
			clearHistory: clearHistory,
			doLogin: doLogin,
			getCurrentPage: getCurrentPage,
			getPosition: getPosition,
			goBack: goBack,
			listCampaigns: listCampaigns,
			registerPageHook: registerPageHook,
			showMonumentDetail: showMonumentDetail,
			showMonumentsForPosition: showMonumentsForPosition,
			showMonumentsList: showMonumentsList,
			resolveImageThumbnail: resolveImageThumbnail,
			showPage: showPage,
			translateAdminLevels: translateAdminLevels,
			uploadErrorHandler: uploadErrorHandler,
			uploadProgressHandler: uploadProgressHandler
		},
		commonsApi: commonsApi,
		db: db,
		monuments: monuments,
		Monument: Monument,
		Photo: Photo,
		templates: templates
	};

	l10n.init().done( function() {
		prefs.init().done( function() {
			db.init().done( init );
			monuments.lang = prefs.get( 'uiLanguage' );
			UploadPage( window.WLMMobile );
		} );
	});
});
