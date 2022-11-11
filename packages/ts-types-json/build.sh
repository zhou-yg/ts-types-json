rm -rf dist/

tsc --declaration

if [ -e dist/src ] 
then
  mv dist/src/* dist/

  rm -r dist/src
  rm dist/tsconfig.json
fi