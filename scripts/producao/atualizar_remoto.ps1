param(
  [Parameter(Mandatory = $true)]
  [string]$ComputerName,
  [string]$ProjectDir = "C:\RH-Control",
  [string]$TaskName = "RHControl",
  [string]$Branch = "main",
  [string]$UserName,
  [string]$EnvFile = ".env.production",
  [string]$ComposeFile = "docker-compose.prod.yml"
)

$ErrorActionPreference = "Stop"

$credencial = $null

if ($UserName) {
  $credencial = Get-Credential -UserName $UserName -Message "Credenciais do computador de producao"
}

$scriptBlock = {
  param($ProjectDir, $TaskName, $Branch, $EnvFile, $ComposeFile)

  $ErrorActionPreference = "Stop"

  if (-not (Test-Path -LiteralPath $ProjectDir)) {
    throw "Pasta do projeto nao encontrada no servidor: $ProjectDir"
  }

  Set-Location -LiteralPath $ProjectDir

  git fetch origin
  git pull --ff-only origin $Branch

  docker compose --env-file $EnvFile -f $ComposeFile up -d --build

  $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

  if ($task) {
    Start-ScheduledTask -TaskName $TaskName
  }

  docker compose --env-file $EnvFile -f $ComposeFile ps
}

$params = @{
  ComputerName = $ComputerName
  ScriptBlock = $scriptBlock
  ArgumentList = @($ProjectDir, $TaskName, $Branch, $EnvFile, $ComposeFile)
}

if ($credencial) {
  $params.Credential = $credencial
}

Invoke-Command @params
