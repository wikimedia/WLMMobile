define([ 'jquery', 'monument' ], function( $, Monument ) {
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

	MonumentsApi.prototype.filterByNameForCountry = function( country, str ) {
		var d = $.Deferred();
		return this.request( {
			action: 'search',
			srcountry: country,
			srname: '~' + str + '*'
		} );
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
