from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import obter_usuario_atual
from app.dependencies import get_db
from app.models import AtestadoMedico, Colaborador, Falta, Suspensao
from app.routes.dashboard import (
    calcular_vencimento_aso,
    calcular_vencimentos_experiencia,
    inicio_do_proximo_mes,
    listar_experiencias_concluidas,
    listar_ultimos_retornos_ferias,
    montar_status_ferias,
)
from app.schemas import CalendarioEventoResponse

router = APIRouter(
    prefix="/calendario",
    tags=["Calendário RH"],
    dependencies=[Depends(obter_usuario_atual)],
)


def periodo_padrao():
    hoje = date.today()
    inicio = date(hoje.year, hoje.month, 1)
    fim = inicio_do_proximo_mes(hoje) - timedelta(days=1)

    return inicio, fim


def evento(
    id_evento: str,
    tipo: str,
    titulo: str,
    data_inicio: date,
    colaborador: Colaborador,
    data_fim: date | None = None,
    descricao: str | None = None,
    status: str | None = None,
):
    return {
        "id": id_evento,
        "tipo": tipo,
        "titulo": titulo,
        "data_inicio": data_inicio,
        "data_fim": data_fim,
        "colaborador_id": colaborador.id,
        "colaborador_nome": colaborador.nome,
        "descricao": descricao,
        "status": status,
    }


@router.get("/rh", response_model=list[CalendarioEventoResponse])
def calendario_rh(
    data_inicio: date | None = None,
    data_fim: date | None = None,
    tipo: str = "todos",
    db: Session = Depends(get_db),
):
    inicio_padrao, fim_padrao = periodo_padrao()
    inicio = data_inicio or inicio_padrao
    fim = data_fim or fim_padrao
    eventos = []

    if tipo in ("todos", "faltas"):
        faltas = (
            db.query(Falta)
            .join(Colaborador)
            .filter(
                Falta.data_falta >= inicio,
                Falta.data_falta <= fim,
                Falta.removido_em.is_(None),
            )
            .all()
        )

        eventos.extend(
            evento(
                f"falta-{falta.id}",
                "faltas",
                "Falta",
                falta.data_falta,
                falta.colaborador,
                descricao=falta.motivo,
            )
            for falta in faltas
        )

    if tipo in ("todos", "atestados"):
        atestados = (
            db.query(AtestadoMedico)
            .join(Colaborador)
            .filter(
                AtestadoMedico.data_atestado >= inicio,
                AtestadoMedico.data_atestado <= fim,
                AtestadoMedico.removido_em.is_(None),
            )
            .all()
        )

        eventos.extend(
            evento(
                f"atestado-{atestado.id}",
                "atestados",
                "Atestado",
                atestado.data_atestado,
                atestado.colaborador,
                data_fim=atestado.data_atestado + timedelta(days=atestado.dias - 1),
                descricao=atestado.cid or atestado.observacao,
            )
            for atestado in atestados
        )

    if tipo in ("todos", "suspensoes"):
        suspensoes = (
            db.query(Suspensao)
            .join(Colaborador)
            .filter(
                Suspensao.data_inicio <= fim,
                Suspensao.removido_em.is_(None),
            )
            .all()
        )

        for suspensao in suspensoes:
            data_fim_suspensao = suspensao.data_inicio + timedelta(
                days=suspensao.dias - 1,
            )

            if data_fim_suspensao < inicio:
                continue

            eventos.append(
                evento(
                    f"suspensao-{suspensao.id}",
                    "suspensoes",
                    "Suspensão",
                    suspensao.data_inicio,
                    suspensao.colaborador,
                    data_fim=data_fim_suspensao,
                    descricao=suspensao.motivo,
                    status=suspensao.status,
                )
            )

    if tipo in ("todos", "asos"):
        colaboradores = (
            db.query(Colaborador)
            .filter(
                Colaborador.ativo == True,
                Colaborador.data_aso.isnot(None),
            )
            .all()
        )

        hoje = date.today()
        for colaborador in colaboradores:
            vencimento = calcular_vencimento_aso(colaborador.data_aso)

            if vencimento < inicio or vencimento > fim:
                continue

            status_aso = "Vencido" if vencimento < hoje else "Vencendo"
            eventos.append(
                evento(
                    f"aso-{colaborador.id}",
                    "asos",
                    "ASO",
                    vencimento,
                    colaborador,
                    status=status_aso,
                )
            )

    if tipo in ("todos", "experiencia"):
        colaboradores = (
            db.query(Colaborador)
            .filter(
                Colaborador.ativo == True,
                Colaborador.data_admissao.isnot(None),
                Colaborador.data_desligamento.is_(None),
            )
            .all()
        )

        hoje = date.today()
        experiencias_concluidas = listar_experiencias_concluidas(db)
        for colaborador in colaboradores:
            for etapa, vencimento in calcular_vencimentos_experiencia(
                colaborador.data_admissao
            ):
                if (colaborador.id, etapa, vencimento) in experiencias_concluidas:
                    continue

                if vencimento < inicio or vencimento > fim:
                    continue

                status_experiencia = "Vencido" if vencimento < hoje else "Vencendo"
                eventos.append(
                    evento(
                        f"experiencia-{etapa.replace(' ', '-')}-{colaborador.id}",
                        "experiencia",
                        f"Experiência {etapa}",
                        vencimento,
                        colaborador,
                        descricao=(
                            f"Admissão em {colaborador.data_admissao.strftime('%d/%m/%Y')}"
                        ),
                        status=status_experiencia,
                    )
                )

    if tipo in ("todos", "ferias"):
        colaboradores = (
            db.query(Colaborador)
            .filter(
                Colaborador.ativo == True,
                Colaborador.data_admissao.isnot(None),
                Colaborador.data_desligamento.is_(None),
            )
            .all()
        )

        hoje = date.today()
        ultimos_retornos = listar_ultimos_retornos_ferias(db)
        for colaborador in colaboradores:
            alerta_ferias = montar_status_ferias(
                colaborador,
                hoje,
                ultimos_retornos,
            )
            data_base = alerta_ferias["data_base_ferias"]
            fim_periodo = alerta_ferias["data_fim_periodo_aquisitivo"]
            vencimento = alerta_ferias["vencimento_ferias"]

            if vencimento < inicio or vencimento > fim:
                continue

            status_ferias = alerta_ferias["status"]
            descricao_ferias = (
                f"Período aquisitivo de {data_base.strftime('%d/%m/%Y')} "
                f"a {fim_periodo.strftime('%d/%m/%Y')}"
            )
            eventos.append(
                evento(
                    f"ferias-{colaborador.id}",
                    "ferias",
                    "Férias",
                    vencimento,
                    colaborador,
                    descricao=descricao_ferias,
                    status=status_ferias,
                )
            )

    eventos.sort(key=lambda item: (item["data_inicio"], item["tipo"], item["titulo"]))

    return eventos
