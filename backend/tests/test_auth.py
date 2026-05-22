import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")

from app.auth import criar_token_acesso, verificar_senha, gerar_hash_senha


def test_hash_senha_valida_senha_original():
    senha_hash = gerar_hash_senha("senha-segura")

    assert verificar_senha("senha-segura", senha_hash)
    assert not verificar_senha("senha-errada", senha_hash)


def test_criar_token_acesso_retorna_jwt():
    token = criar_token_acesso({"sub": "admin@example.com"})

    assert isinstance(token, str)
    assert token.count(".") == 2
