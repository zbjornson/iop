const fs = require("fs");
const sax = require("sax");
const saxparser = sax.parser();
const peg = require("pegjs");
const parser = peg.generate(fs.readFileSync("./grammar.pegjs", "utf8"), {});

const techs = ["MMX", "SSE", "SSE2", "SSE3", "SSSE3", "SSE4.1", "SSE4.2", "AVX", "AVX2", "AVX-512"];
const specialTechs = ["KNC", "AMX", "SVML", "Other"];

// TODO: these are current arguments
const maxTech = "AVX2";
const specialTech = "";
const categories = ["Load", "Swizzle"];
const ops = [];

let debug = false;

let currentTech = "";
let intrinName = "";
let currentCat = [];
let skip = true;

saxparser.onopentag = ({ name, attributes }) => {
  if (name === "INTRINSIC") {
    currentTech = attributes.TECH;
    intrinName = attributes.NAME;
    currentCat = [];
    skip = true;
  }
}

saxparser.ontext = text => {
  if (saxparser.tag.name === "CATEGORY") {
    for (let cat of categories) {
      if (text === cat) {
        skip = false;
        currentCat.push(cat);
      }
    }
  }
  if (saxparser.tag.name === "OPERATION") {
    if ((techs.includes(currentTech) && (techs.indexOf(currentTech) <= techs.indexOf(maxTech))) || ((specialTechs.includes(specialTech) && currentTech === specialTech))) {
      if ((!skip) && (text.trim())) {
        ops.push({
          name: intrinName, category: currentCat, operation:
            text.trim()
        });
      }
    }
  }
};

saxparser.write(fs.readFileSync("./data/data.xml", "utf8")).close();

let correctParsing = 0;
let incorrectParsing = 0;

if (!debug) {
  // Print as list
  console.log("{");
}

for (const op of ops) {
  try {
    // Ignore Macros, as they are not contemplated (only 9 cases among all intrinsics)
    if (op.name.startsWith("_MM_")) {
      continue;
    }
    let operation = parser.parse(op.operation);
    if (!debug) {
      console.dir({ name: op.name, category: op.category, op: operation }, { depth: null });
      console.log(",");
    } else {
      console.log("✔", op.name);
    }
    correctParsing++;
  } catch (ex) {
    if (debug) {
      console.log("✘", op.name);
      console.log("✘", op.operation);
    }
    console.log("{ " + op.name + ": None }");
    incorrectParsing++;
  }
}

if (debug) {
  console.log("Correct parsing = " + correctParsing);
  console.log("Incorrect parsing = " + incorrectParsing);
} else {
  // Close list
  console.log("}");
}