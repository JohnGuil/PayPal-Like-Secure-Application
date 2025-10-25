<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Alert</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #2c2e2f;
            background-color: #f5f7fa;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: #ffffff;
            padding: 32px 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 8px 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 40px;
        }
        .alert-box {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .alert-box strong {
            color: #856404;
            display: block;
            margin-bottom: 8px;
        }
        .details-box {
            background-color: #f5f7fa;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e7eaf0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #6c7378;
            font-size: 14px;
        }
        .detail-value {
            color: #2c2e2f;
            font-size: 14px;
            font-weight: 500;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #dc3545;
            color: #ffffff;
            text-decoration: none;
            border-radius: 24px;
            font-weight: 600;
            margin: 24px 0;
            text-align: center;
        }
        .button-secondary {
            background-color: #6c757d;
        }
        .security-tips {
            background-color: #e7f3ff;
            border-left: 4px solid #0070ba;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .security-tips h3 {
            margin: 0 0 12px 0;
            color: #0070ba;
            font-size: 16px;
        }
        .security-tips ul {
            margin: 0;
            padding-left: 20px;
        }
        .security-tips li {
            margin: 8px 0;
            font-size: 14px;
            color: #2c2e2f;
        }
        .footer {
            background-color: #f5f7fa;
            padding: 32px 40px;
            text-align: center;
            font-size: 12px;
            color: #6c7378;
        }
        .footer p {
            margin: 8px 0;
        }
        .footer a {
            color: #0070ba;
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 24px;
            }
            .header {
                padding: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🔒 Security Alert</h1>
            <p>Important security notification</p>
        </div>
        
        <div class="content">
            <p>Hi <strong>{{ $user->full_name }}</strong>,</p>
            
            <div class="alert-box">
                <strong>{{ $alertType }}</strong>
                {{ $alertMessage }}
            </div>
            
            @if(count($details) > 0)
            <div class="details-box">
                <h3 style="margin-top: 0; font-size: 16px; color: #2c2e2f;">Activity Details:</h3>
                @foreach($details as $label => $value)
                <div class="detail-row">
                    <span class="detail-label">{{ ucfirst(str_replace('_', ' ', $label)) }}</span>
                    <span class="detail-value">{{ $value }}</span>
                </div>
                @endforeach
            </div>
            @endif
            
            <p><strong>What should you do?</strong></p>
            <ul>
                <li>If this was you, no action is needed</li>
                <li>If this wasn't you, change your password immediately</li>
                <li>Review your recent account activity</li>
                <li>Contact support if you notice any suspicious activity</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="{{ config('app.frontend_url') }}/security" class="button">Review Security Settings</a>
            </div>
            
            <div class="security-tips">
                <h3>🛡️ Security Tips</h3>
                <ul>
                    <li>Never share your password or 2FA codes with anyone</li>
                    <li>Enable two-factor authentication for extra security</li>
                    <li>Use a strong, unique password</li>
                    <li>Be cautious of phishing emails and suspicious links</li>
                    <li>Keep your contact information up to date</li>
                </ul>
            </div>
            
            <p style="margin-top: 32px; font-size: 14px; color: #6c7378;">
                This is an automated security notification. If you have concerns, please contact our support team immediately.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>PayPal Secure</strong></p>
            <p>This is an automated security alert. Please do not reply to this email.</p>
            <p>
                <a href="{{ config('app.frontend_url') }}">Visit Dashboard</a> •
                <a href="{{ config('app.frontend_url') }}/help">Help Center</a> •
                <a href="{{ config('app.frontend_url') }}/security">Security Center</a>
            </p>
            <p style="margin-top: 16px;">© {{ date('Y') }} PayPal Secure. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
