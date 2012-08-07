define( [ 'jquery' ], function() {

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
			var data = { action: 'adminlevels', format: 'json' }, i;
			if( tree ) {
				for( i = 0; i < tree.length; i++ ) {
					tree[ i ] = encodeURIComponent( tree[ i ] );
				}
				data.admtree = tree.join( '|' );
			}
			var d = $.ajax( {
				url: this.baseUrl,
				dataType: 'json',
				data: data
			} ).pipe( function( data ) {
				var levels = data.admin_levels;
				var adminLevels = [];
				if( levels ) {
					levels.forEach( function( item ) {
						adminLevels.push( new AdminLevel( item.name, tree ) );
					} );
				}
				return adminLevels;
			} );
			return d;
		}
	};

	return AdminTreeApi;
} );
