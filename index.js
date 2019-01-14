const peg = require("pegjs");
const fs = require("fs");
const parser = peg.generate(fs.readFileSync("./grammar.pegjs", "utf8"), {});

const psllw = `
FOR j := 0 to 3
  i := j*16
  IF count[63:0] > 15
    dst[i+15:i] := 0
  ELSE
    dst[i+15:i] := ZeroExtend(a[i+15:i] << count[63:0])
  FI
ENDFOR
`;

// Sometimes IF goes with THEN. Also notice it's `=` not `==`, which is fine
// because `:=` is assignment
const rdseed = `
IF HW_NRND_GEN.ready = 1 THEN
	val[15:0] := HW_NRND_GEN.data
	RETURN 1
ELSE
	val[15:0] := 0
	RETURN 0
FI
`;
// console.dir(parser.parse(rdseed), {depth: null});

const vpermilpd = `
IF (imm8[0] == 0) tmp_dst[63:0] := a[63:0]
IF (imm8[0] == 1) tmp_dst[63:0] := a[127:64]
IF (imm8[1] == 0) tmp_dst[127:64] := a[63:0]
IF (imm8[1] == 1) tmp_dst[127:64] := a[127:64]
IF (imm8[2] == 0) tmp_dst[191:128] := a[191:128]
IF (imm8[2] == 1) tmp_dst[191:128] := a[255:192]
IF (imm8[3] == 0) tmp_dst[255:192] := a[191:128]
IF (imm8[3] == 1) tmp_dst[255:192] := a[255:192]
FOR j := 0 to 3
	i := j*64
	IF k[j]
		dst[i+63:i] := tmp_dst[i+63:i]
	ELSE
		dst[i+63:i] := src[i+63:i]
	FI
ENDFOR
dst[MAX:256] := 0
`;
// console.dir(parser.parse(vpermilpd), {depth: null});

const vplzcntd = `
FOR j := 0 to 7
	i := j*32
	tmp := 31
	dst[i+31:i] := 0
	DO WHILE (tmp >= 0 AND a[i+tmp] == 0)
		tmp := tmp - 1
		dst[i+31:i] := dst[i+31:i] + 1
	OD
ENDFOR
dst[MAX:256] := 0
`;
// console.dir(parser.parse(vplzcntd), {depth: null});

// This one has a bunch of oddities:
// * CASE(x of Identifier), not even sure what this syntactically means
// * It had (before cleaning) some non-standard characters like en dashes
// * Mixed cases of if/then/etc
// * `set #IE` setting flags
// * member access `tsrc.sign`
const vfixupimmsd = `
enum TOKEN_TYPE {
	QNAN_TOKEN := 0, 
	SNAN_TOKEN := 1, 
	ZERO_VALUE_TOKEN := 2, 
	ONE_VALUE_TOKEN := 3, 
	NEG_INF_TOKEN := 4, 
	POS_INF_TOKEN := 5, 
	NEG_VALUE_TOKEN := 6, 
	POS_VALUE_TOKEN := 7
}
FIXUPIMMPD(src1[63:0], src2[63:0], src3[63:0], imm8[7:0]){
	tsrc[63:0] := ((src2[62:52] == 0) AND (MXCSR.DAZ == 1)) ? 0.0 : src2[63:0]
	CASE(tsrc[63:0] of TOKEN_TYPE)
		QNAN_TOKEN:j := 0
		SNAN_TOKEN:j := 1
		ZERO_VALUE_TOKEN: j := 2
		ONE_VALUE_TOKEN: j := 3
		NEG_INF_TOKEN: j := 4
		POS_INF_TOKEN: j := 5
		NEG_VALUE_TOKEN: j := 6
		POS_VALUE_TOKEN: j := 7
	ESAC
	
	token_response[3:0] := src3[3+4*j:4*j]
	
	CASE(token_response[3:0]) of
		0 : dest[63:0] := src1[63:0]
		1 : dest[63:0] := tsrc[63:0]
		2 : dest[63:0] := QNaN(tsrc[63:0])
		3 : dest[63:0] := QNAN_Indefinite
		4 : dest[63:0] := -INF
		5 : dest[63:0] := +INF
		6 : dest[63:0] := tsrc.sign? -INF : +INF
		7 : dest[63:0] := -0
		8 : dest[63:0] := +0
		9 : dest[63:0] := -1
		10: dest[63:0] := +1
		11: dest[63:0] := 1/2
		12: dest[63:0] := 90.0
		13: dest[63:0] := PI/2
		14: dest[63:0] := MAX_FLOAT
		15: dest[63:0] := -MAX_FLOAT
	ESAC
	
	CASE(tsrc[31:0] of TOKEN_TYPE)
		ZERO_VALUE_TOKEN: if imm8[0] then set #ZE
		ZERO_VALUE_TOKEN: if imm8[1] then set #IE
		ONE_VALUE_TOKEN: if imm8[2] then set #ZE
		ONE_VALUE_TOKEN: if imm8[3] then set #IE
		SNAN_TOKEN: if imm8[4] then set #IE
		NEG_INF_TOKEN: if imm8[5] then set #IE
		NEG_VALUE_TOKEN: if imm8[6] then set #IE
		POS_INF_TOKEN: if imm8[7] then set #IE
	ESAC
	RETURN dest[63:0]
}

IF k[0]
	dst[63:0] := FIXUPIMMPD(a[63:0], b[63:0], c[63:0], imm8[7:0])
ELSE
	dst[63:0] := 0
FI
dst[127:64] := a[127:64]
dst[MAX:128] := 0
`;
console.dir(parser.parse(vfixupimmsd), {depth: null});

// This one has a variable OP operation
const vcmppd = `
CASE (imm8[7:0]) OF
0: OP := _CMP_EQ_OQ
1: OP := _CMP_LT_OS
2: OP := _CMP_LE_OS
3: OP := _CMP_UNORD_Q 
4: OP := _CMP_NEQ_UQ
5: OP := _CMP_NLT_US
6: OP := _CMP_NLE_US
7: OP := _CMP_ORD_Q
8: OP := _CMP_EQ_UQ
9: OP := _CMP_NGE_US
10: OP := _CMP_NGT_US
11: OP := _CMP_FALSE_OQ
12: OP := _CMP_NEQ_OQ
13: OP := _CMP_GE_OS
14: OP := _CMP_GT_OS
15: OP := _CMP_TRUE_UQ
16: OP := _CMP_EQ_OS
17: OP := _CMP_LT_OQ
18: OP := _CMP_LE_OQ
19: OP := _CMP_UNORD_S
20: OP := _CMP_NEQ_US
21: OP := _CMP_NLT_UQ
22: OP := _CMP_NLE_UQ
23: OP := _CMP_ORD_S
24: OP := _CMP_EQ_US
25: OP := _CMP_NGE_UQ 
26: OP := _CMP_NGT_UQ 
27: OP := _CMP_FALSE_OS 
28: OP := _CMP_NEQ_OS 
29: OP := _CMP_GE_OQ
30: OP := _CMP_GT_OQ
31: OP := _CMP_TRUE_US
ESAC
FOR j := 0 to 7
	i := j*64
	k[j] := (a[i+63:i] OP b[i+63:i]) ? 1 : 0
ENDFOR
k[MAX:8] := 0
`;

const vextractf32x4 = `
CASE imm8[7:0] of
0: dst[127:0] := a[127:0]
1: dst[127:0] := a[255:128]
2: dst[127:0] := a[383:256]
3: dst[127:0] := a[511:384]
ESAC
dst[MAX:128] := 0
`;
