(function() {
	var cordova = 'cordova-1.8.1',
		os = false,
		ua = navigator.userAgent,
		detectorClasses = [];

	if( ua.match( /Android/ ) ) {
		os = 'android';
	} else if ( ua.match(/iPhone|iPad|iPod Touch/ ) ) {
		os = 'ios';
	}
	
	if( os === 'android' ) {
		detectorClasses.push( 'android' );
		if( ua.match( /Android 2/ ) ) {
			detectorClasses.push( 'android-2' );
		} else if( ua.match( /Android 3/ ) ) {
			detectorClasses.push( 'android-3' );
		} else if( ua.match( /Android 4/ ) ) {
			detectorClasses.push( 'android-4' );
		}
	}

	// FIXME: There ought to be a better way to get root element, but I'm jQuery spoilt
	document.getElementsByTagName('html')[0].className += ' ' + detectorClasses.join( ' ' );

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
})();
