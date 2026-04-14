# UrbanLink Testing Layout & Implementation Verification

## 1. TESTING STRATEGY OVERVIEW

### Test Pyramid
```
        /\
       /  \        E2E Tests (Postman/Bruno)
      /____\       Integration Tests
     /      \     Unit Tests
    /        \   
   /          \ 
  /____________\
```

### Test Coverage Areas
- ✅ Unit Tests (Services, Models)
- ✅ Integration Tests (Controllers, API Endpoints)
- ✅ API Testing (REST endpoints)
- ✅ Payment Flow Testing (M-Pesa STK Push)
- ✅ Notification Testing (Real-time, SMS, Email)
- ✅ Grok AI Service Testing
- ✅ Database Testing (Migrations, Models)

---

## 2. UNIT TESTS FOR SERVICES

### 2.1 PaymentService Testing

**Test File:** `tests/Unit/PaymentServiceTest.php`

```php
<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\PaymentService;
use App\Services\MpesaService;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PaymentServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PaymentService $paymentService;
    protected MpesaService $mpesaService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mpesaService = $this->mock(MpesaService::class);
        $this->paymentService = new PaymentService($this->mpesaService);
    }

    // Test 1: Phone number formatting
    public function test_phone_number_formatting_from_local_format()
    {
        $user = User::factory()->create(['phone' => '0712345678']);
        $data = [
            'user_id' => $user->id,
            'payable_type' => 'ride',
            'payable_id' => 1,
            'phone' => '0712345678',
            'amount' => 500,
        ];

        $this->mpesaService->shouldReceive('stkPush')
            ->with(\Mockery::on(function ($args) {
                return $args['phone'] === '254712345678';
            }))
            ->andReturn([
                'ResponseCode' => '0',
                'CheckoutRequestID' => 'test-id',
                'MerchantRequestID' => 'test-merchant-id',
            ]);

        $payment = $this->paymentService->initiateMpesa($data);
        
        $this->assertEquals('254712345678', $payment->meta['phone']);
    }

    // Test 2: STK Push Initiation
    public function test_stk_push_initiation_success()
    {
        $user = User::factory()->create();
        $data = [
            'user_id' => $user->id,
            'payable_type' => 'ride',
            'payable_id' => 1,
            'phone' => '254712345678',
            'amount' => 500,
        ];

        $this->mpesaService->shouldReceive('stkPush')
            ->andReturn([
                'ResponseCode' => '0',
                'CheckoutRequestID' => 'checkout-123',
                'MerchantRequestID' => 'merchant-123',
                'CustomerMessage' => 'Success',
            ]);

        $payment = $this->paymentService->initiateMpesa($data);

        $this->assertEquals('processing', $payment->status);
        $this->assertEquals('checkout-123', $payment->meta['stk_request_id']);
        $this->assertDatabaseHas('payments', ['id' => $payment->id, 'status' => 'processing']);
    }

    // Test 3: Payment Callback Processing - Success
    public function test_callback_processing_success()
    {
        $payment = Payment::factory()->create([
            'status' => 'processing',
            'meta' => [
                'stk_request_id' => 'checkout-123',
            ],
        ]);

        $callbackData = [
            'Body' => [
                'stkCallback' => [
                    'CheckoutRequestID' => 'checkout-123',
                    'ResultCode' => 0,
                    'ResultDesc' => 'The service request has been processed successfully.',
                    'CallbackMetadata' => [
                        'Item' => [
                            ['Name' => 'Amount', 'Value' => 500],
                            ['Name' => 'MpesaReceiptNumber', 'Value' => 'LIJ7791974'],
                            ['Name' => 'TransactionDate', 'Value' => 20260408120000],
                            ['Name' => 'PhoneNumber', 'Value' => '254712345678'],
                        ],
                    ],
                ],
            ],
        ];

        $updatedPayment = $this->paymentService->updateFromMpesaCallback($callbackData);

        $this->assertEquals('completed', $updatedPayment->status);
        $this->assertEquals('LIJ7791974', $updatedPayment->mpesa_transaction_id);
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'completed',
            'result_code' => 0,
        ]);
    }

    // Test 4: Payment Callback Processing - User Cancelled
    public function test_callback_processing_user_cancelled()
    {
        $payment = Payment::factory()->create([
            'status' => 'processing',
            'meta' => ['stk_request_id' => 'checkout-123'],
        ]);

        $callbackData = [
            'Body' => [
                'stkCallback' => [
                    'CheckoutRequestID' => 'checkout-123',
                    'ResultCode' => 1032,
                    'ResultDesc' => 'Request cancelled by user',
                ],
            ],
        ];

        $updatedPayment = $this->paymentService->updateFromMpesaCallback($callbackData);

        $this->assertEquals('cancelled', $updatedPayment->status);
        $this->assertEquals(1032, $updatedPayment->result_code);
    }

    // Test 5: Payment Callback Processing - Insufficient Funds
    public function test_callback_processing_insufficient_funds()
    {
        $payment = Payment::factory()->create([
            'status' => 'processing',
            'meta' => ['stk_request_id' => 'checkout-123'],
        ]);

        $callbackData = [
            'Body' => [
                'stkCallback' => [
                    'CheckoutRequestID' => 'checkout-123',
                    'ResultCode' => 1,
                    'ResultDesc' => 'Insufficient funds',
                ],
            ],
        ];

        $updatedPayment = $this->paymentService->updateFromMpesaCallback($callbackData);

        $this->assertEquals('failed', $updatedPayment->status);
        $this->assertEquals(1, $updatedPayment->result_code);
    }

    // Test 6: Idempotent Callback Processing
    public function test_callback_processing_is_idempotent()
    {
        $payment = Payment::factory()->create([
            'status' => 'completed',
            'meta' => ['stk_request_id' => 'checkout-123'],
            'mpesa_transaction_id' => 'LIJ7791974',
        ]);

        $callbackData = [
            'Body' => [
                'stkCallback' => [
                    'CheckoutRequestID' => 'checkout-123',
                    'ResultCode' => 0,
                    'ResultDesc' => 'The service request has been processed successfully.',
                    'CallbackMetadata' => [
                        'Item' => [
                            ['Name' => 'MpesaReceiptNumber', 'Value' => 'LIJ7791974'],
                        ],
                    ],
                ],
            ],
        ];

        $updatedPayment = $this->paymentService->updateFromMpesaCallback($callbackData);

        // Should still be completed, no double-processing
        $this->assertEquals('completed', $updatedPayment->status);
    }
}
```

