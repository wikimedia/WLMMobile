// Tools for formatting description for uploads


function getCampaignInfo(campaign, callback) {
	$.ajax({
		url: 'https://commons.wikimedia.org/w/api.php',
		data: {
			action: 'uploadcampaign',
			campaigns: campaign,
			ucprop: 'config',
			format: 'json'
		},
		success: function(data) {
			// @fixme check for various errors
			callback(data.uploadcampaign.campaigns[0].config);
		},
		error: function() {
			callback(null);
		}
	});
}

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

function formatUploadDescription( monument, campaignConfig, username ) {
	var idTemplate = campaignConfig.idField,
		idField = idTemplate.replace( '$1', monument.id ),
		license = campaignConfig.defaultOwnWorkLicence, // note the typo in the API field
		ourCategories = [ 
			'Mobile upload', 
			'Uploaded with Android WLM App',
			'UA: ' + navigator.userAgent.match( /Android (.*?)(?=\))/g )
		],
		cats = campaignConfig.defaultCategories.
			concat( campaignConfig.autoCategories ).
			concat( ourCategories ),
		autoWikiText = campaignConfig.autoWikiText;

	var desc = '';
	desc += '=={{int:filedesc}}==\n';
	desc += '{{Information\n';
	desc += '|description=';

	desc += '{{' + monument.lang + '|1=' + monument.name + '}}\n';
	desc += idField + '\n';

	desc += '|date=' + dateYMD() + '\n';
	desc += '|source={{own}}\n';
	desc += '|author=[[User:' + username + ']]\n';
	desc += '|permission=\n';
	desc += '|other_versions=\n';
	desc += '|other_fields=\n';
	desc += '}}\n';

	desc += '\n';

	desc += '=={{int:license-header}}==\n';
	desc += '{{self|' + license + '}}\n';

	desc += '\n';

	if ( autoWikiText.length ) {
		desc += autoWikiText + '\n';
	}

	cats.forEach( function( cat ) {
		desc += '[[Category:' + cat + ']]\n';
	});

	return desc;
}
