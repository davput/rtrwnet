#!/bin/bash
# Test Script: Upgrade API Flow
# Usage: ./test_upgrade_api.sh <TOKEN> <TENANT_ID> <NEW_PLAN_ID>

BASE_URL="http://localhost:8089/api/v1"
TOKEN=$1
TENANT_ID=$2
NEW_PLAN_ID=$3

if [ -z "$TOKEN" ] || [ -z "$TENANT_ID" ] || [ -z "$NEW_PLAN_ID" ]; then
    echo "Usage: ./test_upgrade_api.sh <TOKEN> <TENANT_ID> <NEW_PLAN_ID>"
    echo "Example: ./test_upgrade_api.sh eyJhbGc... tenant-123 plan-pro-id"
    exit 1
fi

echo "=== Test Upgrade API Flow ==="
echo ""

# 1. Get current billing info
echo "1. Getting current billing info..."
curl -s -X GET "$BASE_URL/billing" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Tenant-ID: $TENANT_ID" \
    -H "Content-Type: application/json" | jq '.data.subscription'

echo ""
echo "---"

# 2. Request upgrade
echo "2. Requesting upgrade to plan: $NEW_PLAN_ID"
UPGRADE_RESPONSE=$(curl -s -X PUT "$BASE_URL/billing/subscription" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Tenant-ID: $TENANT_ID" \
    -H "Content-Type: application/json" \
    -d "{\"plan_id\": \"$NEW_PLAN_ID\"}")

echo "$UPGRADE_RESPONSE" | jq '.'

# Extract order_id if upgrade requires payment
ORDER_ID=$(echo "$UPGRADE_RESPONSE" | jq -r '.data.order_id // empty')

if [ -n "$ORDER_ID" ]; then
    echo ""
    echo "Order created: $ORDER_ID"
    echo "---"
    
    # 3. Get invoice details
    echo "3. Getting invoice details..."
    curl -s -X GET "$BASE_URL/payment/$ORDER_ID/details" \
        -H "Authorization: Bearer $TOKEN" \
        -H "X-Tenant-ID: $TENANT_ID" \
        -H "Content-Type: application/json" | jq '.'
    
    echo ""
    echo "---"
    
    # 4. Create payment token (BCA VA)
    echo "4. Creating payment token (BCA VA)..."
    PAYMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/payment/$ORDER_ID/token" \
        -H "Authorization: Bearer $TOKEN" \
        -H "X-Tenant-ID: $TENANT_ID" \
        -H "Content-Type: application/json" \
        -d '{"payment_method": "bca_va"}')
    
    echo "$PAYMENT_RESPONSE" | jq '.'
    
    echo ""
    echo "---"
    
    # 5. Check payment status
    echo "5. Checking payment status..."
    curl -s -X GET "$BASE_URL/payment/$ORDER_ID/status" \
        -H "Authorization: Bearer $TOKEN" \
        -H "X-Tenant-ID: $TENANT_ID" \
        -H "Content-Type: application/json" | jq '.'
    
    echo ""
    echo "=== Instructions ==="
    echo "1. Pay using the VA number shown above"
    echo "2. After payment, run: curl -X GET '$BASE_URL/payment/$ORDER_ID/status' with headers"
    echo "3. Check billing to verify upgrade: curl -X GET '$BASE_URL/billing' with headers"
else
    echo ""
    echo "No order created - upgrade may have been applied immediately (downgrade)"
fi

echo ""
echo "=== Test Complete ==="
