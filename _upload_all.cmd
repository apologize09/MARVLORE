@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set LOG=%~dp0_upload_all_log.txt

echo === start %DATE% %TIME% === > "%LOG%"
echo cwd=>> "%LOG%"
cd >> "%LOG%"

where git >> "%LOG%" 2>&1
git --version >> "%LOG%" 2>&1
if errorlevel 1 (
  echo Git not found. Install Git for Windows first. >> "%LOG%"
  type "%LOG%"
  exit /b 1
)

REM Nested .git makes Git treat the folder as a submodule/gitlink (empty on GitHub).
if exist "marvlore-website-main\.git" (
  echo Removing nested .git in marvlore-website-main >> "%LOG%"
  rmdir /s /q "marvlore-website-main\.git" >> "%LOG%" 2>&1
)
if exist "cms-strapi-main\.git" (
  echo Removing nested .git in cms-strapi-main >> "%LOG%"
  rmdir /s /q "cms-strapi-main\.git" >> "%LOG%" 2>&1
)

if not exist ".git" (
  echo INIT_REPO >> "%LOG%"
  git init >> "%LOG%" 2>&1
)

echo === remotes before === >> "%LOG%"
git remote -v >> "%LOG%" 2>&1

git remote remove origin >> "%LOG%" 2>&1
git remote add origin git@github.com:apologize09/MARVLORE.git >> "%LOG%" 2>&1
echo === remotes after === >> "%LOG%"
git remote -v >> "%LOG%" 2>&1

echo === add === >> "%LOG%"
git add -A >> "%LOG%" 2>&1
git status -sb >> "%LOG%" 2>&1

git rev-parse --verify HEAD >nul 2>&1
if errorlevel 1 (
  echo === first commit === >> "%LOG%"
  git commit -m "Upload full MARVLORE project: website + Strapi CMS" >> "%LOG%" 2>&1
) else (
  git diff --cached --quiet
  if errorlevel 1 (
    echo === commit changes === >> "%LOG%"
    git commit -m "Upload full MARVLORE project: website + Strapi CMS" >> "%LOG%" 2>&1
  ) else (
    echo === no staged changes === >> "%LOG%"
  )
)

git branch -M main >> "%LOG%" 2>&1
echo === force push === >> "%LOG%"
git push --force -u origin main >> "%LOG%" 2>&1
set PUSH_EXIT=%ERRORLEVEL%
echo EXIT=%PUSH_EXIT% >> "%LOG%"
echo === done %DATE% %TIME% === >> "%LOG%"

type "%LOG%"
echo.
if not "%PUSH_EXIT%"=="0" (
  echo Push failed. If SSH key is missing, try:
  echo   git remote set-url origin https://github.com/apologize09/MARVLORE.git
  echo   git push --force -u origin main
)
endlocal & exit /b %PUSH_EXIT%
