from sqlalchemy import inspect

from prelegal.database.init_db import init_db


def test_init_db_creates_users_table(test_engine):
    init_db(test_engine)
    inspector = inspect(test_engine)
    assert "users" in inspector.get_table_names()


def test_users_table_has_expected_columns(test_engine):
    init_db(test_engine)
    inspector = inspect(test_engine)
    columns = {col["name"] for col in inspector.get_columns("users")}
    assert columns >= {"id", "email", "hashed_password", "created_at"}


def test_init_db_is_idempotent(test_engine):
    """create_all should be safe to call multiple times."""
    init_db(test_engine)
    init_db(test_engine)
    inspector = inspect(test_engine)
    assert inspector.get_table_names().count("users") == 1
