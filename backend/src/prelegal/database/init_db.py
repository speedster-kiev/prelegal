from sqlalchemy.engine import Engine

import prelegal.models  # noqa: F401 — imports all models, registering them with Base.metadata
from prelegal.database.engine import Base


def init_db(engine: Engine) -> None:
    Base.metadata.create_all(bind=engine)
