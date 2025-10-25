<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaction Refunded</title>
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
            background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
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
            background-color: #fff8e1;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
            border: 2px solid #ffc107;
        }
        .amount {
            font-size: 36px;
            font-weight: 700;
            color: #f57c00;
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
            background-color: #ffc107;
            color: #2c2e2f;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #ff9800;
            color: #ffffff;
            text-decoration: none;
            border-radius: 24px;
            font-weight: 600;
            margin: 24px 0;
            text-align: center;
        }
        .info-box {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .info-box p {
            margin: 0;
            font-size: 14px;
            color: #1976d2;
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
            <h1>🔄 Transaction Refunded</h1>
            <p>Your payment has been refunded</p>
        </div>
        
        <div class="content">
            <p>Hi <strong>{{ $originalTransaction->sender->full_name }}</strong>,</p>
            
            <p>A transaction has been refunded to your account. The money has been returned to your balance.</p>
            
            <div class="amount-box">
                <div class="amount">+{{ $amount }}</div>
                <div class="amount-label">Refund Amount</div>
            </div>

            <div class="info-box">
                <p><strong>Refund Reason:</strong> {{ $reason }}</p>
            </div>
            
            <div class="transaction-details">
                <h3 style="margin-top: 0; color: #2c2e2f;">Original Transaction</h3>
                <div class="detail-row">
                    <span class="detail-label">To</span>
                    <span class="detail-value">{{ $originalTransaction->recipient->full_name }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Original Transaction ID</span>
                    <span class="detail-value">#{{ $originalTransaction->id }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Original Date</span>
                    <span class="detail-value">{{ $originalTransaction->created_at->format('F j, Y \a\t g:i A') }}</span>
                </div>
                @if($originalTransaction->description)
                <div class="detail-row">
                    <span class="detail-label">Original Note</span>
                    <span class="detail-value">{{ $originalTransaction->description }}</span>
                </div>
                @endif
            </div>

            <div class="transaction-details" style="border-top: 2px solid #e7eaf0;">
                <h3 style="margin-top: 0; color: #2c2e2f;">Refund Transaction</h3>
                <div class="detail-row">
                    <span class="detail-label">Refund Transaction ID</span>
                    <span class="detail-value">#{{ $refundTransaction->id }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Refund Date</span>
                    <span class="detail-value">{{ $refundTransaction->created_at->format('F j, Y \a\t g:i A') }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status</span>
                    <span class="detail-value">
                        <span class="status-badge">Refunded</span>
                    </span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ config('app.frontend_url') }}/transactions" class="button">View Transaction History</a>
            </div>
            
            <p style="margin-top: 32px; font-size: 14px; color: #6c7378;">
                The refunded amount has been added back to your PayPal Secure balance.
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
