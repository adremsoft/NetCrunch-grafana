@ECHO OFF
SET CurrentDir=%cd%

echo BUILDING GrafCrunch Server
call go run build.go build
call :CheckError "COMPILE GRAFCRUNCH SERVER"

echo BUILDING GrafCrunch Client
rem call grunt release
call yarn install
call :CheckError "GRAFCRUNCH CLIENT"
call yarn build
call :CheckError "GRAFCRUNCH CLIENT"

goto EndOfScript

:CheckError
  if %ERRORLEVEL% NEQ 0 goto BuildError
goto :eof

:BuildError
  @SET MESSAGE=%~1
  ECHO BUILD ERROR: %MESSAGE%
  call cd %CurrentDir%
  EXIT 1
goto :eof

:EndOfScript
