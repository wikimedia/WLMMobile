$('html').addClass('android');

// Android opens a.external externally automatically.

platform.geoUrl = function(lat, lon, address) {
    var q = 'geo:' + lat + ',' + lon;
    if (address) {
        q += '?q=' + encodeURIComponent(address);
    }
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
