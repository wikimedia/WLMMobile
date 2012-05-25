(function() {
	var cordova = 'cordova-1.7.0rc1.js',
		os = false;

	if (navigator.userAgent.match(/Android/)) {
		os = 'android';
	} else if (navigator.userAgent.match(/iPhone|iPad|iPod Touch/)) {
		os = 'ios';
	}
	
	if (!os) {
		// Assume in a browser for testing. PhoneGap-specific things will fail.
		//alert('Unrecognized OS');
		$(window).bind('load', function() {
			//$(document).trigger('deviceready');
			onDeviceReady();
		});
	} else {
		document.writeln('<script type="text/javascript" charset="utf-8" src="' + os + '/' + cordova + '"></script>');
		document.writeln('<script type="text/javascript" charset="utf-8" src="' + os + '/platform.js"></script>');
	}
	
	if (os == 'android') {
		document.writeln('<script type="text/javascript" charset="utf-8" src="' + os + '/plugins/PinchZoom.js"></script>');
	}

})();
