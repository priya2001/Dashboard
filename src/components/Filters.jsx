export default function Filters({
  operator,
  setOperator,
  wellType,
  setWellType,
  status,
  setStatus,
  county,
  setCounty,
  searchApi,
  setSearchApi,
  operatorOptions,
  typeOptions,
  statusOptions,
  countyOptions,
  onReset,
}) {
  return (
    <div className="slicers-bar">
      <div className="slicer">
        <label>Operator</label>
        <select id="filterOperator" value={operator} onChange={(e) => setOperator(e.target.value)}>
          <option value="">All Operators</option>
          {operatorOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="slicer">
        <label>Well Type</label>
        <select id="filterType" value={wellType} onChange={(e) => setWellType(e.target.value)}>
          <option value="">All Types</option>
          {typeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="slicer">
        <label>Well Status</label>
        <select id="filterStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="slicer">
        <label>County</label>
        <select id="filterCounty" value={county} onChange={(e) => setCounty(e.target.value)}>
          <option value="">All Counties</option>
          {countyOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="search-box">
        <label>API Search</label>
        <input
          type="text"
          id="searchApi"
          placeholder="Search by API number…"
          value={searchApi}
          onChange={(e) => setSearchApi(e.target.value)}
        />
      </div>
      <button className="btn-reset" onClick={onReset}>
        ↺ Reset
      </button>
    </div>
  );
}

