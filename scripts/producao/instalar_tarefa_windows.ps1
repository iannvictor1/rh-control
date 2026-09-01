param(
  [string]$ProjectDir = "C:\RH-Control",
  [string]$TaskName = "RHControl",
  [ValidateSet("Startup", "Logon")]
  [string]$Trigger = "Startup",
  [string]$UserId = "SYSTEM"
)

$ErrorActionPreference = "Stop"

$scriptPath = Join-Path $PSScriptRoot "iniciar_rh_control.ps1"

if (-not (Test-Path -LiteralPath $scriptPath)) {
  throw "Script de inicializacao nao encontrado: $scriptPath"
}

if (-not (Test-Path -LiteralPath $ProjectDir)) {
  throw "Pasta do projeto nao encontrada: $ProjectDir"
}

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -ProjectDir `"$ProjectDir`""

if ($Trigger -eq "Logon") {
  $taskTrigger = New-ScheduledTaskTrigger -AtLogOn
} else {
  $taskTrigger = New-ScheduledTaskTrigger -AtStartup
}

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
  -MultipleInstances IgnoreNew `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -StartWhenAvailable

$principal = New-ScheduledTaskPrincipal `
  -UserId $UserId `
  -RunLevel Highest

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $taskTrigger `
  -Settings $settings `
  -Principal $principal `
  -Description "Inicia o RH Control com Docker Compose" `
  -Force | Out-Null

Start-ScheduledTask -TaskName $TaskName

Write-Host "Tarefa '$TaskName' instalada e iniciada."
Write-Host "Projeto: $ProjectDir"
Write-Host "Gatilho: $Trigger"
