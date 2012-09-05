test( 'stripWikiText', function() {
	strictEqual( stripWikiText( 'United States' ), 'United States' );
	strictEqual( stripWikiText( '[[District of Columbia]]' ), 'District of Columbia' );
	strictEqual( stripWikiText( '[[San Francisco County, California]]' ), 'San Francisco County' );
	strictEqual( stripWikiText( '[[Blah|Test]]' ), 'Test' );
	strictEqual( stripWikiText( "[[Star of India (ship)|''Star of India'']]" ), 'Star of India' );
	strictEqual( stripWikiText( "[[Star of India (ship)|'''Star of India''']]" ), 'Star of India' );
	strictEqual( stripWikiText( "[[Star of India (ship)|'''''Star of India''''']]" ), 'Star of India' );
} );

test( 'trimUtf8String', function() {
	strictEqual( trimUtf8String( 'Just a string', 20 ), 'Just a string', 'ascii string fits' );
	strictEqual( trimUtf8String( 'Just a string', 10 ), 'Just a str', 'ascii string truncated' );
	strictEqual( trimUtf8String( 'Júst á stríng', 10 ), 'Júst á s', 'latin1 string truncated' );
	strictEqual( trimUtf8String( 'こんにちは', 10 ), 'こんに', 'CJK string truncated' );
	strictEqual( trimUtf8String( '𐌰𐌱𐌲𐌳', 10 ), '𐌰𐌱', 'non-BMP string truncated' );
} );
