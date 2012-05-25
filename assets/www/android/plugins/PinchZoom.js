var PinchZoom = function() {
};

PinchZoom.prototype.addEventListener = function(eventName, callback) {
	console.log('hello');
	return PhoneGap.exec(callback, null, 'PinchZoom', 'start', []);
}

PinchZoom.prototype.removeEventListener = function(eventName, callback) {
	// vague and not exact :)
	return PhoneGap.exec(callback, null, 'PinchZoom', 'stop', []);
}


PhoneGap.addConstructor(function() {
	PhoneGap.addPlugin("pinchZoom", new PinchZoom());
});

