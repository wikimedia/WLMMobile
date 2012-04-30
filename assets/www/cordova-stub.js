(function() {
	var cordova = 'cordova-1.7.0rc1.js',
		os = false;

	if (navigator.userAgent.match(/Android/)) {
		os = 'android';
	} else if (navigator.userAgent.match(/iOS/)) {
		os = 'ios';
	}
	
	if (!os) {
		alert('Unrecognized OS');
	} else {
		document.writeln('<script type="text/javascript" charset="utf-8" src="' + os + '/' + cordova + '"></script>');
	}

})();