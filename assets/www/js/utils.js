function stripWikiText( str ) {
	str = str.replace( /\[\[[^\|]+\|([^\]]+)\]\]/g, '$1' );
	str = str.replace( /^\[\[(.*),(.*)\]\]$/, '$1' );
	str = str.replace( /\[\[([^\]]+)\]\]/g, '$1' );
	str = str.replace( /\{\{([^\]]+)\}\}/g, '' );
	str = str.replace( /'''(.*?)'''/g, '$1' );
	str = str.replace( /''(.*?)''/g, '$1' );
	return str;
}

function trimUtf8String( str, allowedLength ) {
	// Count UTF-8 bytes to see where we need to crop long names.
	var bytes = 0, chars = 0;
	var codeUnit, len;

	for ( var i = 0; i < str.length; i++ ) {
		// JavaScript strings are UTF-16.
		codeUnit = str.charCodeAt( i );

		// http://en.wikipedia.org/wiki/UTF-8#Description
		if ( codeUnit < 0x80 ) {
			len = 1;
		} else if ( codeUnit < 0x800 ) {
			len = 2;
		} else if ( codeUnit >= 0xd800 && codeUnit < 0xe000 ) {
			// http://en.wikipedia.org/wiki/UTF-16#Description
			// Code point is one half of a surrogate pair.
			// This and its partner combine to form a single 4 byte character in UTF-8.
			len = 4;
		} else {
			len = 3;
		}
		if ( bytes + len <= allowedLength ) {
			bytes += len;
			chars++;
			if ( len == 4 ) {
				// Skip over second half of surrogate pair as a unit.
				chars++;
				i++;
			}
		} else {
			// Ran out of bytes.
			return str.substr( 0, chars );
		}
	}

	// We fit!
	return str;
}
