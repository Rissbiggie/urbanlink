# UrbanLink API - Bruno Collection Guide

## Overview

This Bruno collection contains **60+ pre-configured API requests** for testing the UrbanLink application. All endpoints are organized by feature with built-in tests and automatic variable management.

## Quick Start

1. **Open Bruno**
   ```bash
   cd UrbanLink
   bruno open  # or use the Bruno GUI
   ```

2. **Set Authentication Token**
   - Update `baseUrl` and `authToken` in collection variables
   - Or run the `Login` request first to auto-populate the token

3. **Start Testing**
   - Click any request to view details
   - Modify parameters as needed
   - Click "Send" to execute
   - Check the "Tests" tab for validation results

## Collection Structure

```
UrbanLink API Collection
├── Authentication
│   ├── Login
│   └── Register
├── Payments
│   ├── Create Payment
│   ├── List Payments
│   ├── Get Payment Details
│   ├── Get Payment Status
│   ├── M-Pesa Callback - Success
│   ├── M-Pesa Callback - User Cancelled
│   ├── M-Pesa Callback - Insufficient Funds
│   ├── M-Pesa Callback - Wrong PIN
│   └── M-Pesa Callback - Network Timeout
├── Notifications
│   ├── List Notifications
│   ├── Get Notification Count
│   ├── Send Test Notification
│   ├── Mark Notification as Read
│   ├── Mark All Notifications as Read
│   └── Delete Notification
├── Grok AI
│   ├── Health Check
│   ├── Ask Question
│   ├── Chat
│   ├── Analyze Ride
│   ├── Suggest Pricing
│   ├── Generate Support Response
│   ├── Analyze Driver Performance
│   └── Predict Demand
├── Rides
│   ├── Request Ride
│   ├── List Rides
│   ├── Get Ride Details
│   └── Update Ride Status
├── User
│   ├── Get Profile
│   ├── Update Profile
│   └── Update Password
├── Applications
│   ├── Apply for Driver
│   └── Get Application Status
├── Compliance
│   ├── Get Compliance Status
│   └── Submit Compliance Document
├── Driver
│   ├── Get Driver Profile
│   ├── Update Driver Status
│   ├── Get Driver Earnings
│   ├── Accept Ride
│   └── Decline Ride
├── Admin
│   ├── Get All Payments
│   ├── Get All Applications
│   ├── Approve Application
│   ├── Reject Application
│   └── Get System Reports
└── Error Scenarios
    ├── Invalid Phone Format
    ├── Missing Required Field
    └── Unauthorized Access
```

## Global Variables

The collection uses these variables that auto-populate:

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | API base URL | `http://localhost:8000` |
| `apiVersion` | API version | `v1` |
| `authToken` | Bearer token from login | Auto-populated after login |
| `userId` | Current user ID | `1` |
| `testRideId` | Ride ID for testing | Auto-set from "Request Ride" |
| `testPaymentId` | Payment ID for testing | Auto-set from "Create Payment" |
| `testNotificationId` | Notification ID for testing | Auto-set from "Send Test Notification" |
| `stkRequestId` | M-Pesa STK request ID | Auto-set from "Create Payment" |

## Testing Workflows

### 1. Complete Payment Flow

```
1. Login (get authToken)
2. Request Ride (get testRideId)
3. Create Payment (get testPaymentId & stkRequestId)
4. M-Pesa STK Push Callback - Success (simulate M-Pesa response)
5. Get Payment Status (verify completion)
```

**Expected Result:** Payment status changes from `processing` → `completed`

### 2. Notification Flow

```
1. Login (get authToken)
2. Send Test Notification (get testNotificationId)
3. List Notifications (verify notification appears)
4. Mark Notification as Read (update read status)
5. Get Notification Count (verify unread count decreased)
```

**Expected Result:** Notification marked as read, unread count decreases

### 3. Grok AI Flow

```
1. Login (get authToken)
2. Grok Health Check (verify service available)
3. Grok Ask Question (test AI response)
4. Grok Analyze Ride (get ride insights)
5. Grok Suggest Pricing (get pricing recommendations)
```

**Expected Result:** All requests succeed with AI responses

### 4. Driver Application Flow

```
1. Register (create user account)
2. Apply for Driver (submit documents)
3. Get Application Status (check status)
4. LOGIN as ADMIN
5. Get All Applications (view pending apps)
6. Approve Application (approve driver)
```

**Expected Result:** Application status → `pending` → `approved`

## Available Test Scenarios

### M-Pesa Callback Scenarios

| File Name | Result Code | Scenario |
|-----------|-------------|----------|
| M-Pesa Callback - Success | 0 | Payment completed successfully |
| M-Pesa Callback - User Cancelled | 1032 | User cancelled the STK prompt |
| M-Pesa Callback - Insufficient Funds | 1 | Insufficient balance in account |
| M-Pesa Callback - Wrong PIN | 2001 | User entered wrong PIN |
| M-Pesa Callback - Network Timeout | 2 | Network error during payment |

**Usage:** Send any callback to simulate that scenario

### Error Scenarios

| Request | Expected Status | Purpose |
|---------|-----------------|---------|
| Invalid Phone Format | 422 | Validate phone field |
| Missing Required Field | 422 | Validate required fields |
| Unauthorized Access | 401 | Verify auth protection |

