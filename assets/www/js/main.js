function onBodyLoad() {
	// Load Cordova specific stuff here. They all use global variables
	var GLOBAL_LIBS = [
		CORDOVA_MODULE,
		PLATFORM_MODULE,
		'mediawiki'
	].concat(CORDOVA_PLUGINS);
	require(GLOBAL_LIBS, function() {
		document.addEventListener('deviceready', onDeviceReady, false);
	});
}

function onDeviceReady() {
	require(["jquery", "l10n", 'jquery.localize', 'app'], function($, l10n) {
		l10n.initLanguages();
	});
}
