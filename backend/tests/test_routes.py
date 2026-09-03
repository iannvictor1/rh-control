from datetime import date
from io import BytesIO

from fastapi.testclient import TestClient
from openpyxl import Workbook
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.routes.dashboard as dashboard_route
from app.routes.colaboradores import extrair_registros_ferias_pdf
from app.auth import gerar_hash_senha, obter_usuario_atual
from app.dependencies import get_db
from app.main import app
from app.models import (
    Advertencia,
    Base,
    Colaborador,
    ExperienciaConcluida,
    Falta,
    Ferias,
    NotaAdesiva,
    Suspensao,
    Usuario,
)


def criar_cliente_teste(tmp_path, perfil="admin"):
    database_url = f"sqlite:///{tmp_path / 'routes.db'}"
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )

    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()

        try:
            yield db
        finally:
            db.close()

    def override_usuario_atual():
        return Usuario(
            id=1,
            nome="Admin",
            email="admin@example.com",
            perfil=perfil,
            ativo=True,
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[obter_usuario_atual] = override_usuario_atual

    return TestClient(app), TestingSessionLocal


def test_colaboradores_exige_autenticacao():
    app.dependency_overrides.clear()
    client = TestClient(app)

    response = client.get("/colaboradores/")

    assert response.status_code == 401


def test_login_ignora_maiusculas_e_espacos_no_email(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add(Usuario(
        nome="Usuária RH",
        email="UsuarioRH@Example.com",
        senha_hash=gerar_hash_senha("senha-segura"),
        perfil="rh",
        ativo=True,
    ))
    db.commit()
    db.close()

    response = client.post(
        "/auth/login",
        json={
            "email": "  usuariorh@example.COM  ",
            "senha": "senha-segura",
        },
    )

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"

    app.dependency_overrides.clear()


def test_criar_falta_valida_colaborador(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    response = client.post(
        "/faltas/",
        json={
            "colaborador_id": 999,
            "data_falta": "2026-05-20",
            "motivo": "Teste",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Colaborador não encontrado"

    db = SessionLocal()
    db.add(Colaborador(nome="Ana", ativo=True))
    db.commit()
    db.close()

    response = client.post(
        "/faltas/",
        json={
            "colaborador_id": 1,
            "data_falta": "2026-05-20",
            "motivo": "Teste",
        },
    )

    assert response.status_code == 200
    assert response.json()["colaborador_id"] == 1

    app.dependency_overrides.clear()


def test_consulta_nao_pode_criar_falta(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path, perfil="consulta")

    db = SessionLocal()
    db.add(Colaborador(nome="Ana", ativo=True))
    db.commit()
    db.close()

    response = client.post(
        "/faltas/",
        json={
            "colaborador_id": 1,
            "data_falta": "2026-05-20",
            "motivo": "Teste",
        },
    )

    assert response.status_code == 403

    app.dependency_overrides.clear()


def test_buscar_colaboradores_filtra_e_pagina(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add_all([
        Colaborador(nome="Ana Silva", setor="RH", ativo=True),
        Colaborador(nome="Bruno Souza", setor="TI", ativo=False),
        Colaborador(nome="Carla Lima", setor="RH", ativo=True),
    ])
    db.commit()
    db.close()

    response = client.get(
        "/colaboradores/busca",
        params={
            "q": "rh",
            "status": "ativos",
            "skip": 0,
            "limit": 1,
        },
    )

    assert response.status_code == 200
    assert response.json()["total"] == 2
    assert len(response.json()["items"]) == 1

    app.dependency_overrides.clear()


def test_listar_opcoes_colaboradores_filtra_ativos(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add_all([
        Colaborador(nome="Ana Silva", ativo=True),
        Colaborador(nome="Bruno Souza", ativo=False),
        Colaborador(nome="Carla Lima", ativo=True),
    ])
    db.commit()
    db.close()

    response = client.get(
        "/colaboradores/opcoes",
        params={"ativo": True},
    )

    assert response.status_code == 200
    assert [item["nome"] for item in response.json()] == [
        "Ana Silva",
        "Carla Lima",
    ]

    app.dependency_overrides.clear()


def test_notas_sao_do_usuario_logado(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    response = client.post(
        "/notas/",
        json={
            "titulo": "Lembrete",
            "conteudo": "Conferir ASOs",
            "cor": "amarelo",
            "fixada": True,
            "aberta": True,
            "posicao_x": 24,
            "posicao_y": 48,
        },
    )

    assert response.status_code == 200
    assert response.json()["titulo"] == "Lembrete"
    assert response.json()["usuario_id"] == 1
    assert response.json()["aberta"] is True
    assert response.json()["posicao_x"] == 24
    assert response.json()["posicao_y"] == 48

    db = SessionLocal()
    db.add(NotaAdesiva(
        usuario_id=2,
        titulo="Nota de outro usuario",
        conteudo="Privada",
        cor="azul",
        fixada=False,
    ))
    db.commit()
    db.close()

    response = client.get("/notas/")

    assert response.status_code == 200
    assert [nota["titulo"] for nota in response.json()] == ["Lembrete"]

    app.dependency_overrides.clear()


def test_criar_colaborador_rejeita_cpf_duplicado(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add(Colaborador(nome="Ana", cpf="111.222.333-44", ativo=True))
    db.commit()
    db.close()

    response = client.post(
        "/colaboradores/",
        json={
            "nome": "Bruno",
            "cpf": "111.222.333-44",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "CPF já cadastrado"

    app.dependency_overrides.clear()


def test_criar_colaborador_gera_matricula_automaticamente(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add(Colaborador(nome="Ana", matricula="000007", ativo=True))
    db.commit()
    db.close()

    response = client.post(
        "/colaboradores/",
        json={
            "nome": "Bruno",
            "matricula": "999999",
        },
    )

    assert response.status_code == 200
    assert response.json()["matricula"] == "000002"

    app.dependency_overrides.clear()


def test_criar_colaborador_salva_empresa(tmp_path):
    client, _SessionLocal = criar_cliente_teste(tmp_path)

    response = client.post(
        "/colaboradores/",
        json={
            "empresa": "Frontline",
            "nome": "Ana",
        },
    )

    assert response.status_code == 200
    assert response.json()["empresa"] == "Frontline"

    app.dependency_overrides.clear()


def test_criar_colaborador_salva_salario(tmp_path):
    client, _SessionLocal = criar_cliente_teste(tmp_path)

    response = client.post(
        "/colaboradores/",
        json={
            "empresa": "C&M",
            "nome": "Ana",
            "salario": "2450.75",
        },
    )

    assert response.status_code == 200
    assert response.json()["salario"] == "2450.75"

    app.dependency_overrides.clear()


def test_importar_colaboradores_de_planilha(tmp_path):
    client, _SessionLocal = criar_cliente_teste(tmp_path)
    workbook = Workbook()
    sheet = workbook.active
    sheet.append([
        "EMPRESA",
        "NOME",
        "MATRICULA",
        "CARGO",
        "SALARIO",
        "SETOR",
        "TIPO DE CONTRATO",
        "CPF",
        "RG",
        "DATA DE NASCIMENTO",
        "DATA DE ADMISSAO",
        "DATA DO ASO",
        "E-MAIL",
        "TELEFONE",
        "TELEFONE DE EMERGENCIA",
        "ENDERECO",
    ])
    sheet.append([
        "Frontline",
        "Ana Silva",
        "999",
        "Analista",
        "3500,50",
        "RH",
        "clt",
        "11122233344",
        "12.3",
        "01021990",
        "10032024",
        "15032024",
        "ana@example.com",
        "(11) 99999-9999",
        "(11) 98888-8888",
        "Rua A",
    ])
    sheet.append(["C&M"])

    arquivo = BytesIO()
    workbook.save(arquivo)
    arquivo.seek(0)

    response = client.post(
        "/colaboradores/importar",
        files={
            "arquivo": (
                "colaboradores.xlsx",
                arquivo.getvalue(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["importados"] == 1
    assert response.json()["ignorados"] == 1

    response = client.get("/colaboradores/")
    colaborador = response.json()[0]

    assert colaborador["empresa"] == "Frontline"
    assert colaborador["nome"] == "Ana Silva"
    assert colaborador["matricula"] == "000001"
    assert colaborador["tipo_contrato"] == "CLT"
    assert colaborador["cpf"] == "111.222.333-44"
    assert colaborador["rg"] == "123"
    assert colaborador["data_nascimento"] == "1990-02-01"
    assert colaborador["salario"] == "3500.50"

    app.dependency_overrides.clear()


def test_colaborador_com_desligamento_exige_motivo_e_inativa(tmp_path):
    client, _SessionLocal = criar_cliente_teste(tmp_path)

    response = client.post(
        "/colaboradores/",
        json={
            "nome": "Ana",
            "data_desligamento": "2026-05-20",
        },
    )

    assert response.status_code == 422

    response = client.post(
        "/colaboradores/",
        json={
            "nome": "Ana",
            "data_desligamento": "2026-05-20",
            "motivo_desligamento": "Pedido de demissao",
        },
    )

    assert response.status_code == 200
    assert response.json()["ativo"] is False
    assert response.json()["motivo_desligamento"] == "Pedido de demissao"

    app.dependency_overrides.clear()


def test_buscar_faltas_filtra_e_pagina(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    ana = Colaborador(nome="Ana Silva", ativo=True)
    bruno = Colaborador(nome="Bruno Souza", ativo=True)
    db.add_all([ana, bruno])
    db.commit()

    db.add_all([
        Falta(colaborador_id=ana.id, data_falta=date(2026, 5, 7), motivo="Atraso"),
        Falta(colaborador_id=ana.id, data_falta=date(2026, 5, 8), motivo="Teste"),
        Falta(colaborador_id=bruno.id, data_falta=date(2026, 5, 9), motivo="Atraso"),
    ])
    db.commit()
    db.close()

    response = client.get(
        "/faltas/busca",
        params={
            "q": "ana",
            "data_inicio": "2026-05-01",
            "data_fim": "2026-05-31",
            "skip": 0,
            "limit": 1,
        },
    )

    assert response.status_code == 200
    assert response.json()["total"] == 2
    assert len(response.json()["items"]) == 1
    assert response.json()["items"][0]["colaborador"]["nome"] == "Ana Silva"

    app.dependency_overrides.clear()


def test_buscar_advertencias_filtra_tipo_e_pagina(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    colaborador = Colaborador(nome="Ana Silva", ativo=True)
    db.add(colaborador)
    db.commit()

    db.add_all([
        Advertencia(
            colaborador_id=colaborador.id,
            data_advertencia=date(2026, 5, 7),
            tipo="Verbal",
            motivo="Atraso",
        ),
        Advertencia(
            colaborador_id=colaborador.id,
            data_advertencia=date(2026, 5, 8),
            tipo="Escrita",
            motivo="Conduta",
        ),
    ])
    db.commit()
    db.close()

    response = client.get(
        "/advertencias/busca",
        params={
            "tipo": "Escrita",
            "skip": 0,
            "limit": 10,
        },
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["tipo"] == "Escrita"

    app.dependency_overrides.clear()


def test_buscar_suspensoes_filtra_status_e_pagina(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    colaborador = Colaborador(nome="Ana Silva", ativo=True)
    db.add(colaborador)
    db.commit()

    db.add_all([
        Suspensao(
            colaborador_id=colaborador.id,
            data_inicio=date(2026, 5, 7),
            dias=1,
            motivo="Atraso",
            status="Ativa",
        ),
        Suspensao(
            colaborador_id=colaborador.id,
            data_inicio=date(2026, 5, 8),
            dias=2,
            motivo="Conduta",
            status="Finalizada",
        ),
    ])
    db.commit()
    db.close()

    response = client.get(
        "/suspensoes/busca",
        params={
            "status": "Finalizada",
            "skip": 0,
            "limit": 10,
        },
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["status"] == "Finalizada"

    app.dependency_overrides.clear()


def test_excluir_falta_faz_soft_delete(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add(Colaborador(nome="Ana", ativo=True))
    db.commit()
    db.close()

    response = client.post(
        "/faltas/",
        json={
            "colaborador_id": 1,
            "data_falta": "2026-05-20",
            "motivo": "Teste",
        },
    )

    assert response.status_code == 200

    response = client.delete("/faltas/1")

    assert response.status_code == 204

    response = client.get("/faltas/")

    assert response.status_code == 200
    assert response.json() == []

    db = SessionLocal()
    falta = db.query(Falta).filter(Falta.id == 1).first()
    db.close()

    assert falta is not None
    assert falta.removido_em is not None
    assert falta.removido_por_id == 1

    app.dependency_overrides.clear()


def test_dashboard_resumo_conta_apenas_faltas_do_mes_atual(tmp_path, monkeypatch):
    class DataFixa(date):
        @classmethod
        def today(cls):
            return cls(2026, 5, 26)

    monkeypatch.setattr(dashboard_route, "date", DataFixa)
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    colaborador = Colaborador(nome="Ana", ativo=True)
    db.add(colaborador)
    db.commit()

    db.add_all([
        Falta(colaborador_id=colaborador.id, data_falta=date(2026, 5, 7)),
        Falta(colaborador_id=colaborador.id, data_falta=date(2026, 4, 30)),
        Falta(colaborador_id=colaborador.id, data_falta=date(2266, 2, 22)),
        Falta(colaborador_id=colaborador.id, data_falta=date(2251, 5, 4)),
    ])
    db.commit()
    db.close()

    response = client.get("/dashboard/resumo")

    assert response.status_code == 200
    assert response.json()["faltas_mes"] == 1

    app.dependency_overrides.clear()


def test_dashboard_alerta_periodo_experiencia(tmp_path, monkeypatch):
    class DataFixa(date):
        @classmethod
        def today(cls):
            return cls(2026, 5, 26)

    monkeypatch.setattr(dashboard_route, "date", DataFixa)
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add(Colaborador(
        nome="Ana",
        data_admissao=date(2026, 4, 20),
        ativo=True,
    ))
    db.commit()
    db.close()

    response = client.get("/dashboard/resumo")

    assert response.status_code == 200
    assert response.json()["experiencias_vencidas"] == 0
    assert response.json()["experiencias_vencendo_30_dias"] == 1

    response = client.get("/dashboard/experiencia")

    assert response.status_code == 200
    alertas = response.json()
    assert alertas[0]["etapa"] == "45 dias"
    assert alertas[0]["vencimento_experiencia"] == "2026-06-04"
    assert alertas[0]["status"] == "Vencendo"

    app.dependency_overrides.clear()


def test_concluir_experiencia_remove_alerta_dashboard(tmp_path, monkeypatch):
    class DataFixa(date):
        @classmethod
        def today(cls):
            return cls(2026, 5, 26)

    monkeypatch.setattr(dashboard_route, "date", DataFixa)
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add(Colaborador(
        nome="Ana",
        data_admissao=date(2026, 4, 20),
        ativo=True,
    ))
    db.commit()
    db.close()

    response = client.post(
        "/experiencias/1/concluir",
        json={
            "etapa": "45 dias",
            "vencimento_experiencia": "2026-06-04",
        },
    )

    assert response.status_code == 200
    assert response.json()["etapa"] == "45 dias"

    response = client.get("/dashboard/resumo")

    assert response.status_code == 200
    assert response.json()["experiencias_vencidas"] == 0
    assert response.json()["experiencias_vencendo_30_dias"] == 0

    response = client.get("/dashboard/experiencia")

    assert response.status_code == 200
    assert all(
        alerta["etapa"] != "45 dias"
        for alerta in response.json()
    )

    app.dependency_overrides.clear()


def test_dashboard_alerta_periodo_ferias(tmp_path, monkeypatch):
    class DataFixa(date):
        @classmethod
        def today(cls):
            return cls(2026, 5, 26)

    monkeypatch.setattr(dashboard_route, "date", DataFixa)
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add(Colaborador(
        nome="Ana",
        data_admissao=date(2025, 6, 10),
        ativo=True,
    ))
    db.commit()
    db.close()

    response = client.get("/dashboard/resumo")

    assert response.status_code == 200
    assert response.json()["ferias_vencidas"] == 0
    assert response.json()["ferias_vencendo_30_dias"] == 1

    response = client.get("/dashboard/ferias")

    assert response.status_code == 200
    alertas = response.json()
    assert alertas[0]["vencimento_ferias"] == "2026-06-10"
    assert alertas[0]["status"] == "Vencendo"

    app.dependency_overrides.clear()


def test_dashboard_ferias_usa_periodo_aquisitivo_importado(tmp_path, monkeypatch):
    class DataFixa(date):
        @classmethod
        def today(cls):
            return cls(2026, 5, 26)

    monkeypatch.setattr(dashboard_route, "date", DataFixa)
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add(Colaborador(
        nome="Ana",
        data_admissao=date(2020, 1, 10),
        data_inicio_periodo_aquisitivo=date(2025, 6, 10),
        data_fim_periodo_aquisitivo=date(2026, 6, 9),
        data_limite_ferias=date(2027, 3, 9),
        ativo=True,
    ))
    db.commit()
    db.close()

    response = client.get("/dashboard/ferias")

    assert response.status_code == 200
    alerta = response.json()[0]
    assert alerta["data_base_ferias"] == "2025-06-10"
    assert alerta["data_fim_periodo_aquisitivo"] == "2026-06-09"
    assert alerta["vencimento_ferias"] == "2026-06-10"
    assert alerta["data_limite_ferias"] == "2027-03-09"
    assert alerta["status"] == "Vencendo"
    assert alerta["status_limite_ferias"] == "Limite em dia"
    assert alerta["alerta_data_limite_ferias"] is False

    app.dependency_overrides.clear()


def test_dashboard_ferias_alerta_data_limite(tmp_path, monkeypatch):
    class DataFixa(date):
        @classmethod
        def today(cls):
            return cls(2026, 8, 1)

    monkeypatch.setattr(dashboard_route, "date", DataFixa)
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add(Colaborador(
        nome="Ana",
        data_admissao=date(2020, 1, 10),
        data_inicio_periodo_aquisitivo=date(2024, 11, 19),
        data_fim_periodo_aquisitivo=date(2025, 11, 18),
        data_limite_ferias=date(2026, 8, 18),
        ativo=True,
    ))
    db.commit()
    db.close()

    response = client.get("/dashboard/resumo")

    assert response.status_code == 200
    assert response.json()["ferias_limite_vencidas"] == 0
    assert response.json()["ferias_limite_vencendo_30_dias"] == 1

    response = client.get("/dashboard/ferias")

    assert response.status_code == 200
    alerta = response.json()[0]
    assert alerta["status"] == "Vencido"
    assert alerta["status_limite_ferias"] == "Limite vencendo"
    assert alerta["dias_para_limite_ferias"] == 17
    assert alerta["alerta_data_limite_ferias"] is True

    app.dependency_overrides.clear()


def test_dashboard_ferias_conta_a_partir_do_retorno(tmp_path, monkeypatch):
    class DataFixa(date):
        @classmethod
        def today(cls):
            return cls(2026, 5, 26)

    monkeypatch.setattr(dashboard_route, "date", DataFixa)
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    colaborador = Colaborador(
        nome="Ana",
        data_admissao=date(2024, 1, 10),
        ativo=True,
    )
    db.add(colaborador)
    db.commit()
    db.add(Ferias(
        colaborador_id=colaborador.id,
        data_inicio=date(2025, 6, 1),
        data_fim=date(2025, 6, 20),
        data_retorno=date(2025, 6, 21),
    ))
    db.commit()
    db.close()

    response = client.get("/dashboard/ferias")

    assert response.status_code == 200
    alerta = response.json()[0]
    assert alerta["data_base_ferias"] == "2025-06-21"
    assert alerta["vencimento_ferias"] == "2026-06-21"
    assert alerta["status"] == "Vencendo"

    app.dependency_overrides.clear()


def test_extrair_registros_ferias_pdf_escolhe_periodo_aquisitivo_atual():
    texto = """
    CÃ³digo
    Empregado
    Cargo
    AdmissÃ£o
    PerÃ­odo Aquisitivo
    Data Limite
    000014
    FRANCISCO ELIONARDO GOMES DE LIMA
    MOTORISTA II
    19/11/2018
    19/11/2024 a 18/11/2025
    19/10/2026
    30,0
    000014
    FRANCISCO ELIONARDO GOMES DE LIMA
    MOTORISTA II
    19/11/2018
    19/11/2025 a 18/11/2026
    19/10/2027
    30,0
    000052
    HERBIA CASTRO LIMA
    SUPERVISOR FINANCEIRO
    20/01/2025
    20/01/2025 a 19/01/2026
    26/12/2026
    30,0
    """

    registros = extrair_registros_ferias_pdf(texto)

    assert registros == [
        {
            "codigo": "000014",
            "nome": "FRANCISCO ELIONARDO GOMES DE LIMA",
            "data_inicio_periodo_aquisitivo": date(2024, 11, 19),
            "data_fim_periodo_aquisitivo": date(2025, 11, 18),
            "data_limite_ferias": date(2026, 8, 18),
        },
        {
            "codigo": "000052",
            "nome": "HERBIA CASTRO LIMA",
            "data_inicio_periodo_aquisitivo": date(2025, 1, 20),
            "data_fim_periodo_aquisitivo": date(2026, 1, 19),
            "data_limite_ferias": date(2026, 10, 19),
        },
    ]


def test_limpar_importacao_ferias_pdf(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add_all([
        Colaborador(
            nome="Ana",
            data_admissao=date(2020, 1, 10),
            data_inicio_periodo_aquisitivo=date(2024, 11, 19),
            data_fim_periodo_aquisitivo=date(2025, 11, 18),
            data_limite_ferias=date(2026, 8, 18),
            ativo=True,
        ),
        Colaborador(
            nome="Bruno",
            data_admissao=date(2021, 2, 5),
            ativo=True,
        ),
    ])
    db.commit()
    db.close()

    response = client.delete("/colaboradores/importar-ferias-pdf")

    assert response.status_code == 200
    assert response.json()["limpos"] == 1

    db = SessionLocal()
    colaboradores = db.query(Colaborador).order_by(Colaborador.nome).all()
    assert len(colaboradores) == 2
    assert colaboradores[0].data_inicio_periodo_aquisitivo is None
    assert colaboradores[0].data_fim_periodo_aquisitivo is None
    assert colaboradores[0].data_limite_ferias is None
    assert colaboradores[1].nome == "Bruno"
    db.close()

    app.dependency_overrides.clear()


def test_criar_ferias_registra_periodo(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add(Colaborador(nome="Ana", data_admissao=date(2025, 1, 10), ativo=True))
    db.commit()
    db.close()

    response = client.post(
        "/ferias/",
        json={
            "colaborador_id": 1,
            "data_inicio": "2026-01-02",
            "data_fim": "2026-01-20",
            "data_retorno": "2026-01-21",
            "observacoes": "Período aquisitivo 2025",
        },
    )

    assert response.status_code == 200
    assert response.json()["data_inicio"] == "2026-01-02"
    assert response.json()["data_retorno"] == "2026-01-21"

    app.dependency_overrides.clear()


def test_calendario_inclui_vencimentos_experiencia(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add(Colaborador(
        nome="Ana",
        data_admissao=date(2026, 4, 1),
        ativo=True,
    ))
    db.commit()
    db.close()

    response = client.get(
        "/calendario/rh",
        params={
            "data_inicio": "2026-05-01",
            "data_fim": "2026-07-31",
            "tipo": "experiencia",
        },
    )

    assert response.status_code == 200
    eventos = response.json()
    assert [evento["titulo"] for evento in eventos] == [
        "Experiência 45 dias",
        "Experiência 90 dias",
    ]
    assert [evento["data_inicio"] for evento in eventos] == [
        "2026-05-16",
        "2026-06-30",
    ]

    app.dependency_overrides.clear()


def test_calendario_oculta_experiencia_concluida(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    colaborador = Colaborador(
        nome="Ana",
        data_admissao=date(2026, 4, 1),
        ativo=True,
    )
    db.add(colaborador)
    db.commit()
    colaborador_id = colaborador.id
    db.add(ExperienciaConcluida(
        colaborador_id=colaborador_id,
        etapa="45 dias",
        vencimento_experiencia=date(2026, 5, 16),
        concluido_por_id=1,
    ))
    db.commit()
    db.close()

    response = client.get(
        "/calendario/rh",
        params={
            "data_inicio": "2026-05-01",
            "data_fim": "2026-07-31",
            "tipo": "experiencia",
        },
    )

    assert response.status_code == 200
    assert [evento["id"] for evento in response.json()] == [
        f"experiencia-90-dias-{colaborador_id}",
    ]

    app.dependency_overrides.clear()


def test_calendario_inclui_vencimento_ferias(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    db.add(Colaborador(
        nome="Ana",
        data_admissao=date(2025, 6, 10),
        ativo=True,
    ))
    db.commit()
    db.close()

    response = client.get(
        "/calendario/rh",
        params={
            "data_inicio": "2026-06-01",
            "data_fim": "2026-06-30",
            "tipo": "ferias",
        },
    )

    assert response.status_code == 200
    eventos = response.json()
    assert len(eventos) == 1
    assert eventos[0]["titulo"] == "Férias"
    assert eventos[0]["data_inicio"] == "2026-06-10"

    app.dependency_overrides.clear()


def test_calendario_ferias_conta_a_partir_do_retorno(tmp_path):
    client, SessionLocal = criar_cliente_teste(tmp_path)

    db = SessionLocal()
    colaborador = Colaborador(
        nome="Ana",
        data_admissao=date(2024, 1, 10),
        ativo=True,
    )
    db.add(colaborador)
    db.commit()
    db.add(Ferias(
        colaborador_id=colaborador.id,
        data_inicio=date(2025, 6, 1),
        data_fim=date(2025, 6, 20),
        data_retorno=date(2025, 6, 21),
    ))
    db.commit()
    db.close()

    response = client.get(
        "/calendario/rh",
        params={
            "data_inicio": "2026-06-01",
            "data_fim": "2026-06-30",
            "tipo": "ferias",
        },
    )

    assert response.status_code == 200
    eventos = response.json()
    assert len(eventos) == 1
    assert eventos[0]["titulo"] == "Férias"
    assert eventos[0]["data_inicio"] == "2026-06-21"
    assert eventos[0]["descricao"] == "Período aquisitivo de 21/06/2025 a 20/06/2026"

    app.dependency_overrides.clear()
