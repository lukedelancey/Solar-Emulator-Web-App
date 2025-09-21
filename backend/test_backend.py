import requests
import psycopg2
from psycopg2.extras import RealDictCursor
import random

# ----------------------------
# Config
# ----------------------------
BASE_URL = "http://127.0.0.1:8000"
DB_HOST = "localhost"
DB_NAME = "pvdb"
DB_USER = "pvuser"
DB_PASSWORD = "Dynamos32"  # update with your pvuser password
DB_PORT = 5432

# ----------------------------
# Helper functions
# ----------------------------
def db_connect():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        cursor_factory=RealDictCursor
    )

def db_query(query, params=None):
    conn = db_connect()
    cur = conn.cursor()
    cur.execute(query, params)
    try:
        results = cur.fetchall()
    except psycopg2.ProgrammingError:
        results = None
    conn.commit()
    cur.close()
    conn.close()
    return results

def print_test(title, passed):
    status = "PASSED" if passed else "FAILED"
    print(f"[{status}] {title}")

# ----------------------------
# Test cases
# ----------------------------
def run_tests():
    print("=== Starting API + DB Tests ===")

    # 1. Clean slate (delete test modules if any exist)
    db_query("DELETE FROM pvmodules WHERE name LIKE 'TEST_%';")

    # ----------------------------
    # Test PV Module Creation
    # ----------------------------
    module_payload = {
        "name": f"TEST_MODULE_{random.randint(1,10000)}",
        "voc": 40.0,
        "isc": 9.0,
        "vmp": 32.0,
        "imp": 8.5,
        "ns": 60,
        "kv": -0.3,
        "ki": 0.004
    }

    r = requests.post(f"{BASE_URL}/modules", json=module_payload)
    passed = r.status_code == 201 and r.json()["name"] == module_payload["name"]
    print_test("Create module", passed)
    module_id = r.json()["id"] if passed else None

    # Duplicate name check
    r2 = requests.post(f"{BASE_URL}/modules", json=module_payload)
    print_test("Duplicate module creation should fail", r2.status_code == 400)

    # ----------------------------
    # Test GET /modules
    # ----------------------------
    r = requests.get(f"{BASE_URL}/modules")
    passed = r.status_code == 200 and any(m["id"] == module_id for m in r.json())
    print_test("Get all modules", passed)

    # Test GET /modules/{id} valid
    r = requests.get(f"{BASE_URL}/modules/{module_id}")
    passed = r.status_code == 200 and r.json()["id"] == module_id
    print_test("Get module by valid ID", passed)

    # Test GET /modules/{id} invalid
    r = requests.get(f"{BASE_URL}/modules/999999")
    print_test("Get module by invalid ID returns 404", r.status_code == 404)

    # ----------------------------
    # Test PUT /modules/{id}
    # ----------------------------
    update_payload = {"voc": 41.0, "imp": 8.6}
    r = requests.put(f"{BASE_URL}/modules/{module_id}", json=update_payload)
    resp_json = r.json()
    passed = r.status_code == 200 and resp_json["voc"] == 41.0 and resp_json["imp"] == 8.6
    print_test("Update module partial", passed)

    # ----------------------------
    # Test Simulation Endpoint
    # ----------------------------
    sim_payload = {
        "module_id": module_id,
        "use_environmental_conditions": True,
        "irradiance": 800.0,
        "temperature": 40.0
    }
    r = requests.post(f"{BASE_URL}/simulate_iv_curve/", json=sim_payload)
    resp_json = r.json()
    passed = r.status_code == 200 and "iv_curve" in resp_json and len(resp_json["iv_curve"]) > 0
    print_test("Simulate IV curve with environmental conditions", passed)

    # Edge case: invalid module
    sim_payload_invalid = {"module_id": 999999, "use_environmental_conditions": False}
    r = requests.post(f"{BASE_URL}/simulate_iv_curve/", json=sim_payload_invalid)
    print_test("Simulate IV curve with invalid module ID returns 404", r.status_code == 404)

    # Edge case: zero irradiance
    sim_payload_zero = {"module_id": module_id, "use_environmental_conditions": True, "irradiance": 0, "temperature": 25}
    r = requests.post(f"{BASE_URL}/simulate_iv_curve/", json=sim_payload_zero)
    resp_json = r.json()
    passed = r.status_code == 200 and resp_json["summary"]["Isc"] >= 0
    print_test("Simulate IV curve with 0 irradiance", passed)

    # ----------------------------
    # Test DELETE /modules/{id}
    # ----------------------------
    r = requests.delete(f"{BASE_URL}/modules/{module_id}")
    passed = r.status_code == 200
    print_test("Delete module by valid ID", passed)

    # Verify deletion in DB
    db_modules = db_query("SELECT * FROM pvmodules WHERE id = %s", (module_id,))
    print_test("Module removed from DB after deletion", len(db_modules) == 0)

    # ----------------------------
    # Check alembic_version unchanged
    # ----------------------------
    alembic_ver = db_query("SELECT * FROM alembic_version")
    print_test("Alembic version table exists", len(alembic_ver) == 1)

    print("=== All tests complete ===")

# ----------------------------
# Run tests
# ----------------------------
if __name__ == "__main__":
    run_tests()
