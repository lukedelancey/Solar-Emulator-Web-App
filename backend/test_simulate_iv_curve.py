# backend/test_simulate_iv_curve.py
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend import models
import numpy as np

client = TestClient(app)

# Realistic PV module parameters for testing
test_module_configs = [
    {
        "name": "Small_Mono_100W",
        "celltype": "monoSi",
        "voc": 22.5,
        "isc": 5.85,
        "vmp": 18.2,
        "imp": 5.49,
        "ns": 36,
        "ki": 0.0035,
        "kv": -0.0704,
    },
    {
        "name": "Standard_Mono_300W",
        "celltype": "monoSi",
        "voc": 39.7,
        "isc": 9.45,
        "vmp": 32.9,
        "imp": 9.12,
        "ns": 60,
        "ki": 0.0047,
        "kv": -0.123,
    },
    {
        "name": "High_Power_Mono_500W",
        "celltype": "monoSi",
        "voc": 47.4,
        "isc": 13.2,
        "vmp": 40.6,
        "imp": 12.3,
        "ns": 72,
        "ki": 0.0066,
        "kv": -0.142,
    },
    {
        "name": "Multi_Si_250W",
        "celltype": "multiSi",
        "voc": 37.8,
        "isc": 8.75,
        "vmp": 30.6,
        "imp": 8.17,
        "ns": 60,
        "ki": 0.0052,
        "kv": -0.125,
    },
    {
        "name": "CdTe_Thin_Film_100W",
        "celltype": "cdte",
        "voc": 67.5,
        "isc": 1.85,
        "vmp": 54.7,
        "imp": 1.83,
        "ns": 116,
        "ki": 0.00074,
        "kv": -0.216,
    },
    {
        "name": "CIGS_Thin_Film_130W",
        "celltype": "cigs",
        "voc": 69.2,
        "isc": 2.4,
        "vmp": 58.5,
        "imp": 2.22,
        "ns": 120,
        "ki": 0.00084,
        "kv": -0.221,
    },
    {
        "name": "Amorphous_Si_80W",
        "celltype": "amorphous",
        "voc": 44.0,
        "isc": 2.55,
        "vmp": 33.8,
        "imp": 2.37,
        "ns": 60,
        "ki": 0.00128,
        "kv": -0.154,
    },
    {
        "name": "Bifacial_Mono_400W",
        "celltype": "monoSi",
        "voc": 41.2,
        "isc": 12.05,
        "vmp": 34.7,
        "imp": 11.53,
        "ns": 66,
        "ki": 0.0060,
        "kv": -0.127,
    },
]

# Environmental test conditions
test_conditions = [
    {"name": "STC", "irradiance": 1000, "temperature": 25},
    {"name": "Hot_Sunny", "irradiance": 1200, "temperature": 45},
    {"name": "Cool_Cloudy", "irradiance": 400, "temperature": 15},
    {"name": "Dawn_Dusk", "irradiance": 200, "temperature": 20},
    {"name": "Cold_Bright", "irradiance": 900, "temperature": -10},
    {"name": "Very_Hot", "irradiance": 1000, "temperature": 65},
]

# ------------------------
# Helper Functions
# ------------------------
def create_test_module(db_session, config):
    """Create a single test module from config"""
    mod = models.PVModule(
        name=config["name"],
        voc=config["voc"],
        isc=config["isc"],
        vmp=config["vmp"],
        imp=config["imp"],
        ns=config["ns"],
        kv=config["kv"],
        ki=config["ki"]
    )
    db_session.add(mod)
    db_session.commit()
    db_session.refresh(mod)
    return mod

# ------------------------
# Fixtures
# ------------------------
@pytest.fixture(scope="session")
def test_modules():
    """Create all test modules at start of test session"""
    db = SessionLocal()
    created_modules = []

    try:
        for config in test_module_configs:
            mod = create_test_module(db, config)
            created_modules.append((mod, config))

        yield created_modules

    finally:
        # Clean up all modules
        for mod, _ in created_modules:
            db.delete(mod)
        db.commit()
        db.close()

@pytest.fixture
def single_test_module():
    """Create a single module for basic tests"""
    db = SessionLocal()
    config = test_module_configs[1]  # Standard 300W mono
    mod = create_test_module(db, config)

    yield mod, config

    # Clean up
    db.delete(mod)
    db.commit()
    db.close()

