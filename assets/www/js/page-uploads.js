/*global define, FileTransfer, FileUploadOptions, console, WLMConfig, Image, mw, $ */
/*jslint sloppy: true, white:true, maxerr: 50, indent: 4, plusplus: true, vars:true */
define( [ 'jquery' ], function() {
	var api, db, templates, commonsApi, showMonumentDetail, showPage, translateAdminLevels,
		app,
		doLogin, uploadErrorHandler,
		uploadsRendered = 0, // For display caching: compare vs db.dirty
		incompleteUploadsRendered = 0,
		Monument, Photo,
		thumbSize = WLMConfig.THUMB_SIZE;

	// Expects user to be logged in
	function showUploads() {
		if ( uploadsRendered > db.dirty ) {
			// we've already rendered the current display
			return;
		}
		uploadsRendered = Date.now();

		var username = api.userName,
			$list = $( '#uploads-page .monuments-list' );
		db.requestUploads( db.UPLOAD_COMPLETE ).done( function( uploads ) {
			$list.empty();
			if( uploads.length ) {
				var thumbFetcher = api.getImageFetcher( thumbSize, thumbSize ); // important: use same API we upload to!
				var uploadsTemplate = templates.getTemplate( 'upload-list-item-template' );
				var uploadCompleteTemplate = templates.getTemplate( 'upload-completed-item-detail-template' );
				$.each( uploads, function( i, upload ) {
					var monument = new Monument( JSON.parse( upload.monument ), api );
					var photo = JSON.parse( upload.photo );
					var $uploadItem = $( uploadsTemplate( { upload: upload, monument: monument, photo: photo } ) );

					photo.data.fileUrl = WLMConfig.WIKI_BASE + 'File:' + encodeURIComponent( photo.data.fileTitle );
					$uploadItem.find( 'a' ).click( function() {
						$( '#completed-upload-detail' ).html( uploadCompleteTemplate( { upload: upload, monument: monument, photo: photo } ) );
						$( '#completed-upload-detail .monumentLink' ).
							data( 'monument', new Monument( monument, commonsApi ) ).
							click( function() {
								showMonumentDetail( $( this ).data( 'monument' ) );
							} ).localize();
						showPage( 'completed-upload-detail-page' );
					} );

					// Note that items uploaded before addition of the '.jpg' extension will fail here.
					var $thumb = $uploadItem.find( 'img.monument-thumbnail' );
					thumbFetcher.request( photo.data.fileTitle ).done( function( imageinfo ) {
						$thumb.attr( 'src', imageinfo.thumburl );
					} ).fail( function() {
						$thumb.attr( 'src', 'images/placeholder-thumb.png' );
					} );
					$list.append( $uploadItem );
					translateAdminLevels( $uploadItem, monument );
				} );
				thumbFetcher.send();
			} else {
				var emptyUploadTemplate = templates.getTemplate( 'upload-list-empty-template' );
				$list.html( emptyUploadTemplate() ).localize();
			}
		} );
	}

	function showIncompleteUploads() {
		if ( incompleteUploadsRendered > db.dirty ) {
			// we've already rendered the current display
			return;
		}
		incompleteUploadsRendered = Date.now();

		var username = api.userName,
			$list = $( '#incomplete-uploads-page .monuments-list' );
		db.requestUploads( db.UPLOAD_INCOMPLETE ).done( function( uploads ) {
			$list.empty();
			var $buttons = $( '#delete-all, #upload-all' );
			$buttons.attr( 'disabled', 'disabled' );

			if( uploads.length ) {
				$( '#select-all' ).removeAttr( 'disabled' );
				var uploadsTemplate = templates.getTemplate( 'upload-incomplete-list-item-template' );
				var uploadIncompleteTemplate = templates.getTemplate( 'upload-incomplete-item-detail-template' );
				var thumbQueue = [];
				$.each( uploads, function( i, upload ) {
					var monument = JSON.parse( upload.monument );
					var photo = JSON.parse( upload.photo );
					var $uploadItem = $( uploadsTemplate( { upload: upload, monument: monument, photo: photo } ) );

					$uploadItem.find( 'input[type=checkbox]' )
						.data( 'monument', monument )
						.data( 'photo', photo )
						.click( function() {
							var $checked = $( '#incomplete-uploads-page .monuments-list input[type=checkbox]:checked' );
							if ( $checked.length > 0 ) {
								$buttons.removeAttr( 'disabled' );
							} else {
								$buttons.attr( 'disabled', 'disabled' );
							}
						} );

					$uploadItem.click( function() {
						$( '#incomplete-upload-detail' ).html( uploadIncompleteTemplate( { upload: upload, monument: monument, photo: photo } ) ).localize();
						$( '#incomplete-upload-detail .monumentLink' ).
							data( 'monument', new Monument( monument, commonsApi ) ).
							click( function() {
								showMonumentDetail( $( this ).data( 'monument' ) );
							} );
						showPage( 'incomplete-upload-detail-page' );
					} );
				
					$uploadItem.find( 'input' ).click( function( event ) {
						// wheeee
						event.stopPropagation();
					} );
					$list.append( $uploadItem );

					// Create thumbnails from the originals so we don't have to keep them all in RAM
					// Serialize loads & draws in a queue so we don't freeze the screen drawing them all at once. 
					thumbQueue.push( function() {
						var img = new Image(),
							$img = $( img ),
							d = $.Deferred();
						$img.attr( 'src', photo.data.contentURL ).load( function() {
							var ratio = img.width / img.height;
							var thumbWidth, thumbHeight;
							if ( ratio >= 1 ) {
								thumbWidth = thumbSize;
								thumbHeight = Math.floor( thumbSize / ratio );
							} else {
								thumbHeight = thumbSize;
								thumbWidth = Math.floor( thumbSize * ratio );
							}
							var $canvas = $( '<canvas>' )
									.attr( 'width', thumbWidth )
									.attr( 'height', thumbHeight )
									.addClass( 'monument-thumbnail' ),
								ctx = $canvas[0].getContext( '2d' );
							ctx.drawImage( img, 0, 0, thumbWidth, thumbHeight );
							$uploadItem.find('img.monument-thumbnail').replaceWith( $canvas );
							d.resolve();
						} );
						return d.promise();
					} );

					// Translate administrative level codes into proper text
					translateAdminLevels( $uploadItem, monument );
				} );
			
				function iterThumbQueue() {
					if ( thumbQueue.length > 0 ) {
						var func = thumbQueue.shift();
						func().done( function() {
							window.setTimeout( iterThumbQueue, 0 );
						} );
					}
				}
				iterThumbQueue();
			} else {
				$( '#select-all' ).attr( 'disabled', true );
				var emptyUploadTemplate = templates.getTemplate( 'upload-incomplete-list-empty-template' );
				$list.html( emptyUploadTemplate() ).localize();
			}
		} );
	}

	function setupIncompleteUploads() {
		$( '#select-all' ).click( function() {
			var $items = $( '#incomplete-uploads-page .monuments-list input[type=checkbox]' );
			if ( $items.length > 0 ) {
				$items.each( function( i, item ) {
					var $item = $( item );
					$item.attr( 'checked', true );
				} );
				$( '#upload-all, #delete-all' ).removeAttr( 'disabled' );
			}
		} );

		$( '#delete-all' ).click( function() {
			var queue = [];
			$( '#incomplete-uploads-page .monuments-list input[type=checkbox]:checked' ).each( function( i, item ) {
				var $item = $( item ),
					photo = $item.data( 'photo' );
				queue.push( photo );
			} );

			// @todo replace confirm() with a nicer in-app dialog?
			if ( window.confirm( mw.message( 'delete-selected-prompt', queue.length ).plain() ) ) {
				// Delete in sequence!
				function iter() {
					if ( queue.length > 0 ) {
						var photo = queue.pop();
						db.deleteUpload( photo ).then( function() {
							iter();
						} );
					} else {
						showIncompleteUploads();
					}
				}
				iter();
			}
		} );

		$( '#upload-all' ).click( function() {
			var queue = [];
			$( '#incomplete-uploads-page .monuments-list input[type=checkbox]:checked' ).each( function( i, item ) {
				var $item = $( item ),
					monument = $item.data( 'monument' ),
					photo = $item.data( 'photo' );
				photo = new Photo( photo.data );
				queue.push( {monument: monument, photo: photo} );
			} );

			// Upload in sequence!
			// @todo build a better progress bar
			function iter() {
				if ( queue.length > 0 ) {
					var item = queue.pop(),
						photo = item.photo,
						monument = item.monument;
					comment = mw.msg( 'upload-comment', WLMConfig.VERSION_NUMBER );
					photo.uploadTo( api, comment, templates.getTemplate( 'upload-photo-description', true ) ).done( function( imageinfo ) {
						db.completeUpload( photo ).done( function() {
							iter();
						} );
					} ).progress( app.uploadProgressHandler ).fail( function( data ) {
						// @todo show error data here
						if ( data === 'Aborted' ) {
							// no-op
							console.log( "Upload got aborted." );
							showPage( 'incomplete-uploads-page' );
						} else {
							uploadErrorHandler( data );
						}
					} );
				} else {
					// Show your now-completed uploads.
					showPage( 'uploads-page' );
				}
			}
			doLogin( iter );
		} );
	}

	function UploadPage( WLMMobile ) {
		app = WLMMobile.app;
		api = WLMMobile.api;
		db = WLMMobile.db;
		Monument = WLMMobile.Monument;
		Photo = WLMMobile.Photo;
		templates = WLMMobile.templates;
		commonsApi = WLMMobile.commonsApi;
		showPage = WLMMobile.app.showPage;
		showMonumentDetail = WLMMobile.app.showMonumentDetail;
		translateAdminLevels = WLMMobile.app.translateAdminLevels;
		uploadErrorHandler = WLMMobile.app.uploadErrorHandler;
		doLogin = WLMMobile.app.doLogin;
		WLMMobile.app.registerPageHook( function( pageName, deffered ) {
			if ( pageName === 'uploads-page' ) {
				showUploads();
			} else if ( pageName === 'incomplete-uploads-page' ) {
				showIncompleteUploads();
			}
		} );
		setupIncompleteUploads();
	}
	return UploadPage;
} );
