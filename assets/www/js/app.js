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
require(['jquery', 'l10n', 'geo', 'api', 'templates', 'monuments', 'jquery.localize'],
	function($, l10n, geo, Api, templates, MonumentsApi) {

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

	function showPage(pageName) {
		var $page = $("#" + pageName); 
		if(!$page.hasClass('popup-container-container')) {
			$('.page, .popup-container-container').hide();
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
		var monumentTemplate = templates.getTemplate('monument-list-item-template');	
		var listThumbFetcher = commonsApi.getImageFetcher(64, 64);
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
		showPage('results-page');
	}

	function calculateCenterAndZoom(monuments) {
		var center = {lat: 0, lon: 0},
			max = {lat: -999, lon: -999},
			min = {lat: 999, lon: 999},
			count = 0,
			location = {},
			visible,
			dist = {lat: 0, lon: 0},
			zoom = 0;
		$.each(monuments, function(i, item) {
			if (item.lat || item.lon) {
				// Only count things that aren't at (0, 0)
				if (item.lat < min.lat) {
					min.lat = item.lat;
				}
				if (item.lon < min.lon) {
					min.lon = item.lon;
				}
				if (item.lat > max.lat) {
					max.lat = item.lat;
				}
				if (item.lon > max.lon) {
					max.lon = item.lon;
				}
				count++;
			}
		});
		if (count === 0) {
			// Seriously?
			location = {center: {lat: 0, lon: 0}, zoom: 1};
		} else {
			center.lat = (min.lat + max.lat) / 2;
			center.lon = (min.lon + max.lon) / 2;
			dist.lat = max.lat - min.lat;
			dist.lon = max.lon - min.lon;
			dist = Math.max(dist.lat,dist.lon);
			visible = 360;
			for (zoom = 1; zoom < 18; zoom++) {
				visible /= 2;
				if (dist >= visible) {
					break;
				}
			}
			location = { center: center, zoom: zoom -1 };
		}
		return location;
	}

	function showMonumentsMap(monuments, center, zoom) {
		if(typeof center === "undefined" && typeof zoom === "undefined") {
			var centerAndZoom = calculateCenterAndZoom(monuments);
			center = centerAndZoom.center;
			zoom = centerAndZoom.zoom;
		}
		showPage('map-page');
		geo.initMap();
		geo.clearMarkers();
		geo.map.setView(new L.LatLng(center.lat, center.lon), zoom);
		$.each(monuments, function(i, monument) {
			if(monument.lat && monument.lon) {
				geo.addMarker(monument.lat,
					monument.lon,
					monument.name,
					monument.address,
					function() { showMonumentDetail(monument); }
				);
			}
		});
	}

	function onDeviceReady() {
		l10n.initLanguages();
		if (window.plugins !== undefined && window.plugins.pinchZoom !== undefined && navigator.userAgent.match(/Android 2/)) {
			// TODO: only enable this while on the map view?
			(function() {
				var origDistance;
				window.plugins.pinchZoom.addEventListener('pinchzoom', function(event) {
					if (geo.map) {
						if(event.type === "pinchzoomstart") {
							origDistance = event.distance;
						}
						else if (event.type === "pinchzoommove" || event.type === "pinchzoomend") {
							var ratio = event.distance / origDistance;
							if (ratio < 0.67) {
								// Zooming out
								origDistance = event.distance;
								geo.map.zoomOut();
							} else if (ratio > 1.5) {
								// Zooming in
								origDistance = event.distance;
								geo.map.zoomIn();
							}
						}
					}
				});
			}());
		}
	}

	function showPhotoConfirmation(fileUrl) {
		var uploadConfirmTemplate = templates.getTemplate('upload-confirm-template');
		var fileName = curMonument.generateFilename();
		console.log("Filename is " + fileName);
		$("#upload-confirm").html(uploadConfirmTemplate({monument: curMonument, fileUrl: fileUrl})).localize();
		$("#confirm-license-text").html(mw.msg('confirm-license-text', api.userName));
		$("#continue-upload").click(function() {
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
			});
		});
		showPage('upload-confirm-page');
	}

	// Need to use callbacks instead of deferreds
	// since callbacks need to be called multiple times
	// For example, when the user tries to login but can not
	// Would have to add a 'cancel' callback in the future
	function doLogin(success, fail) {
		var prevPage = curPageName;
		$("#login").unbind('click').click(function() {
			var username = $("#login-user").val().trim();
			var password = $("#login-pass").val();
			api.login(username, password).done(function(status) {
				if(status === "Success")  {
					showPage(prevPage);
					success();
				} else {
					fail(status);
				}
			}).fail(function(err, textStatus) {
				fail(textStatus);
			});
		});
		$("#login-page .back").unbind('click').click(function() {
			showPage(prevPage);
		});
		showPage("login-page");
	}

	onDeviceReady();
	$(document).bind('mw-messages-ready', function() {
		var countriesListTemplate = templates.getTemplate('country-list-template');
		$("#country-list").html(countriesListTemplate({countries: countries}));
		$("#country-list .country-search").click(function() {
			$('#results').empty();
			var params = {
				limit: 200
			};
			monuments.getForCountry($(this).data('campaign'), params).done(function(monuments) {
				showMonumentsList(monuments);
				$("#show-map").unbind('click').click(function() {
					console.log("Switching to map view");
					showMonumentsMap(monuments);
				});
			});
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
						alert(err);
					});
				}
			} else {
				showPage(toPage);
			}
			return false;
		});

		$('#countries').click(function() {
			showPage('country-page');
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
				// error
				alert('fail: ' + msg);
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
				// error
				alert('fail: ' + msg);
			}, {
				// options
				destinationType: Camera.DestinationType.FILE_URI,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY
			});
		});

		showPage('welcome-page');
		$(document).localize();
	});
});
