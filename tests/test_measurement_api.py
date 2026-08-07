from fastapi.testclient import TestClient

from backend.main import app


def test_measurement_returns_recommendation():
    client = TestClient(app)
    response = client.post(
        "/api/measurements",
        json={
            "calibration_object_mm": {"width": 85.6, "height": 53.98},
            "window_type": "推拉窗",
            "photos": ["data:image/jpeg;base64,abc", "data:image/jpeg;base64,def"],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["window_width_mm"] == 1500
    assert payload["uncertainty_mm"] <= 5.0
    assert payload["recommendation"]["curtain_width_mm"] == 3132


def test_rejects_untrusted_photo_url():
    client = TestClient(app)
    response = client.post(
        "/api/measurements",
        json={
            "calibration_object_mm": {"width": 85.6, "height": 53.98},
            "window_type": "推拉窗",
            "photos": ["file:///tmp/window.jpg"],
        },
    )

    assert response.status_code == 422
