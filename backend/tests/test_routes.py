from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.auth import obter_usuario_atual
from app.dependencies import get_db
from app.main import app
from app.models import Base, Colaborador, Usuario


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
