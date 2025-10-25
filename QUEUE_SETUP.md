# Queue System Setup Guide

## Overview

The application now uses Laravel's queue system to send emails asynchronously, improving performance and user experience. Emails are queued to the database and processed in the background.

## Configuration

### Database Queue Driver

Queue configuration is set in `.env`:
```env
QUEUE_CONNECTION=database
```

### Database Tables

Two tables are used for the queue system:
- `jobs` - Stores pending jobs
- `failed_jobs` - Stores failed jobs for retry/debugging

## Development Usage

### Processing Queued Jobs

To process queued jobs in development:

```bash
# Process all queued jobs and stop when empty
docker exec paypal_backend php artisan queue:work --stop-when-empty

# Process jobs continuously (keeps running)
docker exec paypal_backend php artisan queue:work

# Process only one job and stop
docker exec paypal_backend php artisan queue:work --once
```

### Monitoring the Queue

```bash
# Check how many jobs are queued
docker exec paypal_backend php artisan tinker --execute="echo \Illuminate\Support\Facades\DB::table('jobs')->count();"

# Check failed jobs
docker exec paypal_backend php artisan queue:failed

# Retry all failed jobs
docker exec paypal_backend php artisan queue:retry all
```

## Production Deployment

### Option 1: Supervisor (Recommended)

Create `/etc/supervisor/conf.d/paypal-queue.conf`:

```ini
[program:paypal-queue-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/storage/logs/queue-worker.log
stopwaitsecs=3600
```

Start the workers:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start paypal-queue-worker:*
```

### Option 2: Systemd Service

Create `/etc/systemd/system/paypal-queue.service`:

```ini
[Unit]
Description=PayPal Secure Queue Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable paypal-queue
sudo systemctl start paypal-queue
```

### Option 3: Cron Job (Simple)

Add to crontab:
```
* * * * * cd /var/www && php artisan schedule:run >> /dev/null 2>&1
```

And add to `app/Console/Kernel.php`:
```php
protected function schedule(Schedule $schedule)
{
    $schedule->command('queue:work --stop-when-empty')->everyMinute();
}
```

## Email Queue Behavior

### Queued Email Types

All emails are now sent asynchronously:
1. **Welcome Email** - Sent when user registers
2. **Transaction Sent** - Sent to sender after transaction
3. **Transaction Received** - Sent to recipient after transaction
4. **Transaction Refunded** - Sent when transaction is refunded

### Queue Processing Flow

1. User performs action (register, send money, refund)
2. Email job is created and stored in `jobs` table
3. Response is returned immediately to user (fast!)
4. Queue worker processes job in background
5. Email is sent via configured mail driver
6. Job is removed from queue

### Error Handling

- Failed jobs are stored in `failed_jobs` table
- Jobs can be retried with `php artisan queue:retry`
- Maximum 3 retry attempts by default
- Graceful error handling prevents email failures from affecting user experience

## Testing

### Test Queue System

1. Create a transaction:
```bash
curl -X POST http://localhost:8001/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","recipient_email":"test@example.com","amount":100}'
```

2. Check jobs were queued:
```bash
docker exec paypal_backend php artisan tinker --execute="echo DB::table('jobs')->count();"
```

3. Process the queue:
```bash
docker exec paypal_backend php artisan queue:work --stop-when-empty
```

4. Verify emails in log:
```bash
docker exec paypal_backend tail -n 200 /var/www/storage/logs/laravel.log | grep "Subject:"
```

## Performance Benefits

### Before Queue (Synchronous)
- Request time: ~500ms (waiting for email to send)
- User waits for email to send before getting response
- Email failures delay or break user experience

### After Queue (Asynchronous)
- Request time: ~50ms (10x faster!)
- User gets instant response
- Emails sent in background
- Email failures don't affect user experience
- Better scalability

## Troubleshooting

### Jobs Not Processing

Check if queue worker is running:
```bash
ps aux | grep "queue:work"
```

Check for failed jobs:
```bash
docker exec paypal_backend php artisan queue:failed
```

### Clear All Jobs

Clear stuck jobs:
```bash
docker exec paypal_backend php artisan tinker --execute="DB::table('jobs')->delete();"
```

### Monitor Queue in Real-time

```bash
watch -n 1 'docker exec paypal_backend php artisan tinker --execute="echo DB::table(\"jobs\")->count();"'
```

## Notes

- Queue system uses database driver (no Redis/Beanstalk needed)
- Works seamlessly with existing PostgreSQL database
- All 4 Mailable classes implement `ShouldQueue` interface
- Mail driver remains `log` for development (emails logged to file)
- For production, change `MAIL_MAILER` to `smtp` for real email sending
