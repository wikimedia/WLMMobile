// Cache that compiles and stores templates so they don't keep getting recompiled
// Some templates, however, should not be cached (such as photo upload
// descriptions)
// Currently takes templates from index.html, and an optional bool param
// set skipCache = true to prevent requested template from getting cached.
define(['underscore'], function() {
	var compiled_templates = {};
	function getTemplate(name, skipCache) {
		if(!compiled_templates[name]) {
			var html = $("#" + name).html();
			compiled_template = _.template(html);
			if ( skipCache !== true ) {
				compiled_templates[name] = compiled_template;
			}
		} else {
			compiled_template = compiled_templates[name];
		}
		return compiled_template;
	}

	return {
		getTemplate: getTemplate
	};
});
