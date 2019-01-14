const fs = require("fs");
const sax = require("sax");
const saxparser = sax.parser();
const peg = require("pegjs");
const parser = peg.generate(fs.readFileSync("./grammar.pegjs", "utf8"), {});

const filter = "SSE2"; // "SSE2", "AVX", "AVX2", etc.
const ops = [];
let currentTech = "";
let intrinName = "";

saxparser.onopentag = ({name, attributes}) => {
  if (name === "INTRINSIC") {
    currentTech = attributes.TECH;
    intrinName = attributes.NAME;
  }
}

saxparser.ontext = text => {
	if (saxparser.tag.name === "OPERATION") {
		if (filter ? filter === currentTech : true) {
			if (text.trim()) {
        ops.push({name: intrinName, operation: text.trim()});
      }
		}
	}
};

saxparser.write(fs.readFileSync("./data/data-3.4.2.xml", "utf8")).close();

for (const op of ops) {
  try {
    parser.parse(op.operation);
    console.log("✔", op.name);
    if (op.name === "_mm_shuffle_pd") console.dir(parser.parse(op.operation), {depth: null});
  } catch (ex) {
    console.log("✘", op.name);
  }
}
