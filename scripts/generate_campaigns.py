from urllib2 import urlopen, HTTPError
try:
    import json
except:
    import simplejson as json
import campaign_names

UPLOADCAMPAIGN_URL = "http://commons.wikimedia.org/w/api.php?action=uploadcampaign&format=json&ucprop=config"

campdata = json.loads(urlopen(UPLOADCAMPAIGN_URL).read())['uploadcampaign']['campaigns']
# HACK: Bring up display names from separate file on wiki for now. Should be added to UploadCampaign info itself
# @FIXME remove reliance on this. Currently only used showMonumentDetail() in app.js
namesdata = campaign_names.getCampaignNames()

campaigns = []
campaigndict = {}

for camp in campdata:
	# get all WLM campaigns that are enabled
	if camp['name'].startswith('wlm') and camp['isenabled'] == 1:
		camp['name'] = camp['name'].replace('wlm-','')
		campaign = camp
		if camp['name'] in namesdata:
			campaign['desc'] = namesdata[campaign['name']]
		else:
			campaign['desc'] = campaign['name']
		campaigns.append( campaign )
		print campaign['name'], campaign['desc']


print len(campaigns)
for campaign in campaigns:
	# we could remove 'name' from each campaign, since it is now a dict key
	# and preserving it might be redundant, but i opted to leave it in for 
	# increased flexibility. because this is now a dict rather than a list, 
	# we can't sort it in python, so leaving the structure in tact makes life 
	# easier in js.
	campaigndict[campaign['name']] = campaign
open("campaigns-data-test.js", "w").write('window.CAMPAIGNS = ' + json.dumps(campaigndict, indent=4))
