window.platform = {
    geoUrl: function(lat, lon, address) {
    	// Google maps links for web & iOS
    	// on iOS these open in native Maps app
        var url = 'http://maps.google.com/maps';
        url += '?ll=' + lat + ',' + lon;
        if (address) {
        	url += '&q=' + encodeURIComponent(address);
        }
        return url;
    }
};
