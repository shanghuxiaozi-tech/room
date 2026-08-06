# AI Curtain Measure

Capacitor Android + Python backend prototype for “按图荐帘”. Customers photograph a window with a co-planar calibration object, upload one or more images, and receive millimeter-level window/rod measurements plus curtain SKU recommendations.

## Architecture

- **Mobile app**: React + Capacitor captures camera photos, records calibration-object dimensions, submits images to the backend, and displays measurements/recommendations.
- **Backend**: FastAPI exposes `/api/measurements` and `/healthz`. The current deterministic baseline defines the API contract and is designed to be replaced by Tencent Cloud TI-ONE/TKE inference.
- **Cloud fit**: COS stores encrypted customer photos/results; TKE or SCF serves elastic inference; GPU instances train and batch-generate product-level hanging renderings; KMS/IAM protect customer imagery.

## Target algorithm pipeline

1. Window frame/opening segmentation and sub-pixel corner keypoint regression.
2. Homography correction using a known-size co-planar calibration object.
3. Multi-angle fusion, denoising, and uncertainty estimation.
4. Synthetic + laser-ground-truth real-image training for continuous model improvement.

## Run locally

```bash
npm install
npm run dev
```

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

Set `VITE_API_BASE` to the backend origin if it is not `http://localhost:8000`.

## Android build

```bash
npm install
npm run build
npx cap add android
npm run sync:android
```

Open `android/` in Android Studio or run the generated Gradle task after installing the Android SDK.