# ------------------------
# Basic Functionality Tests
# ------------------------
def test_simulate_default(single_test_module):
    """Test default simulation (STC conditions)"""
    mod, config = single_test_module

    response = client.post("/simulate_iv_curve/", json={
        "module_id": mod.id,
        "use_environmental_conditions": False
    })

    assert response.status_code == 200
    data = response.json()

    # Check structure
    for key in ["module_id", "mode", "irradiance", "temperature", "iv_curve", "pv_curve", "summary"]:
        assert key in data

    # Check default conditions
    assert data["irradiance"] == 1000.0
    assert data["temperature"] == 25.0
    assert data["mode"] == "default"

    # Check curves exist and are non-empty
    assert isinstance(data["iv_curve"], list) and len(data["iv_curve"]) > 0
    assert isinstance(data["pv_curve"], list) and len(data["pv_curve"]) > 0

    # Check summary structure
    summary = data["summary"]
    for param in ["Voc", "Isc", "Vmp", "Imp", "Pmp"]:
        assert param in summary
        assert summary[param] > 0  # Should be positive values

def test_simulate_with_env(single_test_module):
    """Test environmental conditions simulation"""
    mod, config = single_test_module

    response = client.post("/simulate_iv_curve/", json={
        "module_id": mod.id,
        "use_environmental_conditions": True,
        "irradiance": 800,
        "temperature": 35
    })

    assert response.status_code == 200
    data = response.json()
    assert data["irradiance"] == 800
    assert data["temperature"] == 35
    assert data["mode"] == "environment"

def test_simulate_invalid_module():
    """Test handling of non-existent module"""
    response = client.post("/simulate_iv_curve/", json={
        "module_id": 999999,
        "use_environmental_conditions": False
    })
    assert response.status_code == 404
    assert response.json()["detail"] == "Module not found"

def test_simulate_edge_irradiance(single_test_module):
    """Test zero irradiance edge case"""
    mod, config = single_test_module

    response = client.post("/simulate_iv_curve/", json={
        "module_id": mod.id,
        "use_environmental_conditions": True,
        "irradiance": 0
    })

    assert response.status_code == 200
    data = response.json()

    # All currents should be zero or very close to zero
    iv_curve = data["iv_curve"]
    for V, I in iv_curve:
        assert I >= 0
        assert I < 1e-6  # Should be essentially zero

def test_output_format_consistency(single_test_module):
    """Test output format consistency"""
    mod, config = single_test_module

    response = client.post("/simulate_iv_curve/", json={
        "module_id": mod.id,
        "use_environmental_conditions": False
    })

    data = response.json()

    # Check all IV points have correct format
    for point in data["iv_curve"]:
        assert len(point) == 2
        assert isinstance(point[0], (int, float))  # Voltage
        assert isinstance(point[1], (int, float))  # Current

    # Check all PV points have correct format
    for point in data["pv_curve"]:
        assert len(point) == 2
        assert isinstance(point[0], (int, float))  # Voltage
        assert isinstance(point[1], (int, float))  # Power

# ------------------------
# Comprehensive Module Type Tests
# ------------------------
@pytest.mark.parametrize("module_idx", range(len(test_module_configs)))
def test_all_module_types_stc(test_modules, module_idx):
    """Test all module types under STC conditions"""
    mod, config = test_modules[module_idx]

    response = client.post("/simulate_iv_curve/", json={
        "module_id": mod.id,
        "use_environmental_conditions": False
    })

    assert response.status_code == 200, f"Failed for module {config['name']}"
    data = response.json()

    # Basic checks
    assert len(data["iv_curve"]) > 0
    assert len(data["pv_curve"]) > 0

    # Physical reasonableness checks
    summary = data["summary"]
    assert summary["Voc"] > 0, f"Voc should be positive for {config['name']}"
    assert summary["Isc"] > 0, f"Isc should be positive for {config['name']}"
    assert summary["Pmp"] > 0, f"Pmp should be positive for {config['name']}"

    # IV curve should be monotonically decreasing in current
    iv_curve = data["iv_curve"]
    for i in range(1, len(iv_curve)):
        assert iv_curve[i][1] <= iv_curve[i-1][1], f"Current should decrease with voltage for {config['name']}"

@pytest.mark.parametrize("condition_idx", range(len(test_conditions)))
def test_environmental_conditions(single_test_module, condition_idx):
    """Test different environmental conditions"""
    mod, config = single_test_module
    condition = test_conditions[condition_idx]

    response = client.post("/simulate_iv_curve/", json={
        "module_id": mod.id,
        "use_environmental_conditions": True,
        "irradiance": condition["irradiance"],
        "temperature": condition["temperature"]
    })

    assert response.status_code == 200, f"Failed for condition {condition['name']}"
    data = response.json()

    # Verify conditions were applied
    assert data["irradiance"] == condition["irradiance"]
    assert data["temperature"] == condition["temperature"]

    # Should still produce valid curves (except for zero irradiance)
    if condition["irradiance"] > 0:
        assert len(data["iv_curve"]) > 0
        assert data["summary"]["Pmp"] > 0

