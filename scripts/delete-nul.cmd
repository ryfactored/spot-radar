@echo off
:: Deletes the 'nul' file which Windows sometimes creates incorrectly
:: Usage: scripts\delete-nul.cmd

del "\\?\%CD%\nul" 2>nul && echo Deleted nul file || echo No nul file found
