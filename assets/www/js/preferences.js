/*global define, localStorage*/
/*jslint sloppy: true, white:true, maxerr: 50, indent: 4, plusplus: true, vars:true */
// Preferences singleton, to access all 'preferences'
// localStorage is used for persistance
// Call initializeDefaults before using.

define( [ 'jquery', 'l10n' ], function( $, l10n ) {
	// Defaults for preferences
	// If it is a function, it should take only one param (another function)
	// And when done, should replace itself with the default value
	// And then call the 'success()' parameter
	// If it is not a function, is just used as is
	var defaults = {
		// The locale. Default content language + UI language
		locale: function( success ) {
			var defaults = this;
			l10n.navigatorLang( function( lang ) {
				defaults.locale = l10n.normalizeLanguageCode( lang || 'en' );
				success();
			});
		},
		// UI Language. 
		uiLanguage: function( success ) {
			this.uiLanguage = l10n.normalizeLanguageCode(
				get( 'locale' ).replace( /-.*?$/, '' ) );
			success();
		}
	};
	// Ordering of default initializer functions to call
	var defaultFunctions = [
		'locale',
		'uiLanguage'
	];

	// Filters to be fired when any property is set
	var onSet = [];

	// Serializes default function calls
	function init( success ) {
		var d = $.Deferred();
		var functions = defaultFunctions;
		var curFunction = 0;
		var recallFunction = function() {
			curFunction += 1;
			if( curFunction < functions.length ) {
				// We have more functions to call!
				defaults[ functions[ curFunction ] ].apply( defaults, [ recallFunction ] );
			} else {
				// We are out of functions, let's say we succeeded
				d.resolve();
			}
		};
		defaults[ functions[ 0 ] ].apply( defaults, [ recallFunction ] );
		return d.promise();
	}

	function get( pref ) {
		var stored = localStorage.getItem( pref );
		if( !stored ) {
			return defaults[ pref ];
		}
		return stored;
	}
	function set( pref, value ) {
		localStorage.setItem( pref, value );
		$.each( onSet, function( index, fun ) {
			fun( pref, value );
		});
	}

	function clear( pref ) {
		localStorage.removeItem( pref );
	}

	//add an event executed when set method is executed. They must take two params: the ID of the preference and its value.
	function addOnSet( fun ) {
		onSet.push( fun );
	}

	return {
		init: init,
		get: get,
		set: set,
		clear: clear,
		addOnSet: addOnSet
	};
});
