/*global window, onDeviceReady, require*/
/*jslint sloppy: true, white:true, maxerr: 50, indent: 4, plusplus: true, vars:true */
// Load Cordova specific stuff here. They all use global variables
var GLOBAL_LIBS = [];
if (window.CORDOVA_MODULE !== undefined) {
	GLOBAL_LIBS.push(window.CORDOVA_MODULE);
}
if (window.PLATFORM_MODULE !== undefined) {
	GLOBAL_LIBS.push(window.PLATFORM_MODULE);
}
GLOBAL_LIBS.push('mediawiki');
if (window.CORDOVA_PLUGINS !== undefined) {
	GLOBAL_LIBS = GLOBAL_LIBS.concat(window.CORDOVA_PLUGINS);
}
require(GLOBAL_LIBS, function() {
	// deviceready event never fires on Android 4
	// perhaps we've already passed it before our async load starts?
	// we'll just assume we're ready by now for now. Sigh. -- bv 2012-06-02
	//document.addEventListener('deviceready', onDeviceReady, false);
	onDeviceReady();
});

function onDeviceReady() {
	require(["jquery", "l10n", 'jquery.localize', 'app'], function($, l10n) {
		l10n.initLanguages();
	});
}
