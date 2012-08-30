$('html').addClass('android');

// Android opens a.external externally automatically.

platform.geoUrl = function(lat, lon, address) {
	var hasLonLat = typeof lat !== 'undefined' && typeof lon !== 'undefined',
		q = 'geo: ?q=carmen san diego', // should never happen
		add = address ? encodeURIComponent( address ) : '';
	if ( hasLonLat && address ) {
		latlng = lat + ',' + lon;
		q = 'geo:' + latlng + '?q=' + latlng + ' (' + add + ')';
	} else if ( address ) {
		q = 'geo:0,0?q=' + add; // TODO
    }
console.log( q );
    return q;
}

platform.navigatorLang = function(success) {
	var lang = navigator.language;

	var glob = new Globalization;
	glob.getLocaleName(function(result) {
		lang = result.value.toLowerCase().replace('_', '-');
		//console.log('globalization gave: ' + lang);
		success(lang);
	}, function(err) {
		//console.log('globalization error: ' + err);
		success(null);
	});
}
