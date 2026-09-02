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

  function Invoke-Native {
    param(
      [Parameter(Mandatory = $true)]
      [string]$FilePath,
      [Parameter(Mandatory = $true)]
      [string[]]$Arguments,
      [Parameter(Mandatory = $true)]
      [string]$ErrorMessage
    )

    Write-Host ("> " + $FilePath + " " + ($Arguments -join " "))

    $saida = [System.IO.Path]::GetTempFileName()
    $erro = [System.IO.Path]::GetTempFileName()

    try {
      $processo = Start-Process `
        -FilePath $FilePath `
        -ArgumentList $Arguments `
        -WorkingDirectory (Get-Location).Path `
        -NoNewWindow `
        -Wait `
        -PassThru `
        -RedirectStandardOutput $saida `
        -RedirectStandardError $erro

      Get-Content -LiteralPath $saida -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host $_
      }

      Get-Content -LiteralPath $erro -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host $_
      }

      if ($processo.ExitCode -ne 0) {
        throw "$ErrorMessage Codigo de saida: $($processo.ExitCode)"
      }
    } finally {
      Remove-Item -LiteralPath $saida, $erro -Force -ErrorAction SilentlyContinue
    }
  }

  if (-not (Test-Path -LiteralPath $ProjectDir)) {
    throw "Pasta do projeto nao encontrada no servidor: $ProjectDir"
  }

  Set-Location -LiteralPath $ProjectDir

  Invoke-Native `
    -FilePath "git" `
    -Arguments @("fetch", "origin") `
    -ErrorMessage "Falha ao buscar atualizacoes no Git."

  Invoke-Native `
    -FilePath "git" `
    -Arguments @("pull", "--ff-only", "origin", $Branch) `
    -ErrorMessage "Falha ao atualizar o repositorio local."

  Invoke-Native `
    -FilePath "docker" `
    -Arguments @("compose", "--env-file", $EnvFile, "-f", $ComposeFile, "up", "-d", "--build") `
    -ErrorMessage "Falha ao reconstruir e subir o sistema."

  $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

  if ($task) {
    Start-ScheduledTask -TaskName $TaskName
  }

  Invoke-Native `
    -FilePath "docker" `
    -Arguments @("compose", "--env-file", $EnvFile, "-f", $ComposeFile, "ps") `
    -ErrorMessage "Falha ao listar containers."
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
