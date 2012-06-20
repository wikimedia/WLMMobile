/*global $, JSON, define, platform*/
/*jslint sloppy: true, white:true, maxerr: 50, indent: 4, plusplus: true, vars:true */
define(['jquery'], function($) {
	function stripWikiText(str) {
		str = str.replace(/\[\[[^\|]+\|([^\]]+)\]\]/g, '$1');
		str = str.replace(/\[\[([^\]]+)\]\]/g, '$1');
		return str;
	}

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
		this.addressLink = platform.geoUrl(this.lat, this.lon, this.address);
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

	Monument.prototype.generateFilename = function() {
		return this.name + " " + (new Date()).getTime();
	};

	function MonumentsApi(url, mwApi) {
		this.url = url;
		this.mwApi = mwApi;
	}

	MonumentsApi.prototype.request = function(params) {
		var that = this;

		// Force JSON
		params.format = 'json';
		return $.ajax({
			url: this.url,
			data: params,
			dataType: 'text',
			type: 'GET',
			dataFilter: function(text) {
				// Pick up only the last line of the response
				// This ignores all the PHP errors and warnings spouted by the API
				// FIXME: Fix the errors and warnings in the server of the API
				console.log(text);
				var split = text.split("\n");
				var data = JSON.parse(split[split.length -1]);
				var monuments = [];
				$.each(data.monuments || [], function(i, monument) {
					monuments.push(new Monument(monument, that.mwApi));
				});
				return monuments;
			}
		});
	};

	MonumentsApi.prototype.getForCountry = function(country) {
		var d = $.Deferred();
		return this.request({
			action: 'search',
			srcountry: country
		});
	};

	MonumentsApi.prototype.filterByNameForCountry = function(country, str) {
		var d = $.Deferred();
		return this.request({
			action: 'search',
			srcountry: country,
			srname: str + '%'
		});
	};

	MonumentsApi.prototype.getInBoundingBox = function(minLon, minLat, maxLon, maxLat) {
		var bboxString = [minLon, minLat, maxLon, maxLat].join(',');
		console.log(bboxString);
		return this.request({
			action:'search',
			bbox: bboxString
		});
	};

	return MonumentsApi;
});
