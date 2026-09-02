from datetime import date

import pytest
from pydantic import ValidationError

from app.schemas import (
    AtestadoMedicoCreate,
    ColaboradorCreate,
    ColaboradorResponse,
    FaltaCreate,
    SuspensaoUpdate,
)


def test_vencimento_aso_um_ano_depois():
    colaborador = ColaboradorResponse(
        id=1,
        nome="Ana",
        data_aso=date(2026, 5, 19),
        ativo=True,
    )

    assert colaborador.vencimento_aso == date(2027, 5, 19)


def test_vencimento_aso_ajusta_ano_bissexto():
    colaborador = ColaboradorResponse(
        id=1,
        nome="Ana",
        data_aso=date(2024, 2, 29),
        ativo=True,
    )

    assert colaborador.vencimento_aso == date(2025, 2, 28)


def test_colaborador_valida_email():
    with pytest.raises(ValidationError):
        ColaboradorCreate(nome="Ana", email="email-invalido")


def test_colaborador_valida_cpf_com_11_digitos():
    with pytest.raises(ValidationError):
        ColaboradorCreate(nome="Ana", cpf="123")


def test_colaborador_aceita_data_aso_futura():
    colaborador = ColaboradorCreate(
        nome="Ana",
        data_aso=date(2999, 1, 1),
    )

    assert colaborador.data_aso == date(2999, 1, 1)


def test_colaborador_aceita_bonificacao_vazia():
    colaborador = ColaboradorCreate(
        nome="Ana",
        tipo_bonificacao="Fixa",
    )

    assert colaborador.tipo_bonificacao == "Fixa"
    assert colaborador.bonificacao is None


def test_atestado_exige_dias_positivos():
    with pytest.raises(ValidationError):
        AtestadoMedicoCreate(
            colaborador_id=1,
            data_atestado=date(2026, 5, 20),
            dias=0,
        )


def test_ocorrencia_nao_aceita_data_futura():
    with pytest.raises(ValidationError):
        FaltaCreate(
            colaborador_id=1,
            data_falta=date(2999, 1, 1),
        )


def test_suspensao_valida_status():
    with pytest.raises(ValidationError):
        SuspensaoUpdate(status="Pendente")
