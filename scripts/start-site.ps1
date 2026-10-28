param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path -Parent $PSScriptRoot
$siteUrl = 'http://127.0.0.1:5173/'
$logDirectory = Join-Path $siteRoot '.previews'
$outputLog = Join-Path $logDirectory 'server-output.log'
$errorLog = Join-Path $logDirectory 'server-error.log'

function Get-SiteResponse {
    try {
        return Invoke-WebRequest -Uri $siteUrl -UseBasicParsing -TimeoutSec 2
    } catch {
        return $null
    }
}

function Test-OurSite($Response) {
    return $null -ne $Response -and $Response.StatusCode -eq 200 -and $Response.Content.Contains('DING HAOXUAN')
}

try {
    $response = Get-SiteResponse
    if (Test-OurSite $response) {
        Write-Host "网站已经在运行：$siteUrl"
        if (-not $NoBrowser) { Start-Process $siteUrl }
        exit 0
    }
    if ($null -ne $response) {
        throw '5173 端口正被其他网站使用，请先关闭占用该端口的程序。'
    }

    $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($null -eq $nodeCommand) {
        throw '未找到 Node.js。请安装 Node.js 后重新双击“启动网站.cmd”。'
    }

    $vitePath = Join-Path $siteRoot 'node_modules\vite\bin\vite.js'
    if (-not (Test-Path -LiteralPath $vitePath)) {
        $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
        if ($null -eq $npmCommand) { throw '未找到 npm，请重新安装 Node.js。' }
        Write-Host '首次启动，正在安装网站依赖……'
        Push-Location $siteRoot
        try {
            & $npmCommand.Source ci
            if ($LASTEXITCODE -ne 0) { throw '依赖安装失败，请检查网络后重试。' }
        } finally {
            Pop-Location
        }
    }

    New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
    Write-Host '正在启动网站……'
    $server = Start-Process -FilePath $nodeCommand.Source `
        -ArgumentList @(('"{0}"' -f $vitePath), '--host', '127.0.0.1', '--port', '5173', '--strictPort') `
        -WorkingDirectory $siteRoot -WindowStyle Hidden `
        -RedirectStandardOutput $outputLog -RedirectStandardError $errorLog -PassThru

    $deadline = (Get-Date).AddSeconds(25)
    do {
        $response = Get-SiteResponse
        if (Test-OurSite $response) {
            Write-Host "网站已启动：$siteUrl"
            Write-Host '网站在后台运行，关闭此窗口不会停止网站；重启电脑后请再次双击启动。'
            if (-not $NoBrowser) { Start-Process $siteUrl }
            exit 0
        }
        if ($server.HasExited) {
            $details = Get-Content -LiteralPath $errorLog -Tail 12 -ErrorAction SilentlyContinue
            throw ("网站进程已退出。`n" + ($details -join "`n"))
        }
        Start-Sleep -Milliseconds 250
    } while ((Get-Date) -lt $deadline)

    throw "启动超时。请查看日志：$errorLog"
} catch {
    Write-Host ("启动失败：" + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
