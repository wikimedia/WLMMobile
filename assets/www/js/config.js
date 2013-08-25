var WLMConfig = {
	BLOCKING_POLICY: 'http://commons.wikimedia.org/wiki/Commons:Blocking_policy?uselang=$1',
	COMMONS_API: 'https://commons.wikimedia.org/w/api.php',
	GITHUB_MESSAGES: 'https://raw.github.com/wikimedia/WLMMobile/master/assets/www/',
	MONUMENT_API: 'http://wlm.wikimedia.org/api/api.php',
	MONUMENT_SEARCH_LIMIT: 50, // amount of monuments to request in a single query (see bug 39182 for more context)
	SIGNUP_PAGE: 'https://commons.wikimedia.org/w/index.php?title=Special:UserLogin&type=signup&uselang=$1',
	WIKI_API: 'https://test.wikipedia.org/w/api.php',
	WIKI_BASE: 'https://test.wikipedia.org/wiki/',
	WIKI_LOVES_MONUMENTS_HOMEPAGE: 'http://www.wikilovesmonuments.org/',
	WIKIPEDIA: 'https://$1.wikipedia.org',
	WIKIPEDIA_API: 'https://$1.wikipedia.org/w/api.php',
	VERSION_NUMBER: '1.3',
	VERSION_NAME: 'Elichavayan', // famous monument name (next should begin with F)

	// app specific
	THUMB_SIZE: 64 * window.devicePixelRatio
};
