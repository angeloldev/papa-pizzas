from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.models import DataBloqueada


def _proximo_sabado(a_partir_de: date) -> date:
    dias_ate_sabado = (5 - a_partir_de.weekday()) % 7
    return a_partir_de + timedelta(days=dias_ate_sabado)


def _esta_no_prazo(sabado: date) -> bool:
    """Retorna True se ainda dentro do prazo (antes de sexta às 12h)."""
    agora = datetime.now()
    sexta = sabado - timedelta(days=1)
    corte = datetime(sexta.year, sexta.month, sexta.day, 12, 0, 0)
    return agora < corte


def datas_disponiveis(db: Session, quantidade: int = 8) -> list[date]:
    """Retorna sábados disponíveis: exclui bloqueados pelo admin e fora do prazo de sexta às 12h."""
    bloqueadas: set[date] = {row.data for row in db.query(DataBloqueada.data).all()}

    hoje = date.today()
    candidato = _proximo_sabado(hoje)
    disponiveis: list[date] = []

    while len(disponiveis) < quantidade:
        if candidato not in bloqueadas and _esta_no_prazo(candidato):
            disponiveis.append(candidato)
        candidato += timedelta(weeks=1)

    return disponiveis
