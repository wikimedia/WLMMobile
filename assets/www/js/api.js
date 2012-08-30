/*global define, FileTransfer, FileUploadOptions, console, $*/
/*jslint sloppy: true, white:true, maxerr: 50, indent: 4, plusplus: true, vars:true */
define(['jquery'], function() {
	var TIMEOUT = 15 * 1000; // Default timeout value

	var defaultOptions = {
		onProgressChanged: function() {
		}
	};
	var GUEST_USERNAME = 'GUEST';

	function Api( url, options ) {
		options = options || defaultOptions;

		this.userName = GUEST_USERNAME;
		this.options = options;
		this.options.onProgressChanged = this.options.onProgressChanged || function(){};
		this.url = url;
	}

	Api.prototype.request = function(method, params) {
		// Force JSON
		params.format = 'json';
		this.lastRequest = $.ajax({
			url: this.url,
			data: params,
			dataType: 'json',
			type: method,
			timeout: TIMEOUT
		});
		return this.lastRequest;
	};
	
	Api.prototype.cancel = function() {
		if( this.lastRequest ) {
			console.log( 'cancelling the last request' );
			this.lastRequest.abort();
		}
	};

	Api.prototype.login = function(username, password) {
		var d = $.Deferred();
		var that = this;
		that.request('POST', {
			action: 'login',
			lgname: username,
			lgpassword: password
		}).done(function(data) {
			var token = data.login.token;
			that.request('POST', {
				action: 'login',
				lgname: username,
				lgpassword: password,
				lgtoken: token
			}).done(function(resultData) {
				if( resultData && resultData.login && resultData.login.result === 'Success' ) {
					that.loggedIn = true;
				}
				d.resolve(resultData.login.result);
			}).fail(function(err) {
				d.reject(err);
			});
			that.userName = username;
		}).fail(function(err) {
			d.reject(err);
		});
		return d.promise();
	};

	Api.prototype.logout = function() {
		var d = $.Deferred();
		var that = this;
		that.request( 'POST', {
			action: 'logout'
		} ).done( function( data ) {
			that.loggedIn = false;
			that.userName = GUEST_USERNAME;
			d.resolve( data );
		} ).fail( function( err ) {
			d.reject( err );
		} );
		return d.promise();
	};

	Api.prototype.requestEditToken = function() {
		var d = $.Deferred();
		if( this.token ) {
			d.resolve( this.token );
			return d.promise();
		} 
		var that = this;
		that.request( 'GET',  {
			action: 'query',
			prop: 'info',
			intoken: 'edit',
			// HACK: for Samsung Galaxy S
			titles: 'Bohemian Rhapsody' + Math.random()
		} ).done( function( data ) {
			var token;
			$.each( data.query.pages, function( i, item ) {
				token = item.edittoken;
			} );
			if ( token ) {
				that.token = token;
				d.resolve( token );
			} else {
				d.reject( "No token found" );
			}
		} ).fail( function( err ) {
			d.reject( err );
		} );
		return d.promise();
	};

	Api.prototype.startUpload = function( sourceUri, filename ) {
		var d = $.Deferred();
		var that = this;
		var onprogresschange = that.options.onProgressChanged;
		onprogresschange( 0 );
		that.requestEditToken().done(function(token) {
			console.log( 'got token', token );
			onprogresschange( 10 );
			var options = new FileUploadOptions();
			options.fileKey = 'file';
			options.fileName = filename;
			//options.fileName = filename;
			options.mimeType = "image/jpg";
			options.chunkedMode = false;
			options.params = {
				action: 'upload',
				filename: filename,
				ignorewarnings: 1,
				stash: 1,
				token: token,
				format: 'json'
			};

			var ft = new FileTransfer();
			function uploadSuccess( r ) {
				// success
				console.log("Code = " + r.responseCode);
				console.log("Response = " + r.response);
				console.log("Sent = " + r.bytesSent);
				var data = JSON.parse(r.response);
				if( data.error ) {
					d.reject( data );
				} else if ( data && data.upload && data.upload.result === 'Success' ) {
					d.resolve( data.upload.filekey, token );
				} else {
					d.reject(data);
				}
			}
			that.lastRequest = d.promise();
			that.lastRequest.abort = function() {
				console.log('Aborting upload...');
				ft.abort();
			}
			function uploadFail( error ) {
				console.log("upload error source " + error.source);
				console.log("upload error target " + error.target);
				console.log(JSON.stringify(error));
				if (error.code == FileTransferError.ABORT_ERR ) {
					d.reject("Aborted");
				} else {
					d.reject("HTTP error");
				}
			}
			
			window.resolveLocalFileSystemURI( sourceUri, function( fileEntry ) {
				fileEntry.file( function( file ) {
					ft.onprogress = function( r ) {
						var percentageSent, sent;
						sent = r.loaded || 0;
						percentageSent = sent / file.size * 100;
						onprogresschange( Math.round( percentageSent / 2 ) + 10 );
					};
					ft.upload( sourceUri, that.url, function( r ) {
						uploadSuccess( r );
					}, uploadFail, options );
				} );
			});
		});
		return d.promise();
	};

	Api.prototype.finishUpload = function( fileKey, filename, comment, text, token ) {
		var d = $.Deferred();
		var onprogresschange = this.options.onProgressChanged;
		console.log('upload completing... getting token...');
		var that = this;
		function sendImage( token ) {
			var progress = 70;
			onprogresschange( progress );
			console.log('.... got token');
			var progressTimeout = window.setInterval( function() {
				progress = progress < 100 ? progress + 1 : progress;
				onprogresschange( progress );
			}, 500 );
			console.log('starting ajax upload completion...');
			that.request('POST', {
				action: 'upload',
				filekey: fileKey,
				filename: filename,
				comment: comment,
				text: text,
				token: token,
				ignorewarnings: 1
			}).done(function(data) {
				onprogresschange( 100 );
				window.clearTimeout( progressTimeout );
				console.log(JSON.stringify(data));
				if (data.upload.result === 'Success') {
					d.resolve(data.upload.imageinfo);
				} else {
					d.reject("Upload did not succeed");
				}
			} ).fail( function( xhr ) {
				window.clearTimeout( progressTimeout );
				if ( xhr.statusText === 'abort' ) {
					d.reject( 'Aborted' );
				} else {
					d.reject( 'HTTP error' );
				}
			});
		}
		if( token ) {
			sendImage( token );
		} else {
			this.requestEditToken().done( sendImage );
		}
		return d.promise();
	};

	function ImageFetcher(api, width, height) {
		this.api = api;
		this.titles = [];
		this.deferreds = {};
		this.width = width;
		this.height = height;
	}

	ImageFetcher.prototype.addDeferred = function( title, deferred ) {
		this.deferreds[ title.replace(/ /g, '_') ] = deferred;
	};

	ImageFetcher.prototype.getDeferred = function( title ) {
		return this.deferreds[ title.replace(/ /g, '_') ];
	};

	ImageFetcher.prototype.request = function(filename) {
		var d = $.Deferred();
		var title = 'File:' + filename;
		this.titles.push(title);
		this.addDeferred( title, d );
		return d.promise();
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
		this.api.request('GET', data).done(function(data) {
			if(!data.query) {
				console.log('no return image data');
				return;
			}
			var origName = {};
			if(data.query.normalized) {
				$.each(data.query.normalized, function(i, pair) {
					origName[pair.to] = pair.from;
				});
			}

			$.each(data.query.pages, function(pageId, page) {
				var title = page.title;
				if(origName.title) {
					console.log('Normalizing title');
					title = origName[title];
				}
				var deferred = that.getDeferred( title );
				if(page.imageinfo) {
					var imageinfo = page.imageinfo[0];
					if( deferred ) {
						// Preload the thumbnail image before resolving the deferred.
						// This avoids delays between returning the imageinfo and showing the image.
						var img = new Image(),
							$img = $( img );
						$img.attr( 'src', imageinfo.thumburl ).one( 'load', function() {
							deferred.resolve( imageinfo );
							$img.unbind( 'error' );
						} ).one( 'error', function() {
							// Image failed to load -- such as broken thumbnail or 404.
							deferred.reject();
							$img.unbind( 'load' );
						} );
					} else {
						console.log( 'Failed to locate deferred image with title ' + title );
					}
				} else {
					if( deferred ) {
						// Sorry, no image data available.
						deferred.reject();
					}
				}
			});
		});
	};

	Api.prototype.getImageFetcher = function(width, height) {
		return new ImageFetcher(this, width, height);
	};

	return Api;
});
