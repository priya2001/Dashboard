export default function UploadSection({ dragOver, onDragOver, onDragLeave, onDrop }) {
  return (
    <div
      className={`upload-section${dragOver ? ' drag-over' : ''}`}
      id="uploadZone"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      >
      <div className="upload-icon">⛽</div>
      <div className="upload-title">Upload Well Data</div>
      <div className="upload-sub">Upload any CSV/XLSX file and the dashboard will auto-detect the main columns</div>
      <label className="upload-btn" htmlFor="wellFileInput">
        Browse File
      </label>
    </div>
  );
}
