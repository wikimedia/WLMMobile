define( [ 'jquery' ], function() {
	var cache = {};

	function translateCode( code ) {
		// TODO: i18n complete translations of code
		var name = code;
		if( CAMPAIGNS[ code ] ) {
			name = CAMPAIGNS[ code ].desc;
		}
		return name;
	}

	function AdminLevel( code, parents ) {
		this.code = code;
		this.name = translateCode( code );
		this.parents = parents;
	}

	function AdminTreeApi( base ) {
		this.baseUrl = base;
	}

	AdminTreeApi.prototype = {
		getLeaves: function( tree ) {
			var data = { action: 'adminlevels', format: 'json' }, i, admtree = [],
				cacheKey = 'root', d = new $.Deferred();
			if( tree ) {
				for( i = 0; i < tree.length; i++ ) {
					admtree.push( encodeURIComponent( tree[ i ] ) );
				}
				admtree = admtree.join( '|' );
				cacheKey = admtree;
				data.admtree = admtree;
			}
			if ( cache[ cacheKey ] ) {
				d.resolve( cache[ cacheKey ] );
			} else {
				d = $.ajax( {
					url: this.baseUrl,
					dataType: 'json',
					data: data
				} ).pipe( function( data ) {
					var levels = data.admin_levels;
					var adminLevels = [];
					if ( levels ) {
						levels.forEach( function( item ) {
							adminLevels.push( new AdminLevel( item.name, tree ) );
						} );
					}
					cache[ cacheKey ] = adminLevels;
					return adminLevels;
				} );
			}
			return d;
		}
	};

	return AdminTreeApi;
} );
