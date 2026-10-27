@echo off
rem Crea Bingo.exe (solo Windows). Hay que volver a ejecutarlo si cambias index.html, style.css o script.js.
set CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
"%CSC%" /nologo /target:winexe /out:"%~dp0Bingo.exe" /resource:"%~dp0index.html",index.html /resource:"%~dp0style.css",style.css /resource:"%~dp0script.js",script.js "%~dp0launcher\Launcher.cs"
if errorlevel 1 (echo ERROR) else (echo Listo: Bingo.exe)
