@echo off
echo Starting Backend...
cd sashvi-studio-suite-main\backend
start /B npm run dev > ..\..\backend.log 2>&1
echo Starting Frontend...
cd ..
start /B npm run dev > ..\frontend.log 2>&1
echo Both servers started in background!
