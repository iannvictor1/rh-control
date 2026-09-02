from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import obter_usuario_atual
from app.dependencies import get_db
from app.models import (
    Advertencia,
    AtestadoMedico,
    Colaborador,
    ExperienciaConcluida,
    Ferias,
    Falta,
    Suspensao,
)
from app.schemas import (
    DashboardAsoResponse,
    DashboardExperienciaResponse,
    DashboardFeriasResponse,
    DashboardMensalResponse,
    DashboardResumoResponse,
    DashboardScoreResponse,
    DashboardSetorResponse,
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


def calcular_vencimentos_experiencia(data_admissao: date):
    return [
        ("45 dias", data_admissao + timedelta(days=45)),
        ("90 dias", data_admissao + timedelta(days=90)),
    ]


def listar_experiencias_concluidas(db: Session):
    return {
        (colaborador_id, etapa, vencimento)
        for colaborador_id, etapa, vencimento in db.query(
            ExperienciaConcluida.colaborador_id,
            ExperienciaConcluida.etapa,
            ExperienciaConcluida.vencimento_experiencia,
        ).all()
    }


def calcular_vencimento_ferias(data_admissao: date):
    try:
        return data_admissao.replace(year=data_admissao.year + 1)
    except ValueError:
        return data_admissao.replace(
            year=data_admissao.year + 1,
            day=28,
        )


def adicionar_meses(data_base: date, meses: int):
    mes_total = data_base.month - 1 + meses
    ano = data_base.year + mes_total // 12
    mes = mes_total % 12 + 1
    ultimo_dia_mes = (
        date(ano + 1, 1, 1)
        if mes == 12
        else date(ano, mes + 1, 1)
    ).toordinal() - date(ano, mes, 1).toordinal()

    return date(ano, mes, min(data_base.day, ultimo_dia_mes))


def calcular_data_limite_ferias(data_base: date):
    return adicionar_meses(data_base, 9)


def listar_ultimos_retornos_ferias(db: Session):
    return dict(
        db.query(
            Ferias.colaborador_id,
            func.max(Ferias.data_retorno),
        )
        .filter(Ferias.removido_em.is_(None))
        .group_by(Ferias.colaborador_id)
        .all()
    )


def montar_status_experiencia(
    colaborador: Colaborador,
    hoje: date,
    experiencias_concluidas: set[tuple[int, str, date]] | None = None,
):
    alertas = []
    concluidas = experiencias_concluidas or set()

    for etapa, vencimento in calcular_vencimentos_experiencia(
        colaborador.data_admissao
    ):
        if (colaborador.id, etapa, vencimento) in concluidas:
            continue

        dias_para_vencer = (vencimento - hoje).days

        if dias_para_vencer < 0:
            status = "Vencido"
        elif dias_para_vencer <= 30:
            status = "Vencendo"
        else:
            status = "Em dia"

        alertas.append({
            "id": colaborador.id,
            "nome": colaborador.nome,
            "data_admissao": colaborador.data_admissao,
            "etapa": etapa,
            "vencimento_experiencia": vencimento,
            "status": status,
            "dias_para_vencer": dias_para_vencer,
        })

    return alertas


def montar_status_ferias(
    colaborador: Colaborador,
    hoje: date,
    ultimos_retornos: dict[int, date] | None = None,
):
    ultimo_retorno = (ultimos_retornos or {}).get(colaborador.id)
    fim_periodo = None

    if ultimo_retorno:
        data_base = ultimo_retorno
        vencimento = calcular_vencimento_ferias(ultimo_retorno)
        fim_periodo = vencimento - timedelta(days=1)
        data_limite = calcular_data_limite_ferias(fim_periodo)
    elif colaborador.data_inicio_periodo_aquisitivo and colaborador.data_fim_periodo_aquisitivo:
        data_base = colaborador.data_inicio_periodo_aquisitivo
        fim_periodo = colaborador.data_fim_periodo_aquisitivo
        vencimento = fim_periodo + timedelta(days=1)
        data_limite = colaborador.data_limite_ferias or calcular_data_limite_ferias(
            fim_periodo
        )
    else:
        data_base = colaborador.data_admissao
        vencimento = calcular_vencimento_ferias(colaborador.data_admissao)
        fim_periodo = vencimento - timedelta(days=1)
        data_limite = colaborador.data_limite_ferias or calcular_data_limite_ferias(
            fim_periodo
        )

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
        "data_admissao": colaborador.data_admissao,
        "data_base_ferias": data_base,
        "data_fim_periodo_aquisitivo": fim_periodo,
        "vencimento_ferias": vencimento,
        "data_limite_ferias": data_limite,
        "status": status,
        "dias_para_vencer": dias_para_vencer,
    }


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


