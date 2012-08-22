test( 'stripWikiText', function() {
	strictEqual( stripWikiText( 'United States' ), 'United States' );
	strictEqual( stripWikiText( '[[District of Columbia]]' ), 'District of Columbia' );
	strictEqual( stripWikiText( '[[San Francisco County, California]]' ), 'San Francisco County' );
	strictEqual( stripWikiText( '[[Blah|Test]]' ), 'Test' );
} );
