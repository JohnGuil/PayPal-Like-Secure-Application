<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Sent</title>
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
            background: linear-gradient(135deg, #0070ba 0%, #1546a0 100%);
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
        .amount-box {
            background-color: #f5f7fa;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
        }
        .amount {
            font-size: 36px;
            font-weight: 700;
            color: #0070ba;
            margin: 0;
        }
        .amount-label {
            font-size: 14px;
            color: #6c7378;
            margin-top: 4px;
        }
        .transaction-details {
            margin: 32px 0;
            border-top: 1px solid #e7eaf0;
            padding-top: 24px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #f5f7fa;
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
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            background-color: #28a745;
            color: #ffffff;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #0070ba;
            color: #ffffff;
            text-decoration: none;
            border-radius: 24px;
            font-weight: 600;
            margin: 24px 0;
            text-align: center;
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
            <h1>💸 Payment Sent Successfully</h1>
            <p>Your payment has been processed</p>
        </div>
        
        <div class="content">
            <p>Hi <strong>{{ $sender->full_name }}</strong>,</p>
            
            <p>You sent a payment. Here are the details:</p>
            
            <div class="amount-box">
                <div class="amount">-{{ $amount }}</div>
                <div class="amount-label">Amount Sent</div>
            </div>
            
            <div class="transaction-details">
                <div class="detail-row">
                    <span class="detail-label">To</span>
                    <span class="detail-value">{{ $recipient->full_name }} ({{ $recipient->email }})</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Transaction ID</span>
                    <span class="detail-value">#{{ $transaction->id }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type</span>
                    <span class="detail-value">{{ ucfirst($transaction->type) }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status</span>
                    <span class="detail-value">
                        <span class="status-badge">{{ ucfirst($transaction->status) }}</span>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">{{ $transaction->created_at->format('F j, Y \a\t g:i A') }}</span>
                </div>
                @if($transaction->description)
                <div class="detail-row">
                    <span class="detail-label">Note</span>
                    <span class="detail-value">{{ $transaction->description }}</span>
                </div>
                @endif
                <div class="detail-row" style="border-bottom: none; padding-top: 24px; margin-top: 16px; border-top: 2px solid #e7eaf0;">
                    <span class="detail-label" style="font-size: 16px; font-weight: 600;">New Balance</span>
                    <span class="detail-value" style="font-size: 18px; font-weight: 700; color: #0070ba;">{{ $newBalance }}</span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ config('app.frontend_url') }}/transactions" class="button">View Transaction History</a>
            </div>
            
            <p style="margin-top: 32px; font-size: 14px; color: #6c7378;">
                If you didn't make this payment, please contact us immediately.
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
        </div>
    </div>
</body>
</html>
