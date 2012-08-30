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
		var promise = execute( insertSQL, [ username, JSON.stringify( monument ), JSON.stringify( photo ), timestamp, completed ] );
		this.dirty = Date.now();
		return promise;
	}
	
	function deleteUpload( photo ) {
		var deleteSQL = "DELETE FROM completed_uploads WHERE photo=?;";
		var promise = execute( deleteSQL, [ JSON.stringify( photo ) ] );
		this.dirty = Date.now();
		return promise;
	}

	function completeUpload( photo ) {
		var updateSQL = "UPDATE completed_uploads SET completed=? WHERE photo=?;";
		var promise = execute( updateSQL, [ true, JSON.stringify( photo ) ] );
		this.dirty = Date.now();
		return promise;
	}

	function requestUploads( completed ) {
		var querySQL = 'SELECT * FROM completed_uploads WHERE completed = ? ORDER BY timestamp DESC';
		return query( querySQL, [ completed ] );
	}

	return {
		UPLOAD_COMPLETE: true,
		UPLOAD_INCOMPLETE: false,
		dirty: Date.now(),
		init: init,
		addUpload: addUpload,
		deleteUpload: deleteUpload,
		completeUpload: completeUpload,
		query: query,
		requestUploads: requestUploads
	};
});
