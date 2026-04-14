<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
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
        .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        .highlight {
            background-color: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 6px;
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
            <h1 class="title">{{ $title }}</h1>
        </div>

        <div class="message">
            <p>Hello {{ $user->name }},</p>

            <div class="highlight">
                {{ $message }}
            </div>

            @if(isset($data) && is_array($data))
                <p><strong>Details:</strong></p>
                <ul>
                    @foreach($data as $key => $value)
                        @if(is_string($value) || is_numeric($value))
                            <li><strong>{{ ucfirst(str_replace('_', ' ', $key)) }}:</strong> {{ $value }}</li>
                        @endif
                    @endforeach
                </ul>
            @endif

            <p>
                You can view more details by logging into your UrbanLink account.
            </p>
        </div>

        <div style="text-align: center;">
            <a href="{{ config('app.url') }}/dashboard" class="button">
                View Dashboard
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