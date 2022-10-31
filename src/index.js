"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.getFunctionScopeTypes = exports.getTopTypes = void 0;
var ts = require("typescript");
var tjs = require("typescript-json-schema-pub");
var tsconfig_json_1 = require("../tsconfig.json");
/**
 * all symbol is belong to varaible symbol
 */
function getJSONTypeOfSymbol(checker, s, gen) {
    if (!(s.flags & (ts.SymbolFlags.Variable | ts.SymbolFlags.Function))) {
        throw new Error('[getJSONTypeOfSymbol] the symbol must be a variable or function');
    }
    var name = s.getName();
    if (s.flags & ts.SymbolFlags.Function) {
        var type_1 = checker.getTypeOfSymbolAtLocation(s, s.valueDeclaration);
        var signature = type_1.getCallSignatures()[0];
        var parameters = signature.getParameters();
        var returnType = signature.getReturnType();
        return {
            name: name,
            type: 'function',
            parameters: parameters.map(function (p) { return getJSONTypeOfSymbol(checker, p, gen); }),
            returnType: gen.getTypeDefinition(returnType)
        };
    }
    var type = checker.getTypeOfSymbolAtLocation(s, s.valueDeclaration);
    var r = gen.getTypeDefinition(type);
    var result = {
        name: name,
        type: r
    };
    return result;
}
/**
 * get name of function like node, there are 2 ways:
 * 1. by function declaration
 * 2. by variable declaration and the type is function
 */
function getNameFromFunctionLikeNode(node) {
    if (ts.isFunctionDeclaration(node)) {
        return node.name;
    }
    else if (ts.isVariableDeclaration(node)) {
        if (node.initializer &&
            (ts.isFunctionExpression(node.initializer) ||
                ts.isArrowFunction(node.initializer))) {
            if (ts.isIdentifier(node.name)) {
                return node.name;
            }
        }
    }
    return undefined;
}
function getBodyFromFunctionLikeNode(node) {
    if (ts.isFunctionDeclaration(node)) {
        return node.body;
    }
    else if (ts.isVariableDeclaration(node)) {
        if (node.initializer &&
            (ts.isFunctionExpression(node.initializer) ||
                ts.isArrowFunction(node.initializer))) {
            return node.initializer.body;
        }
    }
    return undefined;
}
function getAllVaraiblesTypes(sourceFile, checker, scope, scopeName) {
    /**
     * all variables in the file, there are 2 formation
     *  1.var
     *  2.const/let
     */
    var variableSymbols = new Set();
    ts.forEachChild(sourceFile, firstVisit);
    return __spreadArray([], variableSymbols, true);
    function deepthVisitVariable(node) {
        var symbol = checker.getSymbolAtLocation(node);
        if (symbol && (symbol.flags & (ts.SymbolFlags.Variable | ts.SymbolFlags.Function))) {
            variableSymbols.add(symbol);
            return true;
        }
        else {
            var found_1 = false;
            ts.forEachChild(node, function (n) {
                if (!found_1) {
                    found_1 = found_1 || deepthVisitVariable(n);
                }
            });
        }
    }
    function firstVisit(node) {
        // console.log('node kind', ts.SyntaxKind[node.kind], ts.SyntaxKind[node.parent.kind])
        switch (scope) {
            case 'module':
                if (ts.isSourceFile(node.parent) && (ts.isVariableStatement(node) ||
                    ts.isFunctionDeclaration(node))) {
                    deepthVisitVariable(node);
                }
                break;
            case 'function':
                var name_1 = getNameFromFunctionLikeNode(node);
                if (name_1 && ts.isIdentifier(name_1) && name_1.escapedText === scopeName) {
                    var body = getBodyFromFunctionLikeNode(node);
                    if (body) {
                        deepthVisitVariable(body);
                    }
                }
                else {
                    ts.forEachChild(node, firstVisit);
                }
                break;
        }
    }
}
function initializeProgram(file) {
    var program = ts.createProgram([file], __assign({}, tsconfig_json_1["default"].compilerOptions));
    var checker = program.getTypeChecker();
    var sourceFile = program.getSourceFiles().find(function (f) {
        if (!f.isDeclarationFile) {
            return f.fileName === file;
        }
    });
    return {
        program: program,
        sourceFile: sourceFile,
        checker: checker
    };
}
function getTopTypes(file) {
    var _a = initializeProgram(file), program = _a.program, checker = _a.checker, sourceFile = _a.sourceFile;
    if (sourceFile) {
        var symbols = getAllVaraiblesTypes(sourceFile, checker, 'module');
        /**
         * @TODO tjs need refactor or rewrite
         */
        var generate_1 = tjs.buildGenerator(program, {
            required: true
        });
        var types = symbols.map(function (s) {
            var t = getJSONTypeOfSymbol(checker, s, generate_1);
            return t;
        });
        return types;
    }
    return [];
}
exports.getTopTypes = getTopTypes;
function getFunctionScopeTypes(file, functionName) {
    var _a = initializeProgram(file), program = _a.program, checker = _a.checker, sourceFile = _a.sourceFile;
    if (sourceFile) {
        var symbols = getAllVaraiblesTypes(sourceFile, checker, 'function', functionName);
        var generate_2 = tjs.buildGenerator(program, {
            required: true
        });
        var types = symbols.map(function (s) {
            var t = getJSONTypeOfSymbol(checker, s, generate_2);
            return t;
        });
        return types;
    }
    return [];
}
exports.getFunctionScopeTypes = getFunctionScopeTypes;
