#!/bin/bash

# API Testing Script for PayPal-Like Secure Application
# This script tests all API endpoints

BASE_URL="http://localhost:8001/api"
echo "=================================="
echo "API Testing Script"
echo "=================================="
echo ""

#!/bin/bash

# API Testing Script for PayPal-Like Secure Application
# Base URL for API requests
BASE_URL="http://localhost:8000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Register a new user
echo -e "${YELLOW}Test 1: User Registration${NC}"
echo "POST $BASE_URL/register"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "mobile_number": "+1234567890",
    "password": "Test@123456",
    "password_confirmation": "Test@123456"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# Check if registration was successful
if echo "$REGISTER_RESPONSE" | grep -q "Registration successful"; then
    echo -e "${GREEN}✓ Registration successful${NC}"
else
    echo -e "${RED}✗ Registration failed${NC}"
fi
echo ""
echo "=================================="
echo ""

# Test 2: Login
echo -e "${YELLOW}Test 2: User Login${NC}"
echo "POST $BASE_URL/login"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456"
  }')

echo "$LOGIN_RESPONSE" | jq '.'
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ ! -z "$TOKEN" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗ Login failed${NC}"
fi
echo ""
echo "=================================="
echo ""

# Test 3: Get User Info (Protected Route)
if [ ! -z "$TOKEN" ]; then
    echo -e "${YELLOW}Test 3: Get User Information (Protected)${NC}"
    echo "GET $BASE_URL/user"
    USER_RESPONSE=$(curl -s -X GET "$BASE_URL/user" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$USER_RESPONSE" | jq '.'
    echo ""
    
    if echo "$USER_RESPONSE" | grep -q "full_name"; then
        echo -e "${GREEN}✓ User info retrieved successfully${NC}"
    else
        echo -e "${RED}✗ Failed to get user info${NC}"
    fi
    echo ""
    echo "=================================="
    echo ""
fi

# Test 4: Setup 2FA (Protected Route)
if [ ! -z "$TOKEN" ]; then
    echo -e "${YELLOW}Test 4: Setup 2FA (Protected)${NC}"
    echo "POST $BASE_URL/2fa/setup"
    TFA_SETUP_RESPONSE=$(curl -s -X POST "$BASE_URL/2fa/setup" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$TFA_SETUP_RESPONSE" | jq '. | del(.qr_code)' # Hide QR code for cleaner output
    echo ""
    
    if echo "$TFA_SETUP_RESPONSE" | grep -q "secret"; then
        echo -e "${GREEN}✓ 2FA setup successful${NC}"
        echo "Note: QR code data omitted from display"
    else
        echo -e "${RED}✗ 2FA setup failed${NC}"
    fi
    echo ""
    echo "=================================="
    echo ""
fi

# Test 5: Logout (Protected Route)
if [ ! -z "$TOKEN" ]; then
    echo -e "${YELLOW}Test 5: Logout (Protected)${NC}"
    echo "POST $BASE_URL/logout"
    LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/logout" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$LOGOUT_RESPONSE" | jq '.'
    echo ""
    
    if echo "$LOGOUT_RESPONSE" | grep -q "Logout successful"; then
        echo -e "${GREEN}✓ Logout successful${NC}"
    else
        echo -e "${RED}✗ Logout failed${NC}"
    fi
    echo ""
    echo "=================================="
    echo ""
fi

# Test 6: Test Invalid Login
echo -e "${YELLOW}Test 6: Invalid Login (Should Fail)${NC}"
echo "POST $BASE_URL/login"
INVALID_LOGIN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword"
  }')

echo "$INVALID_LOGIN" | jq '.'
echo ""

if echo "$INVALID_LOGIN" | grep -q "incorrect"; then
    echo -e "${GREEN}✓ Invalid login correctly rejected${NC}"
else
    echo -e "${RED}✗ Invalid login not handled properly${NC}"
fi
echo ""
echo "=================================="
echo ""

echo -e "${GREEN}API Testing Complete!${NC}"
echo ""
echo "Summary of Available Endpoints:"
echo "  POST   /api/register              - Register new user"
echo "  POST   /api/login                 - Login user"
echo "  POST   /api/logout                - Logout user (requires token)"
echo "  GET    /api/user                  - Get user info (requires token)"
echo "  POST   /api/2fa/setup             - Setup 2FA (requires token)"
echo "  POST   /api/2fa/verify            - Verify 2FA code (requires token)"
echo "  POST   /api/2fa/verify-login      - Verify 2FA during login"
echo "  POST   /api/2fa/disable           - Disable 2FA (requires token)"
echo ""
