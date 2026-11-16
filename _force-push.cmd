@echo off
cd /d "%~dp0"
echo === cwd === > _force-push-log.txt
cd >> _force-push-log.txt
echo === remotes === >> _force-push-log.txt
git remote -v >> _force-push-log.txt 2>&1
if errorlevel 1 (
  echo No git repo here. Run git init first. >> _force-push-log.txt
  type _force-push-log.txt
  exit /b 1
)
git remote remove origin >> _force-push-log.txt 2>&1
git remote add origin https://github.com/apologize09/MARVLORE.git >> _force-push-log.txt 2>&1
git add -A >> _force-push-log.txt 2>&1
git status -sb >> _force-push-log.txt 2>&1
git rev-parse --verify HEAD >nul 2>&1
if errorlevel 1 (
  git commit -m "Replace remote with local marvlore-website-main tree" >> _force-push-log.txt 2>&1
) else (
  git diff --cached --quiet
  if errorlevel 1 git commit -m "Replace remote with local marvlore-website-main tree" >> _force-push-log.txt 2>&1
)
git branch -M main >> _force-push-log.txt 2>&1
echo === force push === >> _force-push-log.txt
git push --force -u origin main >> _force-push-log.txt 2>&1
echo EXIT=%ERRORLEVEL% >> _force-push-log.txt
type _force-push-log.txt
