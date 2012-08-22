function stripWikiText( str ) {
	str = str.replace( /\[\[[^\|]+\|([^\]]+)\]\]/g, '$1' );
	str = str.replace( /^\[\[(.*),(.*)\]\]$/, '$1' );
	str = str.replace( /\[\[([^\]]+)\]\]/g, '$1' );
	str = str.replace( /\{\{([^\]]+)\}\}/g, '' );
	return str;
}
