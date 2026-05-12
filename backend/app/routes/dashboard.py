from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import obter_usuario_atual
from app.dependencies import get_db
from app.models import (
    Advertencia,
    AtestadoMedico,
    Colaborador,
    Falta,
    Suspensao,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(obter_usuario_atual)],
)


def calcular_vencimento_aso(data_aso: date):
    try:
        return data_aso.replace(year=data_aso.year + 1)
    except ValueError:
        return data_aso.replace(
            year=data_aso.year + 1,
            day=28,
        )


def montar_status_aso(colaborador: Colaborador, hoje: date):
    vencimento = calcular_vencimento_aso(colaborador.data_aso)
    dias_para_vencer = (vencimento - hoje).days

    if dias_para_vencer < 0:
        status = "Vencido"
    elif dias_para_vencer <= 30:
        status = "Vencendo"
    else:
        status = "Em dia"

    return {
        "id": colaborador.id,
        "nome": colaborador.nome,
        "data_aso": colaborador.data_aso,
        "vencimento_aso": vencimento,
        "status": status,
        "dias_para_vencer": dias_para_vencer,
    }


@router.get("/resumo")
def resumo_dashboard(db: Session = Depends(get_db)):
    hoje = date.today()
    limite_aso = hoje + timedelta(days=30)

    inicio_mes = date(
        hoje.year,
        hoje.month,
        1,
    )

    total_colaboradores = db.query(Colaborador).count()

    ativos = db.query(Colaborador).filter(
        Colaborador.ativo == True
    ).count()

    inativos = db.query(Colaborador).filter(
        Colaborador.ativo == False
    ).count()

    faltas_mes = db.query(Falta).filter(
        Falta.data_falta >= inicio_mes
    ).count()

    atestados_mes = db.query(AtestadoMedico).filter(
        AtestadoMedico.data_atestado >= inicio_mes
    ).count()

    advertencias_mes = db.query(Advertencia).filter(
        Advertencia.data_advertencia >= inicio_mes
    ).count()

    suspensoes_mes = db.query(Suspensao).filter(
        Suspensao.data_inicio >= inicio_mes
    ).count()

    colaboradores_com_aso = db.query(Colaborador).filter(
        Colaborador.ativo == True,
        Colaborador.data_aso.isnot(None),
    ).all()

    asos_vencidos = 0
    asos_vencendo_30_dias = 0

    for colaborador in colaboradores_com_aso:
        vencimento = calcular_vencimento_aso(colaborador.data_aso)

        if vencimento < hoje:
            asos_vencidos += 1
        elif vencimento <= limite_aso:
            asos_vencendo_30_dias += 1

    return {
        "total_colaboradores": total_colaboradores,
        "ativos": ativos,
        "inativos": inativos,
        "faltas_mes": faltas_mes,
        "atestados_mes": atestados_mes,
        "advertencias_mes": advertencias_mes,
        "suspensoes_mes": suspensoes_mes,
        "asos_vencidos": asos_vencidos,
        "asos_vencendo_30_dias": asos_vencendo_30_dias,
    }


@router.get("/asos")
def listar_status_asos(db: Session = Depends(get_db)):
    hoje = date.today()

    colaboradores = db.query(Colaborador).filter(
        Colaborador.ativo == True,
        Colaborador.data_aso.isnot(None),
    ).all()

    status_asos = [
        montar_status_aso(colaborador, hoje)
        for colaborador in colaboradores
    ]

    status_asos.sort(
        key=lambda item: item["dias_para_vencer"]
    )

    return status_asos


@router.get("/score")
def score_disciplinar(db: Session = Depends(get_db)):
    colaboradores = db.query(Colaborador).all()

    ranking = []

    for colaborador in colaboradores:
        score = 100

        faltas = (
            db.query(Falta)
            .filter(Falta.colaborador_id == colaborador.id)
            .count()
        )

        advertencias_verbais = (
            db.query(Advertencia)
            .filter(
                Advertencia.colaborador_id == colaborador.id,
                Advertencia.tipo == "Verbal",
            )
            .count()
        )

        advertencias_escritas = (
            db.query(Advertencia)
            .filter(
                Advertencia.colaborador_id == colaborador.id,
                Advertencia.tipo == "Escrita",
            )
            .count()
        )

        suspensoes = (
            db.query(Suspensao)
            .filter(Suspensao.colaborador_id == colaborador.id)
            .count()
        )

        score -= faltas * 10
        score -= advertencias_verbais * 5
        score -= advertencias_escritas * 15
        score -= suspensoes * 30

        if score < 0:
            score = 0

        if score >= 90:
            nivel = "Excelente"
        elif score >= 70:
            nivel = "Bom"
        elif score >= 50:
            nivel = "Atenção"
        else:
            nivel = "Crítico"

        ranking.append({
            "id": colaborador.id,
            "nome": colaborador.nome,
            "score": score,
            "nivel": nivel,
        })

    ranking.sort(key=lambda x: x["score"], reverse=True)

    return ranking
