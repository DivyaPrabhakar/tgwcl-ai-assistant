#!/bin/bash
echo "Clearing cache..."
curl -X POST http://localhost:3001/api/clear-cache

echo -e "\nRefreshing all tables..."
curl -X POST http://localhost:3001/api/refresh/items
curl -X POST http://localhost:3001/api/refresh/outfits  
curl -X POST http://localhost:3001/api/refresh/usage-log
curl -X POST http://localhost:3001/api/refresh/inspiration
curl -X POST http://localhost:3001/api/refresh/shopping-list
curl -X POST http://localhost:3001/api/refresh/avoids
curl -X POST http://localhost:3001/api/refresh/inactive-items

echo -e "\nChecking final cache status..."
curl http://localhost:3001/api/cache-status