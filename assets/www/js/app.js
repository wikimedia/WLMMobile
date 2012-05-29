

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
require(['jquery', 'l10n', 'geo', 'api', 'jquery.localize'], function($, l10n, geo, Api) {

	var api = new Api("https://test.wikipedia.org/w/api.php");
	var commonsApi = new Api('https://commons.wikimedia.org/w/api.php');
	var wlmapi = 'http://toolserver.org/~erfgoed/api/api.php';
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
	/* When this function is called, Cordova has been initialized and is ready to roll */
	/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app launch.
	see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
	for more details -jm */
	function onDeviceReady()
	{
		l10n.initLanguages();
		if (window.plugins.pinchZoom !== undefined) {
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
		$.each(countries, function(code, name) {
			var $li = $('<li>'),
				$button = $('<button>');
			$button.addClass('country-search').text(name);
			$button.click(function() {
				showPage('results-page');
				searchParams = {
					how: 'campaign',
					campaign: code,
					lat: null,
					lon: null
				};
				updateSearch();
			});
			$button.appendTo($li);
			$li.appendTo('#country-list');
		});

		$('#countries').click(function() {
			showPage('country-page');
		});

		$('#nearby').click(function() {
			showPage('results-page');
			navigator.geolocation.getCurrentPosition(function(pos) {
				searchParams = {
					how: 'nearby',
					campaign: null,
					lat: pos.coords.latitude,
					lon: pos.coords.longitude
				};
				updateSearch();
			}, function(err) {
				alert('Error in geolocation');
			});
		});
		
		$('#back-welcome').click(function() {
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

	function showSearchResults(data) {
		//alert(data);
		var fields = [
			'country',
			'lang',
			'id',
			'name',
			'address',
			'municipality',
			'lat',
			'lon',
			'image',
			'source',
			'monument_article',
			'registrant_url',
			'changed'
		];
		var results = [];
		// XML -> JSON
		$('monument', data).each(function(i, node) {
			var obj = {};
			$.each(fields, function(i, field) {
				obj[field] = node.getAttribute(field);
				if (field == 'lat' || field == 'lon') {
					obj[field] = parseFloat(obj[field]);
				}
			});
			results.push(obj);
		});
		
		// Sort by location
		if (searchParams.how == 'nearby') {
			/**
			 * Distance approximation, in degrees
			 */
			function dist(lat, lon) {
				var dlat = (lat - searchParams.lat),
					dlon = (lon - searchParams.lon),
					degrees = Math.sqrt(dlat * dlat + dlon * dlon);
				return degrees;
			}
			$.each(results, function(i, item) {
				item.dist = dist(item.lat, item.lon);
			});
			results = results.sort(function(a, b) {
				return a.dist - b.dist;
			});
		}
		
		// whee
		$('#results').empty();
		var fetcher = new ImageFetcher(commonsApi, 64, 64);

		geo.initMap();
		geo.clearMarkers();
		if (searchParams.how == 'nearby') {
			geo.map.setView(new L.LatLng(searchParams.lat, searchParams.lon), 10);
		} else {
			var center = {lat: 0, lon: 0},
				max = {lat: -999, lon: -999},
				min = {lat: 999, lon: 999},
				count = 0,
				dist = {lat: 0, lon: 0},
				zoom = 0;
			$.each(results, function(i, item) {
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
				geo.map.setView(new L.LatLng(0, 0), 1);
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
				geo.map.setView(new L.LatLng(center.lat, center.lon), zoom - 1);
			}
		}

		$.each(results, function(i, item) {
			var $li = $('<li><img> <div class="stuff"><div class="name"></div><div class="address"></div></div></li>');
			$li.find('.name').text(stripWikiText(item.name));
			$li.find('.address').text(stripWikiText(item.address));
			if (item.image) {
				fetcher.request(item.image, function(imageinfo) {
					$li.find('img').attr('src', imageinfo.thumburl);
				});
			}
			$li.appendTo('#results');
			var showDetail = function() {
				showPage('detail-page');
				$('#detail-country').text(item.country);
				$('#detail-lang').text(item.lang);
				$('#detail-id').text(item.id);
				$('#detail-name').text(stripWikiText(item.name)); // may contain wikitext
				if (item.monument_article) {
					// @fixme may contain a #foo hash
					var url = 'https://' + item.lang + '.wikipedia.org/wiki/' +
						encodeURIComponent(item.monument_article.replace(/ /g, '_'));
					$('#detail-link a').attr('href', url).text(item.monument_article.replace(/_/g, ' '));
					$('#detail-link').show();
				} else {
					$('#detail-link a').attr('href', '#').empty();
					$('#detail-link').hide();
				}
				var addr = stripWikiText(item.address); // may contain wikitext
				var geoUri = platform.geoUrl(item.lat, item.lon, addr);
				$('#detail-address a')
					.text(addr)
					.attr('href', geoUri);
				$('#detail-municipality').text(stripWikiText(item.municipality)); // may contain wikitext
				$('#detail-location a')
					.text(item.lat + ', ' + item.lon)
					.attr('href', platform.geoUrl(item.lat, item.lon));
				$('#detail-source a').attr('href', item.source); // URL?
				$('#detail-changed').text(item.changed); // timestamp - format me
				$('#detail-image').empty();
				if (item.image) {
					var fetcher2 = new ImageFetcher(commonsApi, 300, 240);
					fetcher2.request(item.image, function(imageinfo) {
						console.log('?? ' + JSON.stringify(imageinfo));
						var $img = $('<img>');
						$img.attr('src', imageinfo.thumburl);
						$('#detail-image').empty().append($img);
					});
					fetcher2.send();
				}
			};
			$li.click(showDetail);
			
			if (item.lat || item.lon) {
				// Only add items to map that have a lat/lon
				geo.addMarker(item.lat,
					item.lon,
					stripWikiText(item.name),
					stripWikiText(item.address),
					showDetail);
			}
		});
		fetcher.send();
	}


	/**
	 * Fetch image info for one or more images via MediaWiki API
	 */
	function ImageFetcher(api, width, height) {
		this.api = api || commonsApi;
		this.titles = [];
		this.callbacks = {};
		this.width = width;
		this.height = height;
	}

	ImageFetcher.prototype.request = function(filename, callback) {
		var title = 'File:' + filename;
		this.titles.push(title);
		this.callbacks[title] = callback;
	};

	ImageFetcher.prototype.send = function() {
		var that = this;
		var data = {
			action: 'query',
			titles: this.titles.join('|'),
			prop: 'imageinfo',
			iiprop: 'url',
			format: 'json'
		};
		if (this.width) {
			data.iiurlwidth = this.width;
		}
		if (this.height) {
			data.iiurlheight = this.height;
		}
		$.ajax({
			url: this.api,
			data: data,
			success: function(data) {
				// Get the normalization map
				if (!('query' in data)) {
					console.log('no return image data');
					return;
				}
				var origName = {};
				if ('normalized' in data.query) {
					$.each(data.query.normalized, function(i, pair) {
						origName[pair.to] = pair.from;
					});
				}

				$.each(data.query.pages, function(pageId, page) {
					var title = page.title;
					if (title in origName) {
						console.log('Normalizing title');
						title = origName[title];
					}
					if ('imageinfo' in page) {
						var imageinfo = page.imageinfo[0];
						if (title in that.callbacks) {
							that.callbacks[title].apply(imageinfo, [imageinfo]);
						} else {
							console.log('No callback for image ' + title);
						}
					}
				});
			}
		});
	};



	function stripWikiText(str) {
		str = str.replace(/\[\[[^\|]+\|([^\]]+)\]\]/g, '$1');
		str = str.replace(/\[\[([^\]]+)\]\]/g, '$1');
		return str;
	}


	function updateSearch() {
		var data = {
			'action': 'search',
			'limit': 50,
			'format': 'xml',
		}
		if (searchParams.how == 'nearby') {
			var dist = 0.25; // degree 'radius' approx on the bounding box
			data.bbox = [
				searchParams.lon - dist,
				searchParams.lat - dist,
				searchParams.lon + dist,
				searchParams.lat + dist
			].join(',');
		} else if (searchParams.how == 'campaign') {
			data.srcountry = searchParams.campaign;
		}
		/*
		// Filter option is ssllooww and doesn't work right now.
		var filter = $('#filter-input').val();
		if (filter != '') {
			data.srname = '%' + filter + '%';
		}
		*/
		$.ajax({
			url: wlmapi,
			data: data,
			success: function(data) {
				showSearchResults(data);
			}
		});
	}
});
