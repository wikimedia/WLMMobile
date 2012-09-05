(function() {

module( 'monuments.js', {} );

test( 'trimBoundingBox', function() {
	var bb = WLMMobile.monuments.trimBoundingBox( 1.02, 1.02, 1.11, 1.11 ),
		bb2 = WLMMobile.monuments.trimBoundingBox( -5, -5, 5, 5 );
	strictEqual( '1.020', bb[ 0 ], 'untouched' );
	strictEqual( '1.110', bb[ 2 ], 'untouched' );

	strictEqual( bb2[ 0 ], '-0.100', 'capped at 0.2 degrees width/height' );
	strictEqual( bb2[ 1 ], '-0.100', 'capped at 0.2 degrees width/height' );
	strictEqual( bb2[ 2 ], '0.100', 'capped at 0.2 degrees width/height' );
	strictEqual( bb2[ 3 ], '0.100',  'capped at 0.2 degrees width/height' );
});

test( 'getForAdminLevel', function() {
	WLMMobile.monuments.getForAdminLevel( [ 'US', 'US-CA', 'San Francisco' ]).done( function( data ) {
		strictEqual( data[ 0 ].name, 'Golden Gate Bridge' );
	} );
} );

}());
