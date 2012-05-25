window.geo = function() {

	var shownURLs = [];

	function initMap() {
		if (!geo.map) {
			// Disable webkit 3d CSS transformations for tile positioning
			// Causes lots of flicker in PhoneGap for some reason...
			L.Browser.webkit3d = false;
			geo.map = new L.Map('map');
			//var tiles = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			var tiles = new L.TileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
				maxZoom: 18,
				subdomains: '1234' // for MapQuest tiles
			});
			geo.map.addLayer(tiles);

			geo.map.attributionControl.setPrefix("");
			geo.map.attributionControl.addAttribution('<span class="map-attribution">' + mw.message("attribution-mapquest") + '</span>');
			geo.map.attributionControl.addAttribution("<br /><span class='map-attribution'>" + mw.message("attribution-osm") + '</span>');

			$(".map-attribution a").bind('click', function(event) {
				// Force web links to open in external browser
				// instead of the app, where navigation will be broken.
				chrome.openExternalLink(this.href);
				event.preventDefault();
			});
			geo.markerGroup = new L.LayerGroup();
			geo.map.addLayer(geo.markerGroup);
		}
	}
	
	function clearMarkers() {
		geo.markerGroup.clearLayers();
	}
	
	function addMarker(lat, lon, title, summary, callback) {
		var marker = new L.Marker(new L.LatLng(lat, lon));

		html = "<div><strong>" + title + "</strong><p>" + summary + "</p></div>";
		var popupContent = $(html).click(function() {
			callback();
		})[0];
		marker.bindPopup(popupContent, {closeButton: false});
		geo.markerGroup.addLayer(marker);
	}
	
	return {
		initMap: initMap,
		clearMarkers: clearMarkers,
		addMarker: addMarker,
		map: null,
		markerGroup: null
	};

}();
