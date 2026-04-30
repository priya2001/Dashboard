import { useEffect, useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';
import { PALETTE, frequency, isActiveStatus } from '../utils/dashboard';

function renderChart(instanceRef, canvasRef, config) {
  if (!canvasRef.current) return;
  if (instanceRef.current) {
    instanceRef.current.destroy();
  }
  instanceRef.current = new Chart(canvasRef.current, config);
}

function baseOptions(type) {
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

export default function AnalysisSection({ filteredData }) {
  const concentrationRef = useRef(null);
  const activeRateRef = useRef(null);
  const concentrationChartRef = useRef(null);
  const activeRateChartRef = useRef(null);

  const analysis = useMemo(() => {
    const opActive = {};
    filteredData.forEach((row) => {
      if (isActiveStatus(row['Well Status'])) {
        opActive[row.Operator] = (opActive[row.Operator] || 0) + 1;
      }
    });

    const topActive = Object.entries(opActive).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxActive = topActive[0]?.[1] || 1;

    const typeStatus = {};
    filteredData.forEach((row) => {
      if (!typeStatus[row['Well Type']]) typeStatus[row['Well Type']] = { total: 0, active: 0 };
      typeStatus[row['Well Type']].total += 1;
      if (isActiveStatus(row['Well Status'])) typeStatus[row['Well Type']].active += 1;
    });
    const typeRates = Object.entries(typeStatus)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8);

    const countyDiv = {};
    filteredData.forEach((row) => {
      if (!countyDiv[row.County]) countyDiv[row.County] = new Set();
      countyDiv[row.County].add(row['Well Type']);
    });
    const countyScore = Object.entries(countyDiv)
      .map(([county, set]) => [county, set.size])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const topOp5 = frequency(filteredData, 'Operator').slice(0, 5);
    const top5cnt = topOp5.reduce((sum, entry) => sum + entry[1], 0);
    const restCnt = filteredData.length - top5cnt;

    const countyData = {};
    filteredData.forEach((row) => {
      if (!countyData[row.County]) countyData[row.County] = { total: 0, active: 0 };
      countyData[row.County].total += 1;
      if (isActiveStatus(row['Well Status'])) countyData[row.County].active += 1;
    });

    const activeCountyRates = Object.entries(countyData)
      .filter(([, values]) => values.total >= 3)
      .map(([county, values]) => [county, (values.active / values.total) * 100])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const total = filteredData.length;
    const topOp = frequency(filteredData, 'Operator')[0];
    const topCounty = frequency(filteredData, 'County')[0];
    const activeRate = filteredData.filter((row) => isActiveStatus(row['Well Status'])).length;
    const operatorCount = new Set(filteredData.map((row) => row.Operator)).size;
    const countyCount = new Set(filteredData.map((row) => row.County)).size;

    const insights = [];
    if (topOp && total) {
      insights.push(`<b style="color:var(--accent)">${topOp[0]}</b> leads with ${topOp[1]} wells (${(topOp[1] / total * 100).toFixed(1)}% share).`);
    }
    if (topCounty) {
      insights.push(`<b style="color:var(--accent3)">${topCounty[0]}</b> county has the highest well concentration.`);
    }
    if (total) {
      insights.push(`Overall active rate is <b style="color:var(--accent4)">${(activeRate / total * 100).toFixed(1)}%</b> across ${total.toLocaleString()} wells.`);
    }
    if (operatorCount) {
      insights.push(`${operatorCount} operators span ${countyCount} counties - avg ${(total / operatorCount).toFixed(1)} wells/operator.`);
    }

    return {
      topActive,
      maxActive,
      typeRates,
      countyScore,
      topOp5,
      restCnt,
      activeCountyRates,
      insights,
    };
  }, [filteredData]);

  useEffect(() => {
    renderChart(concentrationChartRef, concentrationRef, {
      type: 'doughnut',
      data: {
        labels: [...analysis.topOp5.map((entry) => entry[0].substring(0, 14)), 'Others'],
        datasets: [
          {
            data: [...analysis.topOp5.map((entry) => entry[1]), analysis.restCnt],
            backgroundColor: [...PALETTE.slice(0, 5), '#1e2d47'],
            borderWidth: 2,
            borderColor: '#080c14',
          },
        ],
      },
      options: baseOptions('doughnut'),
    });

    renderChart(activeRateChartRef, activeRateRef, {
      type: 'bar',
      data: {
        labels: analysis.activeCountyRates.map((entry) => entry[0]),
        datasets: [
          {
            data: analysis.activeCountyRates.map((entry) => Number(entry[1].toFixed(1))),
            backgroundColor: analysis.activeCountyRates.map((_, index) => `${PALETTE[index % PALETTE.length]}bb`),
            borderRadius: 3,
          },
        ],
      },
      options: {
        ...baseOptions('bar'),
        indexAxis: 'y',
        plugins: { ...baseOptions('bar').plugins, legend: { display: false } },
        scales: {
          x: {
            ticks: { color: '#7a9cc5', callback: (value) => `${value}%` },
            grid: { color: '#1e2d47' },
          },
          y: {
            ticks: { color: '#7a9cc5', font: { size: 10 } },
            grid: { color: '#1e2d47' },
          },
        },
      },
    });

    return () => {
      [concentrationChartRef, activeRateChartRef].forEach((ref) => {
        if (ref.current) {
          ref.current.destroy();
          ref.current = null;
        }
      });
    };
  }, [analysis]);

  return (
    <div className="analysis-section">
      <div className="analysis-title">🔬 DEEP ANALYSIS</div>
      <div className="analysis-grid">
        <div className="analysis-card">
          <h4>Top Operators by Active Wells</h4>
          <table>
            <tbody>
              {analysis.topActive.map(([operator, count]) => (
                <tr key={operator}>
                  <td>{operator}</td>
                  <td>
                    {count}
                    <span className="bar-inline" style={{ width: `${(count / analysis.maxActive) * 60}px` }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="analysis-card">
          <h4>Status Rate by Well Type</h4>
          <table>
            <tbody>
              {analysis.typeRates.map(([wellType, values]) => (
                <tr key={wellType}>
                  <td>{wellType.length > 22 ? `${wellType.substring(0, 22)}…` : wellType}</td>
                  <td>{((values.active / values.total) * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="analysis-card">
          <h4>County Diversity Score</h4>
          <table>
            <tbody>
              {analysis.countyScore.map(([county, score]) => (
                <tr key={county}>
                  <td>{county}</td>
                  <td>{score} types</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analysis-grid">
        <div className="analysis-card">
          <h4>Operator Concentration (Top 5 vs Rest)</h4>
          <canvas ref={concentrationRef} height="160" />
        </div>
        <div className="analysis-card">
          <h4>Active Rate by County (Top 10)</h4>
          <canvas ref={activeRateRef} height="160" />
        </div>
        <div className="analysis-card">
          <h4>Summary Insights</h4>
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, paddingTop: 4 }}>
            {analysis.insights.map((line, index) => (
              <p key={`${index}-${line}`} style={{ marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: `▸ ${line}` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
