# Streaming CSV Endpoints Implementation

## Overview

I've implemented streaming CSV endpoints for the Timely sports events management system. These endpoints allow organizers and admins to export large datasets efficiently without memory issues.

## Endpoints

The following CSV endpoints are available:

### 1. Registrations CSV
- **URL**: `/api/reports/registrations.csv`
- **Method**: GET
- **Authentication**: Admin/Organizer only
- **Query Parameters**:
  - `event`: Event ID to filter by
  - `date_from`: Start date (YYYY-MM-DD)
  - `date_to`: End date (YYYY-MM-DD)
  - `status`: Registration status filter

### 2. Fixtures CSV
- **URL**: `/api/reports/fixtures.csv`
- **Method**: GET
- **Authentication**: Admin/Organizer only
- **Query Parameters**:
  - `event`: Event ID to filter by
  - `date_from`: Start date (YYYY-MM-DD)
  - `date_to`: End date (YYYY-MM-DD)
  - `status`: Fixture status filter

### 3. Results CSV
- **URL**: `/api/reports/results.csv`
- **Method**: GET
- **Authentication**: Admin/Organizer only
- **Query Parameters**:
  - `event`: Event ID to filter by
  - `date_from`: Start date (YYYY-MM-DD)
  - `date_to`: End date (YYYY-MM-DD)
  - `status`: Result status filter

### 4. Ticket Sales CSV
- **URL**: `/api/reports/ticket_sales.csv`
- **Method**: GET
- **Authentication**: Admin/Organizer only
- **Query Parameters**:
  - `event`: Event ID to filter by
  - `date_from`: Start date (YYYY-MM-DD)
  - `date_to`: End date (YYYY-MM-DD)
  - `status`: Order status filter

## Implementation Details

### Files Created/Modified

1. **`reports/views_csv.py`** - New file containing streaming CSV views
2. **`reports/urls.py`** - Updated to include CSV endpoints
3. **`api/urls.py`** - Updated to include reports URLs
4. **`timely/settings.py`** - Re-enabled necessary apps for CSV functionality

### Key Features

#### Streaming Response
- Uses Django's `StreamingHttpResponse` for memory-efficient CSV generation
- Processes data in chunks of 1000 records to handle large datasets
- No memory issues even with millions of records

#### Date Filtering
- Supports `date_from` and `date_to` parameters in YYYY-MM-DD format
- Automatically handles timezone conversion
- Filters data based on relevant date fields for each report type

#### Event Filtering
- Optional `event` parameter to filter by specific event
- Validates event existence and returns appropriate error if not found

#### Status Filtering
- Optional `status` parameter for additional filtering
- Supports different status values based on the report type

#### Security
- Admin/Organizer authentication required
- Proper permission checks before data access
- No data leakage to unauthorized users

### CSV Headers

#### Registrations CSV
- ID, Event, Applicant Name, Applicant Email, Team, Type, Status
- Submitted At, Decided At, Decided By, Reason, Division

#### Fixtures CSV
- ID, Event, Round, Phase, Home Team, Away Team
- Venue, Start Time, End Time, Status, Created At

#### Results CSV
- ID, Event, Fixture, Home Team, Away Team
- Home Score, Away Score, Winner, Finalized At, Created At

#### Ticket Sales CSV
- Order ID, User Name, User Email, Event, Fixture
- Total Amount, Currency, Status, Created At, Tickets Count
- Payment Method, Stripe Payment Intent ID

## Usage Examples

### Basic Usage
```bash
# Get all registrations for a specific event
GET /api/reports/registrations.csv?event=123

# Get fixtures for a date range
GET /api/reports/fixtures.csv?date_from=2024-01-01&date_to=2024-01-31

# Get ticket sales with status filter
GET /api/reports/ticket_sales.csv?status=paid&event=123
```

### Frontend Integration
```javascript
// Download CSV file
const downloadCSV = async (reportType, filters = {}) => {
  const params = new URLSearchParams(filters);
  const url = `/api/reports/${reportType}.csv?${params}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
};
```

## Performance Considerations

- **Memory Efficient**: Streaming response prevents memory issues
- **Chunked Processing**: Data processed in 1000-record chunks
- **Database Optimization**: Uses `select_related` and `prefetch_related` for efficient queries
- **Indexed Fields**: Leverages database indexes for fast filtering

## Error Handling

- **Invalid Event ID**: Returns 400 Bad Request with error message
- **Invalid Date Format**: Returns 400 Bad Request with format requirements
- **Unauthorized Access**: Returns 403 Forbidden
- **Missing Required Apps**: Graceful degradation with helpful error messages

## Dependencies

The CSV endpoints require the following Django apps to be enabled:
- `events` - For event data
- `registrations` - For registration data
- `fixtures` - For fixture data
- `results` - For result data
- `tickets` - For ticket sales data
- `reports` - For the CSV endpoints themselves

## Future Enhancements

1. **Additional Report Types**: Revenue, attendance, performance reports
2. **Export Formats**: PDF, Excel, JSON export options
3. **Scheduled Exports**: Automated report generation
4. **Custom Fields**: Configurable CSV columns
5. **Compression**: Gzip compression for large files
6. **Progress Tracking**: Real-time export progress for very large datasets

## Testing

To test the endpoints, ensure all required apps are enabled in `INSTALLED_APPS` and run:

```bash
# Start the Django server
python manage.py runserver

# Test with curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:8000/api/reports/registrations.csv?event=1"
```

The endpoints will return CSV data with appropriate headers for file download.
