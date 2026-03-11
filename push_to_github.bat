@echo off
echo ========================================
echo  3D INVENZA — GitHub Push Script
echo ========================================

:: Find git in common locations
set GIT=
if exist "C:\Program Files\Git\cmd\git.exe" set GIT="C:\Program Files\Git\cmd\git.exe"
if exist "C:\Program Files\Git\bin\git.exe" set GIT="C:\Program Files\Git\bin\git.exe"
if exist "C:\Program Files (x86)\Git\cmd\git.exe" set GIT="C:\Program Files (x86)\Git\cmd\git.exe"
if exist "D:\Program Files\Git\cmd\git.exe" set GIT="D:\Program Files\Git\cmd\git.exe"
if exist "D:\Git\cmd\git.exe" set GIT="D:\Git\cmd\git.exe"

:: Try git from PATH
if not defined GIT (
    git --version >nul 2>&1 && set GIT=git
)

if not defined GIT (
    echo ERROR: git.exe not found! Please open Git Bash and run:
    echo   git init
    echo   git remote add origin https://github.com/kushaldoshi26/3D_INVENZA.git
    echo   git add .
    echo   git commit -m "3D INVENZA - Full Project"
    echo   git push -u origin main -f
    pause
    exit /b 1
)

echo Found git: %GIT%
echo.

:: Init if needed
%GIT% rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo Initializing git repository...
    %GIT% init
    %GIT% branch -M main
)

:: Configure remote
%GIT% remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Adding remote origin...
    %GIT% remote add origin https://github.com/kushaldoshi26/3D_INVENZA.git
) else (
    echo Updating remote origin...
    %GIT% remote set-url origin https://github.com/kushaldoshi26/3D_INVENZA.git
)

:: Create .gitignore if missing
if not exist .gitignore (
    echo Creating .gitignore...
    (
        echo node_modules/
        echo .env
        echo *.log
        echo backend/database.json
        echo backend-new/*.db
        echo .DS_Store
        echo Thumbs.db
    ) > .gitignore
)

:: Stage all files
echo.
echo Staging all files...
%GIT% add -A

:: Commit
echo.
echo Committing...
%GIT% commit -m "3D INVENZA - Full Project with Hologram Fix"

:: Push
echo.
echo Pushing to GitHub...
%GIT% push -u origin main -f

echo.
echo ========================================
if errorlevel 1 (
    echo PUSH FAILED — Check output above.
    echo If asked for credentials, use your GitHub token as the password.
) else (
    echo SUCCESS! Project pushed to:
    echo https://github.com/kushaldoshi26/3D_INVENZA
)
echo ========================================
pause
