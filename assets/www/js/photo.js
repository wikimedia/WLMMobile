/*global define,$,platform */
/*jslint sloppy: true, white:true, maxerr: 50, indent: 4, plusplus: true, vars:true */
define( [ 'jquery' ], function( $ ) {
	// Represents a photograph that was taken by an user at some point and that will be on a 
	// wiki at some point (past or future)
	// Data this needs to encapsulate:
	// FileName on server, local filename, timestamp of taking, timestamp of upload
	// Page content generated, monument data, user who took it
	//
	// Should also handle actual Uploading API, and adding stuff to the database
	//
	// Should add an entry right after it is 'created' (not via constructor)
	// Should be able to mark it as uploaded when it is uploaded
	//
	// Make this generic enough to be reusable across projects
	function Photo( data ) {
		this.data = data;
	}

	Photo.prototype.uploadTo = function( mwApi, comment ) {
		var data = this.data;
		var d = $.Deferred();
		d.notify( 'starting' );
		mwApi.startUpload( data.contentURL, data.fileTitle ).done( function( fileKey, token ) {
			d.notify( 'in-progress' );
			mwApi.finishUpload( fileKey, data.fileTitle, comment, data.fileContent, token ).done( function( imageinfo ) {

				d.resolve( imageinfo );
			} ).fail( function( errorMsg ) {
				d.reject( errorMsg );
			} );

		} ).fail( function( errorMsg ) {
			d.reject( errorMsg );
		} );
		return d;
	};

	return Photo;
} );
