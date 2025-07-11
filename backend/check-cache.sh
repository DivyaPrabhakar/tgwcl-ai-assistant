#!/bin/bash
echo "🗂️  Cache Status Summary:"
echo "========================"
curl -s http://localhost:3001/api/cache-status | python3 -c "
import json, sys
data = json.load(sys.stdin)
for table, info in data.items():
    status = '✅' if info['recordCount'] > 0 else '❌'
    print(f'{status} {table}: {info[\"recordCount\"]} records')
"
