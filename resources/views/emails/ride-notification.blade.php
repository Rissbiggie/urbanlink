<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ride Update - UrbanLink</title>
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
        .status-requested { background-color: #fef3c7; color: #92400e; }
        .status-accepted { background-color: #dbeafe; color: #1e40af; }
        .status-in-progress { background-color: #fef3c7; color: #92400e; }
        .status-completed { background-color: #d1fae5; color: #065f46; }
        .status-cancelled { background-color: #fee2e2; color: #991b1b; }
        .ride-details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
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
            <h1 class="title">Ride Update</h1>
            @if(isset($ride->status))
                <span class="status-badge status-{{ strtolower($ride->status) }}">
                    {{ ucfirst(str_replace('_', ' ', $ride->status)) }}
                </span>
            @endif
        </div>

        <div class="message">
            <p>Hello {{ $user->name }},</p>

            <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 6px;">
                {{ $message }}
            </div>

            @if(isset($ride))
            <div class="ride-details">
                <h3 style="margin-top: 0; color: #1f2937;">Ride Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Ride ID:</span>
                    <span class="detail-value">#{{ $ride->id }}</span>
                </div>
                @if($ride->pickup_location)
                <div class="detail-row">
                    <span class="detail-label">Pickup:</span>
                    <span class="detail-value">{{ $ride->pickup_location }}</span>
                </div>
                @endif
                @if($ride->dropoff_location)
                <div class="detail-row">
                    <span class="detail-label">Drop-off:</span>
                    <span class="detail-value">{{ $ride->dropoff_location }}</span>
                </div>
                @endif
                @if($ride->scheduled_time)
                <div class="detail-row">
                    <span class="detail-label">Scheduled Time:</span>
                    <span class="detail-value">{{ $ride->scheduled_time->format('M j, Y g:i A') }}</span>
                </div>
                @endif
                @if($ride->driver)
                <div class="detail-row">
                    <span class="detail-label">Driver:</span>
                    <span class="detail-value">{{ $ride->driver->user->name }}</span>
                </div>
                @endif
                @if($ride->vehicle)
                <div class="detail-row">
                    <span class="detail-label">Vehicle:</span>
                    <span class="detail-value">{{ $ride->vehicle->make }} {{ $ride->vehicle->model }} ({{ $ride->vehicle->license_plate }})</span>
                </div>
                @endif
                @if($ride->estimated_fare)
                <div class="detail-row">
                    <span class="detail-label">Estimated Fare:</span>
                    <span class="detail-value">${{ number_format($ride->estimated_fare, 2) }}</span>
                </div>
                @endif
            </div>
            @endif

            <p>
                You can track your ride and view more details by logging into your UrbanLink account.
            </p>
        </div>

        <div style="text-align: center;">
            <a href="{{ config('app.url') }}/dashboard/rides" class="button">
                View My Rides
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