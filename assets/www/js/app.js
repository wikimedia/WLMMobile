

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
require(['jquery', 'l10n', 'geo', 'api', 'templates', 'monuments', 'jquery.localize'], function($, l10n, geo, Api, templates, MonumentsApi) {

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


	onDeviceReady();
	function onDeviceReady()
	{
		l10n.initLanguages();
		if (window.plugins !== undefined && window.plugins.pinchZoom !== undefined && navigator.userAgent.match(/Android 2/)) {
			// TODO: only enable this while on the map view?
			(function() {
				var origDistance;
				window.plugins.pinchZoom.addEventListener('pinchzoom', function(event) {
					if (geo.map) {
						if (event.type == "pinchzoomstart") {
							origDistance = event.distance;
						}
						else if (event.type == "pinchzoommove" || event.type == "pinchzoomend") {
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
			})();
		}
	}

	$(document).bind('mw-messages-ready', function() {
		var countriesListTemplate = templates.getTemplate('country-list-template');
		$("#country-list").html(countriesListTemplate({countries: countries}))
		$("#country-list button.country-search").click(function() {
			monuments.getForCountry($(this).data('campaign')).done(function(monuments) {
				showMonumentsList(monuments);
				$("#show-map").unbind('click').click(function() {
					console.log("Switching to map view");
					showMonumentsMap(monuments);
				});
			});
		});

		$('#countries').click(function() {
			showPage('country-page');
		});

		$('#nearby').click(function() {
			navigator.geolocation.getCurrentPosition(function(pos) {
				console.log("Got position");
				monuments.getInBoundingBox(pos.coords.longitude - nearbyDeg,
					pos.coords.latitude - nearbyDeg,
					pos.coords.longitude + nearbyDeg,
					pos.coords.latitude + nearbyDeg
				).done(function(monuments) {
					console.log("OM NOM NOM");
					showMonumentsMap(monuments, {
						lat: pos.coords.latitude,
						lon: pos.coords.longitude
					}, 10);
				});
			}, function(err) {
				alert('Error in geolocation');
			});
		});

		$('.back-welcome').click(function() {
			showPage('welcome-page');
		});
		$('#show-list').click(function() {
			$('#map-view').hide();
			$('#list-view').show();
			$('#show-list').hide();
			$('#show-map').show();
		});
		$('#show-map').click(function() {
			$('#list-view').hide();
			$('#map-view').show();
			$('#show-map').hide();
			$('#show-list').show();
		}).click(); // show map by default
		
		$('#back-results').click(function() {
			showPage('results-page');
		});

		$('#start-upload').click(function() {
			showPage('login-page');
		});

		$('#back-detail').click(function() {
			showPage('detail-page');
		});

		// do your thing!
		//navigator.notification.alert("Cordova is working")
		$('#login').click(function() {
			var username = $("#login-user").val().trim();
			var password = $("#login-pass").val();
			api.login(username, password).done(function(status) {
				if(status === "Success")  {
					showPage('upload-page');
				} else {
					alert(status);
				}
			}).fail(function(err) {
				alert(JSON.stringify(err));
			});
		});
		
		// upload-page
		$('#takephoto').click(function() {
			navigator.camera.getPicture(function(data) {
				// success
				state.fileUri = data;
				prepUploadConfirmation();
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
				prepUploadConfirmation();
			}, function(msg) {
				// error
				alert('fail: ' + msg);
			}, {
				// options
				destinationType: Camera.DestinationType.FILE_URI,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY
			});
		});
		
		// upload-status-page
		$('#continue').click(function() {
			showPage('upload-progress');
			continueButtonCheck();
			startUpload(state.fileUri);
		});
		$('#change-photo').click(function() {
			showPage('upload-page');
		});
		
		// upload-progress
		$('#self-confirmation').click(function() {
			continueButtonCheck();
		});
		$('#cancel-post-upload').click(function() {
			// @fixme cancel the file transfer if still running
			showPage('upload-status-page');
		});
		$('#continue-post-upload').click(function() {
			if (!state.fileKey) {
				alert('no file key yet');
			} else {
				showPage('upload-description');
			}
		});
		
		// upload-description
		$('#submit-upload').click(function() {
			console.log('Completing upload...');
			api.finishUpload(state.fileKey, 'test_wlm.jpg', 'testing wlm', 'testing wlm');
		});
		
		showPage('welcome-page');
		console.log("About to localize!");
		$(document).localize();
		console.log("localized!");
	});

	function showPage(page) {
		$('.page').hide();
		$('#' + page).show();
	}

	function showMonumentDetail(monument) {
		var monumentTemplate = templates.getTemplate('monument-details-template');
		var imageFetcher = commonsApi.getImageFetcher(300, 240);
		var $monumentDetail = $(monumentTemplate({monument: monument}));
		$("#monument-detail").html($monumentDetail);
		monument.requestThumbnail(imageFetcher).done(function(imageinfo) {
			$monumentDetail.find('img.monument-thumbnail').attr('src', imageinfo.thumburl);
		});
		imageFetcher.send();
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
			$("#results").append($monumentItem).click(function() {
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
		if (count == 0) {
			// Seriously?
			return {center: {lat: 0, lon: 0}, zoom: 1};
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
			return { center: center, zoom: zoom -1 };
		}
	}

	function showMonumentsMap(monuments, center, zoom) {
		if(typeof center === "undefined" && typeof zoom === "undefined") {
			var centerAndZoom = calculateCenterAndZoom(monuments);
			center = centerAndZoom.center;
			zoom = centerAndZoom.zoom;
		}
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
		showPage('map-page');
	}

	function prepUploadConfirmation() {
		showPage('upload-status-page');
	}

	function startUpload(fileUri) {
		api.startUpload(fileUri, 'test_wlm.jpg', 'testing wlm', 'testing wlm').done(function(fileKey) {
			state.fileKey = fileKey;
			$('#upload-progress-bar').text('done');
			continueButtonCheck();
		});
	}

	function continueButtonCheck() {
		var okToContinue = (state.fileKey && $('#self-confirmation').is(':checked'));
		if (okToContinue) {
			$('#continue-post-upload').removeAttr('disabled');
		} else {
			$('#continue-post-upload').attr('disabled', 'disabled');
		}
	}
});
