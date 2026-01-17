@echo off
echo === Quick Sync to GitHub (Windows) ===
echo Adding all files...
git add .

set /p msg="Enter a description of your changes (Press Enter for default 'Update'): "
if "%msg%"=="" set msg="Update code"

echo Committing with message: "%msg%"...
git commit -m "%msg%"

echo Pushing to GitHub...
git push

echo.
echo ✅ Success! Code is now on GitHub.
pause