### 2.2 NotificationService Testing

**Test File:** `tests/Unit/NotificationServiceTest.php`

```php
<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\NotificationService;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected NotificationService $notificationService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->notificationService = new NotificationService();
    }

    // Test 1: Real-time Notification Creation
    public function test_real_time_notification_created_in_database()
    {
        $user = User::factory()->create();
        
        $result = $this->notificationService->sendRealTimeNotification(
            $user,
            'test',
            'Test Title',
            'Test Message',
            ['test_data' => 'value']
        );

        $this->assertTrue($result);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type' => 'test',
            'title' => 'Test Title',
            'message' => 'Test Message',
            'is_read' => false,
        ]);
    }

    // Test 2: Email Notification
    public function test_email_notification_sent()
    {
        Mail::fake();
        
        $user = User::factory()->create(['email' => 'test@example.com']);
        
        $result = $this->notificationService->sendEmailNotification(
            $user,
            'Test Subject',
            'emails.notification',
            ['test' => 'data']
        );

        $this->assertTrue($result);
        Mail::assertSent(\Illuminate\Mail\Message::class);
    }

    // Test 3: SMS Notification Phone Formatting
    public function test_sms_phone_number_formatting()
    {
        Log::fake();
        
        $user = User::factory()->create(['phone' => '0712345678']);
        
        // This test verifies the phone formatting logic
        $result = $this->notificationService->sendSmsNotification(
            $user,
            'Test SMS Message'
        );

        // Should format to +254712345678
        Log::assertLogged('info', fn ($msg) => 
            str_contains($msg, '+254712345678')
        );
    }

    // Test 4: Multi-channel Notification
    public function test_multi_channel_notification()
    {
        Mail::fake();
        
        $user = User::factory()->create();
        
        $results = $this->notificationService->sendMultiChannelNotification(
            $user,
            'test',
            'Test Title',
            'Test Message',
            ['realtime', 'email'],
            ['data' => 'value']
        );

        $this->assertTrue($results['realtime']);
        $this->assertTrue($results['email']);
        $this->assertDatabaseHas('notifications', ['user_id' => $user->id]);
    }

    // Test 5: Mark Notification as Read
    public function test_mark_notification_as_read()
    {
        $user = User::factory()->create();
        $notification = Notification::factory()->create([
            'user_id' => $user->id,
            'is_read' => false,
        ]);

        $result = $this->notificationService->markAsRead($notification->id, $user);

        $this->assertTrue($result);
        $this->assertDatabaseHas('notifications', [
            'id' => $notification->id,
            'is_read' => true,
        ]);
    }

    // Test 6: Get User Notifications
    public function test_get_user_notifications()
    {
        $user = User::factory()->create();
        Notification::factory(5)->create(['user_id' => $user->id, 'is_read' => false]);
        Notification::factory(3)->create(['user_id' => $user->id, 'is_read' => true]);

        $notifications = $this->notificationService->getUserNotifications($user, 50);

        $this->assertCount(8, $notifications);
    }

    // Test 7: Ride Notifications
    public function test_send_ride_notification()
    {
        $user = User::factory()->create();
        $rideData = [
            'pickup_address' => 'Nairobi CBD',
            'dropoff_address' => 'Westlands',
            'final_fare' => 500,
        ];

        $result = $this->notificationService->sendRideNotification(
            $user,
            'ride_completed',
            $rideData
        );

        $this->assertTrue($result);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type' => 'ride',
            'title' => 'Ride Completed',
        ]);
    }
}
```

