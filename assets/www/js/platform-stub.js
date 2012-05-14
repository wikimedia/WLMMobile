window.platform = {
    geoUrl: function(lat, lon, address) {
        var q = lat + ',' + lon;
        if (address) {
            q += ' ' + address;
        }
        return 'http://maps.google.com/maps?q=' + encodeURIComponent();
    }
};
