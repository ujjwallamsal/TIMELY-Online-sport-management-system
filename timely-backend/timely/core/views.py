from django.http import HttpResponse


def SiteIndexView(request):
    html = (
        """
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Timely Site Index</title>
            <style>
                body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif; line-height: 1.5; padding: 40px; }
                .card { max-width: 720px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
                h1 { margin: 0 0 8px; font-size: 24px; }
                p { color: #4b5563; margin: 0 0 16px; }
                ul { list-style: none; padding: 0; margin: 0; }
                li { margin: 8px 0; }
                a { color: #2563eb; text-decoration: none; font-weight: 600; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Timely Sports Management</h1>
                <p>Quick links for local development:</p>
                <ul>
                    <li><a href="http://localhost:5173" target="_blank" rel="noopener noreferrer">Visit Frontend (http://localhost:5173)</a></li>
                    <li><a href="/admin/" target="_blank" rel="noopener noreferrer">Django Admin (/admin)</a></li>
                    <li><a href="/api/" target="_blank" rel="noopener noreferrer">API (/api/)</a></li>
                </ul>
            </div>
        </body>
        </html>
        """
    )
    return HttpResponse(html)


