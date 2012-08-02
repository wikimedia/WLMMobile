(function() {

module( 'monuments.js', {} );

test( 'trimBoundingBox', function() {
	var bb = WLMMobile.monuments.trimBoundingBox( 1.02, 1.02, 1.11, 1.11 ),
		bb2 = WLMMobile.monuments.trimBoundingBox( -5, -5, 5, 5 );
	strictEqual( 1.02, bb[ 0 ], 'untouched' );
	strictEqual( 1.11, bb[ 2 ], 'untouched' );

	strictEqual( bb2[ 0 ], -0.1, 'capped at 0.2 degrees width/height' );
	strictEqual( bb2[ 1 ], -0.1, 'capped at 0.2 degrees width/height' );
	strictEqual( bb2[ 2 ], 0.1, 'capped at 0.2 degrees width/height' );
	strictEqual( bb2[ 3 ], 0.1,  'capped at 0.2 degrees width/height' );
});

}());
