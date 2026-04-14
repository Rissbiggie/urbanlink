# Bruno Collection - Quick Reference Card

## 🚀 Quick Start

```bash
cd UrbanLink
bruno open  # or open in Bruno GUI

# Then run "Login" request first to get authToken
```

## 📋 Test Workflows (Copy & Paste)

### ⚡ Payment Flow (5 steps)
```
1. Login
2. Request Ride
3. Create Payment
4. M-Pesa STK Push Callback - Success
5. Get Payment Status (verify → "completed")
```

### 📢 Notification Flow (5 steps)
```
1. Login
2. Send Test Notification
3. List Notifications
4. Mark Notification as Read
5. Get Notification Count
```

### 🤖 Grok AI Flow (5 steps)
```
1. Login
2. Grok Health Check
3. Grok Ask Question
4. Grok Analyze Ride
5. Grok Suggest Pricing
```

### 👤 Driver Application (6 steps)
```
1. Register
2. Apply for Driver
3. Get Application Status

Switch to ADMIN:
4. Get All Applications
5. Approve Application
6. Check Application Status (verify → "approved")
```

---

## 📍 All Available Requests

### Authentication (2)
- ✅ Login
- ✅ Register

### Payment (9)
- ✅ Create Payment
- ✅ List Payments
- ✅ Get Payment Details
- ✅ Get Payment Status
- ✅ M-Pesa Callback - Success (ResultCode: 0)
- ✅ M-Pesa Callback - User Cancelled (1032)
- ✅ M-Pesa Callback - Insufficient Funds (1)
- ✅ M-Pesa Callback - Wrong PIN (2001)
- ✅ M-Pesa Callback - Network Timeout (2)

### Notifications (6)
- ✅ List Notifications
- ✅ Get Notification Count
- ✅ Send Test Notification
- ✅ Mark Notification as Read
- ✅ Mark All Notifications as Read
- ✅ Delete Notification

### Grok AI (8)
- ✅ Health Check
- ✅ Ask Question
- ✅ Chat
- ✅ Analyze Ride
- ✅ Suggest Pricing
- ✅ Generate Support Response
- ✅ Analyze Driver Performance
- ✅ Predict Demand

### Rides (4)
- ✅ Request Ride
- ✅ List Rides
- ✅ Get Ride Details
- ✅ Update Ride Status

### User (3)
- ✅ Get Profile
- ✅ Update Profile
- ✅ Update Password

### Applications (2)
- ✅ Apply for Driver
- ✅ Get Application Status

### Compliance (2)
- ✅ Get Compliance Status
- ✅ Submit Compliance Document

### Driver (5)
- ✅ Get Driver Profile
- ✅ Update Driver Status
- ✅ Get Driver Earnings
- ✅ Accept Ride
- ✅ Decline Ride

### Admin (5)
- ✅ Get All Payments
- ✅ Get All Applications
- ✅ Approve Application
- ✅ Reject Application
- ✅ Get System Reports

### Error Scenarios (3)
- ✅ Invalid Phone Format
- ✅ Missing Required Field
- ✅ Unauthorized Access

---

## 🔧 Global Variables (Auto-Populated)

| Variable | Auto-Set By | Example |
|----------|------------|---------|
| `{{authToken}}` | Login | `10\|abc123xyz` |
| `{{testRideId}}` | Request Ride | `5` |
| `{{testPaymentId}}` | Create Payment | `12` |
| `{{testNotificationId}}` | Send Test Notification | `45` |
| `{{stkRequestId}}` | Create Payment | `checkout-123` |

---

## 🧪 Test Results Interpretation

After each request, check **Tests** tab:

| Result | Meaning |
|--------|---------|
| ✅ Green | Test Passed |
| ❌ Red | Test Failed - check response |
| ⚪ Blue | Info - additional data |

---

## 🔄 M-Pesa Callback Codes

| Code | Scenario | Use Request |
|------|----------|------------|
| `0` | ✅ Success | M-Pesa Callback - Success |
| `1` | ❌ Insufficient Funds | M-Pesa Callback - Insufficient |
| `2` | ❌ Network Timeout | M-Pesa Callback - Network Timeout |
| `1032` | ❌ User Cancelled | M-Pesa Callback - User Cancelled |
| `2001` | ❌ Wrong PIN | M-Pesa Callback - Wrong PIN |

---

## 💡 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Run Login request again |
| 422 Validation Error | Check request body format |
| Payment still "processing" | Send success callback |
| Grok service unavailable | Check Docker: `docker-compose logs grok` |
| Token expired | Run Login → copy new token |

---

## 🎯 Testing Checklist

- [ ] Run Login (get token)
- [ ] Run Grok Health Check (verify service)
- [ ] Run Create Payment (test payment initiation)
- [ ] Run M-Pesa Callback (simulate M-Pesa)
- [ ] Run Get Payment Status (verify completion)
- [ ] Run Send Test Notification (test notifications)
- [ ] Run Grok Analyze Ride (test AI)
- [ ] All tests show ✅ green

---

## 🌐 Configuration

### Development
```
baseUrl: http://localhost:8000
```

### Docker
```
baseUrl: http://app:8000  (internal)
baseUrl: http://localhost (exposed)
```

### ngrok (Public)
```
baseUrl: https://xxxx-xxx-xxx-xxx.ngrok.io
```

---

## 📊 Performance Metrics

| Endpoint | Avg Response | Expected |
|----------|--------------|----------|
| Login | ~150ms | < 500ms |
| Create Payment | ~200ms | < 500ms |
| Grok Ask | ~2000ms | < 5000ms (AI processing) |
| List Payments | ~50ms | < 500ms |
| Notifications | ~30ms | < 500ms |

---

## 🔗 Request Chaining Example

```javascript
// After Login succeeds:
// authToken is auto-stored

// After Request Ride succeeds:
// testRideId is auto-stored in {{testRideId}}

// Can now use in Create Payment:
// "payable_id": {{testRideId}}

// All automatic - no manual copy/paste needed!
```

---

## 📝 Sample Request Body

### Create Payment
```json
{
  "payable_type": "ride",
  "payable_id": 1,
  "phone": "0712345678",
  "amount": 500
}
```

### Grok Ask Question
```json
{
  "question": "What is the capital of Kenya?"
}
```

### M-Pesa Success Callback
```json
{
  "Body": {
    "stkCallback": {
      "CheckoutRequestID": "{{stkRequestId}}",
      "ResultCode": 0,
      "ResultDesc": "Success",
      "CallbackMetadata": {
        "Item": [
          {"Name": "Amount", "Value": 500},
          {"Name": "MpesaReceiptNumber", "Value": "LIJ7791974"}
        ]
      }
    }
  }
}
```

---

## 🎓 Learning Path

### Beginner
1. Open collection
2. Run "Login"
3. Run "Get Profile"
4. Run "List Payments"

### Intermediate
1. Run payment workflow (5 steps)
2. Run notification workflow (5 steps)
3. Check each test passes

### Advanced
1. Create custom requests
2. Add pre-request scripts
3. Create request groups
4. Export to CI/CD

---

## 📞 Quick Support

**Errors?** Check Bruno console in Terminal tab  
**See full details?** Click "Response" tab  
**Validate format?** Tests show what's wrong  
**Debug?** Add `console.log()` in scripts tab

---

**Pro Tips:**
- 💡 Always run Login first
- 💡 Variables auto-populate - watch logs
- 💡 Tests show what failed - read them carefully
- 💡 Use error scenario requests to verify error handling
- 💡 Run all requests in a folder for batch testing

✨ **Happy Testing!**