### 2.3 GrokService Testing

**Test File:** `tests/Unit/GrokServiceTest.php`

```php
<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\GrokService;

class GrokServiceTest extends TestCase
{
    protected GrokService $grokService;

    protected function setUp(): void
    {
        parent::setUp();
        // Skip if GROK_API_KEY not configured
        if (!config('services.grok.api_key')) {
            $this->markTestSkipped('Grok API key not configured');
        }
        $this->grokService = new GrokService();
    }

    // Test 1: Service Availability
    public function test_grok_service_availability()
    {
        $available = $this->grokService->isAvailable();
        $this->assertTrue($available);
    }

    // Test 2: Health Status
    public function test_grok_health_status()
    {
        $status = $this->grokService->getHealthStatus();

        $this->assertArrayHasKey('service', $status);
        $this->assertArrayHasKey('available', $status);
        $this->assertArrayHasKey('base_url', $status);
        $this->assertEquals('Grok AI', $status['service']);
    }

    // Test 3: Simple Question
    public function test_ask_question()
    {
        $answer = $this->grokService->ask('What is 2+2?');
        
        $this->assertIsString($answer);
        $this->assertNotEmpty($answer);
    }
}
```

---

## 3. INTEGRATION TESTS FOR CONTROLLERS

### 3.1 PaymentController API Testing

