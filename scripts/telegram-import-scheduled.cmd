@echo off
rem Scheduled Telegram import on this computer (Windows Task Scheduler, every 3 hours).
rem Runs one import (collect -> Gemini -> upload to the site, status "moderation") and appends to logs\telegram-import.log.
cd /d "%~dp0.."
if not exist logs mkdir logs
echo ===== %date% %time% ===== >> "logs\telegram-import.log"
call npm.cmd run telegram:import >> "logs\telegram-import.log" 2>&1
echo exit code %errorlevel% >> "logs\telegram-import.log"
