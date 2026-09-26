<#
.SYNOPSIS
  imagegen の ComfyUI（klein 4B、1 インスタンス）をバックグラウンドで起動し、/system_stats が応答するまで待つ（冪等）。

.DESCRIPTION
  ComfyUI_img2 の scripts/start.ps1 の型を借り、1 インスタンスに縮めた。
    待ち受け : 127.0.0.1:<Port>（既定 8288。img2 の 8188／8189 とは衝突しない）
    GPU      : --cuda-device <CudaDevice>（既定 1）。klein 4B fp8 ＋ qwen_3_4b で約 12 GB 使うので、
               同じ GPU で img2 のインスタンスと同時には動かさない
    共通     : --models-directory models、--base-directory runtime\klein、API ノード無効、ブラウザを開かない、プレビュー無し
  - すでに自分のインスタンスが応答していれば、何もしない（冪等）
  - ポートを別のプロセスが使っていたら、止めずにエラーにする
  - ログは logs\klein.log と logs\klein.err.log。前回分は *.prev.log に退避
  - PID は runtime\klein.pid、詳細は runtime\klein.json

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File imagegen\scripts\start.ps1
  powershell -ExecutionPolicy Bypass -File imagegen\scripts\start.ps1 -CudaDevice 0
  powershell -ExecutionPolicy Bypass -File imagegen\scripts\stop.ps1
#>
[CmdletBinding()]
param(
    [int]$Port = 8288,
    [int]$CudaDevice = 1,
    [string[]]$ExtraArgs = @(),
    [int]$TimeoutSec = 300
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root

$Name    = 'klein'
$Py      = Join-Path $Root '.venv\Scripts\python.exe'
$Main    = Join-Path $Root 'ComfyUI\main.py'
$Models  = Join-Path $Root 'models'
$Logs    = Join-Path $Root 'logs'
$Runtime = Join-Path $Root 'runtime'
$Cache   = Join-Path $Root '.cache'

foreach ($p in @($Py, $Main, $Models)) { if (-not (Test-Path $p)) { throw "$p がありません（scripts\setup.ps1 を先に）" } }

$env:CUDA_DEVICE_ORDER = 'PCI_BUS_ID'
$env:HF_HOME           = Join-Path $Cache 'hf'
$env:UV_CACHE_DIR      = Join-Path $Cache 'uv'
$env:PIP_CACHE_DIR     = Join-Path $Cache 'pip'
$env:TEMP              = Join-Path $Cache 'tmp'
$env:TMP               = $env:TEMP
$env:CUDA_CACHE_PATH   = Join-Path $Cache 'nv'
$env:PYTHONUNBUFFERED  = '1'
$env:PYTHONNOUSERSITE  = '1'
Remove-Item Env:VIRTUAL_ENV, Env:PYTHONPATH, Env:CUDA_VISIBLE_DEVICES -ErrorAction SilentlyContinue
foreach ($d in @($Logs, $Runtime, $env:HF_HOME, $env:UV_CACHE_DIR, $env:PIP_CACHE_DIR, $env:TEMP, $env:CUDA_CACHE_PATH)) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
}

function Write-Json($obj, [string]$path) {
    [IO.File]::WriteAllText($path, ($obj | ConvertTo-Json -Depth 5), (New-Object Text.UTF8Encoding($false)))
}
function Get-Listener([int]$port) { @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) }
function Get-CmdLine([int]$procId) {
    $p = Get-CimInstance Win32_Process -Filter "ProcessId=$procId" -ErrorAction SilentlyContinue
    if ($p) { return [string]$p.CommandLine } else { return $null }
}
function Test-Ours([int]$procId, [int]$port) {
    $cl = Get-CmdLine $procId
    return ($cl -and $cl -like '*ComfyUI\main.py*' -and $cl -like "*--port $port*")
}
function Test-Api([int]$port) {
    try { return Invoke-RestMethod -Uri "http://127.0.0.1:$port/system_stats" -TimeoutSec 3 -UseBasicParsing }
    catch { return $null }
}
function Show-Tail($path) {
    if (Test-Path $path) { Get-Content -Tail 25 -Encoding UTF8 $path | ForEach-Object { Write-Host "    $_" } }
}

$pidFile  = Join-Path $Runtime "$Name.pid"
$jsonFile = Join-Path $Runtime "$Name.json"
$listen   = @(Get-Listener $Port)

if ($listen.Count -gt 0) {
    $lp = [int]$listen[0].OwningProcess
    if ((Test-Ours $lp $Port) -and (Test-Api $Port)) {
        Write-Host "[OK]   $Name はすでに 127.0.0.1:$Port で動いています（PID $lp）"
        Set-Content -Encoding ASCII -Path $pidFile -Value $lp
        exit 0
    }
    $pname = (Get-Process -Id $lp -ErrorAction SilentlyContinue).ProcessName
    Write-Host "[NG]   ポート $Port を別のプロセスが使っています（PID $lp $pname）。止めずに中断します" -ForegroundColor Red
    exit 1
}

