import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import './styles.css';

type Measurement = {
  window_width_mm: number;
  window_height_mm: number;
  rod_length_mm: number;
  left_return_mm: number;
  right_return_mm: number;
  top_gap_mm: number;
  floor_gap_mm: number;
  confidence: number;
  uncertainty_mm: number;
  recommendation: { style: string; curtain_width_mm: number; curtain_height_mm: number; sku_family: string };
};

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [calibrationWidth, setCalibrationWidth] = useState(85.6);
  const [calibrationHeight, setCalibrationHeight] = useState(53.98);
  const [windowType, setWindowType] = useState('推拉窗');
  const [result, setResult] = useState<Measurement | null>(null);
  const [status, setStatus] = useState('请拍摄与窗面共面的标定物和窗户。');

  const canMeasure = useMemo(() => photos.length > 0, [photos]);

  async function capturePhoto() {
    const photo = await Camera.getPhoto({ quality: 85, resultType: CameraResultType.DataUrl, source: CameraSource.Camera });
    setPhotos((current) => [...current, photo]);
    setStatus(`已采集 ${photos.length + 1} 张照片，可继续补拍多角度照片提升置信度。`);
  }

  async function measure() {
    setStatus('正在上传照片并进行云端测算…');
    const response = await fetch(`${API_BASE}/api/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        calibration_object_mm: { width: calibrationWidth, height: calibrationHeight },
        window_type: windowType,
        photos: photos.map((photo) => photo.dataUrl),
      }),
    });
    if (!response.ok) throw new Error(await response.text());
    const payload = (await response.json()) as Measurement;
    setResult(payload);
    setStatus('测算完成，已生成窗帘尺寸与款式建议。');
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">AI 图像生成 + 毫米级测量</p>
        <h1>按图荐帘：从客户实拍到商品级挂装效果图</h1>
        <p>使用手机照片、共面标定物和云端视觉算法，自动测算窗洞、罗马杆与安装面尺寸，并推荐窗帘 SKU。</p>
      </section>

      <section className="card grid">
        <label>标定物宽度（mm）<input type="number" value={calibrationWidth} onChange={(e) => setCalibrationWidth(Number(e.target.value))} /></label>
        <label>标定物高度（mm）<input type="number" value={calibrationHeight} onChange={(e) => setCalibrationHeight(Number(e.target.value))} /></label>
        <label>窗型<select value={windowType} onChange={(e) => setWindowType(e.target.value)}><option>推拉窗</option><option>平开窗</option><option>飘窗</option><option>落地窗</option></select></label>
      </section>

      <section className="actions">
        <button onClick={capturePhoto}>拍摄 / 添加照片</button>
        <button disabled={!canMeasure} onClick={measure}>云端测算并荐帘</button>
      </section>

      <p className="status">{status}</p>

      <section className="photo-strip">
        {photos.map((photo, index) => <img key={index} src={photo.dataUrl} alt={`采集照片 ${index + 1}`} />)}
      </section>

      {result && <section className="card result">
        <h2>测量结果</h2>
        <dl><dt>窗洞宽 / 高</dt><dd>{result.window_width_mm} mm / {result.window_height_mm} mm</dd><dt>轨道有效长度</dt><dd>{result.rod_length_mm} mm</dd><dt>左右回位</dt><dd>{result.left_return_mm} mm / {result.right_return_mm} mm</dd><dt>离顶 / 离地间隙</dt><dd>{result.top_gap_mm} mm / {result.floor_gap_mm} mm</dd><dt>不确定度</dt><dd>±{result.uncertainty_mm} mm，置信度 {(result.confidence * 100).toFixed(1)}%</dd></dl>
        <h3>推荐窗帘</h3>
        <p>{result.recommendation.style}，成品宽 {result.recommendation.curtain_width_mm} mm，高 {result.recommendation.curtain_height_mm} mm，SKU 系列：{result.recommendation.sku_family}</p>
      </section>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
