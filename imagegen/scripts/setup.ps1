<#
.SYNOPSIS
  versions/ に固定した版から imagegen（Laterna の画像環境）を作り直す（冪等）。

.DESCRIPTION
  ComfyUI_img2 の scripts/setup.ps1 の型を借りた（D:\ComfyUI_img2、読み取り専用）。順に次の5つを「あれば検証だけ／無ければ作る」で処理する。
    1. Python   : versions/python.txt の版を uv で <root>\python に入れる（shim とレジストリには書かない）
    2. venv     : <root>\.venv
    3. ComfyUI  : versions/comfyui.txt のタグで <root>\ComfyUI に clone（custom_nodes は触らない）
    4. パッケージ: versions/requirements.lock と uv pip freeze を突き合わせ、差があれば uv pip sync
    5. モデル   : versions/models.json の各ファイルを <root>\models\<subfolder> に置く。
                  local_source（手元の同じファイル）があればコピー、無ければ url から取得。バイト数と sha256 を検証

  キャッシュとテンポラリはすべて <root>\.cache の下に向ける。<root> の外には書かない。
  前提：uv と git が PATH にあること。curl.exe は Windows 標準の物を使う。

.PARAMETER VerifyOnly
  何も作らず、取得もしない。既存物の検証だけを行い、足りない物・食い違う物を報告する。

.PARAMETER SkipModelHash
  モデルの sha256 を計算せず、バイト数だけで検証する（速いが弱い）。

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File imagegen\scripts\setup.ps1 -VerifyOnly
  powershell -ExecutionPolicy Bypass -File imagegen\scripts\setup.ps1
#>
[CmdletBinding()]
param(
    [switch]$VerifyOnly,
    [switch]$SkipModelHash
)

$ErrorActionPreference = 'Continue'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root

# ---- 取得元 ----
$TorchIndex = 'https://download.pytorch.org/whl/cu130'
$PypiIndex  = 'https://pypi.org/simple'
$ComfyRepo  = 'https://github.com/comfyanonymous/ComfyUI'

# ---- キャッシュ・テンポラリを imagegen の中に向ける ----
$Cache = Join-Path $Root '.cache'
$env:UV_CACHE_DIR          = Join-Path $Cache 'uv'
$env:UV_PYTHON_INSTALL_DIR = Join-Path $Root  'python'
$env:UV_PYTHON_BIN_DIR     = Join-Path $Cache 'uvbin'
$env:UV_TOOL_DIR           = Join-Path $Cache 'uvtool'
$env:UV_TOOL_BIN_DIR       = Join-Path $Cache 'uvtool\bin'
$env:UV_PYTHON_PREFERENCE  = 'only-managed'
$env:UV_PYTHON_DOWNLOADS   = 'manual'
$env:UV_NO_CONFIG          = '1'
$env:HF_HOME               = Join-Path $Cache 'hf'
$env:PIP_CACHE_DIR         = Join-Path $Cache 'pip'
$env:TEMP                  = Join-Path $Cache 'tmp'
$env:TMP                   = $env:TEMP
Remove-Item Env:VIRTUAL_ENV -ErrorAction SilentlyContinue
foreach ($d in @($env:UV_CACHE_DIR, $env:HF_HOME, $env:PIP_CACHE_DIR, $env:TEMP)) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
}

$script:Failures = New-Object System.Collections.Generic.List[string]
function Ok($msg)   { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Info($msg) { Write-Host "[..]   $msg" }
function Fail($msg) { Write-Host "[NG]   $msg" -ForegroundColor Red; $script:Failures.Add($msg) }

function Read-Pin($name) {
    $p = Join-Path $Root "versions\$name"
    if (-not (Test-Path $p)) { throw "versions\$name がありません" }
    return (Get-Content -Raw -Encoding UTF8 $p).Trim()
}

foreach ($cmd in @('uv', 'git')) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "$cmd が PATH にありません" }
}

$PyVersion  = Read-Pin 'python.txt'
$ComfyTag   = Read-Pin 'comfyui.txt'
$LockPath   = Join-Path $Root 'versions\requirements.lock'
$ModelsJson = Get-Content -Raw -Encoding UTF8 (Join-Path $Root 'versions\models.json') | ConvertFrom-Json
$VenvPy     = Join-Path $Root '.venv\Scripts\python.exe'

