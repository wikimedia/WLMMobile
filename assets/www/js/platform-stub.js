/*global window*/
/*jslint sloppy: true, white:true, maxerr: 50, indent: 4, plusplus: true, vars:true */
window.platform = {
	geoUrl: function(lat, lon, address) {
		// Google maps links for web & iOS
		// on iOS these open in native Maps app
		var hasLonLat = typeof lat !== 'undefined' && typeof lon !== 'undefined',
			add = address ? encodeURIComponent( address ) : '',
			url = [ 'http://maps.google.com/maps?q=' ];
		if ( hasLonLat && address ) {
			url = url.concat( [ lat, ',', lon ] );
			url.push( '%20(' + add + ')' );
		} else if ( address ) {
			url.push( add );
		}
		return url.join('');
	}
};
