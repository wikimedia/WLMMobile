$(document).on('click', 'a.external', function(event) {
	var $a = $(this);
	alert($a.attr('href'));
});

