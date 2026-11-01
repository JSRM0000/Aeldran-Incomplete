@echo off
chcp 65001 >nul 2>nul
setlocal
title 艾尔德兰 · Aeldran
cd /d "%~dp0"

set "PORT=5173"
set "URL=http://127.0.0.1:%PORT%/"

echo.
echo  ============================================================
echo    AELDRAN  /  艾 尔 德 兰
echo    以文字为墨 · 以抉择为刃
echo  ============================================================
echo.

rem ---------- 1. 环境检查 ----------
where node >nul 2>nul
if errorlevel 1 goto :no_node

where npm >nul 2>nul
if errorlevel 1 goto :no_node

echo [1/4] 已检测到 Node.js
for /f "delims=" %%v in ('node -v') do echo        版本 %%v

rem ---------- 2. 依赖检查 ----------
if not exist "node_modules\" goto :install
echo [2/4] 依赖已就绪
goto :port

:install
echo [2/4] 首次运行，正在安装依赖（约需 1 分钟）...
call npm install --no-audit --no-fund
if errorlevel 1 goto :install_failed

rem ---------- 3. 端口检查 ----------
:port
netstat -ano | findstr /c:":%PORT%" | findstr /c:"LISTENING" >nul 2>nul
if not errorlevel 1 goto :already_running
echo [3/4] 正在启动本地服务器...
start "Aeldran Dev Server" /min cmd /c "npm run dev -- --port %PORT% --strictPort"
goto :wait

:already_running
echo [3/4] 检测到本地服务器已在运行，直接打开界面
goto :open

rem ---------- 4. 等待服务就绪 ----------
:wait
echo        等待界面就绪（最长 60 秒）...
powershell -NoProfile -Command "$end=(Get-Date).AddSeconds(60); while((Get-Date) -lt $end){ try{ $c=New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1',%PORT%); $c.Close(); exit 0 }catch{ Start-Sleep -Milliseconds 400 } }; exit 1"
if errorlevel 1 goto :timeout

:open
echo [4/4] 正在打开浏览器...
start "" "%URL%"
echo.
echo  已启动。关闭标题为「Aeldran Dev Server」的窗口即可结束游戏。
echo  若浏览器未自动打开，请手动访问：%URL%
echo.
timeout /t 3 /nobreak >nul
exit /b 0

rem ---------- 异常分支 ----------
:no_node
echo.
echo  [!] 未找到 Node.js。
echo      本作需要 Node.js 18 或更高版本才能运行。
echo      请到 https://nodejs.org/ 下载安装后重新双击本文件。
echo.
pause
exit /b 1

:install_failed
echo.
echo  [!] 依赖安装失败，请检查网络连接后重试。
echo.
pause
exit /b 1

:timeout
echo.
echo  [!] 服务器启动超时。请查看「Aeldran Dev Server」窗口中的报错信息。
echo      常见原因：%PORT% 端口被占用，或依赖未正确安装。
echo.
pause
exit /b 1
