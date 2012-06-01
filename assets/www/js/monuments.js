define(['jquery'], function($) {
	function stripWikiText(str) {
		str = str.replace(/\[\[[^\|]+\|([^\]]+)\]\]/g, '$1');
		str = str.replace(/\[\[([^\]]+)\]\]/g, '$1');
		return str;
	}

	function MonumentsApi(url, mwApi) {
		this.url = url;
		this.mwApi = mwApi;
	}

	MonumentsApi.prototype.request = function(params) {
		// Force JSON
		params.format = 'json';
		return $.ajax({
			url: this.url,
			data: params,
			dataType: 'text',
			type: 'GET',
			dataFilter: function(data) {
				// Pick up only the last line of the response
				// This ignores all the PHP errors and warnings spouted by the API
				// FIXME: Fix the errors and warnings in the server of the API
				var split = data.split("\n");
				return JSON.parse(split[split.length -1]);
			}
		});
	};

	MonumentsApi.prototype.getForCountry = function(country) {
		var d = $.Deferred();
		this.request({
			action: 'search',
			srcountry: country
		}).done(function(data) {
			var monuments = [];
			var that = this;
			console.log(JSON.stringify(data));
			$.each(data['monuments'], function(i, monument) {
				monuments.push(new Monument(monument, that.mwApi));
			});
			d.resolve(monuments);
		}).fail(function() {
			d.reject.apply(d, args);
		});
		return d.promise();
	};

	function Monument(data, mwApi) {
		// Sanitize and transform data to be cleaner and more useful
		var stripFields = ['name', 'address'];
		var floatFields = ['lat', 'lon'];
		var that = this;
		$.each(data, function(key, value) {
			if($.inArray(key, stripFields) !== -1) {
				that[key] = stripWikiText(value);
			} else if($.inArray(key, floatFields) !== -1) {
				that[key] = parseFloat(value);
			} else {
				that[key] = value;
			}
		});
		this.mwApi = mwApi;
	}

	Monument.prototype.requestThumbnail = function(imageFetcher) {
		var d = $.Deferred();
		imageFetcher.request(this.image).done(function(imageinfo) {
			d.resolve(imageinfo);
		}).fail(function(err) {
			d.reject.apply(d, arguments);
		});
		return d.promise();
	};

	return MonumentsApi;
});
