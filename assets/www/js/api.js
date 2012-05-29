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
		return d;
	};

	Api.prototype.requestEditToken = function() {
		var d = $.Deferred();
		if(this.token) {
			d.resolve(this.token);
			return d;
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
		return d;
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
		return d;
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
		return d;
	};

	return Api;
});
