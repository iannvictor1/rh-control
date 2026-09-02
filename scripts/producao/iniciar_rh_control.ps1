param(
  [string]$ProjectDir = "C:\RH-Control",
  [string]$EnvFile = ".env.production",
  [string]$ComposeFile = "docker-compose.prod.yml",
  [int]$DockerTimeoutSeconds = 180
)

$ErrorActionPreference = "Stop"

function Write-Log {
  param([string]$Message)

  $logsDir = Join-Path $ProjectDir "logs"
  New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -Path (Join-Path $logsDir "rh-control-startup.log") -Value $line
}

function Wait-Docker {
  param([int]$TimeoutSeconds)

  $limit = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $limit) {
    try {
      docker info *> $null
      return
    } catch {
      Start-Sleep -Seconds 5
    }
  }

  throw "Docker nao respondeu dentro de $TimeoutSeconds segundos."
}

function Use-DockerConfigSemCredenciais {
  param([string]$ProjectDir)

  $dockerConfigDir = Join-Path $ProjectDir "logs\docker-config"
  $dockerConfigFile = Join-Path $dockerConfigDir "config.json"

  New-Item -ItemType Directory -Force -Path $dockerConfigDir | Out-Null

  if (-not (Test-Path -LiteralPath $dockerConfigFile)) {
    '{"auths":{}}' | Set-Content -LiteralPath $dockerConfigFile -Encoding UTF8
  }

  $env:DOCKER_CONFIG = $dockerConfigDir
}

if (-not (Test-Path -LiteralPath $ProjectDir)) {
  throw "Pasta do projeto nao encontrada: $ProjectDir"
}

$envPath = Join-Path $ProjectDir $EnvFile
$composePath = Join-Path $ProjectDir $ComposeFile

if (-not (Test-Path -LiteralPath $envPath)) {
  throw "Arquivo de ambiente nao encontrado: $envPath"
}

if (-not (Test-Path -LiteralPath $composePath)) {
  throw "Arquivo Docker Compose nao encontrado: $composePath"
}

Write-Log "Iniciando RH Control em $ProjectDir"

try {
  $dockerService = Get-Service -Name "com.docker.service" -ErrorAction SilentlyContinue

  if ($dockerService -and $dockerService.Status -ne "Running") {
    Start-Service -Name "com.docker.service"
    Write-Log "Servico com.docker.service iniciado."
  }
} catch {
  Write-Log "Nao foi possivel iniciar o servico Docker automaticamente: $($_.Exception.Message)"
}

Set-Location -LiteralPath $ProjectDir
Use-DockerConfigSemCredenciais -ProjectDir $ProjectDir
Wait-Docker -TimeoutSeconds $DockerTimeoutSeconds

docker compose --env-file $EnvFile -f $ComposeFile up -d
Write-Log "RH Control iniciado."
