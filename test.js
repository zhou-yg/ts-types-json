const ts = require("typescript");
const fs = require("node:fs");

const sourceCode = fs.readFileSync('test.source.ts', 'utf-8');

/** Generate documentation for all classes in a set of .ts files */
function generateDocumentation() {
  // Build a program using the set of root file names in fileNames
  // let program = ts.createSourceFile('a.ts', sourceCode, ts.ScriptTarget.ES2015, false, ts.ScriptKind.TS);
  let program = ts.createProgram(['test.source.ts'], {
    target: ts.ScriptTarget.ES2015,
  })

  ts.createProgram

  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {

      const { statements } = sourceFile
      const [n1, n2] = statements
      console.log('statements.1: ', n1, ts.SyntaxKind[n1.kind]);
      ts.forEachChild(n1, n => console.log(ts.SyntaxKind[n.kind]))
      console.log('statements.2: ', n2, ts.SyntaxKind[n2.kind], '\n');
    
      if (n2.kind === ts.SyntaxKind.FirstStatement) {
        const v = n2.declarationList.declarations[0];
        
        // console.log(v, ts.SyntaxKind[v.kind], v.symbol)

        const symbol = checker.getSymbolAtLocation(v.name)
        console.log('symbol: ', symbol);

        const type = checker.getTypeOfSymbolAtLocation(symbol, v.name)
        console.log('type: ', type);

        const typeStr = checker.typeToString(type)
        console.log('typeStr: ', typeStr);
      }

    }
  }


}


generateDocumentation()