def inicio_do_proximo_mes(data_referencia: date):
    if data_referencia.month == 12:
        return date(data_referencia.year + 1, 1, 1)

    return date(data_referencia.year, data_referencia.month + 1, 1)


def periodo_padrao():
    hoje = date.today()
    inicio = date(
        hoje.year,
        hoje.month,
        1,
    )

    return inicio, inicio_do_proximo_mes(hoje)


def montar_periodo(data_inicio: date | None, data_fim: date | None):
    inicio_padrao, fim_padrao = periodo_padrao()
    inicio = data_inicio or inicio_padrao
    fim = data_fim + timedelta(days=1) if data_fim else fim_padrao

    return inicio, fim


def aplicar_filtros_colaboradores(query, setor: str | None, status: str = "todos"):
    if setor and setor != "todos":
        if setor == "__sem_setor__":
            query = query.filter(Colaborador.setor.is_(None))
        else:
            query = query.filter(Colaborador.setor == setor)

    if status == "ativos":
        query = query.filter(Colaborador.ativo == True)
    elif status == "inativos":
        query = query.filter(Colaborador.ativo == False)

    return query


def aplicar_filtros_ocorrencias(query, setor: str | None, status: str = "todos"):
    return aplicar_filtros_colaboradores(
        query.join(Colaborador),
        setor,
        status,
    )


@router.get("/resumo", response_model=DashboardResumoResponse)
def resumo_dashboard(
    data_inicio: date | None = None,
    data_fim: date | None = None,
    setor: str | None = None,
    status: str = "todos",
    db: Session = Depends(get_db),
):
    hoje = date.today()
    limite_aso = hoje + timedelta(days=30)

    inicio_periodo, fim_periodo = montar_periodo(data_inicio, data_fim)

    colaboradores_filtrados = aplicar_filtros_colaboradores(
        db.query(Colaborador),
        setor,
        status,
    )

    total_colaboradores = colaboradores_filtrados.count()

    ativos = aplicar_filtros_colaboradores(
        db.query(Colaborador),
        setor,
        "ativos",
    ).count()

    inativos = aplicar_filtros_colaboradores(
        db.query(Colaborador),
        setor,
        "inativos",
    ).count()

    faltas_mes = aplicar_filtros_ocorrencias(
        db.query(Falta),
        setor,
        status,
    ).filter(
        Falta.data_falta >= inicio_periodo,
        Falta.data_falta < fim_periodo,
        Falta.removido_em.is_(None),
    ).count()

    atestados_mes = aplicar_filtros_ocorrencias(
        db.query(AtestadoMedico),
        setor,
        status,
    ).filter(
        AtestadoMedico.data_atestado >= inicio_periodo,
        AtestadoMedico.data_atestado < fim_periodo,
        AtestadoMedico.removido_em.is_(None),
    ).count()

    advertencias_mes = aplicar_filtros_ocorrencias(
        db.query(Advertencia),
        setor,
        status,
    ).filter(
        Advertencia.data_advertencia >= inicio_periodo,
        Advertencia.data_advertencia < fim_periodo,
        Advertencia.removido_em.is_(None),
    ).count()

    suspensoes_mes = aplicar_filtros_ocorrencias(
        db.query(Suspensao),
        setor,
        status,
    ).filter(
        Suspensao.data_inicio >= inicio_periodo,
        Suspensao.data_inicio < fim_periodo,
        Suspensao.removido_em.is_(None),
    ).count()

    status_aso = status if status != "todos" else "ativos"
    colaboradores_com_aso = aplicar_filtros_colaboradores(
        db.query(Colaborador),
        setor,
        status_aso,
    ).filter(Colaborador.data_aso.isnot(None)).all()

    asos_vencidos = 0
    asos_vencendo_30_dias = 0

    for colaborador in colaboradores_com_aso:
        vencimento = calcular_vencimento_aso(colaborador.data_aso)

        if vencimento < hoje:
            asos_vencidos += 1
        elif vencimento <= limite_aso:
            asos_vencendo_30_dias += 1

    colaboradores_em_experiencia = aplicar_filtros_colaboradores(
        db.query(Colaborador),
        setor,
        "ativos",
    ).filter(
        Colaborador.data_admissao.isnot(None),
        Colaborador.data_desligamento.is_(None),
    ).all()

    experiencias_vencidas = 0
    experiencias_vencendo_30_dias = 0
    experiencias_concluidas = listar_experiencias_concluidas(db)

    for colaborador in colaboradores_em_experiencia:
        for alerta in montar_status_experiencia(
            colaborador,
            hoje,
            experiencias_concluidas,
        ):
            if alerta["status"] == "Vencido":
                experiencias_vencidas += 1
            elif alerta["status"] == "Vencendo":
                experiencias_vencendo_30_dias += 1

    colaboradores_com_ferias = aplicar_filtros_colaboradores(
        db.query(Colaborador),
        setor,
        "ativos",
    ).filter(
        Colaborador.data_admissao.isnot(None),
        Colaborador.data_desligamento.is_(None),
    ).all()

    ferias_vencidas = 0
    ferias_vencendo_30_dias = 0
    ultimos_retornos = listar_ultimos_retornos_ferias(db)

    for colaborador in colaboradores_com_ferias:
        alerta = montar_status_ferias(colaborador, hoje, ultimos_retornos)

        if alerta["status"] == "Vencido":
            ferias_vencidas += 1
        elif alerta["status"] == "Vencendo":
            ferias_vencendo_30_dias += 1

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
        "experiencias_vencidas": experiencias_vencidas,
        "experiencias_vencendo_30_dias": experiencias_vencendo_30_dias,
        "ferias_vencidas": ferias_vencidas,
        "ferias_vencendo_30_dias": ferias_vencendo_30_dias,
    }


