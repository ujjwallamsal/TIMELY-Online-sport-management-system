import React, { useEffect, useMemo, useState } from 'react';
import Skeleton from './Skeleton.jsx';
import EmptyState from './EmptyState.jsx';

export default function DataTable({
  columns = [],
  fetchPage, // async ({ page, pageSize, sort, filters }) => { data, pagination }
  pageSize = 20,
  filters: initialFilters = {},
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPage({ page, pageSize, sort, filters })
      .then(({ data, pagination }) => {
        if (!active) return;
        setRows(data);
        setPagination(pagination || { page, total: data.length, totalPages: 1 });
      })
      .catch(() => {
        if (!active) return;
        setRows([]);
        setPagination({ page: 1, total: 0, totalPages: 1 });
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, pageSize, sort, filters, fetchPage]);

  const header = useMemo(() => (
    <thead className="bg-gray-50 sticky top-0">
      <tr>
        {columns.map((col) => (
          <th key={col.key} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
            {col.header}
          </th>
        ))}
      </tr>
    </thead>
  ), [columns]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-auto max-w-full">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          {header}
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3"><Skeleton className="h-4" /></td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6">
                  <EmptyState title="No results" description="Try changing filters." />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id || JSON.stringify(row)} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-600 bg-gray-50">
        <div>
          Page {pagination.page} of {pagination.totalPages}
        </div>
        <div className="space-x-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}


