from __future__ import annotations

from math import sqrt
from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="AI Curtain Measurement API", version="0.1.0")


class CalibrationObject(BaseModel):
    width: float = Field(gt=0, description="Known calibration object width in millimeters")
    height: float = Field(gt=0, description="Known calibration object height in millimeters")


class MeasurementRequest(BaseModel):
    calibration_object_mm: CalibrationObject
    window_type: str
    photos: List[str] = Field(min_length=1, description="Data URLs or object-storage URLs")


def estimate_uncertainty(photo_count: int, calibration: CalibrationObject) -> float:
    base = 7.5 / sqrt(photo_count)
    calibration_penalty = 0.8 if min(calibration.width, calibration.height) >= 50 else 1.4
    return round(max(3.0, base * calibration_penalty), 1)


def recommend_style(window_type: str, rod_length_mm: int, window_height_mm: int) -> dict:
    multiplier = 2.0 if window_type in {"落地窗", "飘窗"} else 1.8
    return {
        "style": "双倍褶皱遮光布 + 可替换面料 AI 效果图",
        "curtain_width_mm": round(rod_length_mm * multiplier),
        "curtain_height_mm": max(1200, window_height_mm + 180),
        "sku_family": "blackout-premium" if window_type == "落地窗" else "daily-soft-fabric",
    }


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}


@app.post("/api/measurements")
def create_measurement(payload: MeasurementRequest) -> dict:
    if any(not photo.startswith(("data:image/", "https://", "cos://")) for photo in payload.photos):
        raise HTTPException(status_code=422, detail="photos must be image data URLs or trusted object-storage URLs")

    # Replace this deterministic baseline with Tencent Cloud TI-ONE/TKE inference that performs:
    # segmentation, sub-pixel keypoint regression, homography rectification, and multi-view fusion.
    confidence = min(0.98, 0.82 + len(payload.photos) * 0.04)
    uncertainty = estimate_uncertainty(len(payload.photos), payload.calibration_object_mm)
    window_width_mm = 1500
    window_height_mm = 1800 if payload.window_type == "落地窗" else 1350
    rod_length_mm = window_width_mm + 240

    return {
        "window_width_mm": window_width_mm,
        "window_height_mm": window_height_mm,
        "rod_length_mm": rod_length_mm,
        "left_return_mm": 120,
        "right_return_mm": 120,
        "top_gap_mm": 90,
        "floor_gap_mm": 15 if payload.window_type == "落地窗" else 850,
        "confidence": confidence,
        "uncertainty_mm": uncertainty,
        "recommendation": recommend_style(payload.window_type, rod_length_mm, window_height_mm),
    }
