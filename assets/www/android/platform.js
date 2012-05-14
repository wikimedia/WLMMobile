$('html').addClass('android');

// Android opens a.external externally automatically.

platform.geoUrl = function(lat, lon, address) {
    var q = 'geo:' + lat + ',' + lon;
    if (address) {
        q += '?q=' + encodeURIComponent(address);
    }
    return q;
}