**Test File:** `tests/Feature/PaymentControllerTest.php`

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Ride;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PaymentControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    // Test 1: Initiate Payment Endpoint
    public function test_initiate_payment_endpoint()
    {
        $ride = Ride::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/payments/initiate', [
                'payable_type' => 'ride',
                'payable_id' => $ride->id,
                'phone' => '254712345678',
                'amount' => 500,
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'id',
            'user_id',
            'status',
            'amount',
            'meta',
        ]);
        $this->assertDatabaseHas('payments', [
            'user_id' => $this->user->id,
            'payable_id' => $ride->id,
        ]);
    }

    // Test 2: List Payments Endpoint
    public function test_list_payments_endpoint()
    {
        Ride::factory(3)->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/payments');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'status', 'amount'],
            ],
        ]);
    }

    // Test 3: Get Payment Status Endpoint
    public function test_get_payment_status_endpoint()
    {
        $payment = Payment::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/payments/{$payment->id}/status");

        $response->assertStatus(200);
        $response->assertJsonStructure(['status']);
    }

    // Test 4: M-Pesa Callback Endpoint
    public function test_mpesa_callback_endpoint()
    {
        $payment = Payment::factory()->create([
            'status' => 'processing',
            'meta' => ['stk_request_id' => 'checkout-123'],
        ]);

        $callbackData = [
            'Body' => [
                'stkCallback' => [
                    'CheckoutRequestID' => 'checkout-123',
                    'ResultCode' => 0,
                    'ResultDesc' => 'Success',
                    'CallbackMetadata' => [
                        'Item' => [
                            ['Name' => 'Amount', 'Value' => 500],
                            ['Name' => 'MpesaReceiptNumber', 'Value' => 'LIJ7791974'],
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/payments/mpesa/callback', $callbackData);

        $response->assertStatus(200);
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'completed',
        ]);
    }
}
```

### 3.2 NotificationController API Testing

**Test File:** `tests/Feature/NotificationControllerTest.php`

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;

class NotificationControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    // Test 1: List Notifications
    public function test_list_notifications_endpoint()
    {
        Notification::factory(5)->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/notifications');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                '*' => ['id', 'type', 'title', 'message', 'is_read'],
            ],
            'meta' => ['total', 'unread_count'],
        ]);
    }

    // Test 2: Get Notification Count
    public function test_notification_count_endpoint()
    {
        Notification::factory(3)->create(['user_id' => $this->user->id, 'is_read' => false]);
        Notification::factory(2)->create(['user_id' => $this->user->id, 'is_read' => true]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/notifications/count');

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'total' => 5,
                'unread' => 3,
            ],
        ]);
    }

    // Test 3: Mark Notification as Read
    public function test_mark_notification_as_read()
    {
        $notification = Notification::factory()->create([
            'user_id' => $this->user->id,
            'is_read' => false,
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(200);
        $this->assertDatabaseHas('notifications', [
            'id' => $notification->id,
            'is_read' => true,
        ]);
    }

    // Test 4: Mark All Notifications as Read
    public function test_mark_all_notifications_as_read()
    {
        Notification::factory(3)->create(['user_id' => $this->user->id, 'is_read' => false]);

        $response = $this->actingAs($this->user)
            ->putJson('/api/notifications/read-all');

        $response->assertStatus(200);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->user->id,
            'is_read' => true,
        ]);
    }

    // Test 5: Delete Notification
    public function test_delete_notification()
    {
        $notification = Notification::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/notifications/{$notification->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('notifications', ['id' => $notification->id]);
    }

    // Test 6: Test Notification Endpoint
    public function test_send_test_notification()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/notifications/test', [
                'type' => 'test',
            ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->user->id,
            'type' => 'test',
        ]);
    }
}
```

### 3.3 GrokController API Testing

**Test File:** `tests/Feature/GrokControllerTest.php`

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class GrokControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        if (!config('services.grok.api_key')) {
            $this->markTestSkipped('Grok API key not configured');
        }
        $this->user = User::factory()->create();
    }

    // Test 1: Health Check
    public function test_grok_health_endpoint()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/grok/health');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => ['service', 'available', 'timestamp'],
        ]);
    }

    // Test 2: Ask Question
    public function test_grok_ask_endpoint()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/grok/ask', [
                'question' => 'What is the capital of Kenya?',
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => ['answer', 'question', 'asked_at'],
        ]);
    }

    // Test 3: Chat Endpoint
    public function test_grok_chat_endpoint()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/grok/chat', [
                'prompt' => 'Hello, how are you?',
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['success', 'data']);
    }
}
```

---

## 4. AUTOMATED TEST SUITE RUNNER

**Test File:** `tests/TestSuite.php`

```bash
# Run all tests
php artisan test

# Run specific test class
php artisan test tests/Unit/PaymentServiceTest.php

# Run specific test method
php artisan test tests/Unit/PaymentServiceTest.php --filter test_phone_number_formatting_from_local_format

# Run with coverage
php artisan test --coverage

# Run in parallel
php artisan test --parallel
```

---

## 5. MANUAL API TESTING (Using Bruno/Postman)

### 5.1 Payment Flow Testing

**Step 1: Initialize Payment**
```json
POST /api/payments/initiate
Authorization: Bearer {token}

{
  "payable_type": "ride",
  "payable_id": 1,
  "phone": "0712345678",
  "amount": 500
}

Expected Response:
{
  "id": 1,
  "status": "processing",
  "user_id": 1,
  "amount": 500,
  "meta": {
    "phone": "254712345678",
    "stk_request_id": "checkout-123",
    "response_code": "0"
  }
}
```

**Step 2: User Enters PIN on M-Pesa**
(Simulated by receiving callback)

**Step 3: M-Pesa Sends Callback**
```json
POST /api/payments/mpesa/callback

