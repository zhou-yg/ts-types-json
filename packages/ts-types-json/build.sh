rm -rf dist/

tsc --declaration

mv dist/src/* dist/

rm -r dist/src
rm dist/tsconfig.json