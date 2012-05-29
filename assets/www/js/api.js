define(['jquery'], function() {
	function Api(url) {
		this.url = url;
	}

	Api.prototype.request = function(method, params) {
		// Force JSON
		params.format = 'json';
		return $.ajax({
			url: this.url,
			data: params,
			dataType: 'json',
			type: method
		});
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
				d.resolve(resultData.login.result);
			}).fail(function(err) {
				d.reject(err);
			});
		}).fail(function(err) {
			d.reject(err);
		});
		return d.promise();
	};

	Api.prototype.requestEditToken = function() {
		var d = $.Deferred();
		if(this.token) {
			d.resolve(this.token);
			return d.promise();
		} 
		var that = this;
		that.request('GET',  {
			action: 'query',
			prop: 'info',
			intoken: 'edit',
			titles: 'Bohemian Rhapsody'
		}).done(function(data) {
			var token;
			$.each(data.query.pages, function(i, item) {
				token = item.edittoken;
			});
			if (token) {
				that.token = token;
				d.resolve(token);
			} else {
				d.reject("No token found");
			}
		}).fail(function(err) {
			d.reject(err);
		});
		return d.promise();
	};

	Api.prototype.startUpload = function(sourceUri, filename, comment, text) {
		var d = $.Deferred();
		var that = this;
		that.requestEditToken().done(function(token) {
			var options = new FileUploadOptions();
			options.fileKey = 'file';
			options.fileName = sourceUri.substr(sourceUri.lastIndexOf('/')+1);
			//options.fileName = filename;
			options.mimeType = "image/jpg";
			options.chunkedMode = false;
			options.params = {
				action: 'upload',
				filename: filename,
				comment: comment,
				text: text,
				ignorewarnings: 1,
				stash: 1,
				token: token,
				format: 'json'
			};

			var ft = new FileTransfer();
			ft.upload(sourceUri, that.url, function(r) {
				// success
				console.log("Code = " + r.responseCode);
				console.log("Response = " + r.response);
				console.log("Sent = " + r.bytesSent);
				var data = JSON.parse(r.response);
				if (data.upload.result == 'Success') {
					d.resolve(data.upload.filekey);
				} else {
					d.reject(data);
				}
			}, function(error) {
				console.log("upload error source " + error.source);
				console.log("upload error target " + error.target);
				console.log(JSON.stringify(error));
				d.reject("HTTP error");
			}, options);
		});
		return d.promise();
	};

	Api.prototype.finishUpload = function(fileKey, filename, comment, text) {
		var d = $.Deferred();
		console.log('upload completing... getting token...');
		var that = this;
		this.requestEditToken().done(function(token) {
			console.log('.... got token');
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
				console.log(JSON.stringify(data));
				if (data.upload.result == 'Success') {
					d.resolve(data.upload.imageinfo);
				} else {
					d.reject("Upload did not succeed");
				}
			}).fail(function(xhr, err) {
				console.log("upload error source " + error.source);
				console.log("upload error target " + error.target);
				d.reject("HTTP error");
			});
		});
		return d.promise();
	};

	Api.prototype.getImageFetcher = function(width, height) {
		return new ImageFetcher(this, width, height);
	};

	function ImageFetcher(api, width, height) {
		this.api = api;
		this.titles = [];
		this.deferreds = {};
		this.width = width;
		this.height = height;
	}

	ImageFetcher.prototype.request = function(filename) {
		var d = $.Deferred();
		var title = 'File:' + filename;
		this.titles.push(title);
		this.deferreds[title] = d;
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
					that.deferreds[title].resolve(imageinfo);
				}
			});
		});
	};

	return Api;
});
