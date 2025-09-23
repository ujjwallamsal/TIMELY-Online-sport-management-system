import Button from '../../components/ui/Button.jsx';
import { reportsAPI } from '../../services/api.js';

export default function AdminReports() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">Reports</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <Button onClick={reportsAPI.registrationsCSV}>Registrations CSV</Button>
        <Button onClick={reportsAPI.fixturesCSV}>Fixtures CSV</Button>
        <Button onClick={reportsAPI.resultsCSV}>Results CSV</Button>
        <Button onClick={reportsAPI.ticketSalesCSV}>Ticket Sales CSV</Button>
      </div>
    </div>
  );
}


