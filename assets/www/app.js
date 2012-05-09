

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
var wlmapi = 'http://toolserver.org/~erfgoed/api/api.php';
var state = {
	fileUri: null,
	fileKey: null,
	fileSize: null,
	title: null
};


/* When this function is called, Cordova has been initialized and is ready to roll */
/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app launch.
see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
for more details -jm */
function onDeviceReady()
{
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
		/*
		 This gives... nothing so far
		navigator.geolocation.getCurrentPosition(function(pos) {
			alert(pos.coords.latitude + ', ' +
				pos.coords.longitude);
			$.ajax({
				url: wlmapi,
				data: {
					'action': 'search',
					'srlat': pos.coords.latitude,
					'srlon': pos.coords.longitude,
					'format': 'json',
				},
				success: function(data) {
					
				}
			});
		}, function(err) {
			alert('Error in geolocation');
		});
		*/

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

