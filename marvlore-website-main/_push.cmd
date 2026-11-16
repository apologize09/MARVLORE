@echo off
cd /d "%~dp0"
echo START > _push-log.txt
git --version >> _push-log.txt 2>&1
if not exist .git git init >> _push-log.txt 2>&1
git remote remove origin >> _push-log.txt 2>&1
git remote add origin https://github.com/apologize09/MARVLORE.git >> _push-log.txt 2>&1
git remote -v >> _push-log.txt 2>&1
git add -A >> _push-log.txt 2>&1
git status -sb >> _push-log.txt 2>&1
git rev-parse --verify HEAD >nul 2>&1
if errorlevel 1 (
  git commit -m "Initial commit: MARVLORE website" >> _push-log.txt 2>&1
) else (
  git diff --cached --quiet
  if errorlevel 1 git commit -m "Sync local MARVLORE website" >> _push-log.txt 2>&1
)
git branch -M main >> _push-log.txt 2>&1
git push -u origin main >> _push-log.txt 2>&1
echo EXIT=%ERRORLEVEL% >> _push-log.txt
echo DONE. See _push-log.txt
type _push-log.txt
pause
