// Preferences singleton, to access user data
// Stores 
// localStorage is used for persistance
// Call initializeDefaults before using.

define( [ 'jquery' ], function( $ ) {
	var dbName = 'WLM.db';
	var curVersion = '1.0';
	var createScripts = [
		"CREATE TABLE IF NOT EXISTS completed_uploads (id, username, monument, photo, timestamp, completed);"
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

	function addUpload( username, monument, photo, completed ) {
		var timestamp = ( new Date() ).getTime();
		var insertSQL = "INSERT INTO completed_uploads ( username, monument, photo, timestamp, completed ) VALUES ( ?, ?, ?, ?, ? );";
		execute( insertSQL, [ username, JSON.stringify( monument ), JSON.stringify( photo ), timestamp, completed ] );
	}

	function requestUploadsForUser( username, completed ) {
		var querySQL = 'SELECT * FROM completed_uploads WHERE username = ? AND completed = ?';
		return query( querySQL, [ username, completed ] );
	}

	return {
		UPLOAD_COMPLETE: true,
		UPLOAD_INCOMPLETE: false,
		init: init,
		addUpload: addUpload,
		query: query,
		requestUploadsForUser: requestUploadsForUser
	};
});
