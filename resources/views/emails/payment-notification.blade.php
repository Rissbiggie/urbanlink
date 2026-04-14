<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Update - UrbanLink</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background-color: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-processing { background-color: #fef3c7; color: #92400e; }
        .status-completed { background-color: #d1fae5; color: #065f46; }
        .status-failed { background-color: #fee2e2; color: #991b1b; }
        .status-refunded { background-color: #dbeafe; color: #1e40af; }
        .payment-details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .amount {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            text-align: center;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .detail-label {
            font-weight: 600;
            color: #374151;
        }
        .detail-value {
            color: #6b7280;
        }
        .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 UrbanLink</div>
            <h1 class="title">Payment Update</h1>
            @if(isset($payment->status))
                <span class="status-badge status-{{ strtolower($payment->status) }}">
                    {{ ucfirst(str_replace('_', ' ', $payment->status)) }}
                </span>
            @endif
        </div>

        <div class="message">
            <p>Hello {{ $user->name }},</p>

            <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 6px;">
                {{ $message }}
            </div>

            @if(isset($payment))
            <div class="payment-details">
                <h3 style="margin-top: 0; color: #1f2937;">Payment Details</h3>

                @if($payment->amount)
                <div class="amount">
                    ${{ number_format($payment->amount, 2) }}
                </div>
                @endif

                <div class="detail-row">
                    <span class="detail-label">Payment ID:</span>
                    <span class="detail-value">#{{ $payment->id }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Reference:</span>
                    <span class="detail-value">{{ $payment->reference ?? 'N/A' }}</span>
                </div>
                @if($payment->ride)
                <div class="detail-row">
                    <span class="detail-label">Ride ID:</span>
                    <span class="detail-value">#{{ $payment->ride->id }}</span>
                </div>
                @endif
                <div class="detail-row">
                    <span class="detail-label">Payment Method:</span>
                    <span class="detail-value">{{ $payment->payment_method ?? 'N/A' }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">{{ $payment->created_at->format('M j, Y g:i A') }}</span>
                </div>
                @if($payment->processed_at)
                <div class="detail-row">
                    <span class="detail-label">Processed:</span>
                    <span class="detail-value">{{ $payment->processed_at->format('M j, Y g:i A') }}</span>
                </div>
                @endif
            </div>
            @endif

            <p>
                You can view your payment history and receipts by logging into your UrbanLink account.
            </p>
        </div>

        <div style="text-align: center;">
            <a href="{{ config('app.url') }}/dashboard/payments" class="button">
                View Payments
            </a>
        </div>

        <div class="footer">
            <p>
                This is an automated notification from UrbanLink.<br>
                If you have any questions, please contact our support team.
            </p>
            <p>
                © {{ date('Y') }} UrbanLink. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>