

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

function onBodyLoad()
{		
	document.addEventListener("deviceready", onDeviceReady, false);
}

var api = "https://test.wikipedia.org/w/api.php";
var commonsApi = 'https://commons.wikimedia.org/w/api.php';
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


/* When this function is called, Cordova has been initialized and is ready to roll */
/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app launch.
see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
for more details -jm */
function onDeviceReady()
{
	$.each(countries, function(code, name) {
		var $li = $('<li>'),
			$button = $('<button>');
		$button.addClass('country-search').text(name);
		$button.click(function() {
			showPage('results-page');
			$.ajax({
				url: wlmapi,
				data: {
					'action': 'search',
					'srcountry': code,
					'format': 'xml',
				},
				success: function(data) {
					showSearchResults(data);
				}
			});
		});
		$button.appendTo($li);
		$li.appendTo('#country-list');
	});

	$('#nearby').click(function() {
		showPage('results-page');
		/*
			monuments: [
				{
					country,
					lang,
					id, // string
					name,
					address, // may be empty
					municipality, // may be empty
					lat, // string
					lon, // string
					image, // may be empty
					source, // URL for the image? may be empty
					monument_article, // seems mostly empty
					registrant_url, // what's this mean exactly?
					
					
		*/
		//This gives... nothing so far
		navigator.geolocation.getCurrentPosition(function(pos) {
			//alert(pos.coords.latitude + ', ' + pos.coords.longitude);
			$.ajax({
				url: wlmapi,
				data: {
					'action': 'search',
					'srlat': pos.coords.latitude,
					'srlon': pos.coords.longitude,
					'format': 'xml',
				},
				success: function(data) {
					showSearchResults(data);
				}
			});
		}, function(err) {
			alert('Error in geolocation');
		});

	});
	
	$('#back-welcome').click(function() {
		showPage('welcome-page');
	});

	$('#back-results').click(function() {
		showPage('results-page');
	});

	$('#start-upload').click(function() {
		showPage('login-page');
	});

	// do your thing!
	//navigator.notification.alert("Cordova is working")
	$('#login').click(function() {
		function submitLogin(callback, token) {
			var params = {
				action: 'login',
				lgname: $('#login-user').val(),
				lgpassword: $('#login-pass').val(),
				format: 'json'
			};
			if (token) {
				params.lgtoken = token;
			}
			$.ajax({
				url: api,
				data: params,
				type: 'POST',
				success: function(data) {
					console.log(JSON.stringify(data));
					console.log('data.login.result is ' + data.login.result);
					if (data.login.result == 'NeedToken') {
						console.log('got NeedToken');
						if (!token) {
							console.log('resubmitting with token');
							submitLogin(callback, data.login.token);
						} else {
							console.log('got asked for token twice');
						}
					} else if (data.login.result == 'Success') {
						console.log('success');
						callback(true);
					} else {
						console.log('fail');
						callback(false);
					}
				},
				error: function(err) {
					console.log('faaaaailed');
					callback(false);
				},
			});
		};
		submitLogin(function(ok) {
			if (ok) {
				showPage('upload-page');
			} else {
				alert('not logged in');
			}
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
		completeUpload(state.fileKey);
	});
	
	showPage('welcome-page');
}

function showPage(page) {
	$('.page').hide();
	$('#' + page).show();
}


function prepUploadConfirmation() {
	showPage('upload-status-page');
}


/**
 * @return promise, resolves with token value, rejects with error message
 */
function getToken() {
	var defer = new $.Deferred();
	$.ajax({
		url: api,
		data: {
			action: 'query',
			prop: 'info',
			intoken: 'edit',
			titles: 'Foo',
			format: 'json'
		},
		success: function(data) {
			var token;
			$.each(data.query.pages, function(i, item) {
				token = item.edittoken;
			});
			if (token) {
				defer.resolve(token);
			} else {
				defer.reject("No token found");
			}
		},
		fail: function(xhr, err) {
			defer.reject("HTTP error");
		}
	});
	return defer.promise();
}


/**
 * @return promise, resolves with stashed file key, rejects with error message
 */
function doUpload(sourceUri) {
	var defer = new $.Deferred();
	getToken().done(function(token) {
		var options = new FileUploadOptions();
		options.fileKey = "file";
		options.fileName = sourceUri.substr(sourceUri.lastIndexOf('/')+1);
		options.mimeType = "image/jpg";
		options.chunkedMode = false;
		options.params = {
			action: 'upload',
			filename: 'Test_file.jpg',
			comment: 'Uploaded with WLMTest',
			text: 'Photo uploaded with WLMTest',
			ignorewarnings: 1,
			stash: 1,
			token: token,
			format: 'json'
		};
		
		var ft = new FileTransfer();
		ft.upload(sourceUri, api, function(r) {
			// success
			console.log("Code = " + r.responseCode);
			console.log("Response = " + r.response);
			console.log("Sent = " + r.bytesSent);
			var data = JSON.parse(r.response);
			if (data.upload.result == 'Success') {
				defer.resolve(data.upload.filekey);
			} else {
				defer.reject("Upload did not succeed");
			}
		}, function(error) {
			console.log("upload error source " + error.source);
			console.log("upload error target " + error.target);
			defer.reject("HTTP error");
		}, options);
	});
	return defer.promise();
}

/**
 * @return promise resolves with imageinfo structure, rejects with error message
 */
function completeUpload(fileKey) {
	var defer = new $.Deferred();
	console.log('upload completing... getting token...');
	getToken().done(function(token) {
		console.log('.... got token');
		console.log('starting ajax upload completion...');
		$.ajax({
			url: api,
			type: 'POST',
			data: {
				action: 'upload',
				filekey: fileKey,
				filename: 'Test_file.jpg',
				comment: 'Uploaded with WLMTest',
				text: 'Photo uploaded with WLMTest',
				ignorewarnings: 1,
				token: token,
				format: 'json'
			},
			success: function(data) {
				console.log(JSON.stringify(data));
				if (data.upload.result == 'Success') {
					defer.resolve(data.upload.imageinfo);
				} else {
					defer.reject("Upload did not succeed");
				}
			},
			fail: function(xhr, error) {
				console.log("upload error source " + error.source);
				console.log("upload error target " + error.target);
				defer.reject("HTTP error");
			}
		});
	});
	return defer.promise();
}

function startUpload(fileUri) {
	doUpload(fileUri).done(function(fileKey) {
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
	// whee
	$('#results').empty();
	$.each(results, function(i, item) {
		var $li = $('<li><img> <span class="name"></span></li>');
		$li.find('.name').text(item.name);
		if (item.image) {
			$.ajax({
				url: commonsApi,
				data: {
					action: 'query',
					titles: 'File:' + item.image,
					prop: 'imageinfo',
					iiprop: 'url',
					iiurlwidth: 64,
					iiurlheight: 64,
					format: 'json'
				},
				success: function(data) {
					$.each(data.query.pages, function(pageId, page) {
						//console.log(JSON.stringify(page.imageinfo));
						$li.find('img').attr('src', page.imageinfo[0].thumburl);
					});
				}
			});
		}
		$li.appendTo('#results');
		$li.click(function() {
			showPage('detail-page');
			$('#detail-country').text(item.country);
			$('#detail-lang').text(item.lang);
			$('#detail-id').text(item.id);
			$('#detail-name').text(item.name); // may contain wikitext
			$('#detail-link').text(item.monument_article);
			$('#detail-address').text(item.name); // may contain wikitext
			$('#detail-municipality').text(item.name); // may contain wikitext
			$('#detail-location').text(item.lat + ', ' + item.lon);
			$('#detail-source').text(item.source); // URL?
			$('#detail-changed').text(item.changed); // timestamp - format me
			if (item.image) {
				/*
				$.ajax({
					url: commonsApi,
					data: {
						action: 'query',
						titles: 'File:' + item.image,
						prop: 'imageinfo',
						iiprop: 'url',
						iiurlwidth: 300,
						iiurlheight: 240,
						format: 'json'
					},
					success: function(data) {
						$.each(data.query.pages, function(pageId, page) {
							var $img = $('<img>');
							$img.attr('src', page.imageinfo[0].thumburl);
							$('#detail-image').empty().append($img);
						});
					}
				});
				*/
				var fetcher = new ImageFetcher(commonsApi, 300, 240);
				fetcher.request(item.image, function(imageinfo) {
					console.log('?? ' + JSON.stringify(imageinfo));
					var $img = $('<img>');
					$img.attr('src', imageinfo.thumburl);
					$('#detail-image').empty().append($img);
				});
				fetcher.send();
			}
		});
	});
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
	console.log(this.api);
	console.log(JSON.stringify(data));
	$.ajax({
		url: this.api,
		data: data,
		success: function(data) {
			// Get the normalization map
			var origName = {};
			if (data.query.normalized) {
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
				var imageinfo = page.imageinfo[0];
				if (title in that.callbacks) {
					console.log('Calling callback for ' + title);
					that.callbacks[title].apply(imageinfo, [imageinfo]);
				} else {
					console.log('No callback for image ' + title);
				}
			});
		}
	});
};

