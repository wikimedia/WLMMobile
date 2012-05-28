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
			d.resolve(token);
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

	return Api;
});
