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
