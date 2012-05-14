// Force external links to open externally on iOS despite whitelisting :P
$(document).on('click', 'a.external', function(event) {
    var $a = $(this),
        url = $a.attr('href');
    console.log(url);
    window.open(url, "_blank");
    event.preventDefault();
});

$('html').addClass('ios');

// inherit default platform.geoUrl

