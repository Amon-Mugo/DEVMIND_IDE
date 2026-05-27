export default function DBResults({ results, error }) {
  if (error) {
    return (
      <div className="p-4 text-red-400 text-sm font-mono">
        ❌ {error}
      </div>
    );
  }

  if (!results) {
    return (
      <div className="p-4 text-gray-600 text-sm text-center">
        Run a query to see results
      </div>
    );
  }

  if (!results.rows.length) {
    return (
      <div className="p-4 text-green-400 text-sm">
        ✅ {results.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 text-green-400 text-xs border-b border-gray-800">
        ✅ {results.message}
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-gray-300 font-mono">
          <thead className="bg-gray-900 sticky top-0">
            <tr>
              {results.columns.map((col, i) => (
                <th key={i} className="px-4 py-2 text-left text-blue-400 border-b border-gray-800">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}