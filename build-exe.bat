@echo off
rem Crea Bingo.exe (solo Windows). Hay que volver a ejecutarlo si cambias index.html, style.css, script.js o los audios.
set CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
set ZIP=%TEMP%\bingo_audio.zip
if exist "%ZIP%" del "%ZIP%"
powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::CreateFromDirectory('%~dp0audio', '%ZIP%', 'Optimal', $true)"
"%CSC%" /nologo /target:winexe /out:"%~dp0Bingo.exe" /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll /resource:"%~dp0index.html",index.html /resource:"%~dp0style.css",style.css /resource:"%~dp0script.js",script.js /resource:"%ZIP%",audio.zip "%~dp0launcher\Launcher.cs"
if errorlevel 1 (echo ERROR) else (echo Listo: Bingo.exe)
