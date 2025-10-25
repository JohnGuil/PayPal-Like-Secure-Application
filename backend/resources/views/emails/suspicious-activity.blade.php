<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Suspicious Activity Detected</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        h1 {
            color: #ff9800;
            margin: 0;
            font-size: 24px;
        }
        .warning-box {
            background-color: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .activity-list {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .activity-item {
            padding: 10px;
            margin: 10px 0;
            background-color: white;
            border-radius: 4px;
            border-left: 3px solid #ff9800;
        }
        .activity-type {
            font-weight: bold;
            color: #ff9800;
            margin-bottom: 5px;
        }
        .details {
            margin: 20px 0;
        }
        .detail-item {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-item:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: bold;
            color: #666;
        }
        .action-box {
            background-color: #e8f5e9;
            border-left: 4px solid #4caf50;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .action-box h3 {
            margin-top: 0;
            color: #2e7d32;
            font-size: 16px;
        }
        .action-box ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .action-box li {
            margin: 5px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">⚠️</div>
            <h1>Suspicious Activity Detected</h1>
        </div>

        <p>Hello {{ $userName }},</p>

        <div class="warning-box">
            <strong>We detected unusual activity on your account.</strong>
        </div>

        <p>A login to your account was detected that appears unusual based on your typical patterns. This could be you logging in from a new location or device, or it could be someone attempting unauthorized access.</p>

        <div class="details">
            <div class="detail-item">
                <span class="detail-label">Login Time:</span>
                {{ $loginTime }}
            </div>
            <div class="detail-item">
                <span class="detail-label">IP Address:</span>
                {{ $ipAddress }}
            </div>
        </div>

        <div class="activity-list">
            <h3 style="margin-top: 0;">Suspicious Indicators:</h3>
            @foreach($suspicious as $item)
                <div class="activity-item">
                    <div class="activity-type">{{ $item['message'] }}</div>
                    @if(isset($item['ip']))
                        <div style="color: #666; font-size: 14px;">IP: {{ $item['ip'] }}</div>
                    @endif
                    @if(isset($item['count']))
                        <div style="color: #666; font-size: 14px;">Attempts: {{ $item['count'] }}</div>
                    @endif
                </div>
            @endforeach
        </div>

        <p><strong>Was this you?</strong></p>
        <p>If you recognize this activity, you can safely ignore this email. No further action is needed.</p>

        <p><strong>Wasn't you?</strong></p>
        <div class="action-box">
            <h3>Take Action Immediately:</h3>
            <ul>
                <li><strong>Change your password</strong> right away</li>
                <li><strong>Enable two-factor authentication</strong> for extra security</li>
                <li><strong>Review recent account activity</strong> for any unauthorized transactions</li>
                <li><strong>Check connected devices</strong> and revoke access to unknown ones</li>
                <li><strong>Contact support</strong> if you notice any suspicious transactions</li>
            </ul>
        </div>

        <p style="background-color: #fff3e0; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong>🔐 Security Reminder:</strong> We will never ask for your password via email. If you receive any suspicious emails claiming to be from us, do not click any links or provide your information.
        </p>

        <div class="footer">
            <p>This is an automated security notification from PayPal-Like Secure Application.</p>
            <p>© {{ date('Y') }} PayPal-Like Secure Application. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
