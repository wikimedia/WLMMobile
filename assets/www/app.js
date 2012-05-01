

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

	/* When this function is called, Cordova has been initialized and is ready to roll */
	/* If you are supporting your own protocol, the var invokeString will contain any arguments to the app launch.
	see http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html
	for more details -jm */
	function onDeviceReady()
	{
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
					alert('logged in');
				} else {
					alert('not logged in');
				}
			});
		});
		$('#takephoto').click(function() {
			navigator.camera.getPicture(function(data) {
				// success
				//alert('success: ' + data);
				doUpload(data);
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
				//alert('success: ' + data);
				doUpload(data);
			}, function(msg) {
				// error
				alert('fail: ' + msg);
			}, {
				// options
				destinationType: Camera.DestinationType.FILE_URI,
				sourceType: Camera.PictureSourceType.PHOTOLIBRARY
			});
		});
	}
	
	function doUpload(sourceUri) {
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
				console.log(JSON.stringify(data));
				$.each(data.query.pages, function(i, item) {
					token = item.edittoken;
				});
				console.log('token is ' + token);
				
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
					token: token,
					format: 'json'
				};
				
				var ft = new FileTransfer();
				ft.upload(sourceUri, api, function(r) {
					// success
					alert('success');
					console.log("Code = " + r.responseCode);
					console.log("Response = " + r.response);
					console.log("Sent = " + r.bytesSent);
				}, function(error) {
					alert("An error has occurred: Code = " + error.code);
					console.log("upload error source " + error.source);
					console.log("upload error target " + error.target);
				}, options);
			}
		});
	}
    

