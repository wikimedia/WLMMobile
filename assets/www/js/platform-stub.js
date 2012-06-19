/*global window*/
/*jslint sloppy: true, white:true, maxerr: 50, indent: 4, plusplus: true, vars:true */
window.platform = {
	geoUrl: function(lat, lon, address) {
		// Google maps links for web & iOS
		// on iOS these open in native Maps app
		var url = ['http://maps.google.com/maps',
			'?ll=', lat, ',', lon];
		if(address) {
			url.push('&q=' + encodeURIComponent(address));
		}
		return url.join('');
	}
};
