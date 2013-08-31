(function() {
	var names = {}, campaigns = {},
		cacheData = localStorage.getItem( 'wlm-campaign-data' );

	names.ad = 'Andorra'
	names.at = 'Austria'
	names['be-bru'] = 'Belgium (Brussels)'
	names['be-vlg'] = 'Belgium (Flanders)'
	names['be-wal'] = 'Belgium (Wallonia)'
	names.by = 'Belarus'
	names.ch = 'Switzerland'
	names['de-by'] = 'Germany (Bavaria)'
	names['de-he'] = 'Germany (Hesse)'
	names['de-nrw-bm'] = 'Germany (nrw-bm)'
	names['de-nrw-k'] = 'Germany (nrw-k)'
	names['dk-bygning'] = 'Denmark (bygning)'
	names['dk-fortids'] = 'Denmark (fortids)'
	names.ee = 'Estonia'
	names.es = 'Spain'
	names['es-ct'] = 'Spain (Catalonia)'
	names['es-vc'] = 'Spain (Valencia)'
	names.fr = 'France'
	names.ie = 'Ireland'
	names['it-88'] = 'Italy (88)'
	names['it-bz'] = 'Italy (bz)'
	names.lu = 'Luxemburg'
	names.mt = 'Malta'
	names.nl = 'Netherlands'
	names.no = 'Norway'
	names.pl = 'Poland'
	names.pt = 'Portugal'
	names.ro = 'Romania'
	names.se = 'Sweden'
	names.sk = 'Slovakia'
	names.us = 'United States'
	names.pa = 'Panama'
	names['us-ca'] = 'California, United States'
	names.cl = 'Chile'
	names.rs = 'Serbia'
	names.il = 'Israel'
	names.ca = 'Canada'
	names.in = 'India'
	names.gh = 'Ghana'
	names.ar = 'Argentina'
	names.mx = 'Mexico'
	names.co = 'Colombia'
	names.cz = 'Czech Republic'

	if ( cacheData ) {
		console.log( 'loading live campaign data from cache' );
		window.CAMPAIGNS = JSON.parse( cacheData );
	}
	// update cache with latest and greatest
	$.ajax( { dataType: 'json',
		url: 'https://commons.wikimedia.org/w/api.php?action=query&prop=revisions&format=json&rvprop=content&generator=allpages&gapnamespace=460&gaplimit=500'
	} ).done( function( rawData ) {
		var campdata, camp, i, data = { 'uploadcampaign': { 'campaigns': [] } };

		$.each( rawData.query.pages, function( id, page ) {
			console.log( page );
			var dc = JSON.parse(page.revisions[0]['*']);

			// Reverse mapping
			if ( dc.defaults ) {
				dc.defaultDescription = dc.defaults.description || '';
				dc.defaultLat = dc.defaults.lat || '';
				dc.defaultLon = dc.defaults.lon || '';
				dc.defaultCategories = dc.defaults.categories || [];
			}

			if ( dc.autoAdd ) {
				dc.autoWikiText = dc.autoAdd.wikitext || '';
				dc.autoCategories = dc.autoAdd.categories || [];
			}

			if ( dc.fields && dc.fields[0] ) {
				dc.idField = dc.fields[0].wikitext;
				dc.idFieldInitialValue = dc.fields[0].initialValue;
				dc.idFieldLabelPage = dc.fields[0].label;
				dc.idFieldMaxLength = dc.fields[0].maxLength;
			}
			if ( dc.fields && dc.fields[1] ) {
				dc.idField2 = dc.fields[1].wikitext;
				dc.idField2InitialValue = dc.fields[1].initialValue;
				dc.idField2LabelPage = dc.fields[1].label;
				dc.idFieldMaxLength = dc.fields[1].maxLength;
			}

			if ( dc.licensing && dc.licensing.ownWork && dc.licensing.ownWork.licenses && dc.licensing.ownWork.licenses[0] ) {
				// Typo, yes, yes
				dc.defaultOwnWorkLicence = dc.licensing.ownWork.licenses[0];
			}

			var cam = {}
			cam.name = page.title.split(':')[1];
			cam.isenabled = dc.enabled ? 1 : 0;
			cam.config = dc;

			data.uploadcampaign.campaigns.push( cam );
		} );

		if ( data.uploadcampaign && data.uploadcampaign.campaigns ) {
			campdata = data.uploadcampaign.campaigns;
			for ( i = 0; i < campdata.length; i++ ) {
				camp = campdata[ i ];
				if ( camp.name.indexOf( 'wlm-' ) === 0 && camp.isenabled === 1 ) {
					code = camp.name.replace( 'wlm-', '' );
					camp.desc = names[ code ] || code;
					campaigns[ code ] = camp;
				}
			}
			console.log( 'campaign data refreshed in cache' );
			window.CAMPAIGNS = campaigns;
			localStorage.setItem( 'wlm-campaign-data', JSON.stringify( campaigns ) ); // cache for next time
		}
	});
}() );

