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
campaigndict = {}

for camp in campdata:
	if camp['name'].startswith('wlm'):
		camp['name'] = camp['name'].replace('wlm-','')
		if camp['name'] in namesdata:
			campaign = camp
			campaign['desc'] = namesdata[campaign['name']]
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
