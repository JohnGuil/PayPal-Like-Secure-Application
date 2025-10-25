<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your 2FA Code</title>
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
            background: linear-gradient(135deg, #17a2b8 0%, #117a8b 100%);
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
        .code-box {
            background: linear-gradient(135deg, #17a2b8 0%, #117a8b 100%);
            padding: 40px;
            margin: 32px 0;
            text-align: center;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
        }
        .code-box .code {
            font-size: 48px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 12px;
            font-family: 'Courier New', monospace;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .code-box p {
            margin: 16px 0 0;
            font-size: 14px;
            color: rgba(255,255,255,0.9);
        }
        .expiry-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .expiry-notice strong {
            color: #856404;
            font-size: 16px;
        }
        .security-note {
            background-color: #e7f3ff;
            padding: 20px;
            border-radius: 8px;
            margin: 24px 0;
        }
        .security-note h3 {
            margin: 0 0 12px 0;
            color: #0070ba;
            font-size: 16px;
        }
        .security-note ul {
            margin: 0;
            padding-left: 20px;
        }
        .security-note li {
            margin: 8px 0;
            font-size: 14px;
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
            .code-box .code {
                font-size: 36px;
                letter-spacing: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🔐 Two-Factor Authentication</h1>
            <p>Your verification code</p>
        </div>
        
        <div class="content">
            <p>Hi <strong>{{ $user->full_name }}</strong>,</p>
            
            <p>Here is your two-factor authentication code to complete your login:</p>
            
            <div class="code-box">
                <div class="code">{{ $code }}</div>
                <p>Enter this code in the verification screen</p>
            </div>
            
            <div class="expiry-notice">
                <strong>⏰ This code expires in 10 minutes</strong>
                <p style="margin: 4px 0 0;">For your security, this code will become invalid after 10 minutes or once used.</p>
            </div>
            
            <p style="margin-top: 24px;"><strong>How to use this code:</strong></p>
            <ol style="margin: 12px 0; padding-left: 20px;">
                <li>Return to the login page</li>
                <li>Enter this 6-digit code when prompted</li>
                <li>Click "Verify" to complete your login</li>
            </ol>
            
            <div class="security-note">
                <h3>🛡️ Security Information</h3>
                <ul>
                    <li><strong>Never share this code</strong> with anyone, including PayPal Secure staff</li>
                    <li>If you didn't request this code, change your password immediately</li>
                    <li>Enable app-based 2FA (Google Authenticator, Authy) for better security</li>
                    <li>Make sure you recognize the login attempt location and device</li>
                </ul>
            </div>
            
            <p style="margin-top: 32px; padding: 16px; background-color: #fff3cd; border-radius: 4px; font-size: 14px;">
                <strong>⚠️ Didn't try to log in?</strong><br>
                If you didn't request this code, someone may be trying to access your account. Please secure your account immediately by changing your password and reviewing recent activity.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>PayPal Secure</strong></p>
            <p>This is an automated security message. Please do not reply to this email.</p>
            <p>
                <a href="{{ config('app.frontend_url') }}">Visit Dashboard</a> •
                <a href="{{ config('app.frontend_url') }}/help">Help Center</a> •
                <a href="{{ config('app.frontend_url') }}/security">Security Settings</a>
            </p>
            <p style="margin-top: 16px;">© {{ date('Y') }} PayPal Secure. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
