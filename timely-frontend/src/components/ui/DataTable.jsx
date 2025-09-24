import React, { useEffect, useMemo, useRef, useState } from "react";
import Button from "./Button";
import Input from "./Input";
import EmptyState from "./EmptyState";
import Skeleton from "./Skeleton";

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function DataTable({
  columns,
  fetchPage, // async ({ page, pageSize, sortBy, sortDir, filters }) => { rows, total }
  pageSize = 10,
  initialSortBy,
  initialSortDir = "asc",
  initialFilters = {},
  rowActions, // (row) => ReactNode
  bulkActions, // ({ selectedIds, clearSelection, reload }) => ReactNode
  getRowId = (row) => row.id,
  emptyDescription = "Try adjusting filters or creating a new item.",
}) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(initialSortBy || (columns?.[0]?.accessor));
  const [sortDir, setSortDir] = useState(initialSortDir);
  const [filters, setFilters] = useState(initialFilters);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const debouncedFilters = useDebouncedValue(filters, 300);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const reloadRef = useRef(() => {});
  reloadRef.current = async () => {
    setLoading(true);
    setError(null);
    try {
      const { rows: data, total: count } = await fetchPage({ page, pageSize, sortBy, sortDir, filters: debouncedFilters });
      setRows(data);
      setTotal(count);
      setSelected(new Set());
    } catch (e) {
      setError(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadRef.current();
  }, [page, pageSize, sortBy, sortDir, debouncedFilters]);

  function toggleSort(col) {
    if (!col.sortable) return;
    if (sortBy === col.accessor) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col.accessor);
      setSortDir("asc");
    }
  }

  function toggleSelectAll(checked) {
    if (checked) setSelected(new Set((rows || []).map(r => getRowId(r))));
    else setSelected(new Set());
  }
  function toggleSelectOne(id, checked) {
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  }

  const clearSelection = () => setSelected(new Set());

  const headerCells = (columns || []).map(col => (
    <th key={col.accessor} scope="col" className="sticky top-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
      <button className={`flex items-center gap-1 ${col.sortable ? "cursor-pointer hover:text-gray-900" : "cursor-default"}`} onClick={() => toggleSort(col)}>
        <span>{col.header}</span>
        {col.sortable && sortBy === col.accessor && (
          <span aria-hidden>{sortDir === "asc" ? "▲" : "▼"}</span>
        )}
      </button>
      {col.filter && (
        <div className="mt-2">
          <Input
            id={`filter-${col.accessor}`}
            aria-label={`${col.header} filter`}
            value={filters[col.accessor] || ""}
            onChange={e => setFilters(f => ({ ...f, [col.accessor]: e.target.value }))}
            inputClassName="h-8 px-2 py-1 text-xs"
          />
        </div>
      )}
    </th>
  ));

  return (
    <div className="flex flex-col">
      {selected.size > 0 && (
        <div className="mb-2 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
          <div>
            <span className="font-medium">{selected.size}</span> selected
          </div>
          <div className="flex items-center gap-2">
            {bulkActions?.({ selectedIds: Array.from(selected), clearSelection, reload: () => reloadRef.current() })}
            <Button variant="secondary" onClick={clearSelection}>Clear</Button>
          </div>
        </div>
      )}

      <div className="overflow-auto rounded-md border border-gray-200">
        <table className="w-full border-collapse text-[14px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky top-0 z-10 bg-gray-50 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={rows && rows.length > 0 && selected.size === rows.length}
                  onChange={e => toggleSelectAll(e.target.checked)}
                />
              </th>
              {headerCells}
              {rowActions && <th className="sticky top-0 z-10 bg-gray-50 px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(pageSize)].map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                  {(columns || []).map(c => (
                    <td key={c.accessor} className="px-4 py-3"><Skeleton /></td>
                  ))}
                  {rowActions && <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>}
                </tr>
              ))
            ) : !rows || rows.length === 0 ? (
              <tr>
                <td colSpan={((columns || []).length + 1 + (rowActions ? 1 : 0))} className="px-4 py-6">
                  <EmptyState title="No results" description={emptyDescription} />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={((columns || []).length + 1 + (rowActions ? 1 : 0))} className="px-4 py-6 text-sm text-red-700">
                  {String(error)}
                </td>
              </tr>
            ) : (
              (rows || []).map(row => {
                const id = getRowId(row);
                return (
                  <tr key={id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={selected.has(id)}
                        onChange={e => toggleSelectOne(id, e.target.checked)}
                      />
                    </td>
                    {(columns || []).map(col => (
                      <td key={col.accessor} className="px-4 py-3 align-top">
                        {col.render ? col.render(row[col.accessor], row) : String(row[col.accessor] ?? "")}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-3">{rowActions(row)}</td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="text-gray-600">Page {page} of {totalPages} • {total} total</div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setPage(1)} disabled={page === 1}>First</Button>
          <Button variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
          <Button variant="secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          <Button variant="secondary" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</Button>
        </div>
      </div>
    </div>
  );
}
