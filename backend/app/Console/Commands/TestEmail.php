<?php

namespace App\Console\Commands;

use App\Mail\WelcomeEmail;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:test {email? : The email address to send to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test email to verify SMTP configuration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $toEmail = $this->argument('email');

        if (!$toEmail) {
            $toEmail = $this->ask('Enter the email address to send the test email to');
        }

        if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email address!');
            return 1;
        }

        $this->info('📧 Sending test email...');
        $this->info('To: ' . $toEmail);
        $this->info('From: ' . config('mail.from.address'));
        $this->newLine();

        try {
            // Get a sample user (or create a temporary one)
            $user = User::first();
            
            if (!$user) {
                $this->warn('No users found in database. Using test data.');
                $user = new User([
                    'full_name' => 'Test User',
                    'email' => $toEmail,
                    'balance' => 1000.00
                ]);
            }

            // Send test email
            Mail::to($toEmail)->send(new WelcomeEmail($user));

            $this->newLine();
            $this->info('✅ Test email sent successfully!');
            $this->info('📬 Check your inbox at: ' . $toEmail);
            $this->newLine();
            
            $this->comment('Mail Configuration:');
            $this->table(
                ['Setting', 'Value'],
                [
                    ['Mailer', config('mail.default')],
                    ['Host', config('mail.mailers.smtp.host')],
                    ['Port', config('mail.mailers.smtp.port')],
                    ['Encryption', config('mail.mailers.smtp.encryption')],
                    ['Username', config('mail.mailers.smtp.username')],
                    ['From Address', config('mail.from.address')],
                    ['From Name', config('mail.from.name')],
                ]
            );

            return 0;

        } catch (\Exception $e) {
            $this->newLine();
            $this->error('❌ Failed to send email!');
            $this->error('Error: ' . $e->getMessage());
            $this->newLine();
            
            $this->warn('Common issues:');
            $this->line('  1. Check your .env file has correct Gmail credentials');
            $this->line('  2. Make sure you\'re using an App Password (not regular password)');
            $this->line('  3. Verify 2-Step Verification is enabled on your Gmail account');
            $this->line('  4. Run: php artisan config:clear');
            $this->line('  5. Check storage/logs/laravel.log for detailed errors');
            
            return 1;
        }
    }
}
