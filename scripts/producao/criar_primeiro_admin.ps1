param(
  [string]$AppUrl = "http://localhost",
  [string]$Nome = "Administrador",
  [Parameter(Mandatory = $true)]
  [string]$Email,
  [ValidateSet("admin", "rh", "consulta")]
  [string]$Perfil = "admin"
)

$ErrorActionPreference = "Stop"

$senhaSegura = Read-Host "Senha do usuario" -AsSecureString
$ponteiroSenha = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSegura)

try {
  $senha = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ponteiroSenha)

  if (-not $senha) {
    throw "Senha vazia."
  }

  $url = $AppUrl.TrimEnd("/") + "/api/auth/registrar"
  $body = @{
    nome = $Nome
    email = $Email
    senha = $senha
    perfil = $Perfil
  } | ConvertTo-Json

  $response = Invoke-RestMethod `
    -Uri $url `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

  Write-Host "Usuario criado com sucesso."
  Write-Host ("Nome: " + $response.nome)
  Write-Host ("E-mail: " + $response.email)
  Write-Host ("Perfil: " + $response.perfil)
} finally {
  if ($ponteiroSenha -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ponteiroSenha)
  }
}
