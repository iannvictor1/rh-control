from datetime import date

from app.schemas import ColaboradorResponse


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
