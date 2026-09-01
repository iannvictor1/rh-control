# Instalação em produção - RH Control

Este modo sobe o sistema com Docker Compose:

- PostgreSQL com volume persistente
- Backend FastAPI com migrações Alembic automáticas
- Frontend React servido pelo Nginx
- Proxy `/api` para a API, usando uma única porta para acesso

## 1. Preparar o `.env.production`

Copie o exemplo:

```powershell
Copy-Item .env.production.example .env.production
```

Edite `.env.production` e troque pelo menos:

- `POSTGRES_PASSWORD`
- `SECRET_KEY`
- `APP_URL`, se o IP/domínio do servidor for diferente
- `APP_PORT`, se não quiser usar porta `80`

Para gerar uma chave forte:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

## 2. Subir o sistema

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Depois acesse:

```text
http://IP_DO_SERVIDOR
```

Se usar `APP_PORT=8080`, acesse:

```text
http://IP_DO_SERVIDOR:8080
```

## 3. Verificar saúde

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend
```

Teste a API:

```text
http://IP_DO_SERVIDOR/api/health
```

## 4. Atualizar o sistema

Depois de alterar o código:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

As migrações do banco são aplicadas automaticamente quando o backend inicia.

## 5. Backup básico do banco

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml exec db pg_dump -U rh_control rh_control > backup_rh_control.sql
```

Guarde também o volume de uploads, pois ele contém anexos de atestados.

## 6. Parar o sistema

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

Para remover dados do banco e uploads, remova os volumes manualmente apenas se tiver certeza.

## 7. Iniciar automaticamente com o Windows

No computador de producao, abra o PowerShell como Administrador dentro da pasta do projeto e rode:

```powershell
.\scripts\producao\instalar_tarefa_windows.ps1 -ProjectDir "C:\RH-Control" -TaskName "RHControl"
```

Isso cria uma tarefa no Agendador de Tarefas do Windows para subir o sistema com Docker Compose sempre que o Windows iniciar.

Para testar manualmente:

```powershell
Start-ScheduledTask -TaskName "RHControl"
```

Para ver se subiu:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Se o computador usar Docker Desktop e ele so iniciar depois do login do usuario, instale a tarefa com gatilho de logon:

```powershell
.\scripts\producao\instalar_tarefa_windows.ps1 -ProjectDir "C:\RH-Control" -TaskName "RHControl" -Trigger Logon
```

## 8. Atualizar remotamente a producao

No computador de producao, habilite o PowerShell Remoting uma vez, em PowerShell como Administrador:

```powershell
Enable-PSRemoting -Force
```

No seu computador, se estiver em rede local sem dominio, adicione o IP da producao aos hosts confiaveis:

```powershell
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "IP_DA_PRODUCAO" -Force
```

Depois de fazer uma alteracao, commit e push no GitHub, atualize a producao pelo seu computador:

```powershell
.\scripts\producao\atualizar_remoto.ps1 `
  -ComputerName "IP_DA_PRODUCAO" `
  -ProjectDir "C:\RH-Control" `
  -TaskName "RHControl" `
  -UserName "USUARIO_DA_PRODUCAO"
```

O script entra no computador de producao, executa `git pull`, constroi os containers novamente e reinicia o sistema com Docker Compose.