# ================= 1. Python =================
Write-Host "`n== 1. Python $PyVersion =="
$found = (& uv python find $PyVersion --system 2>$null)
if ($LASTEXITCODE -eq 0 -and $found -and $found.StartsWith($env:UV_PYTHON_INSTALL_DIR, [StringComparison]::OrdinalIgnoreCase)) {
    Ok "Python $PyVersion : $found"
} elseif ($VerifyOnly) {
    Fail "Python $PyVersion が $($env:UV_PYTHON_INSTALL_DIR) にありません"
} else {
    Info "uv python install $PyVersion"
    & uv python install $PyVersion --no-bin --no-registry
    if ($LASTEXITCODE -eq 0) { Ok "Python $PyVersion を入れました" } else { Fail "uv python install に失敗しました" }
}

# ================= 2. venv =================
Write-Host "`n== 2. venv =="
$venvOk = $false
if (Test-Path $VenvPy) {
    $v = (& $VenvPy -c "import platform;print(platform.python_version())").Trim()
    if ($v -eq $PyVersion) { Ok ".venv（Python $v）"; $venvOk = $true }
    else { Fail ".venv の Python が $v で、固定値 $PyVersion と違います（作り直すには .venv を手で消してから再実行）" }
} elseif ($VerifyOnly) {
    Fail ".venv がありません"
} else {
    & uv venv (Join-Path $Root '.venv') --python $PyVersion
    if ($LASTEXITCODE -eq 0) { Ok ".venv を作りました"; $venvOk = $true } else { Fail "uv venv に失敗しました" }
}

