$npmPath  = 'C:\Users\akinrodolu.olajide\AppData\Roaming\npm'
$dartExe  = 'C:\src\flutter\bin\dart.bat'
$snapshot = 'C:\Users\akinrodolu.olajide\AppData\Local\Pub\Cache\global_packages\flutterfire_cli\bin\flutterfire.dart-3.5.0.snapshot'

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName        = $dartExe
$psi.Arguments       = "`"$snapshot`" configure --yes --project=patchwork-9e85d --platforms=android,ios"
$psi.WorkingDirectory = 'C:\Users\akinrodolu.olajide\Downloads\PATCHWORK\apps\mobile'
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError  = $true

# Inject npm into the PATH so the dart subprocess can find firebase.cmd
$psi.EnvironmentVariables['PATH'] = $npmPath + ';' + $psi.EnvironmentVariables['PATH']

Write-Host "Starting flutterfire with npm on PATH..."
Write-Host "PATH prefix: $npmPath"
Write-Host "dart: $dartExe"

$p   = [System.Diagnostics.Process]::Start($psi)
$out = $p.StandardOutput.ReadToEnd()
$err = $p.StandardError.ReadToEnd()
$p.WaitForExit()

Write-Host "=== STDOUT ==="
Write-Host $out
Write-Host "=== STDERR ==="
Write-Host $err
Write-Host "=== Exit code: $($p.ExitCode) ==="
