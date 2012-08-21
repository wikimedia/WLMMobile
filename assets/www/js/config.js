var WLMConfig = {
	BLOCKING_POLICY: 'http://commons.wikimedia.org/wiki/Commons:Blocking_policy?uselang=$1',
	COMMONS_API: 'https://commons.wikimedia.org/w/api.php',
	MONUMENT_API: 'http://wlm.wikimedia.org/api/api.php',
	MONUMENT_SEARCH_LIMIT: 50, // amount of monuments to request in a single query (see bug 39182 for more context)
	SIGNUP_PAGE: 'http://commons.wikimedia.org/w/index.php?title=Special:UserLogin&type=signup&uselang=$1',
	WIKI_API: 'https://test.wikipedia.org/w/api.php',
	WIKIPEDIA_API: 'https://$1.wikipedia.org/w/api.php'
};
