#!/bin/bash
set -e

echo "Running database migrations..."

# Fix corrupted alembic_version table that may have multiple entries
# (can happen when a previous migration partially failed)
python -c "
import os, sys
from sqlalchemy import create_engine, text, inspect

url = os.environ.get('DATABASE_URL', '')
if url.startswith('postgres://'):
    url = url.replace('postgres://', 'postgresql://', 1)

if not url:
    print('No DATABASE_URL set, skipping version table check')
    sys.exit(0)

engine = create_engine(url)
with engine.connect() as conn:
    insp = inspect(engine)
    if 'alembic_version' in insp.get_table_names():
        rows = conn.execute(text('SELECT version_num FROM alembic_version')).fetchall()
        if len(rows) > 1:
            versions = [r[0] for r in rows]
            print(f'WARNING: Found multiple alembic versions: {versions}')
            print('Fixing by keeping only the latest version...')
            # Keep only the highest revision
            from alembic.config import Config
            from alembic.script import ScriptDirectory
            config = Config('alembic.ini')
            script = ScriptDirectory.from_config(config)
            heads = set(script.get_heads())
            # Walk from head backwards to find which DB version is latest
            latest = None
            for rev in script.walk_revisions():
                if rev.revision in versions:
                    latest = rev.revision
                    break
            if latest:
                print(f'Keeping latest version: {latest}')
                conn.execute(text('DELETE FROM alembic_version'))
                conn.execute(text('INSERT INTO alembic_version (version_num) VALUES (:v)'), {'v': latest})
                conn.commit()
                print('Fixed alembic_version table')
        elif len(rows) == 1:
            print(f'Current alembic version: {rows[0][0]}')
        else:
            print('No alembic version found (fresh database)')
    else:
        print('No alembic_version table found (fresh database)')
engine.dispose()
"

alembic upgrade head

echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2
