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
