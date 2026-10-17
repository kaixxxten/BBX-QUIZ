@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "PS_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
set "BUILD_SCRIPT=%~dp0tools\Build-iPadPWA.ps1"

if not exist "%PS_EXE%" (
  echo ERROR: Windows PowerShell was not found.
  echo Path: %PS_EXE%
  echo.
  pause
  exit /b 10
)

if not exist "%BUILD_SCRIPT%" (
  echo ERROR: The iPad update script was not found.
  echo Path: %BUILD_SCRIPT%
  echo.
  pause
  exit /b 11
)

"%PS_EXE%" -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%BUILD_SCRIPT%"
set "EXIT_CODE=%ERRORLEVEL%"
echo.

if not "%EXIT_CODE%"=="0" (
  "%PS_EXE%" -NoLogo -NoProfile -NonInteractive -EncodedCommand VwByAGkAdABlAC0ASABvAHMAdAAgACIA9GawZTFZV2Ua/8uK5WcLdwpOuWUvk6SKCopvYAIwIgAgAC0ARgBvAHIAZQBnAHIAbwB1AG4AZABDAG8AbABvAHIAIABSAGUAZAA=
  echo Exit code: %EXIT_CODE%
  echo.
  pause
  exit /b %EXIT_CODE%
)

"%PS_EXE%" -NoLogo -NoProfile -NonInteractive -EncodedCommand VwByAGkAdABlAC0ASABvAHMAdAAgACIA9GawZYxbEGIa/+KW2n3HjJllB4LrX9ZTSHIsZ/Jd9GawZQIwIgAgAC0ARgBvAHIAZQBnAHIAbwB1AG4AZABDAG8AbABvAHIAIABHAHIAZQBlAG4A
echo.
pause
exit /b 0
