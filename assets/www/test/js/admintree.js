(function() {

module( 'admintree.js', {} );

test( 'getLeaves', function() {
	var tree = [ 'US', 'US-CA', 'Los Angeles County, California' ];
	WLMMobile.admintree.getLeaves( tree ).done( function( data ) {
		strictEqual( 'ok', data[ 0 ].name, 'the expected ajax request was created and data returned' );
	} );
});

test( 'stripName', function() {
	var strip = WLMMobile.admintree.stripName;
	strictEqual( strip( 'United States'), 'United States' );
	strictEqual( strip( '[[District of Columbia]]'), 'District of Columbia' );
	strictEqual( strip( '[[San Francisco County, California]]'), 'San Francisco County' );
	strictEqual( strip( '[[Blah|Test]]'), 'Test' );
});

}());
