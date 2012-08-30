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

	// TODO: make this use a template defined in index.html
	function dateYMD() {
		var now = new Date(),
			year = now.getUTCFullYear(),
			month = now.getUTCMonth() + 1, // 0-based
			day = now.getUTCDate(),
			out = '';

		out += year;

		out += '-';

		if (month < 10) {
			out += '0';
		}
		out += month;

		out += '-';

		if (day < 10) {
			out += '0';
		}
		out += day;

		return out;
	}

	function formatUploadDescription( photo, template, username ) {
		var monument = photo.data.monument, campaignConfig = photo.data.campaignConfig;

		var descData = {
				idField: campaignConfig.idField.replace( '$1', monument.id ),
				license: campaignConfig.defaultOwnWorkLicence, // note the typo in the API field
				username: username,
				autoWikiText: campaignConfig.autoWikiText,
				cats: campaignConfig.defaultCategories.
					concat( campaignConfig.autoCategories ),
				date: dateYMD(),
				monument: monument,
				ua:  navigator.userAgent.match( /Android (.*?)(?=\))/g ),
				appVersion: WLMConfig.VERSION_NUMBER
			};
		return template( { descData: descData } );
	}

	Photo.prototype.uploadTo = function( mwApi, comment, template ) {
		var data = this.data;
		var d = $.Deferred();
		d.notify( 'starting' );
		var fileContent = formatUploadDescription( this, template, mwApi.userName );
		mwApi.startUpload( data.contentURL, data.fileTitle ).done( function( fileKey, token ) {
			d.notify( 'in-progress' );
			mwApi.finishUpload( fileKey, data.fileTitle, comment, fileContent, token ).done( function( imageinfo ) {

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