# ------------------------
# Module Comparison Tests
# ------------------------
def test_module_performance_comparison(test_modules):
    """Test that different module types produce expected relative performance"""
    results = {}

    # Simulate all modules under STC
    for mod, config in test_modules:
        response = client.post("/simulate_iv_curve/", json={
            "module_id": mod.id,
            "use_environmental_conditions": False
        })

        assert response.status_code == 200
        data = response.json()
        results[config["name"]] = data["summary"]

    # High power modules should have higher power output
    assert results["High_Power_Mono_500W"]["Pmp"] > results["Standard_Mono_300W"]["Pmp"]
    assert results["Standard_Mono_300W"]["Pmp"] > results["Small_Mono_100W"]["Pmp"]

    # Thin film modules should have higher voltage, lower current
    cdte_voc = results["CdTe_Thin_Film_100W"]["Voc"]
    mono_voc = results["Standard_Mono_300W"]["Voc"]
    assert cdte_voc > mono_voc, "CdTe should have higher Voc than crystalline Si"

def test_temperature_effects(test_modules):
    """Test that temperature effects are realistic"""
    # Test with mono module
    mod, config = test_modules[1]  # Standard mono 300W

    # Get performance at different temperatures
    cold_response = client.post("/simulate_iv_curve/", json={
        "module_id": mod.id,
        "use_environmental_conditions": True,
        "irradiance": 1000,
        "temperature": 15
    })

    hot_response = client.post("/simulate_iv_curve/", json={
        "module_id": mod.id,
        "use_environmental_conditions": True,
        "irradiance": 1000,
        "temperature": 45
    })

    assert cold_response.status_code == 200
    assert hot_response.status_code == 200

    cold_data = cold_response.json()
    hot_data = hot_response.json()

    # Voltage should decrease with temperature
    assert cold_data["summary"]["Voc"] > hot_data["summary"]["Voc"]

    # Current should increase slightly with temperature
    assert cold_data["summary"]["Isc"] < hot_data["summary"]["Isc"]

def test_irradiance_scaling(single_test_module):
    """Test that current scales with irradiance"""
    mod, config = single_test_module

    # Test at different irradiance levels
    low_irr = client.post("/simulate_iv_curve/", json={
        "module_id": mod.id,
        "use_environmental_conditions": True,
        "irradiance": 500,
        "temperature": 25
    })

    high_irr = client.post("/simulate_iv_curve/", json={
        "module_id": mod.id,
        "use_environmental_conditions": True,
        "irradiance": 1000,
        "temperature": 25
    })

    assert low_irr.status_code == 200
    assert high_irr.status_code == 200

    low_data = low_irr.json()
    high_data = high_irr.json()

    # Current should scale approximately linearly with irradiance
    current_ratio = high_data["summary"]["Isc"] / low_data["summary"]["Isc"]
    expected_ratio = 1000 / 500

    # Allow for some variation due to temperature effects
    assert abs(current_ratio - expected_ratio) < 0.2, f"Current scaling incorrect: {current_ratio} vs expected {expected_ratio}"

# ------------------------
# Performance Tests
# ------------------------
def test_simulation_performance(single_test_module):
    """Test that simulation completes in reasonable time"""
    import time

    mod, config = single_test_module

    start_time = time.time()
    response = client.post("/simulate_iv_curve/", json={
        "module_id": mod.id,
        "use_environmental_conditions": False
    })
    end_time = time.time()

    assert response.status_code == 200
    assert (end_time - start_time) < 2.0, "Simulation should complete within 2 seconds"

# ------------------------
# Error Handling Tests
# ------------------------
def test_invalid_environmental_conditions(single_test_module):
    """Test handling of invalid environmental conditions"""
    mod, config = single_test_module

    # Test negative irradiance (should be handled)
    response = client.post("/simulate_iv_curve/", json={
        "module_id": mod.id,
        "use_environmental_conditions": True,
        "irradiance": -100,
        "temperature": 25
    })

    # Should either reject or handle gracefully
    if response.status_code == 200:
        # If accepted, should handle as zero irradiance case
        data = response.json()
        assert data["summary"]["Pmp"] == 0
    else:
        # If rejected, should return meaningful error
        assert response.status_code in [400, 422, 500]