# ================= 3. ComfyUI =================
Write-Host "`n== 3. ComfyUI $ComfyTag =="
$ComfyDir = Join-Path $Root 'ComfyUI'
if (-not (Test-Path (Join-Path $ComfyDir '.git'))) {
    if ($VerifyOnly) { Fail "ComfyUI がありません" }
    else {
        & git -c advice.detachedHead=false clone --branch $ComfyTag --depth 1 $ComfyRepo $ComfyDir
        if ($LASTEXITCODE -ne 0) { Fail "git clone に失敗しました" }
    }
}
if (Test-Path (Join-Path $ComfyDir '.git')) {
    $tag = (& git -C $ComfyDir describe --tags --exact-match 2>$null)
    if ($tag -eq $ComfyTag) { Ok "タグ $tag（$((& git -C $ComfyDir rev-parse HEAD)))" }
    else { Fail "ComfyUI のタグが '$tag' で、固定値 $ComfyTag と違います" }

    # custom_nodes は versions/custom_nodes.json に固定した物だけ（いまは 0 本＝upstream のまま）
    $cn = (& git -C $ComfyDir status --porcelain --ignored --untracked-files=all -- custom_nodes)
    if ([string]::IsNullOrWhiteSpace(($cn -join ''))) { Ok "custom_nodes は upstream のまま（固定した追加ノード 0 本）" }
    else { Fail "custom_nodes に upstream と違う物があります（versions/custom_nodes.json に固定してから足すこと）：`n$($cn -join "`n")" }

    $dirty = (& git -C $ComfyDir status --porcelain --untracked-files=no)
    if ([string]::IsNullOrWhiteSpace(($dirty -join ''))) { Ok "ComfyUI の追跡ファイルに変更なし" }
    else { Fail "ComfyUI の追跡ファイルが変更されています：`n$($dirty -join "`n")" }
}

# ================= 4. パッケージ =================
Write-Host "`n== 4. パッケージ（versions\requirements.lock） =="
function Get-Freeze {
    $out = (& uv pip freeze --python $VenvPy)
    return @($out | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' } | Sort-Object)
}
function Get-LockDiff($lock) {
    $have = New-Object 'System.Collections.Generic.HashSet[string]'
    foreach ($x in @(Get-Freeze)) { [void]$have.Add($x) }
    $want = New-Object 'System.Collections.Generic.HashSet[string]'
    foreach ($x in $lock) { [void]$want.Add($x) }
    $d = New-Object System.Collections.Generic.List[string]
    foreach ($x in $want) { if (-not $have.Contains($x)) { $d.Add("- $x") } }
    foreach ($x in $have) { if (-not $want.Contains($x)) { $d.Add("+ $x") } }
    return ,$d
}
if ($venvOk) {
    $lock = @(Get-Content -Encoding UTF8 $LockPath | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' -and -not $_.StartsWith('#') } | Sort-Object)
    $diff = Get-LockDiff $lock
    if ($diff.Count -eq 0) { Ok "ロックと一致（$($lock.Count) 件）" }
    elseif ($VerifyOnly) {
        Fail "ロックと差があります（$($diff.Count) 件）：`n$(($diff | ForEach-Object { "  $_" }) -join "`n")"
    } else {
        Info "uv pip sync（PyPI ＋ download.pytorch.org cu130）"
        & uv pip sync $LockPath --python $VenvPy --index-url $PypiIndex --extra-index-url $TorchIndex --index-strategy unsafe-best-match
        if ($LASTEXITCODE -ne 0) { Fail "uv pip sync に失敗しました" }
        elseif ((Get-LockDiff $lock).Count -gt 0) { Fail "sync 後もロックと差があります：`n$((Get-LockDiff $lock) -join "`n")" }
        else { Ok "ロックどおりに入れました（$($lock.Count) 件）" }
    }
    $cuda = (& $VenvPy -c "import torch;print(torch.__version__, torch.cuda.is_available(), torch.cuda.device_count())" 2>$null)
    Info "torch / CUDA 可否 / GPU 枚数 : $cuda"
} else {
    Fail "venv が無いのでパッケージを検証できません"
}

# ================= 5. モデル =================
Write-Host "`n== 5. モデル（versions\models.json） =="
$ModelsRoot = Join-Path $Root $ModelsJson.models_root
foreach ($f in $ModelsJson.files) {
    $dir = Join-Path $ModelsRoot $f.subfolder
    $dst = Join-Path $dir $f.name
    $label = "$($f.subfolder)\$($f.name)"
    if (-not (Test-Path $dst)) {
        if ($VerifyOnly) { Fail "$label がありません"; continue }
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
        $part = "$dst.part"
        $src = [string]$f.local_source
        if ($src -and (Test-Path $src) -and ((Get-Item $src).Length -eq [int64]$f.bytes)) {
            Info "コピー $label（$($f.bytes) B）← $src"
            Copy-Item -Force $src $part
        } else {
            Info "取得 $label（$($f.bytes) B）← $($f.url)"
            & curl.exe -L --fail --retry 5 --retry-delay 5 -C - -o $part $f.url
            if ($LASTEXITCODE -ne 0) { Fail "$label の取得に失敗しました（curl $LASTEXITCODE。再実行で続きから取る）"; continue }
        }
        $sz = (Get-Item $part).Length
        if ($sz -ne [int64]$f.bytes) { Fail "$label のバイト数が $sz で、期待値 $($f.bytes) と違います（.part を残しています）"; continue }
        $h = (Get-FileHash -Algorithm SHA256 $part).Hash.ToLower()
        if ($h -ne $f.sha256) { Fail "$label の sha256 が一致しません：$h（.part を残しています）"; continue }
        Move-Item -Force $part $dst
        Ok "$label 配置・sha256 一致"
        continue
    }
    $sz = (Get-Item $dst).Length
    if ($sz -ne [int64]$f.bytes) { Fail "$label のバイト数が $sz で、期待値 $($f.bytes) と違います"; continue }
    if ($SkipModelHash) { Ok "$label（バイト数のみ一致。sha256 は省略）"; continue }
    $h = (Get-FileHash -Algorithm SHA256 $dst).Hash.ToLower()
    if ($h -eq $f.sha256) { Ok "$label sha256 一致" }
    else { Fail "$label の sha256 が一致しません：$h（期待値 $($f.sha256)）" }
}

# ================= まとめ =================
Write-Host ""
if ($script:Failures.Count -eq 0) {
    Write-Host "すべて一致しました。" -ForegroundColor Green
    exit 0
} else {
    Write-Host "$($script:Failures.Count) 件の問題があります：" -ForegroundColor Red
    $script:Failures | ForEach-Object { Write-Host "  - $_" }
    exit 1
}
