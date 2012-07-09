from urllib2 import urlopen, HTTPError
try:
    import json
except:
    import simplejson as json

UPLOADCAMPAIGN_URL = "http://commons.wikimedia.org/w/api.php?action=uploadcampaign&format=json&ucprop=config"
NAMES_URL = "http://commons.wikimedia.org/wiki/Commons:Monuments_database/Campaign_names?action=raw"

campdata = json.loads(urlopen(UPLOADCAMPAIGN_URL).read())['uploadcampaign']['campaigns']

# HACK: Bring up display names from separate file on wiki for now. Should be added to UploadCampaign info itself, or surfaced via Admin listings soon
nametext = urlopen(NAMES_URL).read()
namesdata = dict([(s.split('=')[0].strip(), s.split('=')[1].strip()) for s in nametext.split("\n")])

campaigns = []

for camp in campdata:
	if camp['name'].startswith('wlm'):
		campaign = {
				'name': camp['name'].replace('wlm-', ''),
				'categories': camp['config']['defaultCategories'],
				'licenses': camp['config']['licensesOwnWork']
				}
		if campaign['name'] in namesdata:
			campaign['desc'] = namesdata[campaign['name']]
			# Only pickup campaings that have a description set
			campaigns.append(campaign)
			print campaign['name'], campaign['desc']

campaigns = sorted(campaigns,  key=lambda k: k['desc'])

open("campaigns-data.js", "w").write('window.CAMPAIGNS = ' + json.dumps(campaigns, indent=4))
