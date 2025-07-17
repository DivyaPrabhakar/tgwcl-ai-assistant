#!/bin/bash
echo "Setting up environment files..."
cp .env.example .env
cp backend/.env.example backend/.env
echo "✅ Created .env files. Please edit them with your actual API keys."