@router.get("/asos", response_model=list[DashboardAsoResponse])
def listar_status_asos(
    setor: str | None = None,
    status: str = "ativos",
    db: Session = Depends(get_db),
):
    hoje = date.today()

    colaboradores = aplicar_filtros_colaboradores(
        db.query(Colaborador),
        setor,
        status,
    ).filter(Colaborador.data_aso.isnot(None)).all()

    status_asos = [
        montar_status_aso(colaborador, hoje)
        for colaborador in colaboradores
    ]

    status_asos.sort(
        key=lambda item: item["dias_para_vencer"]
    )

    return status_asos


@router.get("/experiencia", response_model=list[DashboardExperienciaResponse])
def listar_status_experiencia(
    setor: str | None = None,
    status: str = "ativos",
    db: Session = Depends(get_db),
):
    hoje = date.today()

    colaboradores = aplicar_filtros_colaboradores(
        db.query(Colaborador),
        setor,
        status,
    ).filter(
        Colaborador.data_admissao.isnot(None),
        Colaborador.data_desligamento.is_(None),
    ).all()

    experiencias_concluidas = listar_experiencias_concluidas(db)
    status_experiencia = [
        alerta
        for colaborador in colaboradores
        for alerta in montar_status_experiencia(
            colaborador,
            hoje,
            experiencias_concluidas,
        )
    ]

    status_experiencia.sort(
        key=lambda item: item["dias_para_vencer"]
    )

    return status_experiencia


@router.get("/ferias", response_model=list[DashboardFeriasResponse])
def listar_status_ferias(
    setor: str | None = None,
    status: str = "ativos",
    db: Session = Depends(get_db),
):
    hoje = date.today()

    colaboradores = aplicar_filtros_colaboradores(
        db.query(Colaborador),
        setor,
        status,
    ).filter(
        Colaborador.data_admissao.isnot(None),
        Colaborador.data_desligamento.is_(None),
    ).all()

    ultimos_retornos = listar_ultimos_retornos_ferias(db)
    status_ferias = [
        montar_status_ferias(colaborador, hoje, ultimos_retornos)
        for colaborador in colaboradores
    ]

    status_ferias.sort(
        key=lambda item: item["dias_para_vencer"]
    )

    return status_ferias


@router.get("/score", response_model=list[DashboardScoreResponse])
def score_disciplinar(
    data_inicio: date | None = None,
    data_fim: date | None = None,
    setor: str | None = None,
    status: str = "todos",
    db: Session = Depends(get_db),
):
    inicio_periodo, fim_periodo = montar_periodo(data_inicio, data_fim)
    colaboradores = aplicar_filtros_colaboradores(
        db.query(Colaborador),
        setor,
        status,
    ).all()

    faltas_por_colaborador = dict(
        db.query(Falta.colaborador_id, func.count(Falta.id))
        .filter(
            Falta.data_falta >= inicio_periodo,
            Falta.data_falta < fim_periodo,
            Falta.removido_em.is_(None),
        )
        .group_by(Falta.colaborador_id)
        .all()
    )

    advertencias_por_tipo = {
        (colaborador_id, tipo): total
        for colaborador_id, tipo, total in (
            db.query(
                Advertencia.colaborador_id,
                Advertencia.tipo,
                func.count(Advertencia.id),
            )
            .filter(
                Advertencia.data_advertencia >= inicio_periodo,
                Advertencia.data_advertencia < fim_periodo,
                Advertencia.removido_em.is_(None),
            )
            .group_by(Advertencia.colaborador_id, Advertencia.tipo)
            .all()
        )
    }

    suspensoes_por_colaborador = dict(
        db.query(Suspensao.colaborador_id, func.count(Suspensao.id))
        .filter(
            Suspensao.data_inicio >= inicio_periodo,
            Suspensao.data_inicio < fim_periodo,
            Suspensao.removido_em.is_(None),
        )
        .group_by(Suspensao.colaborador_id)
        .all()
    )

    ranking = []

    for colaborador in colaboradores:
        score = 100

        faltas = faltas_por_colaborador.get(colaborador.id, 0)
        advertencias_verbais = advertencias_por_tipo.get(
            (colaborador.id, "Verbal"),
            0,
        )
        advertencias_escritas = advertencias_por_tipo.get(
            (colaborador.id, "Escrita"),
            0,
        )
        suspensoes = suspensoes_por_colaborador.get(colaborador.id, 0)

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


