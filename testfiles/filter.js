/**
 * An example filter; it accepts the gettext object as its first argument, and
 * should invoke the callback with an error object and the modified translation
 * table.
 *
 * This filter removes translations that are used only in backend templates.
 *
 * @param gt
 * @param callback
 */
module.exports = function filter(gt, callback) {
	var clientSideSource = '/frontend/';
	var err;

	gt.listKeys("et").forEach(function(key) {
		var comment = gt.getComment("et", "", key);
		if (comment) {
			console.log(comment);
			if (comment.code && comment.code.indexOf(clientSideSource) === -1) {
				gt.deleteTranslation("et", "", key);
			}
		}
	});

	callback(err, gt._domains[gt._textdomain]._translationTable);
};
