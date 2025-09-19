# backend/test_db.py
from .database import SessionLocal
from .models import PVModule

def test_insert_and_query():
    db = SessionLocal()
    try:
        m = PVModule(name="Test Module A", voc=44.2, isc=5.33, vmp=36.0, imp=5.0, ns=60, kv=-0.123, ki=0.003)
        db.add(m)
        db.commit()
        db.refresh(m)
        print("Inserted module id:", m.id)

        mods = db.query(PVModule).all()
        for mo in mods:
            print(mo.id, mo.name, mo.voc, mo.isc)
    finally:
        db.close()

if __name__ == "__main__":
    test_insert_and_query()