def chave_mes(data_item: date):
    return f"{data_item.year:04d}-{data_item.month:02d}"


def ultimos_meses(hoje: date, quantidade: int = 6):
    meses = []
    ano = hoje.year
    mes = hoje.month

    for _ in range(quantidade):
        meses.append(f"{ano:04d}-{mes:02d}")
        mes -= 1

        if mes == 0:
            mes = 12
            ano -= 1

    return list(reversed(meses))


def meses_do_periodo(inicio: date, fim: date, limite: int = 12):
    meses = []
    ano = inicio.year
    mes = inicio.month
    ultimo_dia = fim - timedelta(days=1)

    while (ano, mes) <= (ultimo_dia.year, ultimo_dia.month):
        meses.append(f"{ano:04d}-{mes:02d}")
        mes += 1

        if mes == 13:
            mes = 1
            ano += 1

    return meses[-limite:]


@router.get("/mensal", response_model=list[DashboardMensalResponse])
def ocorrencias_mensais(
    data_inicio: date | None = None,
    data_fim: date | None = None,
    setor: str | None = None,
    status: str = "todos",
    db: Session = Depends(get_db),
):
    hoje = date.today()
    meses = ultimos_meses(hoje)
    primeiro_mes = meses[0]
    inicio_padrao = date(
        int(primeiro_mes.split("-")[0]),
        int(primeiro_mes.split("-")[1]),
        1,
    )
    fim_padrao = inicio_do_proximo_mes(hoje)
    inicio = data_inicio or inicio_padrao
    fim = data_fim + timedelta(days=1) if data_fim else fim_padrao
    meses = meses_do_periodo(inicio, fim)

    dados = {
        mes: {
            "mes": mes,
            "faltas": 0,
            "atestados": 0,
            "advertencias": 0,
            "suspensoes": 0,
        }
        for mes in meses
    }

    for falta in aplicar_filtros_ocorrencias(
        db.query(Falta),
        setor,
        status,
    ).filter(
        Falta.data_falta >= inicio,
        Falta.data_falta < fim,
        Falta.removido_em.is_(None),
    ).all():
        mes = chave_mes(falta.data_falta)
        if mes in dados:
            dados[mes]["faltas"] += 1

    for atestado in aplicar_filtros_ocorrencias(
        db.query(AtestadoMedico),
        setor,
        status,
    ).filter(
        AtestadoMedico.data_atestado >= inicio,
        AtestadoMedico.data_atestado < fim,
        AtestadoMedico.removido_em.is_(None),
    ).all():
        mes = chave_mes(atestado.data_atestado)
        if mes in dados:
            dados[mes]["atestados"] += 1

    for advertencia in aplicar_filtros_ocorrencias(
        db.query(Advertencia),
        setor,
        status,
    ).filter(
        Advertencia.data_advertencia >= inicio,
        Advertencia.data_advertencia < fim,
        Advertencia.removido_em.is_(None),
    ).all():
        mes = chave_mes(advertencia.data_advertencia)
        if mes in dados:
            dados[mes]["advertencias"] += 1

    for suspensao in aplicar_filtros_ocorrencias(
        db.query(Suspensao),
        setor,
        status,
    ).filter(
        Suspensao.data_inicio >= inicio,
        Suspensao.data_inicio < fim,
        Suspensao.removido_em.is_(None),
    ).all():
        mes = chave_mes(suspensao.data_inicio)
        if mes in dados:
            dados[mes]["suspensoes"] += 1

    return list(dados.values())


@router.get("/setores", response_model=list[DashboardSetorResponse])
def colaboradores_por_setor(
    setor: str | None = None,
    status: str = "ativos",
    db: Session = Depends(get_db),
):
    resultados = (
        aplicar_filtros_colaboradores(
            db.query(Colaborador.setor, func.count(Colaborador.id)),
            setor,
            status,
        )
        .group_by(Colaborador.setor)
        .all()
    )

    setores = [
        {
            "setor": setor or "Sem setor",
            "total": total,
        }
        for setor, total in resultados
    ]

    setores.sort(key=lambda item: item["total"], reverse=True)

    return setores
