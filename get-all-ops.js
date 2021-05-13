const fs = require("fs");
const sax = require("sax");
const saxparser = sax.parser(true);
const peg = require("pegjs");
const parser = peg.generate(fs.readFileSync("./grammar.pegjs", "utf8"), {});

// TODO:
const filter = "AVX2"; // "SSE2", "AVX", "AVX2", etc.
const ops = [];

let debug = true;

let currentTech = "";
let intrinName = "";
let skip = true;
saxparser.onopentag = ({ name, attributes }) => {
  if (name === "intrinsic") {
    currentTech = attributes.tech;
    intrinName = attributes.name;
    skip = true;
  }
}

saxparser.ontext = text => {
  // TODO:
  if (saxparser.tag.name === "category") {
    if ((text === "Load") || (text === "Swizzle")) {
      skip = false;
    }
  }
  if (saxparser.tag.name === "operation") {
    if (filter ? filter === currentTech : true) {
      if ((!skip) && (text.trim())) {
        ops.push({ name: intrinName, operation: text.trim() });
      }
    }
  }
};

saxparser.write(fs.readFileSync("./data/data.xml", "utf8")).close();

for (const op of ops) {
  try {
    let operation = parser.parse(op.operation);
    if (!debug) {
      console.dir(operation, { depth: null });
    } else {
      console.log("✔ ", op.name);
      if (op.name === "_mm256_shuffle_ps") console.dir(parser.parse(op.operation), { depth: null });
    }
  } catch (ex) {
    if (debug) {
      console.log("✘ ", op.name);
      console.log("✘ ", op.operation);
    }
    console.log("{" + op.name + ":" + "None }")
  }
}
