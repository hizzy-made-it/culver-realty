"""
Persistence layer.

Default: a JSON document store on disk (backend/data/db.json) — zero setup.
Optional: set MONGO_URL (+ DB_NAME) in backend/.env to use MongoDB instead.

Both backends expose the same tiny async interface used by server.py:
    list(collection, filter=None, sort=None, limit=None)
    get(collection, id)
    find_one(collection, filter)
    insert(collection, doc)
    update(collection, id, patch)
    delete(collection, id)
    count(collection, filter=None)
"""
import json
import os
import threading
from pathlib import Path
from typing import Any, Optional


def _matches(doc: dict, flt: Optional[dict]) -> bool:
    if not flt:
        return True
    for k, v in flt.items():
        if k == "$or":
            if not any(_matches(doc, sub) for sub in v):
                return False
            continue
        val = doc.get(k)
        if isinstance(v, dict):
            for op, arg in v.items():
                if op == "$gte" and not (val is not None and val >= arg):
                    return False
                if op == "$lte" and not (val is not None and val <= arg):
                    return False
                if op == "$ne" and val == arg:
                    return False
                if op == "$in" and val not in arg:
                    return False
        elif val != v:
            return False
    return True


class JsonStore:
    def __init__(self, path: Path):
        self.path = path
        self.lock = threading.Lock()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if self.path.exists():
            self.data = json.loads(self.path.read_text() or "{}")
        else:
            self.data = {}

    def _flush(self):
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.data, indent=1))
        tmp.replace(self.path)

    def _col(self, name) -> list:
        return self.data.setdefault(name, [])

    async def list(self, col, flt=None, sort=None, limit=None):
        rows = [d for d in self._col(col) if _matches(d, flt)]
        if sort:
            key, direction = sort
            rows.sort(key=lambda d: (d.get(key) is None, d.get(key)), reverse=direction < 0)
        if limit:
            rows = rows[:limit]
        return [dict(r) for r in rows]

    async def get(self, col, id):
        return await self.find_one(col, {"id": id})

    async def find_one(self, col, flt):
        for d in self._col(col):
            if _matches(d, flt):
                return dict(d)
        return None

    async def insert(self, col, doc):
        with self.lock:
            self._col(col).append(dict(doc))
            self._flush()
        return dict(doc)

    async def update(self, col, id, patch):
        with self.lock:
            for d in self._col(col):
                if d.get("id") == id:
                    d.update(patch)
                    self._flush()
                    return dict(d)
        return None

    async def delete(self, col, id):
        with self.lock:
            rows = self._col(col)
            before = len(rows)
            self.data[col] = [d for d in rows if d.get("id") != id]
            self._flush()
            return len(self.data[col]) < before

    async def count(self, col, flt=None):
        return len([d for d in self._col(col) if _matches(d, flt)])


class MongoStore:
    def __init__(self, url: str, db_name: str):
        from motor.motor_asyncio import AsyncIOMotorClient  # lazy import

        self.client = AsyncIOMotorClient(url)
        self.db = self.client[db_name]

    async def list(self, col, flt=None, sort=None, limit=None):
        cur = self.db[col].find(flt or {}, {"_id": 0})
        if sort:
            cur = cur.sort(sort[0], sort[1])
        if limit:
            cur = cur.limit(limit)
        return await cur.to_list(length=limit or 10000)

    async def get(self, col, id):
        return await self.db[col].find_one({"id": id}, {"_id": 0})

    async def find_one(self, col, flt):
        return await self.db[col].find_one(flt, {"_id": 0})

    async def insert(self, col, doc):
        await self.db[col].insert_one(dict(doc))
        return doc

    async def update(self, col, id, patch):
        await self.db[col].update_one({"id": id}, {"$set": patch})
        return await self.get(col, id)

    async def delete(self, col, id):
        r = await self.db[col].delete_one({"id": id})
        return r.deleted_count > 0

    async def count(self, col, flt=None):
        return await self.db[col].count_documents(flt or {})


def make_store() -> Any:
    mongo = os.environ.get("MONGO_URL")
    if mongo:
        return MongoStore(mongo, os.environ.get("DB_NAME", "culver_realty"))
    root = Path(__file__).resolve().parent
    return JsonStore(root / "data" / "db.json")
