// Preferences singleton, to access user data
// Stores 
// localStorage is used for persistance
// Call initializeDefaults before using.

define( [ 'jquery' ], function( $ ) {
	var dbName = 'WLM.db';
	var curVersion = '1.0';
	var createScripts = [
		"CREATE TABLE IF NOT EXISTS uploads (id, username, file, monument, url, timestamp, completed);"
	];
	var db = null;	
	function init() {
		var d = $.Deferred();
		db = openDatabase( 
			dbName,
			curVersion,
			'Wiki Loves Monuments persistent data',
			4 * 1024 * 1024 // Random guess
		);
		db.transaction( function( tx ) {
			tx.executeSql( createScripts.join( '' ) );
			d.resolve();
		});

		return d.promise();	
	}

	function query( sql, values ) {
		var d = $.Deferred();
		values = values || [];
		db.transaction( function( db ) {
			db.executeSql( sql, values, function( tx, results ) {
				var data = [];
				for( var i = 0; i < results.rows.length; i++ ) {
					data.push( results.rows.item( i ) );
				}
				d.resolve( data );
			});
		});
		return d.promise();
	}

	function execute( sql, values ) {
		var d = $.Deferred();
		db.transaction( function( db ) {
			db.executeSql( sql, values, function( tx, results ) {
				d.resolve( results );
			});
		});
		return d.promise();
	}

	function addUpload( monument, username, fileUrl, url, completed ) {
		var insertSQL = "INSERT INTO uploads ( username, file, monument, url, timestamp, completed ) VALUES ( ?, ?, ?, ?, ?, ? );";
		execute( insertSQL, [ username, fileUrl, JSON.stringify( monument ), url, (new Date()).getTime() , completed ] );
	}

	function requestUploadsForUser( username ) {
		var querySQL = 'SELECT * FROM uploads WHERE username = ?';
		return query( querySQL, [ username ] );
	}

	return {
		init: init,
		addUpload: addUpload,
		query: query,
		requestUploadsForUser: requestUploadsForUser
	};
});
