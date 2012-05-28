var PinchZoom = function() {
};

PinchZoom.prototype.addEventListener = function(eventName, callback) {
	return cordova.exec(callback, null, 'PinchZoom', 'start', []);
}

PinchZoom.prototype.removeEventListener = function(eventName, callback) {
	// vague and not exact :)
	return cordova.exec(callback, null, 'PinchZoom', 'stop', []);
}

cordova.addConstructor(function() {
	cordova.addPlugin("pinchZoom", new PinchZoom());
});
