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
	return Api;
});
