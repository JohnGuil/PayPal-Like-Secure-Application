<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PayPal Secure</title>
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
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: #ffffff;
            padding: 48px 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 12px 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px;
        }
        .welcome-box {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 8px;
            padding: 32px;
            text-align: center;
            margin: 24px 0;
        }
        .welcome-box h2 {
            margin: 0 0 16px 0;
            color: #0369a1;
            font-size: 24px;
        }
        .balance-display {
            font-size: 42px;
            font-weight: 700;
            color: #0c4a6e;
            margin: 16px 0;
        }
        .features {
            margin: 32px 0;
        }
        .feature {
            display: flex;
            align-items: flex-start;
            padding: 20px;
            margin: 12px 0;
            background-color: #f9fafb;
            border-radius: 8px;
        }
        .feature-icon {
            font-size: 32px;
            margin-right: 16px;
            flex-shrink: 0;
        }
        .feature-content h3 {
            margin: 0 0 8px 0;
            font-size: 16px;
            color: #2c2e2f;
        }
        .feature-content p {
            margin: 0;
            font-size: 14px;
            color: #6c7378;
        }
        .button {
            display: inline-block;
            padding: 16px 40px;
            background-color: #6366f1;
            color: #ffffff;
            text-decoration: none;
            border-radius: 24px;
            font-weight: 600;
            margin: 24px 0;
            text-align: center;
            font-size: 16px;
        }
        .button:hover {
            background-color: #4f46e5;
        }
        .security-note {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 32px 0;
            border-radius: 4px;
        }
        .security-note p {
            margin: 0;
            font-size: 14px;
            color: #92400e;
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
            color: #6366f1;
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 24px;
            }
            .header {
                padding: 32px 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🎉 Welcome to PayPal Secure!</h1>
            <p>Your account is ready to use</p>
        </div>
        
        <div class="content">
            <p>Hi <strong>{{ $user->full_name }}</strong>,</p>
            
            <p>Welcome to PayPal Secure! We're excited to have you on board. Your account has been successfully created and you're ready to start sending and receiving payments securely.</p>
            
            <div class="welcome-box">
                <h2>Your Starting Balance</h2>
                <div class="balance-display">{{ $balance }}</div>
                <p style="color: #6c7378; margin-top: 8px;">Start transacting right away!</p>
            </div>
            
            <h2 style="margin-top: 40px; color: #2c2e2f;">What you can do with PayPal Secure:</h2>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">💸</div>
                    <div class="feature-content">
                        <h3>Send Money Instantly</h3>
                        <p>Transfer funds to anyone with just their email address. Fast, easy, and secure.</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">💰</div>
                    <div class="feature-content">
                        <h3>Receive Payments</h3>
                        <p>Get paid instantly and the money goes directly to your account balance.</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">🔄</div>
                    <div class="feature-content">
                        <h3>Request Refunds</h3>
                        <p>Easy refund process if something goes wrong with a transaction.</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">🔐</div>
                    <div class="feature-content">
                        <h3>Two-Factor Authentication</h3>
                        <p>Add an extra layer of security to your account with 2FA protection.</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">📊</div>
                    <div class="feature-content">
                        <h3>Transaction History</h3>
                        <p>View all your transactions with detailed information and search capabilities.</p>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ config('app.frontend_url') }}/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <div class="security-note">
                <p><strong>🔒 Security Tip:</strong> Enable Two-Factor Authentication (2FA) in your account settings for enhanced security. Never share your password with anyone!</p>
            </div>
            
            <p style="margin-top: 32px; font-size: 14px; color: #6c7378;">
                If you have any questions or need help, our support team is here for you 24/7.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>PayPal Secure</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>
                <a href="{{ config('app.frontend_url') }}">Visit Dashboard</a> •
                <a href="{{ config('app.frontend_url') }}/help">Help Center</a> •
                <a href="{{ config('app.frontend_url') }}/privacy">Privacy Policy</a>
            </p>
            <p style="margin-top: 16px;">© {{ date('Y') }} PayPal Secure. All rights reserved.</p>
            <p style="margin-top: 8px; color: #9ca3af;">
                Account Email: {{ $user->email }}
            </p>
        </div>
    </div>
</body>
</html>
