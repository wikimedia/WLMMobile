/*global define,$,platform */
/*jslint sloppy: true, white:true, maxerr: 50, indent: 4, plusplus: true, vars:true */
define( [ 'jquery', 'utils' ], function() {
	function Monument( data, mwApi ) {
		// Sanitize and transform data to be cleaner and more useful
		var stripFields = [ 'name', 'address' ];
		var floatFields = [ 'lat', 'lon' ];
		var that = this;
		$.each(data, function( key, value ) {
			if( $.inArray( key, stripFields ) !== -1 ) {
				that[ key ] = stripWikiText( value );
			} else if( $.inArray( key, floatFields ) !== -1 ) {
				that[ key ] = parseFloat( value );
			} else {
				that[ key ] = value;
			}
		});
		this.addressLink = platform.geoUrl( this.lat, this.lon, this.address );
		this.articleLink = this.processArticleLink();
		this.mwApi = mwApi;
	}

	Monument.prototype.requestThumbnail = function( imageFetcher ) {
		var d = $.Deferred();
		if( this.image ) {
			imageFetcher.request( this.image ).done( function( imageinfo ) {
				d.resolve( imageinfo );
			} ).fail( function( err ) {
				d.reject.apply( d, arguments );
			} );
		}
		return d.promise();
	};

	Monument.prototype.generateFilename = function( date ) {
		var maxLength = 240; // 240 bytes maximum enforced by MediaWiki
		maxLength = maxLength / 2 - '/1024px-'.length; // halve space due to current bugs with Swift causing thumbnails to fail

		var name = this.name.replace( String.fromCharCode(27), '-' );
		name = name.replace( /[\x7f\.\[#<>\[\]\|\{\}/:]/g, '-' );

		var d = date || new Date();
		function pad(str, len) {
			if ( typeof str != 'string' ) {
				str = str + '';
			}
			while ( str.length < len ) {
				str = '0' + str;
			}
			return str;
		}
		var suffix = ' ' +
			pad( d.getDate(), 2 ) +
			'-' +
			pad( d.getMonth(), 2 ) +
			'-' +
			pad( d.getFullYear(), 4 ) +
			' ' +
			pad( d.getHours(), 2 ) +
			'-' +
			pad( d.getMinutes(), 2 ) +
			'-' +
			pad( d.getSeconds(), 2 ) +
			'.jpg';

		var allowedLength = maxLength - suffix.length;

		// Count UTF-8 bytes to see where we need to crop long names.
		var bytes = 0, chars = 0;
		for ( var i = 0; i < name.length; i++ ) {
			// JavaScript strings are UTF-16.
			var codeUnit = name.charCodeAt( i );
			var len;

			// http://en.wikipedia.org/wiki/UTF-8#Description
			if ( codeUnit < 0x80 ) {
				len = 1;
			} else if ( codeUnit < 0x800 ) {
				len = 2;
			} else if ( codeUnit >= 0xd800 && codePoint < 0xe000 ) {
				// http://en.wikipedia.org/wiki/UTF-16#Description
				// Code point is one half of a surrogate pair.
				// This and its partner combine to form a single 4 byte character in UTF-8.
				len = 4;
				i++;
			} else {
				len = 3;
			}
			if ( bytes + len < allowedLength ) {
				bytes += len;
				chars++;
				if ( len == 4 ) {
					// Skip over second half of surrogate pair as a unit.
					chars++;
					i++;
				}
			} else {
				break;
			}
		}

		var base = name.substr( 0, chars );
		return base + suffix;
	};

	Monument.prototype.processArticleLink = function() {
		if ( this.monument_article ) {
			return 'https://' + this.lang + '.wikipedia.org/wiki/' + encodeURIComponent( this.monument_article );
		} else {
			return null;
		}
	}

	return Monument;
} );
