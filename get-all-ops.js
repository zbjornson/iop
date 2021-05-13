const fs = require("fs");
const sax = require("sax");
const saxparser = sax.parser(true);
const peg = require("pegjs");
const parser = peg.generate(fs.readFileSync("./grammar.pegjs", "utf8"), {});

const techs = ["MMX", "SSE", "SSE3", "SSSE3", "SSE4.1", "SSE4.2", "AVX", "AVX2", "AVX-512"];
const specialTechs = ["KNC", "AMX", "SVML", "Other"];

// TODO: these are current arguments
const maxTech = "AVX2";
const specialTech = "";
const categories = ["Load", "Swizzle"];
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
  if (saxparser.tag.name === "category") {
    for (let cat of categories) {
      if (text === cat) {
        skip = false;
        break;
      }
    }
  }
  if (saxparser.tag.name === "operation") {
    if ((techs.includes(currentTech) && (techs.indexOf(currentTech) <= techs.indexOf(maxTech))) || ((specialTechs.includes(currentTech) && currentTech === specialTech))) {
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
      console.log("✔", op.name);
      if (op.name === "_mm256_shuffle_ps") console.dir(parser.parse(op.operation), { depth: null });
    }
  } catch (ex) {
    if (debug) {
      console.log("✘", op.name);
      console.log("✘", op.operation);
    }
    console.log("{ " + op.name + ": None }")
  }
}