$proc = $null
if (Test-Path $jsonFile) {
    $old = [IO.File]::ReadAllText($jsonFile) | ConvertFrom-Json
    if ($old.launcher_pid -and (Get-Process -Id $old.launcher_pid -ErrorAction SilentlyContinue) -and (Test-Ours $old.launcher_pid $Port)) {
        Write-Host "[..]   $Name は起動中です（起動元 PID $($old.launcher_pid)）。応答を待ちます"
        $proc = Get-Process -Id $old.launcher_pid
        $log = $old.log; $err = $old.err_log
    } else {
        Remove-Item -Force $jsonFile, $pidFile -ErrorAction SilentlyContinue
    }
}

if (-not $proc) {
    $base = Join-Path $Runtime $Name
    # ComfyUI は base-directory の下に custom_nodes が無いと起動時の走査で落ちる（img2 は --disable-all-custom-nodes で飛ばしていた）
    foreach ($d in @($base, (Join-Path $base 'custom_nodes'))) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null } }
    $log = Join-Path $Logs "$Name.log"
    $err = Join-Path $Logs "$Name.err.log"
    foreach ($f in @($log, $err)) {
        if (Test-Path $f) { Move-Item -Force $f ($f -replace '\.log$', '.prev.log') }
    }
    $argList = @(
        "`"$Main`"",
        '--listen', '127.0.0.1', '--port', "$Port", '--cuda-device', "$CudaDevice",
        '--base-directory', "`"$base`"", '--models-directory', "`"$Models`"",
        '--disable-api-nodes', '--disable-auto-launch',
        '--preview-method', 'none', '--log-stdout'
    ) + @($ExtraArgs | Where-Object { $_ })
    $cmdLine = "`"`"$Py`" $($argList -join ' ') > `"$log`" 2> `"$err`"`""
    $proc = Start-Process -FilePath "$env:SystemRoot\System32\cmd.exe" -ArgumentList '/d', '/c', $cmdLine `
        -WorkingDirectory $Root -WindowStyle Hidden -PassThru
    Write-Host "[..]   $Name を起動しました（起動元 PID $($proc.Id)、GPU $CudaDevice、port $Port）"
    $info = [ordered]@{
        name = $Name; port = $Port; cuda_device = $CudaDevice; launcher_pid = $proc.Id; pid = $null
        python = $Py; args = ($argList -join ' '); log = $log; err_log = $err
        started_at = (Get-Date).ToString('o')
    }
    Write-Json $info $jsonFile
}

# ---- 応答待ち ----
$deadline = (Get-Date).AddSeconds($TimeoutSec)
while ((Get-Date) -lt $deadline) {
    $stats = Test-Api $Port
    if ($stats) {
        $listen = @(Get-Listener $Port)
        $lp = [int]$listen[0].OwningProcess
        $addrs = @(Get-NetTCPConnection -OwningProcess $lp -State Listen -ErrorAction SilentlyContinue | ForEach-Object { "$($_.LocalAddress):$($_.LocalPort)" })
        $j = [IO.File]::ReadAllText($jsonFile) | ConvertFrom-Json
        $j.pid = $lp
        $j | Add-Member -Force -NotePropertyName ready_at -NotePropertyValue (Get-Date).ToString('o')
        $j | Add-Member -Force -NotePropertyName listen -NotePropertyValue $addrs
        $j | Add-Member -Force -NotePropertyName pytorch_version -NotePropertyValue $stats.system.pytorch_version
        $j | Add-Member -Force -NotePropertyName comfyui_version -NotePropertyValue $stats.system.comfyui_version
        Write-Json $j $jsonFile
        Set-Content -Encoding ASCII -Path $pidFile -Value $lp
        $bad = @($addrs | Where-Object { -not $_.StartsWith('127.0.0.1:') })
        if ($bad.Count -gt 0) { Write-Host "[NG]   $Name が 127.0.0.1 以外でも待ち受けています：$($bad -join ', ')" -ForegroundColor Red; exit 1 }
        Write-Host "[OK]   $Name 応答あり：PID $lp、待ち受け $($addrs -join ', ')、$($stats.devices[0].name)"
        Write-Host "起動済み：http://127.0.0.1:$Port" -ForegroundColor Green
        exit 0
    }
    if ($proc.HasExited) {
        Write-Host "[NG]   $Name が終了しました（終了コード $($proc.ExitCode)）。ログの末尾：" -ForegroundColor Red
        Show-Tail $log; Show-Tail $err
        exit 1
    }
    Start-Sleep -Milliseconds 1000
}
Write-Host "[NG]   $Name が $TimeoutSec 秒以内に応答しませんでした。ログの末尾：" -ForegroundColor Red
Show-Tail $log; Show-Tail $err
exit 1
