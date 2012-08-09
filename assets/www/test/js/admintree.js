(function() {

module( 'admintree.js', {} );

test( 'getLeaves', function() {
	var tree = [ 'US', 'US-CA', 'Los Angeles County, California' ];
	WLMMobile.admintree.getLeaves( tree ).done( function( data ) {
		strictEqual( 'ok', data[ 0 ].name, 'the expected ajax request was created and data returned' );
	} );
});

}());
