#!/bin/bash

echo "=== WARDROBE AI DEBUG ==="
echo "Timestamp: $(date)"
echo ""

echo "1. Server Health:"
curl -s http://localhost:3001/api/health
echo -e "\n"

echo "2. Cache Status (raw JSON):"
curl -s http://localhost:3001/api/cache-status
echo -e "\n"

echo "3. Debug Chat Data (raw JSON):"
curl -s http://localhost:3001/api/debug/chat-data  
echo -e "\n"

echo "4. Chat Test:"
curl -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How many items do I have?", "context": []}'
echo -e "\n"

echo "=== Check server logs in your npm run dev terminal ==="