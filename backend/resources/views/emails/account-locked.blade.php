<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Locked</title>
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
            color: #d32f2f;
            margin: 0;
            font-size: 24px;
        }
        .alert-box {
            background-color: #ffebee;
            border-left: 4px solid #d32f2f;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
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
        .tips {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .tips h3 {
            margin-top: 0;
            color: #333;
            font-size: 16px;
        }
        .tips ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .tips li {
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
            <div class="icon">🔒</div>
            <h1>Account Temporarily Locked</h1>
        </div>

        <p>Hello {{ $userName }},</p>

        <div class="alert-box">
            <strong>Your account has been temporarily locked due to multiple failed login attempts.</strong>
        </div>

        <p>For your security, we've temporarily locked your account to prevent unauthorized access.</p>

        <div class="details">
            <div class="detail-item">
                <span class="detail-label">Lock Duration:</span>
                {{ $lockoutDuration }} minutes
            </div>
            <div class="detail-item">
                <span class="detail-label">Unlock Time:</span>
                {{ $unlockTime }}
            </div>
        </div>

        <div class="info-box">
            <p style="margin: 0;"><strong>What happens next?</strong></p>
            <p style="margin: 10px 0 0 0;">Your account will automatically unlock after {{ $lockoutDuration }} minutes. You can then try logging in again with the correct credentials.</p>
        </div>

        <div class="tips">
            <h3>Security Tips:</h3>
            <ul>
                <li>Make sure you're using the correct email and password</li>
                <li>Check if Caps Lock is enabled</li>
                <li>If you've forgotten your password, use the "Forgot Password" link</li>
                <li>Enable two-factor authentication for extra security</li>
            </ul>
        </div>

        <p><strong>Didn't try to log in?</strong></p>
        <p>If you didn't attempt to access your account, someone may be trying to gain unauthorized access. Please:</p>
        <ul>
            <li>Change your password immediately after the lockout period</li>
            <li>Review your recent account activity</li>
            <li>Enable two-factor authentication</li>
            <li>Contact our support team if you need assistance</li>
        </ul>

        <div class="footer">
            <p>This is an automated security notification from PayPal-Like Secure Application.</p>
            <p>© {{ date('Y') }} PayPal-Like Secure Application. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
