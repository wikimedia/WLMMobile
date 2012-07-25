/*global define,$,platform */
/*jslint sloppy: true, white:true, maxerr: 50, indent: 4, plusplus: true, vars:true */
define( [ 'jquery' ], function() {
	function stripWikiText(str) {
		str = str.replace( /\[\[[^\|]+\|([^\]]+)\]\]/g, '$1' );
		str = str.replace( /\[\[([^\]]+)\]\]/g, '$1' );
		str = str.replace( /\{\{([^\]]+)\}\}/g, '' );
		return str;
	}

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

	Monument.prototype.generateFilename = function() {
		var name = this.name.replace( String.fromCharCode(27), '-' );
		return name.replace( /[\x7f\.\[#<>\[\]\|\{\}]/g, '-' ) + " " + ( new Date() ).getTime();
	};

	return Monument;
} );
