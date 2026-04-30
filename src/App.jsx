import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import UploadSection from './components/UploadSection';
import Filters from './components/Filters';
import KpiCards from './components/KpiCards';
import Charts from './components/Charts';
import AnalysisSection from './components/AnalysisSection';
import Table from './components/Table';
import { isActiveStatus, isInactiveStatus, normalizeWellData } from './utils/dashboard';

export default function App() {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [operatorFilter, setOperatorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [countyFilter, setCountyFilter] = useState('');
  const [searchApi, setSearchApi] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('No data loaded');

  const recordsRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const nextFiltered = allData.filter((row) =>
      (!operatorFilter || row.Operator === operatorFilter) &&
      (!typeFilter || row['Well Type'] === typeFilter) &&
      (!statusFilter || row['Well Status'] === statusFilter) &&
      (!countyFilter || row.County === countyFilter) &&
      (!searchApi || row.Api.toLowerCase().includes(searchApi.toLowerCase())) &&
      (!selectedTimeline || row.Operator === selectedTimeline)
    );

    setFilteredData(nextFiltered);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [allData, operatorFilter, typeFilter, statusFilter, countyFilter, searchApi, selectedTimeline]);

  const options = useMemo(() => {
    const uniqueSorted = (key) => [...new Set(allData.map((row) => row[key]).filter(Boolean))].sort();
    return {
      operatorOptions: uniqueSorted('Operator'),
      typeOptions: uniqueSorted('Well Type'),
      statusOptions: uniqueSorted('Well Status'),
      countyOptions: uniqueSorted('County'),
    };
  }, [allData]);

  const metrics = useMemo(() => {
    const total = filteredData.length;
    const active = filteredData.filter((row) => isActiveStatus(row['Well Status'])).length;
    const inactive = filteredData.filter((row) => isInactiveStatus(row['Well Status'])).length;
    const operators = new Set(filteredData.map((row) => row.Operator)).size;
    const counties = new Set(filteredData.map((row) => row.County)).size;

    return {
      totalText: total.toLocaleString(),
      activeText: active.toLocaleString(),
      activePctText: total ? `${(active / total * 100).toFixed(1)}% of total` : '—',
      operatorsText: operators.toLocaleString(),
      countiesText: counties.toLocaleString(),
      inactiveText: inactive.toLocaleString(),
      inactivePctText: total ? `${(inactive / total * 100).toFixed(1)}% of total` : '—',
    };
  }, [filteredData]);

  const timelineData = useMemo(() => {
    const counts = {};
    filteredData.forEach((row) => {
      counts[row.Operator] = (counts[row.Operator] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
    const max = sorted[0]?.[1] || 1;
    return { sorted, max };
  }, [filteredData]);

  const pageCount = Math.ceil(filteredData.length / 20);

  const handleFile = async (file) => {
    if (!file) return;

    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const workbook = isCsv
      ? XLSX.read(await file.text(), { type: 'string' })
      : XLSX.read(await file.arrayBuffer(), { type: 'array' });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!json.length) {
      window.alert('No data found in file.');
      return;
    }

    const normalized = normalizeWellData(json);
    try {
      await fetch('/api/save-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          data: normalized,
        }),
      });
    } catch (error) {
      console.warn('Could not save JSON file in project folder:', error);
    }
    setAllData(normalized);
    setSelectedTimeline(null);
    setOperatorFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setCountyFilter('');
    setSearchApi('');
    setCurrentPage(1);
    setLastUpdated(`${normalized.length.toLocaleString()} records · ${file.name}`);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    await handleFile(file);
  };

  const handleReset = () => {
    setOperatorFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setCountyFilter('');
    setSearchApi('');
    setSelectedTimeline(null);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    const safePage = Math.min(Math.max(page, 1), pageCount || 1);
    setCurrentPage(safePage);
  };

  const handleTimelineToggle = (operator) => {
    setSelectedTimeline((current) => (current === operator ? null : operator));
  };

  return (
    <>
      <input
        ref={fileInputRef}
        id="wellFileInput"
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          handleFile(file);
        }}
      />

      <div className="topbar">
        <div className="logo">DASHBOARD</div>
        <div className="topbar-right">
          <span className="badge">OIL &amp; GAS ANALYTICS</span>
          {allData.length > 0 ? (
            <button
              type="button"
              onClick={openFilePicker}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text2)',
                borderRadius: 4,
                padding: '4px 10px',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Upload New File
            </button>
          ) : null}
          <span id="lastUpdated">{lastUpdated}</span>
        </div>
      </div>

      {allData.length === 0 ? (
        <UploadSection
          dragOver={dragOver}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        />
      ) : null}

      {allData.length > 0 ? (
        <div className="main" id="mainContent">
          <Filters
            operator={operatorFilter}
            setOperator={setOperatorFilter}
            wellType={typeFilter}
            setWellType={setTypeFilter}
            status={statusFilter}
            setStatus={setStatusFilter}
            county={countyFilter}
            setCounty={setCountyFilter}
            searchApi={searchApi}
            setSearchApi={setSearchApi}
            operatorOptions={options.operatorOptions}
            typeOptions={options.typeOptions}
            statusOptions={options.statusOptions}
            countyOptions={options.countyOptions}
            onReset={handleReset}
          />

          <div className="chart-card" style={{ marginBottom: 20 }}>
            <div className="chart-title">
              <span className="dot" style={{ background: 'var(--accent4)' }} />
              WELL COUNT TIMELINE
            </div>
            <div className="timeline-header">
              <div className="chart-sub">Top operators by well count. Click any row to filter by operator group.</div>
              {selectedTimeline ? (
                <button type="button" className="timeline-back-btn" onClick={() => setSelectedTimeline(null)}>
                  Back to All
                </button>
              ) : null}
            </div>
            <div className="timeline-bar timeline-rows" id="timelineBar">
              {timelineData.sorted.map(([operator, count], index) => (
                <button
                  key={operator}
                  type="button"
                  className={`tl-seg tl-row${selectedTimeline === operator ? ' selected' : ''}`}
                  style={{
                    backgroundColor: ['#00d4ff', '#ff6b35', '#00ff88', '#f7c948', '#c084fc', '#38bdf8', '#fb923c', '#34d399', '#facc15', '#a78bfa', '#0ea5e9', '#f97316', '#10b981', '#eab308', '#8b5cf6', '#06b6d4', '#ef4444', '#22c55e', '#f59e0b', '#6366f1'][index % 20],
                  }}
                  title={`${operator}: ${count} wells`}
                  onClick={() => handleTimelineToggle(operator)}
                >
                  <span className="tl-row-name">{operator.length > 28 ? `${operator.substring(0, 28)}…` : operator}</span>
                  <span className="tl-row-count">{count}</span>
                </button>
              ))}
            </div>
          </div>

          <KpiCards metrics={metrics} />

          <Charts filteredData={filteredData} />

          <AnalysisSection filteredData={filteredData} />

          <Table filteredData={filteredData} currentPage={currentPage} onPageChange={handlePageChange} scrollTargetRef={recordsRef} />
        </div>
      ) : null}
    </>
  );
}
