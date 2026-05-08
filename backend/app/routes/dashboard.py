from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Colaborador, Falta, Advertencia, Suspensao

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

def get_db():
    db = SessionLocal()
    
    try:
        yield db
    finally:
        db.close()

@router.get("/resumo")
def resumo_dashboard(db: Session = Depends(get_db)):
    hoje = date.today()
    
    inicio_mes = date(
        hoje.year,
        hoje.month,
        1
    )
    
    total_colaboradores = db.query(Colaborador).count()
    
    ativos = db.query(Colaborador).filter(
        Colaborador.ativo == True
    ).count()
    
    inativos = db.query(Colaborador).filter(
        Colaborador.ativo == False
    ).count()
    
    falta_mes = db.query(Falta).filter(
        Falta.data_falta >= inicio_mes
    ).count()
    
    advertencias_mes = db.query(Advertencia).filter(
        Advertencia.data_advertencia >= inicio_mes
    ).count()
    
    suspensoes_mes = db.query(Suspensao).filter(
        Suspensao.data_inicio >= inicio_mes
    ).count()
    
    return {
        "total_colaboradores": total_colaboradores,
        "ativos": ativos,
        "inativos": inativos,
        "falta_mes": falta_mes,
        "advertencias_mes": advertencias_mes,
        "suspensoes_mes": suspensoes_mes
    }

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
                Advertencia.tipo == "Verbal"
            )
            .count()
        )
        
        advertencias_escritas = (
            db.query(Advertencia)
            .filter(
                Advertencia.colaborador_id == colaborador.id,
                Advertencia.tipo == "Escrita"
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
            "nivel": nivel
        })
    
    ranking.sort(key=lambda x: x["score"], reverse=True)
    
    return ranking
        
    