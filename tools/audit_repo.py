#!/usr/bin/env python3
"""
Repository audit tool for the CAPSTONE monorepo.
Scans frontend duplicates, backend routes, installed apps, and generates summary.
"""

import os
import re
import csv
import json
from pathlib import Path
from collections import defaultdict, Counter


def scan_frontend_duplicates(frontend_src_path, output_path):
    """Scan frontend src directory for duplicate basenames and write to CSV."""
    print("Scanning frontend for duplicate basenames...")
    
    basename_files = defaultdict(list)
    extensions = {'.jsx', '.js', '.tsx'}
    
    # Walk through frontend src directory
    for root, dirs, files in os.walk(frontend_src_path):
        for file in files:
            file_path = Path(file)
            if file_path.suffix in extensions:
                basename = file_path.stem  # filename without extension
                full_path = os.path.join(root, file)
                basename_files[basename].append(full_path)
    
    # Find duplicates
    duplicates = {basename: files for basename, files in basename_files.items() if len(files) > 1}
    
    # Write to CSV
    with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['basename', 'file_paths'])
        
        for basename, files in sorted(duplicates.items()):
            writer.writerow([basename, '; '.join(files)])
    
    print(f"Found {len(duplicates)} duplicate basenames, written to {output_path}")
    return len(duplicates)


def parse_backend_routes(urls_path, output_path):
    """Parse Django urls.py and extract all path() and include() patterns."""
    print("Parsing backend routes...")
    
    routes = []
    
    try:
        with open(urls_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find all path() patterns
        path_pattern = r'path\s*\(\s*[\'"]([^\'"]+)[\'"]\s*,'
        path_matches = re.findall(path_pattern, content)
        routes.extend([f"path('{match}')" for match in path_matches])
        
        # Find all include() patterns
        include_pattern = r'include\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)'
        include_matches = re.findall(include_pattern, content)
        routes.extend([f"include('{match}')" for match in include_matches])
        
        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            for route in sorted(routes):
                f.write(route + '\n')
        
        print(f"Found {len(routes)} routes, written to {output_path}")
        return len(routes)
        
    except FileNotFoundError:
        print(f"Warning: {urls_path} not found")
        return 0
    except Exception as e:
        print(f"Error parsing {urls_path}: {e}")
        return 0


def read_installed_apps(settings_path, output_path):
    """Read Django settings.py and extract INSTALLED_APPS."""
    print("Reading installed apps...")
    
    apps = []
    channels_blocks_count = 0
    
    try:
        with open(settings_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find INSTALLED_APPS
        installed_apps_match = re.search(
            r'INSTALLED_APPS\s*=\s*\[(.*?)\]',
            content,
            re.DOTALL
        )
        
        if installed_apps_match:
            apps_section = installed_apps_match.group(1)
            # Extract app names (quoted strings)
            app_matches = re.findall(r'[\'"]([^\'"]+)[\'"]', apps_section)
            apps = [app.strip() for app in app_matches if app.strip()]
        
        # Count CHANNEL_LAYERS blocks
        channels_blocks_count = len(re.findall(r'CHANNEL_LAYERS\s*=', content))
        
        # Write apps to file
        with open(output_path, 'w', encoding='utf-8') as f:
            for app in apps:
                f.write(app + '\n')
        
        print(f"Found {len(apps)} installed apps, written to {output_path}")
        print(f"Found {channels_blocks_count} CHANNEL_LAYERS blocks")
        return len(apps), channels_blocks_count
        
    except FileNotFoundError:
        print(f"Warning: {settings_path} not found")
        return 0, 0
    except Exception as e:
        print(f"Error reading {settings_path}: {e}")
        return 0, 0


def check_sqlite_presence(backend_path):
    """Check if db.sqlite3 exists anywhere in the backend."""
    print("Checking for sqlite3 files...")
    
    sqlite_files = []
    for root, dirs, files in os.walk(backend_path):
        for file in files:
            if file.endswith('.sqlite3') or file == 'db.sqlite3':
                sqlite_files.append(os.path.join(root, file))
    
    sqlite_present = len(sqlite_files) > 0
    if sqlite_files:
        print(f"Found sqlite3 files: {sqlite_files}")
    else:
        print("No sqlite3 files found")
    
    return sqlite_present


def main():
    """Main audit function."""
    print("Starting repository audit...")
    
    # Define paths
    repo_root = Path(__file__).parent.parent
    frontend_src = repo_root / "timely-frontend" / "src"
    backend_urls = repo_root / "timely-backend" / "timely" / "urls.py"
    backend_settings = repo_root / "timely-backend" / "timely" / "settings.py"
    backend_root = repo_root / "timely-backend"
    audit_dir = repo_root / "audit"
    
    # Create audit directory if it doesn't exist
    audit_dir.mkdir(exist_ok=True)
    
    # Run audits
    duplicates_count = scan_frontend_duplicates(
        frontend_src,
        audit_dir / "frontend_duplicates.csv"
    )
    
    routes_count = parse_backend_routes(
        backend_urls,
        audit_dir / "backend_routes.txt"
    )
    
    apps_count, channels_blocks_count = read_installed_apps(
        backend_settings,
        audit_dir / "installed_apps.txt"
    )
    
    sqlite_present = check_sqlite_presence(backend_root)
    
    # Generate summary
    summary = {
        "duplicates_count": duplicates_count,
        "routes_count": routes_count,
        "apps_count": apps_count,
        "channels_blocks_count": channels_blocks_count,
        "sqlite_present": sqlite_present
    }
    
    # Write summary
    with open(audit_dir / "summary.json", 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\nAudit complete! Summary written to {audit_dir / 'summary.json'}")
    print("Summary:")
    for key, value in summary.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    main()
