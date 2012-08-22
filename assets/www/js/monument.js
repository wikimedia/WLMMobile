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
		var name = this.name.replace( String.fromCharCode(27), '-' );
		var d = date || new Date();
		var months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec' ];
		var suffix =  d.getDate() + months[ d.getMonth() ] + d.getFullYear() + ' ' + d.getHours() + 'hrs' + d.getMinutes() + 'mins' + d.getSeconds() + 'secs';
		return name.replace( /[\x7f\.\[#<>\[\]\|\{\}]/g, '-' ) + ' (taken on ' + suffix + ').jpg';
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
