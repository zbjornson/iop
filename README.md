Mostly complete parser/gramamr for Intel's intrinsics pseudocode. There are still some edge cases to work out (minor errors and inconsistencies in the pseudocode).


After cloning this repo, use `yarn get-data` to fetch Intel's intrinsic guide.

Example of `vplzcntd`:

```
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
```

```JS
{
  type: 'Program',
  body: [
    {
      type: 'ForStatement',
      init: [
        {
          type: 'AssignmentExpression',
          operator: ':=',
          left: { type: 'Identifier', name: 'j' },
          right: { type: 'Literal', value: 0 }
        },
        [ ' ' ]
      ],
      varmax: { type: 'Literal', value: 7 },
      body: [
        [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'AssignmentExpression',
              operator: ':=',
              left: { type: 'Identifier', name: 'i' },
              right: {
                type: 'BinaryExpression',
                operator: '*',
                left: { type: 'Identifier', name: 'j' },
                right: { type: 'Literal', value: 32 }
              }
            }
          },
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'AssignmentExpression',
              operator: ':=',
              left: { type: 'Identifier', name: 'tmp' },
              right: { type: 'Literal', value: 31 }
            }
          },
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'AssignmentExpression',
              operator: ':=',
              left: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: 'dst' },
                range: {
                  start: {
                    type: 'BinaryExpression',
                    operator: '+',
                    left: { type: 'Identifier', name: 'i' },
                    right: { type: 'Literal', value: 31 }
                  },
                  end: { type: 'Identifier', name: 'i' }
                },
                computed: true
              },
              right: { type: 'Literal', value: 0 }
            }
          },
          {
            type: 'DoWhileStatement',
            test: {
              type: 'BinaryExpression',
              operator: [ 'AND', undefined ],
              left: {
                type: 'BinaryExpression',
                operator: '>=',
                left: { type: 'Identifier', name: 'tmp' },
                right: { type: 'Literal', value: 0 }
              },
              right: {
                type: 'BinaryExpression',
                operator: '==',
                left: {
                  type: 'MemberExpression',
                  object: { type: 'Identifier', name: 'a' },
                  property: {
                    type: 'BinaryExpression',
                    operator: '+',
                    left: { type: 'Identifier', name: 'i' },
                    right: { type: 'Identifier', name: 'tmp' }
                  },
                  computed: true
                },
                right: { type: 'Literal', value: 0 }
              }
            },
            body: [
              [
                {
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'AssignmentExpression',
                    operator: ':=',
                    left: { type: 'Identifier', name: 'tmp' },
                    right: {
                      type: 'BinaryExpression',
                      operator: '-',
                      left: { type: 'Identifier', name: 'tmp' },
                      right: { type: 'Literal', value: 1 }
                    }
                  }
                },
                {
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'AssignmentExpression',
                    operator: ':=',
                    left: {
                      type: 'MemberExpression',
                      object: { type: 'Identifier', name: 'dst' },
                      range: {
                        start: {
                          type: 'BinaryExpression',
                          operator: '+',
                          left: { type: 'Identifier', name: 'i' },
                          right: { type: 'Literal', value: 31 }
                        },
                        end: { type: 'Identifier', name: 'i' }
                      },
                      computed: true
                    },
                    right: {
                      type: 'BinaryExpression',
                      operator: '+',
                      left: {
                        type: 'MemberExpression',
                        object: { type: 'Identifier', name: 'dst' },
                        range: {
                          start: {
                            type: 'BinaryExpression',
                            operator: '+',
                            left: { type: 'Identifier', name: 'i' },
                            right: { type: 'Literal', value: 31 }
                          },
                          end: { type: 'Identifier', name: 'i' }
                        },
                        computed: true
                      },
                      right: { type: 'Literal', value: 1 }
                    }
                  }
                }
              ],
              [ '\t' ]
            ]
          }
        ],
        []
      ]
    },
    {
      type: 'ExpressionStatement',
      expression: {
        type: 'AssignmentExpression',
        operator: ':=',
        left: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'dst' },
          range: {
            start: { type: 'Identifier', name: 'MAX' },
            end: { type: 'Literal', value: 256 }
          },
          computed: true
        },
        right: { type: 'Literal', value: 0 }
      }
    }
  ]
}
```

---

Notes:

1. Some incorrect characters appear in the Intel documents. The following replacements should be made:
   ```js
   x2013: "-" // en dash
   x2044: "/"
   ```