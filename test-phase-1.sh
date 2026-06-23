#!/bin/bash

# Phase 1 Testing Script
# Tests user registration, login, and token validation

set -e

API_URL="http://localhost:5000/api"
TEST_EMAIL="phase1test@example.com"
TEST_PASSWORD="testpass123"
TEST_NAME="Phase 1 Test User"

echo "🧪 Project Alpha - Phase 1 Testing"
echo "=================================="
echo ""

# Test 1: Health check
echo "Test 1️⃣ - Health Check"
echo "Getting: $API_URL/health"
HEALTH=$(curl -s $API_URL/health)
echo "Response: $HEALTH"
echo "✅ Backend is running"
echo ""

# Test 2: Registration
echo "Test 2️⃣ - User Registration"
echo "Registering: $TEST_EMAIL"
REGISTER=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}")
echo "Response: $REGISTER"

# Extract token from response
TOKEN=$(echo $REGISTER | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed - no token received"
  exit 1
fi
echo "✅ Registration successful"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Test 3: Login
echo "Test 3️⃣ - User Login"
echo "Logging in: $TEST_EMAIL"
LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
echo "Response: $LOGIN"

LOGIN_TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$LOGIN_TOKEN" ]; then
  echo "❌ Login failed - no token received"
  exit 1
fi
echo "✅ Login successful"
echo ""

# Test 4: Get current user
echo "Test 4️⃣ - Get Current User"
echo "Using token: Bearer ${TOKEN:0:20}..."
ME=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $ME"

if echo "$ME" | grep -q "$TEST_EMAIL"; then
  echo "✅ Current user retrieved successfully"
else
  echo "❌ Failed to retrieve user info"
  exit 1
fi
echo ""

# Test 5: Verify token
echo "Test 5️⃣ - Verify Token"
VERIFY=$(curl -s -X POST "$API_URL/auth/verify" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $VERIFY"

if echo "$VERIFY" | grep -q '"success":true'; then
  echo "✅ Token verified successfully"
else
  echo "❌ Token verification failed"
  exit 1
fi
echo ""

# Test 6: Invalid token
echo "Test 6️⃣ - Invalid Token"
INVALID=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer invalid-token-123")
echo "Response: $INVALID"

if echo "$INVALID" | grep -q '"error"'; then
  echo "✅ Invalid token correctly rejected"
else
  echo "❌ Invalid token was accepted (security issue)"
  exit 1
fi
echo ""

# Test 7: No token
echo "Test 7️⃣ - Missing Token"
NO_TOKEN=$(curl -s -X GET "$API_URL/auth/me")
echo "Response: $NO_TOKEN"

if echo "$NO_TOKEN" | grep -q '"error"'; then
  echo "✅ Missing token correctly rejected"
else
  echo "❌ Request without token was accepted (security issue)"
  exit 1
fi
echo ""

# Test 8: Duplicate registration
echo "Test 8️⃣ - Duplicate Email"
echo "Trying to register again with: $TEST_EMAIL"
DUPLICATE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}")
echo "Response: $DUPLICATE"

if echo "$DUPLICATE" | grep -q "already exists"; then
  echo "✅ Duplicate email correctly rejected"
else
  echo "❌ Duplicate email was accepted (should be rejected)"
  exit 1
fi
echo ""

# Test 9: Wrong password
echo "Test 9️⃣ - Wrong Password"
echo "Trying login with wrong password"
WRONG_PASS=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}")
echo "Response: $WRONG_PASS"

if echo "$WRONG_PASS" | grep -q "Invalid email or password"; then
  echo "✅ Wrong password correctly rejected"
else
  echo "❌ Wrong password was accepted (security issue)"
  exit 1
fi
echo ""

echo "=================================="
echo "✅ All Phase 1 Tests Passed!"
echo ""
echo "Test user created:"
echo "  Email: $TEST_EMAIL"
echo "  Password: $TEST_PASSWORD"
echo "  Name: $TEST_NAME"
echo ""
echo "You can now:"
echo "1. Visit http://localhost:3000"
echo "2. Click 'Create one' to signup"
echo "3. Or login with above credentials"
echo ""
