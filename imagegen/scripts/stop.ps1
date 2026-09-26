<#
.SYNOPSIS
  start.ps1 で起動した imagegen の ComfyUI（既定 port 8288）を止め、ポートが空くまで待つ（冪等）。

.DESCRIPTION
  ComfyUI_img2 の scripts/stop.ps1 の型を借り、1 インスタンスに縮めた。
  止める対象は runtime\klein.json の pid・launcher_pid と、<Port> で待ち受けているプロセスの和集合。
  ただしコマンドラインが自分の物（ComfyUI\main.py … --port <Port>）に限る。別のプロセスなら止めずにエラーにする。
  何も動いていなければ何もせず 0 で終わる。

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File imagegen\scripts\stop.ps1
#>
[CmdletBinding()]
param(
    [int]$Port = 8288,
    [int]$TimeoutSec = 30
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Runtime = Join-Path $Root 'runtime'
$Name = 'klein'
$Pattern = "*ComfyUI\main.py*--port $Port*"

function Get-Listener([int]$port) { @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) }
function Test-Ours([int]$procId, [string]$pattern) {
    $p = Get-CimInstance Win32_Process -Filter "ProcessId=$procId" -ErrorAction SilentlyContinue
    return ($p -and ([string]$p.CommandLine) -like $pattern)
}
function Stop-Tree([int]$procId) {
    $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    try { & taskkill.exe /PID $procId /T /F 2>&1 | Out-Null } catch { }
    $ErrorActionPreference = $old
}

$pidFile  = Join-Path $Runtime "$Name.pid"
$jsonFile = Join-Path $Runtime "$Name.json"
$cands = New-Object System.Collections.Generic.List[int]
if (Test-Path $jsonFile) {
    try {
        $j = Get-Content -Raw -Encoding UTF8 $jsonFile | ConvertFrom-Json
        foreach ($x in @($j.pid, $j.launcher_pid)) { if ($x) { $cands.Add([int]$x) } }
    } catch { }
}
if (Test-Path $pidFile) { $t = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1); if ($t) { $cands.Add([int]$t.Trim()) } }
foreach ($l in @(Get-Listener $Port)) { $cands.Add([int]$l.OwningProcess) }

$failed = $false
$stopped = @()
foreach ($procId in ($cands | Sort-Object -Unique)) {
    if (-not (Get-Process -Id $procId -ErrorAction SilentlyContinue)) { continue }
    if (-not (Test-Ours $procId $Pattern)) {
        $isListener = @(@(Get-Listener $Port) | Where-Object { $_.OwningProcess -eq $procId }).Count -gt 0
        if ($isListener) {
            Write-Host "[NG]   ポート $Port の PID $procId は imagegen の物ではありません。止めません" -ForegroundColor Red
            $failed = $true
        }
        continue
    }
    Stop-Tree $procId
    $stopped += $procId
}

$deadline = (Get-Date).AddSeconds($TimeoutSec)
while ((@(Get-Listener $Port)).Count -gt 0 -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 300 }
if ((@(Get-Listener $Port)).Count -gt 0) {
    Write-Host "[NG]   $Name：ポート $Port がまだ使われています" -ForegroundColor Red
    $failed = $true
} else {
    Remove-Item -Force $pidFile, $jsonFile -ErrorAction SilentlyContinue
    if ($stopped.Count -gt 0) { Write-Host "[OK]   $Name を止めました（PID $($stopped -join ', ')）。ポート $Port は空いています" }
    else { Write-Host "[OK]   $Name は動いていません。ポート $Port は空いています" }
}
if ($failed) { exit 1 }
exit 0
