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

function formatUploadDescription(monument, campaignConfig, description) {
	var idTemplate = campaignConfig.idField,
		idField = idTemplate.replace('$1', monument.id),
		license = campaignConfig.defaultOwnWorkLicense,
		cats = campaignConfig.defaultCategories;
	
	
	var desc = '';
	desc += '=={{int:filedesc}}==\n';
	desc += '{{Information\n';
	desc += '|description=';
	//
	desc += '{{' + monument.language + '|1=' + description + '}}\n';
	desc += idField + '\n';
	//
	desc += '|date=' + dateYMD() + '\n';
	desc += '|source={{own}}\n';
	desc += '|author=[[User:Fixme|Fixme]]\n'; // @fixme
	desc += '|permission=\n';
	desc += '|other_versions=\n';
	desc += '|other_fields=\n';
	
	desc += '\n';
	
	desc += '=={{int:license-header}}==\n';
	desc += '{{self|' + license + '}}\n';

	desc += '\n';
	
	cats.forEach(function(cat) {
		desc += '[[Category:' + cat + ']]\n';
	});
	
	return desc;
}

