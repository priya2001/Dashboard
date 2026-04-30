import { PAGE_SIZE, statusClass } from '../utils/dashboard';

export default function Table({ filteredData, currentPage, onPageChange, scrollTargetRef }) {
  const total = filteredData.length;
  const pages = Math.ceil(total / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageData = filteredData.slice(start, start + PAGE_SIZE);

  const goToPage = (page) => {
    onPageChange(page);
    if (scrollTargetRef?.current) {
      window.scrollTo({
        top: scrollTargetRef.current.offsetTop - 80,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="analysis-section" style={{ marginTop: 20 }} ref={scrollTargetRef}>
      <div className="analysis-title">📋 WELL RECORDS</div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>API</th>
              <th>Operator</th>
              <th>Well Type</th>
              <th>Status</th>
              <th>County</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, index) => (
              <tr key={`${row.Api}-${start + index}`}>
                <td style={{ color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  {start + index + 1}
                </td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--accent)' }}>
                  {row.Api || '—'}
                </td>
                <td>{row.Operator}</td>
                <td style={{ color: 'var(--text2)' }}>{row['Well Type']}</td>
                <td>
                  <span className={`status-badge ${statusClass(row['Well Status'])}`}>{row['Well Status']}</span>
                </td>
                <td style={{ color: 'var(--text2)' }}>{row.County}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        {pages > 1 && (
          <>
            <span>
              {total.toLocaleString()} records · page {currentPage}/{pages}
            </span>
            {currentPage > 1 && (
              <>
                <button onClick={() => goToPage(1)}>«</button>
                <button onClick={() => goToPage(currentPage - 1)}>‹</button>
              </>
            )}
            {(() => {
              const startPage = Math.max(1, currentPage - 2);
              const endPage = Math.min(pages, startPage + 4);
              const buttons = [];
              for (let page = startPage; page <= endPage; page += 1) {
                buttons.push(
                  <button key={page} className={page === currentPage ? 'active' : ''} onClick={() => goToPage(page)}>
                    {page}
                  </button>,
                );
              }
              return buttons;
            })()}
            {currentPage < pages && (
              <>
                <button onClick={() => goToPage(currentPage + 1)}>›</button>
                <button onClick={() => goToPage(pages)}>»</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
