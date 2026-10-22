$ErrorActionPreference = 'Stop'
$taskTool = 'node'
$taskToolArguments = @()
if ($args.Count -gt 0) {
    $taskTool = [string]$args[0]
    $taskToolArguments = @($args | Select-Object -Skip 1)
}
if ($taskTool -notin @('node', 'npm', 'pnpm')) { throw 'Tool must be node, npm, or pnpm' }
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskVersion = (Get-Content -LiteralPath (Join-Path $taskRoot '.node-version') -Raw).Trim()
if ($taskVersion -notmatch '^\d+\.\d+\.\d+$') { throw 'Invalid .node-version' }
$taskArch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString().ToLowerInvariant()
if ($taskArch -notin @('x64', 'arm64')) { throw "Unsupported Windows architecture: $taskArch" }
$taskRuntime = Join-Path $taskRoot ".cache/node-security/runtimes/node-v$taskVersion-win-$taskArch"
$taskNode = Join-Path $taskRuntime 'node.exe'
if (-not (Test-Path -LiteralPath $taskNode -PathType Leaf)) {
    throw "Portable Node.js $taskVersion is missing. See docs/NODE_SECURITY_UPDATE_2026-10-22.md."
}
$taskActual = & $taskNode --version
if ($LASTEXITCODE -ne 0 -or $taskActual -ne "v$taskVersion") { throw 'Portable Node.js version mismatch' }
$taskTools = Join-Path $taskRoot '.cache/node-security/tools/node_modules'
$taskArguments = @()
switch ($taskTool) {
    'npm' { $taskArguments += Join-Path $taskRuntime 'node_modules/npm/bin/npm-cli.js' }
    'pnpm' {
        $taskPnpm = Join-Path $taskTools 'pnpm/bin/pnpm.cjs'
        if (-not (Test-Path -LiteralPath $taskPnpm -PathType Leaf)) {
            throw 'Project-local pnpm is missing. See docs/NODE_SECURITY_UPDATE_2026-10-22.md.'
        }
        $taskArguments += $taskPnpm
    }
}
$taskArguments += $taskToolArguments
$taskPreviousPath = $env:Path
$taskPreviousStore = $env:npm_config_store_dir
$taskExit = 1
function ConvertTo-NodeArgument([string]$Value) {
    # Windows native argv quoting, including empty values and trailing slashes.
    $taskQuoted = [regex]::Replace($Value, '(\\*)"', {
        param($taskMatch)
        ('\' * (2 * $taskMatch.Groups[1].Value.Length + 1)) + '"'
    })
    $taskQuoted = [regex]::Replace($taskQuoted, '(\\+)$', '$1$1')
    return '"' + $taskQuoted + '"'
}
Push-Location -LiteralPath $taskRoot
try {
    # Only this process and its children use the portable runtime.
    $env:Path = "$taskRuntime;$(Join-Path $taskTools '.bin');$taskPreviousPath"
    $env:npm_config_store_dir = Join-Path $taskRoot '.cache/node-security/pnpm-store'
    $taskStart = New-Object System.Diagnostics.ProcessStartInfo
    $taskStart.FileName = $taskNode
    $taskStart.Arguments = (@($taskArguments | ForEach-Object { ConvertTo-NodeArgument ([string]$_) }) -join ' ')
    $taskStart.UseShellExecute = $false
    $taskStart.CreateNoWindow = $true
    $taskStart.RedirectStandardOutput = $true
    $taskStart.RedirectStandardError = $true
    $taskChild = New-Object System.Diagnostics.Process
    $taskStarted = $false
    try {
        $taskChild.StartInfo = $taskStart
        [void]$taskChild.Start()
        $taskStarted = $true
        $taskOutput = $taskChild.StandardOutput.BaseStream.CopyToAsync([Console]::OpenStandardOutput())
        $taskErrorOutput = $taskChild.StandardError.BaseStream.CopyToAsync([Console]::OpenStandardError())
        $taskChild.WaitForExit()
        [void]$taskOutput.GetAwaiter().GetResult()
        [void]$taskErrorOutput.GetAwaiter().GetResult()
        $taskExit = $taskChild.ExitCode
    }
    finally {
        if ($taskStarted -and -not $taskChild.HasExited) { $taskChild.Kill() }
        $taskChild.Dispose()
    }
}
finally {
    $env:Path = $taskPreviousPath
    $env:npm_config_store_dir = $taskPreviousStore
    Pop-Location
}
exit $taskExit
