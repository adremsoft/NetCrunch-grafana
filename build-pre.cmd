@ECHO OFF

echo CLEANING A PREVIOUS BUILD
call go run build.go clean
rem call grunt clean
rem call yarn clean
call rmdir /S /Q "packaging\windows\GrafCrunchGuard\Win64\Release"
call rmdir /S /Q "packaging\windows\RunGrafCrunch\Win64\Release\"
call rmdir /S /Q "packaging\windows\SetupTools\Win32\Release\"
call del "packaging\windows\release\NC10GrafCrunch.exe"
