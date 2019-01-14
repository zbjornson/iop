const fs = require("fs");
const https = require("https");

if (!fs.existsSync("data/data-3.4.2.xml")) {
	https.get("https://software.intel.com/sites/landingpage/IntrinsicsGuide/files/data-3.4.2.xml", res => {
		res.pipe(fs.createWriteStream("data/data-3.4.2.xml"));
	});
}
