/*global define, L, mw, $, chrome*/
/*jslint sloppy: true, white:true, maxerr: 50, indent: 4, plusplus: true, vars:true */
define(['jquery', '../leaflet/leaflet-src'], function() {

	var shownURLs = [];

	function initMap() {
		if (!this.map) {
			// Disable webkit 3d CSS transformations for tile positioning
			// Causes lots of flicker in PhoneGap for some reason...
			L.Browser.webkit3d = false;
			this.map = new L.Map('map', {
				touchZoom: true, // force on for Android 3/4
				zoomControl: false // disable in favor of pinch-zoom
			});
			//var tiles = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			var tiles = new L.TileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
				maxZoom: 18,
				subdomains: '1234' // for MapQuest tiles
			});
			this.map.addLayer(tiles);

			this.map.attributionControl.setPrefix("");
			this.map.attributionControl.addAttribution('<span class="map-attribution">' + mw.message("attribution-mapquest") + '</span>');
			this.map.attributionControl.addAttribution("<br /><span class='map-attribution'>" + mw.message("attribution-osm") + '</span>');

			$(".map-attribution a").bind('click', function(event) {
				// Force web links to open in external browser
				// instead of the app, where navigation will be broken.
				// TODO: define chrome
				// chrome.openExternalLink(this.href);
				event.preventDefault();
			});
			this.markerGroup = new L.LayerGroup();
			this.map.addLayer(this.markerGroup);
		}
	}
	
	function clearMarkers() {
		this.markerGroup.clearLayers();
	}
	
	function addMarker(lat, lon, title, summary, callback) {
		console.log('adding marker ' + title);
		var marker = new L.Marker(new L.LatLng(lat, lon));
		var html = "<div><strong>" + title + "</strong><p>" + summary + "</p></div>";
		var popupContent = $(html).click(function() {
			callback();
		})[0];
		marker.bindPopup(popupContent, {closeButton: false});
		this.markerGroup.addLayer(marker);
	}
	
	return {
		initMap: initMap,
		clearMarkers: clearMarkers,
		addMarker: addMarker,
		map: null,
		markerGroup: null
	};

});