## Request Examples

### Example 1: Create Payment

```
POST /api/payments/initiate

Request:
{
  "payable_type": "ride",
  "payable_id": 1,
  "phone": "0712345678",
  "amount": 500
}

Response:
{
  "id": 1,
  "status": "processing",
  "amount": 500,
  "meta": {
    "phone": "254712345678",
    "stk_request_id": "checkout-123"
  }
}

Tests Verified:
✓ Status 200
✓ ID exists
✓ Status is "processing"
✓ Phone formatted to +254 format
```

### Example 2: Grok Analyze Ride

```
POST /api/grok/analyze-ride

Request:
{
  "ride_data": {
    "pickup": "Nairobi CBD",
    "dropoff": "Westlands",
    "distance_km": 8,
    "duration_minutes": 15,
    "fare": 500,
    "rating": 4.5
  }
}

Response:
{
  "success": true,
  "data": {
    "analysis": "This ride shows excellent efficiency...",
    "ride_data": {...}
  }
}

Tests Verified:
✓ Status 200
✓ Success flag true
✓ Analysis not empty
```

## Built-in Tests

Every request includes automatic tests that validate:

✅ **Status Code** - Correct HTTP response code  
✅ **Response Structure** - Required fields present  
✅ **Data Types** - Fields have correct types  
✅ **Business Logic** - Values make sense (e.g., status matches expected)  
✅ **Auto-Population** - Variables saved for next requests  

### View Test Results

1. Execute any request
2. Click the **Tests** tab
3. Green checkmark = passed
4. Red X = failed

## Environment Setup

### Default Configuration

```
baseUrl: http://localhost:8000
authToken: (populated after login)
```

### For Docker Setup

```
baseUrl: http://localhost (if exposed)
baseUrl: http://app:8000 (internal Docker)
baseUrl: https://xxxx-xxx-xxx-xxx.ngrok.io (ngrok public)
```

### For Production

```
baseUrl: https://api.urbanlink.example.com
```

## Customization Guide

### Add New Request

1. Right-click on collection folder
2. Select "New Request"
3. Set method and URL
4. Add headers if needed:
   ```
   Content-Type: application/json
   Authorization: Bearer {{authToken}}
   ```
5. Add request body (JSON)
6. Add tests:
   ```
   res.status == 201: pass
   res.body.id !== null: pass
   ```

### Add Pre-request Script

```javascript
// Example: Add timestamp
bru.setVar('currentTime', new Date().toISOString());
```

### Add Response Processing

```javascript
// Example: Extract token
const token = res.body.data.token;
bru.setVar('authToken', token);
```

## Batch Testing

### Run All Payment Tests

1. Select "Payments" folder
2. Click **Run** (play icon)
3. Tests execute sequentially
4. View results in report

### Run Specific Test

1. Click on request name
2. Press `Ctrl+Enter` or click **Send**
3. View result in response pane

## Troubleshooting

### Issue: 401 Unauthorized

**Solution:** Token expired, run "Login" request again

```bash
Login → Copy new token to authToken variable
```

### Issue: 422 Validation Error

**Solution:** Check request body matches requirements

```bash
Example: "phone": "0712345678" must be valid format
```

### Issue: Payment Status Still Processing

**Solution:** Send M-Pesa callback to update status

```bash
Run: M-Pesa STK Push Callback - Success
Then: Get Payment Status (should be "completed")
```

### Issue: Grok Service Unavailable

**Solution:** Check if Grok Docker service running

```bash
docker-compose logs grok
docker ps | grep grok
```

## Performance Tips

1. **Parallel Execution** - Independent requests can run simultaneously
2. **Variable Reuse** - Use auto-populated variables to chain requests
3. **Batch Operations** - Group related tests and run as folder
4. **Response Filtering** - Use tests to only check relevant fields

## Common Workflows

### 1. Quick Health Check

```
Grok Health Check
→ Get Profile
→ List Notifications
```

Expected: All return 200

### 2. Full End-to-End

```
Login
→ Request Ride
→ Create Payment
→ M-Pesa Callback Success
→ Update Ride Status
→ Get Driver Earnings
```

Expected: Complete payment-to-earnings flow

### 3. Notification Testing

```
Send Test Notification
→ List Notifications
→ Get Notification Count
→ Mark Notification as Read
→ Mark All as Read
→ Delete Notification
```

Expected: Notification lifecycle management works

## Integration with CI/CD

### Export Results

1. Run batch tests
2. Click **Export**
3. Choose JSON format
4. Use in CI/CD pipeline

### Example GitHub Actions

```yaml
- name: Run API Tests
  run: |
    bruno run ./UrbanLink/collection.bru --env production
```

## Documentation

- **API Documentation:** See `routes/api.php`
- **Testing Layout:** See `TESTING_LAYOUT.md`
- **Postman Alternative:** Export to Postman if needed

## Support

For issues or questions:

1. Check response error messages
2. Verify database state
3. Check application logs: `docker-compose logs app`
4. Check Grok logs: `docker-compose logs grok`

---

**Last Updated:** April 8, 2026  
**Collection Version:** 1.0  
**Total Requests:** 60+
