// Force external links to open externally on iOS despite whitelisting :P
$(document).on('click', 'a.external', function(event) {
    var $a = $(this),
        url = $a.attr('href');
    console.log(url);
    window.open(url, "_blank");
    event.preventDefault();
});

$('html').addClass('ios');

platform.geoUrl = function(lat, lon, address) {
    var q = lat + ',' + lon;
    if (address) {
        q += ' ' + address;
    }
    return 'http://maps.google.com/maps?q=' + encodeURIComponent(q);
};
