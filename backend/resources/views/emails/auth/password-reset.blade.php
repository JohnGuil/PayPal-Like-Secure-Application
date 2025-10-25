<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
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
            background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);
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
        .button {
            display: inline-block;
            padding: 16px 48px;
            background-color: #6f42c1;
            color: #ffffff;
            text-decoration: none;
            border-radius: 24px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            text-align: center;
        }
        .token-box {
            background-color: #f5f7fa;
            border: 2px dashed #6f42c1;
            padding: 24px;
            margin: 24px 0;
            text-align: center;
            border-radius: 8px;
        }
        .token-box .token {
            font-size: 24px;
            font-weight: 700;
            color: #6f42c1;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
        }
        .token-box p {
            margin: 8px 0 0;
            font-size: 12px;
            color: #6c7378;
        }
        .warning-box {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .warning-box strong {
            color: #856404;
        }
        .expiry-notice {
            background-color: #e7f3ff;
            padding: 16px;
            border-radius: 8px;
            margin: 24px 0;
            text-align: center;
        }
        .expiry-notice strong {
            color: #0070ba;
            font-size: 16px;
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
            <h1>🔑 Password Reset</h1>
            <p>Reset your account password</p>
        </div>
        
        <div class="content">
            <p>Hi <strong>{{ $user->full_name }}</strong>,</p>
            
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
                <a href="{{ $resetUrl }}" class="button">Reset Password</a>
            </div>
            
            <div class="expiry-notice">
                <strong>⏰ This link expires in 60 minutes</strong>
                <p style="margin: 4px 0 0;">For security reasons, password reset links are only valid for 1 hour.</p>
            </div>
            
            <p style="margin-top: 24px;">Or copy and paste this link into your browser:</p>
            <p style="background-color: #f5f7fa; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 12px; color: #6c7378;">
                {{ $resetUrl }}
            </p>
            
            <div class="token-box">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #6c7378;">Reset Token:</p>
                <div class="token">{{ $resetToken }}</div>
                <p>Copy this token if you need to reset your password manually</p>
            </div>
            
            <div class="warning-box">
                <strong>⚠️ Didn't request this?</strong>
                <p style="margin: 8px 0 0;">If you didn't request a password reset, please ignore this email and consider changing your password as a precaution. Your account is still secure.</p>
            </div>
            
            <p style="margin-top: 32px; font-size: 14px; color: #6c7378;">
                <strong>Security Tip:</strong> Never share your password reset link with anyone. We will never ask for your password via email.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>PayPal Secure</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
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
