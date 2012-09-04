var Gettext = require("node-gettext")
  , fs = require("fs");

var gt = new Gettext();

module.exports = {

	gettextToI18next: function(domain, source, target) {
		var self = this;

		fs.readFile(source, function(err, body) {
            if(err){
                throw err;
            }
            gt.addTextdomain("et", body);
        });
	},

	addTextDomain: function(domain, source, callback) {
		var self = this;

		fs.readFile(source, function(err, body) {
            if(err) {
                callback(err);
                return;
            }

            gt.addTextdomain("et", body);

            callback(null, gt._domains[gt._textdomain]._translationTable);
        });
	}

};