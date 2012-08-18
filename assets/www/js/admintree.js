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

	function AdminLevel( code, translated, parents ) {
		this.code = code;
		if ( translated !== undefined ) {
			this.name = translated;
		} else {
			this.name = translateCode( code );
		}
		this.parents = parents;
	}

	function AdminTreeApi( base ) {
		this.baseUrl = base;
	}

	AdminTreeApi.prototype = {
		getLeaves: function( tree, lang ) {
			var data = { action: 'adminlevels', format: 'json', uselang: lang }, i, admtree = [],
				cacheKey = 'root', d = new $.Deferred();
			if( tree ) {
				for( i = 0; i < tree.length; i++ ) {
					admtree.push( tree[ i ] );
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
							adminLevels.push( new AdminLevel( item.name, item.translated, tree ) );
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
