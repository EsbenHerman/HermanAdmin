#!/bin/bash
# Sync Google Calendar events to HermanAdmin
# Fetches last 7 days + next 30 days and upserts to the API

set -e

WORKSPACE_SCRIPTS="$HOME/.openclaw/workspace/scripts"
API_URL="${API_URL:-http://localhost:8080/api/v1/calendar/events/sync}"
CALENDAR_ID="${CALENDAR_ID:-styrbjorn.swensson@gmail.com}"

# Fetch events from Google Calendar and POST to API
python3 - "$WORKSPACE_SCRIPTS" "$CALENDAR_ID" "$API_URL" <<'PYTHON'
import sys
import json
import subprocess
import base64
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

scripts_dir = Path(sys.argv[1])
calendar_id = sys.argv[2]
api_url = sys.argv[3]

from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_credentials_from_bitwarden():
    result = subprocess.run(
        [scripts_dir / 'bws-get.sh', 'GOOGLE_CALENDAR_JSON_B64'],
        capture_output=True, text=True, check=True
    )
    json_bytes = base64.b64decode(result.stdout.strip())
    return json.loads(json_bytes)

def get_service():
    creds_info = get_credentials_from_bitwarden()
    credentials = service_account.Credentials.from_service_account_info(
        creds_info, scopes=SCOPES)
    return build('calendar', 'v3', credentials=credentials)

def fetch_events():
    service = get_service()
    now = datetime.now(timezone.utc)
    
    # Fetch last 7 days + next 30 days
    time_min = (now - timedelta(days=7)).isoformat()
    time_max = (now + timedelta(days=30)).isoformat()
    
    result = service.events().list(
        calendarId=calendar_id,
        timeMin=time_min,
        timeMax=time_max,
        singleEvents=True,
        orderBy='startTime',
        maxResults=250
    ).execute()
    
    return result.get('items', [])

def transform_event(event):
    """Transform Google Calendar event to our API format."""
    start = event.get('start', {})
    end = event.get('end', {})
    
    # Handle all-day events vs. timed events
    if 'date' in start:
        # All-day event
        start_time = start['date'] + 'T00:00:00Z'
        end_time = end.get('date', start['date']) + 'T00:00:00Z'
        all_day = True
    else:
        start_time = start.get('dateTime', '')
        end_time = end.get('dateTime', '')
        all_day = False
    
    return {
        'google_id': event['id'],
        'title': event.get('summary', 'No title'),
        'description': event.get('description'),
        'start_time': start_time,
        'end_time': end_time,
        'all_day': all_day,
        'location': event.get('location'),
        'status': event.get('status', 'confirmed')
    }

# Fetch and transform
print(f"Fetching events from {calendar_id}...", file=sys.stderr)
events = fetch_events()
print(f"Found {len(events)} events", file=sys.stderr)

transformed = [transform_event(e) for e in events]
payload = json.dumps({'events': transformed}).encode('utf-8')

# POST to API
req = urllib.request.Request(
    api_url,
    data=payload,
    headers={'Content-Type': 'application/json'},
    method='POST'
)

with urllib.request.urlopen(req) as response:
    result = json.loads(response.read().decode('utf-8'))
    print(f"Synced: {result.get('upserted', 0)}/{result.get('total', 0)} events")
PYTHON
