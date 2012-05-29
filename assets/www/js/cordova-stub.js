(function() {
	var cordova = 'cordova-1.7.0rc1',
		os = false;

	if (navigator.userAgent.match(/Android/)) {
		os = 'android';
	} else if (navigator.userAgent.match(/iPhone|iPad|iPod Touch/)) {
		os = 'ios';
	}
	
	if (!os) {
		// Assume in a browser for testing. PhoneGap-specific things will fail.
		//alert('Unrecognized OS');
		window.addEventListener('load', function() {
			//$(document).trigger('deviceready');
			onDeviceReady();
		});
	} else {
		window.CORDOVA_MODULE = '../' + os + '/' + cordova;
		window.PLATFORM_MODULE = '../' + os + '/platform';
	}
	if (os == 'android') {
		window.CORDOVA_PLUGINS = ['../android/plugins/PinchZoom'];
	}
})();
