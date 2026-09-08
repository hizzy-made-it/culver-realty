"""Seed the database from seed/properties.json (the live site's catalog snapshot) when empty."""
import json
from pathlib import Path


async def seed_if_empty(db, path: Path):
    if await db.count("properties") > 0 or not path.exists():
        return
    payload = json.loads(path.read_text())
    rows = payload.get("properties", payload)
    for row in rows:
        await db.insert("properties", row)
    print(f"[seed] inserted {len(rows)} properties from {path.name}")
