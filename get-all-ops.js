const fs = require("fs");
const sax = require("sax");
const parser = sax.parser();

const filter = ""; // "SSE2", "AVX", "AVX2", etc.
const ops = [];
let currentTech = "";

parser.onopentag = ({name, attributes}) => {
	if (name === "INTRINSIC") currentTech = attributes.TECH;
}

parser.ontext = text => {
	if (parser.tag.name === "OPERATION") {
		if (filter ? filter === currentTech : true) {
			if (text.trim()) ops.push(text.trim());
		}
	}
};

parser.write(fs.readFileSync("./data/data-3.4.2.xml", "utf8")).close();

// console.log(ops);

// const tokens = new Set(ops.join(" ").split(/\s+/).filter(x => /^[A-Z]+$/.test(x)));
// console.log(tokens)

/*
  'RETURN',

  'IF',
  'ELSE',
  'FI',
  'THEN',
  
  'AND',
  'OR',
  'NOT',
  'XOR',
  'NAND',
  'BITWISE',
  
  'CASE',
  'ESAC',
  
  'FOR',
  'ENDFOR',
  'DO',
  'WHILE',
  'OD',
  'BREAK',
  'CONTINUE',

  'TO',

  'NAN'
  */