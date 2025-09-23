import React, { useCallback } from 'react';
import DataTable from '../../components/ui/DataTable.jsx';
import { publicAPI } from '../../services/api.js';

export default function Events() {
  const fetchPage = useCallback(async ({ page, pageSize }) => {
    const { data, pagination } = await publicAPI.getEvents({ page, page_size: pageSize });
    return { data, pagination };
  }, []);

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'status', header: 'Status' },
    { key: 'start_date', header: 'Start' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">Events</h1>
      <DataTable columns={columns} fetchPage={fetchPage} />
    </div>
  );
}


