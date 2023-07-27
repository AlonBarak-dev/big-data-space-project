npm run build

echo deleting previous build
rm -r ../main_server/build 

echo copying new build to main server
cp -r build ../main_server/build

echo done!
