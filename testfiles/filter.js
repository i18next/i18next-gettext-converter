module.exports = function filter(gt, next) {
	var clientSideSource = 'msgid.php';

	gt.listKeys("et").forEach(function(key) {
		var comment = gt.getComment("et", "", key);
		if (comment) {
			if (comment.code && comment.code.indexOf(clientSideSource) === -1) {
				gt.deleteTranslation("et", "", key);
			}
		}
	});

	return gt;
};