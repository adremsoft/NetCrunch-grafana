@echo off
call yarn build

mkdir dist\datasource\css
copy src\datasource\css\query.editor.css dist\datasource\css

copy src\datasource\services\netCrunchAPI\adrem\*min.js dist\datasource\services\netCrunchAPI\adrem\

