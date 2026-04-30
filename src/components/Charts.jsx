import { useEffect, useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';
import { PALETTE, distinctColor, frequency, stackedStatusColor } from '../utils/dashboard';

function buildBaseOptions(type) {
  const plugins = {
    legend: { labels: { color: '#7a9cc5', font: { family: 'DM Sans', size: 11 }, boxWidth: 12 } },
    tooltip: {
      backgroundColor: '#0d1420',
      titleColor: '#e8f0fe',
      bodyColor: '#7a9cc5',
      borderColor: '#1e2d47',
      borderWidth: 1,
    },
  };

  return {
    responsive: true,
    plugins,
    scales: type !== 'doughnut' && type !== 'pie'
      ? {
          x: { ticks: { color: '#7a9cc5', font: { size: 10 } }, grid: { color: '#1e2d47' } },
          y: { ticks: { color: '#7a9cc5', font: { size: 10 } }, grid: { color: '#1e2d47' } },
        }
      : {},
  };
}

function renderChart(instanceRef, canvasRef, config) {
  if (!canvasRef.current) return;
  if (instanceRef.current) {
    instanceRef.current.destroy();
  }
  instanceRef.current = new Chart(canvasRef.current, config);
}

export default function Charts({ filteredData }) {
  const statusRef = useRef(null);
  const typeRef = useRef(null);
  const operatorRef = useRef(null);
  const countyRef = useRef(null);
  const stackedRef = useRef(null);

  const statusChartRef = useRef(null);
  const typeChartRef = useRef(null);
  const operatorChartRef = useRef(null);
  const countyChartRef = useRef(null);
  const stackedChartRef = useRef(null);

  const chartData = useMemo(() => {
    const statusFreq = frequency(filteredData, 'Well Status');
    const typeFreq = frequency(filteredData, 'Well Type');
    const opFreq = frequency(filteredData, 'Operator').slice(0, 10);
    const countyFreq = frequency(filteredData, 'County').slice(0, 10);
    const topOps = frequency(filteredData, 'Operator').slice(0, 8).map(([name]) => name);
    const statuses = [...new Set(filteredData.map((row) => row['Well Status']))];

    return { statusFreq, typeFreq, opFreq, countyFreq, topOps, statuses };
  }, [filteredData]);

  useEffect(() => {
    renderChart(statusChartRef, statusRef, {
      type: 'doughnut',
      data: {
        labels: chartData.statusFreq.map((entry) => entry[0]),
        datasets: [
          {
            data: chartData.statusFreq.map((entry) => entry[1]),
            backgroundColor: chartData.statusFreq.map((_, index) => distinctColor(index)),
            borderWidth: 2,
            borderColor: '#080c14',
          },
        ],
      },
      options: buildBaseOptions('doughnut'),
    });

    renderChart(typeChartRef, typeRef, {
      type: 'bar',
      data: {
        labels: chartData.typeFreq.map((entry) => entry[0]),
        datasets: [
          {
            data: chartData.typeFreq.map((entry) => entry[1]),
            backgroundColor: chartData.typeFreq.map((_, index) => PALETTE[index % PALETTE.length]),
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        ...buildBaseOptions('bar'),
        plugins: { ...buildBaseOptions('bar').plugins, legend: { display: false } },
      },
    });

    renderChart(operatorChartRef, operatorRef, {
      type: 'bar',
      data: {
        labels: chartData.opFreq.map((entry) => entry[0]),
        datasets: [
          {
            data: chartData.opFreq.map((entry) => entry[1]),
            backgroundColor: chartData.opFreq.map((_, index) => `${PALETTE[index % PALETTE.length]}cc`),
            borderRadius: 4,
          },
        ],
      },
      options: {
        ...buildBaseOptions('bar'),
        indexAxis: 'y',
        plugins: { ...buildBaseOptions('bar').plugins, legend: { display: false } },
      },
    });

    renderChart(countyChartRef, countyRef, {
      type: 'bar',
      data: {
        labels: chartData.countyFreq.map((entry) => entry[0]),
        datasets: [
          {
            data: chartData.countyFreq.map((entry) => entry[1]),
            backgroundColor: chartData.countyFreq.map((_, index) => `${PALETTE[(index + 5) % PALETTE.length]}cc`),
            borderRadius: 4,
          },
        ],
      },
      options: {
        ...buildBaseOptions('bar'),
        indexAxis: 'y',
        plugins: { ...buildBaseOptions('bar').plugins, legend: { display: false } },
      },
    });

    const stackedDatasets = chartData.statuses.map((status, index) => ({
      label: status,
      data: chartData.topOps.map(
        (operator) => filteredData.filter((row) => row.Operator === operator && row['Well Status'] === status).length,
      ),
      backgroundColor: stackedStatusColor(index),
      borderColor: stackedStatusColor(index),
      borderRadius: 2,
      borderSkipped: false,
      stack: 'stack-0',
      barPercentage: 0.9,
      categoryPercentage: 0.8,
      order: index,
    }));

    renderChart(stackedChartRef, stackedRef, {
      type: 'bar',
      data: {
        labels: chartData.topOps,
        datasets: stackedDatasets,
      },
      options: {
        ...buildBaseOptions('bar'),
        scales: {
          x: {
            stacked: true,
            ticks: { color: '#7a9cc5', font: { size: 9 } },
            grid: { color: '#1e2d47' },
          },
          y: {
            stacked: true,
            ticks: { color: '#7a9cc5' },
            grid: { color: '#1e2d47' },
          },
        },
        plugins: buildBaseOptions('bar').plugins,
      },
    });

    return () => {
      [statusChartRef, typeChartRef, operatorChartRef, countyChartRef, stackedChartRef].forEach((ref) => {
        if (ref.current) {
          ref.current.destroy();
          ref.current = null;
        }
      });
    };
  }, [chartData, filteredData]);

  return (
    <>
      <div className="charts-grid row-2" style={{ marginBottom: 20 }}>
        <div className="chart-card">
          <div className="chart-title">
            <span className="dot" style={{ background: 'var(--accent)' }} />
            WELLS BY STATUS
          </div>
          <div className="chart-sub">Distribution across operational states</div>
          <div className="chart-canvas-wrap">
            <canvas ref={statusRef} height="240" />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">
            <span className="dot" style={{ background: 'var(--accent2)' }} />
            WELLS BY TYPE
          </div>
          <div className="chart-sub">Breakdown by well classification</div>
          <div className="chart-canvas-wrap">
            <canvas ref={typeRef} height="240" />
          </div>
        </div>
      </div>

      <div className="charts-grid row-2" style={{ marginBottom: 20 }}>
        <div className="chart-card">
          <div className="chart-title">
            <span className="dot" style={{ background: 'var(--accent3)' }} />
            TOP OPERATORS BY WELL COUNT
          </div>
          <div className="chart-sub">Top 10 operators ranked by number of wells</div>
          <div className="chart-canvas-wrap">
            <canvas ref={operatorRef} height="280" />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">
            <span className="dot" style={{ background: 'var(--accent4)' }} />
            TOP COUNTIES BY WELL COUNT
          </div>
          <div className="chart-sub">Geographic concentration of well activity</div>
          <div className="chart-canvas-wrap">
            <canvas ref={countyRef} height="280" />
          </div>
        </div>
      </div>

      <div className="charts-grid row-full" style={{ marginBottom: 20 }}>
        <div className="chart-card">
          <div className="chart-title">
            <span className="dot" style={{ background: 'var(--accent5)' }} />
            STATUS BREAKDOWN BY TOP OPERATORS
          </div>
          <div className="chart-sub">Stacked view of well status distribution per operator (top 8)</div>
          <div className="chart-canvas-wrap">
            <canvas ref={stackedRef} height="200" />
          </div>
        </div>
      </div>
    </>
  );
}
