const fs = require("fs");
const https = require("https");

if (!fs.existsSync("data/data.xml")) {
	https.get("https://software.intel.com/sites/landingpage/IntrinsicsGuide/files/data-latest.xml", res => {
		res.pipe(fs.createWriteStream("data/data.xml"));
	});
}
