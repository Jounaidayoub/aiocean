<?php

declare(strict_types=1);

namespace App\Shared;



use Resend;

final class EmailService
{
    private readonly \Resend\Client $client;
    private readonly string $from;

    public function __construct(string $apiKey, string $from)
    {
        $this->client = Resend::client($apiKey);
        $this->from   = $from;
    }

    public function sendWelcome(string $toEmail, string $toName): void
    {
        $this->send(
            to:      $toEmail,
            subject: 'Welcome to AI Ocean',
            html:    $this->welcomeHtml($toName),
        );
    }

    public function sendPasswordReset(string $toEmail, string $toName, string $resetUrl): void
    {
        $this->send(
            to:      $toEmail,
            subject: 'Reset your AI Ocean password',
            html:    $this->passwordResetHtml($toName, $resetUrl),
        );
    }

    public function sendSubmissionReceived(string $toEmail, string $toName, string $toolName): void
    {
        $this->send(
            to:      $toEmail,
            subject: "We received your submission: {$toolName}",
            html:    $this->submissionReceivedHtml($toName, $toolName),
        );
    }

    public function sendSubmissionApproved(string $toEmail, string $toName, string $toolName): void
    {
        $this->send(
            to:      $toEmail,
            subject: "Your tool is live: {$toolName}",
            html:    $this->submissionApprovedHtml($toName, $toolName),
        );
    }

    public function sendSubmissionRejected(string $toEmail, string $toName, string $toolName, string $reason): void
    {
        $this->send(
            to:      $toEmail,
            subject: "Update on your submission: {$toolName}",
            html:    $this->submissionRejectedHtml($toName, $toolName, $reason),
        );
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    private function send(string $to, string $subject, string $html): void
    {
        $this->client->emails->send([
            'from'    => $this->from,
            'to'      => [$to],
            'subject' => $subject,
            'html'    => $html,
        ]);
    }

    private function welcomeHtml(string $name): string
    {
        return "
            <p>Hi {$name},</p>
            <p>Welcome to AI Ocean — the community-powered discovery space for AI tools.</p>
            <p>Browse tools, write reviews, and save your favorites.</p>
            <p>The AI Ocean team</p>
        ";
    }

    private function passwordResetHtml(string $name, string $resetUrl): string
    {
        return "
            <p>Hi {$name},</p>
            <p>We received a request to reset your password.</p>
            <p><a href=\"{$resetUrl}\">Reset your password</a></p>
            <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
            <p>The AI Ocean team</p>
        ";
    }

    private function submissionReceivedHtml(string $name, string $toolName): string
    {
        return "
            <p>Hi {$name},</p>
            <p>We received your submission for <strong>{$toolName}</strong> and it's now in our review queue.</p>
            <p>We'll notify you once a decision has been made.</p>
            <p>The AI Ocean team</p>
        ";
    }

    private function submissionApprovedHtml(string $name, string $toolName): string
    {
        return "
            <p>Hi {$name},</p>
            <p>Great news — <strong>{$toolName}</strong> has been approved and is now live on AI Ocean.</p>
            <p>The AI Ocean team</p>
        ";
    }

    private function submissionRejectedHtml(string $name, string $toolName, string $reason): string
    {
        return "
            <p>Hi {$name},</p>
            <p>Unfortunately, <strong>{$toolName}</strong> was not approved at this time.</p>
            <p><strong>Reason:</strong> {$reason}</p>
            <p>You're welcome to revise and resubmit.</p>
            <p>The AI Ocean team</p>
        ";
    }
}
