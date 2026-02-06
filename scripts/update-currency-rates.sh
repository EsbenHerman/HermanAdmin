#!/bin/bash
# Fetch latest exchange rates from Frankfurter API and update HermanAdmin
# Data source: European Central Bank (ECB)
# Run daily via cron

set -e

API_BASE="${HERMANADMIN_API:-http://localhost:8080/api/v1}"
FRANKFURTER_API="https://api.frankfurter.app/latest"

# Currencies to fetch (will get SEK rate for each)
CURRENCIES=("USD" "EUR" "GBP" "CNY")

echo "[$(date -Iseconds)] Updating currency rates..."

for currency in "${CURRENCIES[@]}"; do
    # Fetch rate from Frankfurter (1 unit of currency = X SEK)
    response=$(curl -sf "${FRANKFURTER_API}?from=${currency}&to=SEK")
    
    if [ -z "$response" ]; then
        echo "  ✗ Failed to fetch rate for ${currency}"
        continue
    fi
    
    # Extract the SEK rate using jq
    sek_rate=$(echo "$response" | jq -r '.rates.SEK')
    
    if [ "$sek_rate" = "null" ] || [ -z "$sek_rate" ]; then
        echo "  ✗ No SEK rate in response for ${currency}"
        continue
    fi
    
    # Update HermanAdmin via API
    update_response=$(curl -sf -X POST "${API_BASE}/currencies" \
        -H "Content-Type: application/json" \
        -d "{\"currency\": \"${currency}\", \"sek_rate\": ${sek_rate}}")
    
    if [ $? -eq 0 ]; then
        echo "  ✓ ${currency}: ${sek_rate} SEK"
    else
        echo "  ✗ Failed to update ${currency} in database"
    fi
done

echo "[$(date -Iseconds)] Done"