{
  "Body": {
    "stkCallback": {
      "CheckoutRequestID": "checkout-123",
      "ResultCode": 0,
      "ResultDesc": "The service request has been processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {"Name": "Amount", "Value": 500},
          {"Name": "MpesaReceiptNumber", "Value": "LIJ7791974"},
          {"Name": "TransactionDate", "Value": 20260408120000},
          {"Name": "PhoneNumber", "Value": "254712345678"}
        ]
      }
    }
  }
}

Expected Response:
{
  "status": "ok",
  "payment_id": 1
}

Database should show:
- Payment status: "completed"
- mpesa_transaction_id: "LIJ7791974"
```

**Step 4: Check Payment Status**
```json
GET /api/payments/1/status
Authorization: Bearer {token}

Expected Response:
{
  "status": "completed"
}
```

### 5.2 Notification Flow Testing

**Send Test Notification**
```json
POST /api/notifications/test
Authorization: Bearer {token}

{
  "type": "test"
}

Expected Response:
{
  "success": true,
  "message": "Test notification sent"
}

Notifications should be visible via:
- GET /api/notifications (real-time)
- Check database: notifications table
```

**Check Notifications**
```json
GET /api/notifications
Authorization: Bearer {token}

Expected Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "test",
      "title": "Test Notification",
      "message": "This is a test notification...",
      "is_read": false,
      "created_at": "2026-04-08T10:30:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "unread_count": 1
  }
}
```

**Mark Notifications as Read**
```json
PUT /api/notifications/1/read
Authorization: Bearer {token}

Expected Response:
{
  "success": true,
  "message": "Notification marked as read"
}

Database should show:
- is_read: true
- read_at: timestamp
```

### 5.3 Grok AI Testing

**Health Check**
```json
GET /api/grok/health
Authorization: Bearer {token}

Expected Response:
{
  "success": true,
  "data": {
    "service": "Grok AI",
    "available": true,
    "timestamp": "2026-04-08T10:30:00Z"
  }
}
```

**Ask Question**
```json
POST /api/grok/ask
Authorization: Bearer {token}

{
  "question": "What is the capital of Kenya?"
}

Expected Response:
{
  "success": true,
  "data": {
    "answer": "Nairobi is the capital of Kenya...",
    "question": "What is the capital of Kenya?",
    "asked_at": "2026-04-08T10:30:00Z"
  }
}
```

**Analyze Ride Data**
```json
POST /api/grok/analyze-ride
Authorization: Bearer {token}

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

Expected Response:
{
  "success": true,
  "data": {
    "analysis": "Based on the ride data...",
    "ride_data": {...},
    "timestamp": "2026-04-08T10:30:00Z"
  }
}
```

---

## 6. DATABASE TESTING

### 6.1 Model Factory Testing

**Test File:** `tests/Unit/ModelFactoriesTest.php`

```php
<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Payment;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ModelFactoriesTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_factory_creates_valid_payment()
    {
        $payment = Payment::factory()->create();

        $this->assertNotNull($payment->id);
        $this->assertNotNull($payment->user_id);
        $this->assertTrue(in_array($payment->status, ['pending', 'processing', 'completed', 'failed', 'cancelled']));
        $this->assertTrue($payment->amount > 0);
    }

    public function test_notification_factory_creates_valid_notification()
    {
        $notification = Notification::factory()->create();

        $this->assertNotNull($notification->id);
        $this->assertNotNull($notification->user_id);
        $this->assertNotNull($notification->type);
        $this->assertNotNull($notification->title);
        $this->assertFalse($notification->is_read);
    }
}
```

---

## 7. REAL-TIME TESTING (Pusher Notifications)

### 7.1 Pusher Channel Testing

**Test File:** `tests/Feature/BroadcastingTest.php`

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;

class BroadcastingTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_broadcast_channel_auth()
    {
        $user = User::factory()->create();
        
        $response = $this->postJson('/broadcasting/auth', [
            'channel_name' => "user.{$user->id}",
        ], ['HTTP_X_SOCKET_ID' => 'socket-id']);

        // Authentication should pass for user's own channel
        $response->assertSuccessful();
    }

    public function test_notification_cannot_access_other_user_channel()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $this->actingAs($user1);
        
        $response = $this->postJson('/broadcasting/auth', [
            'channel_name' => "user.{$user2->id}",
        ], ['HTTP_X_SOCKET_ID' => 'socket-id']);

        // Should fail for different user's channel
        $response->assertStatus(403);
    }
}
```

