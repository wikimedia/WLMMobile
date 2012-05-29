// Cache that compiles and stores templates so they don't keep getting recompiled
// Currently takes templates from index.html
define(['underscore'], function() {
	var compiled_templates = {};
	function getTemplate(name) {
		if(!compiled_templates[name]) {
			var html = $("#" + name).html();
			compiled_templates[name] = _.template(html);
		}
		return compiled_templates[name];
	}

	return {
		getTemplate: getTemplate
	};
});
