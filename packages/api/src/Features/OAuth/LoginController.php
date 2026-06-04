<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;
use App\Features\Users\UserService;

/**
 * Human-facing login for the OAuth authorization server. Reuses the same
 * UserService / users table that the rest of the app uses, so credentials
 * and roles stay in sync.
 *
 * - GET  /login  — render the form (with optional ?next= return URL)
 * - POST /login  — verify credentials, set $_SESSION['user_id'], redirect to next
 * - GET  /logout — clear the session and redirect to /login
 */
final class LoginController extends BaseController
{
    public function __construct(private UserService $users) {}

    public function form(Request $request): Response
    {
        $next = (string) ($request->allQuery()['next'] ?? '');
        if (!$this->isSafeRedirect($next)) {
            $next = '';
        }
        $error = (string) ($request->allQuery()['error'] ?? '');

        $body = $this->renderForm($next, $error ?: null, null);
        return $this->html(HtmlView::page('Sign in', $body));
    }

    public function submit(Request $request): Response
    {
        $body = $request->body();
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $next = (string) ($body['next'] ?? '');
        if (!$this->isSafeRedirect($next)) {
            $next = '';
        }

        if ($email === '' || $password === '') {
            $html = $this->renderForm($next, 'Email and password are required.', $email);
            return $this->html(HtmlView::page('Sign in', $html), 400);
        }

        $user = $this->users->verifyCredentials($email, $password);
        if (!$user) {
            $html = $this->renderForm($next, 'Invalid email or password.', $email);
            return $this->html(HtmlView::page('Sign in', $html), 401);
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = $user->id;
        $_SESSION['user_name'] = $user->name;
        $_SESSION['user_email'] = $user->email;
        $_SESSION['user_role'] = $user->role;

        $target = $next !== '' ? $next : '/';
        return (new Response())
            ->status(302)
            ->header('Location', $target)
            ->body('');
    }

    public function logout(Request $request): Response
    {
        $_SESSION = [];
        if (session_id() !== '') {
            session_destroy();
        }
        $next = (string) ($request->allQuery()['next'] ?? '');
        if (!$this->isSafeRedirect($next)) {
            $next = '';
        }
        $target = $next !== '' ? $next : '/login';
        return (new Response())
            ->status(302)
            ->header('Location', $target)
            ->body('');
    }

    private function renderForm(string $next, ?string $error, ?string $emailPrefill): string
    {
        $errBlock = $error
            ? '<div class="alert alert-err">' . HtmlView::e($error) . '</div>'
            : '';
        $email = HtmlView::e($emailPrefill ?? '');
        $nextAttr = HtmlView::e($next);
        $referral = $next !== '' ? '<div class="muted" style="margin-top:8px">After signing in, you\'ll be returned to the application that started the request.</div>' : '';

        return <<<HTML
<h1>Sign in</h1>
<p class="sub">Sign in with your AI Ocean account to continue.</p>
{$errBlock}
<form method="POST" action="/login">
  <input type="hidden" name="next" value="{$nextAttr}">
  <label for="email">Email</label>
  <input type="text" id="email" name="email" value="{$email}" autocomplete="username" required>

  <label for="password">Password</label>
  <input type="password" id="password" name="password" autocomplete="current-password" required>

  <div class="actions">
    <button type="submit" class="btn btn-primary">Sign in</button>
  </div>
  {$referral}
</form>
HTML;
    }

    private function isSafeRedirect(string $url): bool
    {
        if ($url === '') {
            return false;
        }
        $parts = parse_url($url);
        if ($parts === false) {
            return false;
        }
        if (isset($parts['scheme']) && !in_array(strtolower($parts['scheme']), ['http', 'https'], true)) {
            return false;
        }
        if (isset($parts['host'])) {
            $host = strtolower($parts['host']);
            $allowed = ['localhost', '127.0.0.1', '::1'];
            $isAllowed = in_array($host, $allowed, true)
                || str_ends_with($host, '.trycloudflare.com')
                || str_ends_with($host, '.localhost');
            if (!$isAllowed) {
                return false;
            }
        }
        return true;
    }
}