---

## 8. INTEGRATION TEST CHECKLIST

### Payment Feature
- [ ] Phone number formatting (0712... → 254712...)
- [ ] Phone number formatting (254712... → 254712...)
- [ ] STK push initiation with ResponseCode 0
- [ ] STK push failure handling
- [ ] M-Pesa callback success (ResultCode 0)
- [ ] M-Pesa callback user cancelled (ResultCode 1032)
- [ ] M-Pesa callback insufficient funds (ResultCode 1)
- [ ] M-Pesa callback wrong PIN (ResultCode 2001)
- [ ] Idempotent callback processing
- [ ] Payment status query
- [ ] Payment notifications (SMS, email, real-time)
- [ ] Related model updates (Ride payment_status)

### Notification Feature
- [ ] Real-time notification creation (Pusher)
- [ ] Email notification sending
- [ ] SMS notification formatting & sending
- [ ] Multi-channel notifications
- [ ] Notification marking as read
- [ ] Get user notifications (paginated)
- [ ] Ride notifications (all types)
- [ ] Payment notifications (all types)
- [ ] Application notifications (all types)
- [ ] Unread count tracking
- [ ] Notification deletion

### Grok AI Feature
- [ ] Service health check
- [ ] Ask question endpoint
- [ ] Chat endpoint
- [ ] Analyze ride data
- [ ] Suggest pricing
- [ ] Generate support response
- [ ] Analyze driver performance
- [ ] Predict demand
- [ ] Response caching (Redis)
- [ ] Error handling & retries

### Authentication & Authorization
- [ ] User can only see own payments
- [ ] User can only see own notifications
- [ ] Admin can view all payments
- [ ] Admin can view all notifications
- [ ] Unauthorized access returns 401/403

---

## 9. PERFORMANCE TESTING

### Load Testing
```bash
# Install Apache Bench
ab -n 1000 -c 10 http://localhost:8000/api/payments

# Or using hey
go install github.com/rakyll/hey@latest
hey -n 1000 -c 10 http://localhost:8000/api/payments
```

### Expected Results
- Response time: < 200ms
- Error rate: 0%
- Throughput: > 100 requests/sec

---

## 10. TEST EXECUTION COMMANDS

```bash
# Full test suite
php artisan test

# Unit tests only
php artisan test tests/Unit

# Feature tests only
php artisan test tests/Feature

# Payment tests
php artisan test tests/Unit/PaymentServiceTest.php tests/Feature/PaymentControllerTest.php

# Notification tests
php artisan test tests/Unit/NotificationServiceTest.php tests/Feature/NotificationControllerTest.php

# With coverage report
php artisan test --coverage --min=80

# Parallel execution
php artisan test --parallel --parallel-processes=4

# Stop on first failure
php artisan test --stop-on-failure

# Verbose output
php artisan test --verbose
```

---

## 11. NGrok PUBLIC ACCESS TESTING

### Test Public URLs
```bash
# Get ngrok tunnels
docker-compose logs -f ngrok

# Expected output:
# Tunnels:
# urbanlink-app:  https://xxxx-xxx-xxx-xxx.ngrok.io -> http://app:80
# urbanlink-grok: https://yyyy-yyy-yyy-yyy.ngrok.io -> http://grok:5000

# Test M-Pesa callback from external
curl -X POST https://xxxx-xxx-xxx-xxx.ngrok.io/api/payments/mpesa/callback \
  -H "Content-Type: application/json" \
  -d '{"Body":{"stkCallback":{...}}}'

# Test notifications endpoint publicly
curl https://xxxx-xxx-xxx-xxx.ngrok.io/api/notifications \
  -H "Authorization: Bearer {token}"
```

---

## 12. DEPLOYMENT CHECKLIST

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] No console errors or warnings
- [ ] All API endpoints responding correctly
- [ ] M-Pesa callback validation working
- [ ] Notifications sending successfully
- [ ] Grok AI service accessible
- [ ] ngrok tunnels active
- [ ] Redis cache working
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Error logging working
- [ ] Rate limiting active
- [ ] CORS properly configured

