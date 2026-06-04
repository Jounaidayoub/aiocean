<?php

declare(strict_types=1);

namespace App\Features\OAuth;

final class HtmlView
{
    /**
     * Escape a string for safe HTML output.
     */
    public static function e(?string $s): string
    {
        return htmlspecialchars($s ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * Render a full HTML page with the shared dark/light card layout.
     */
    public static function page(string $title, string $body): string
    {
        $t = self::e($title);
        return <<<HTML
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{$t}</title>
  <style>
    :root { color-scheme: light dark; --bg: #ffffff; --fg: #111; --muted: #666; --card: #f7f7f8; --border: #e3e3e6; --accent: #2563eb; --accent-fg: #fff; --danger: #b91c1c; --ok: #166534; --warn: #b45309; }
    @media (prefers-color-scheme: dark) { :root { --bg: #0b0b0d; --fg: #ececef; --muted: #9ca3af; --card: #15151a; --border: #2a2a31; --accent: #3b82f6; --accent-fg: #fff; --danger: #ef4444; --ok: #4ade80; --warn: #fbbf24; } }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; }
    .wrap { min-height: 100dvh; display: grid; place-items: center; padding: 24px; }
    .card { width: 100%; max-width: 480px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 28px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
    h1 { font-size: 1.25rem; margin: 0 0 4px; }
    .sub { color: var(--muted); font-size: 0.9rem; margin-bottom: 20px; }
    label { display: block; font-size: 0.85rem; font-weight: 600; margin: 14px 0 6px; }
    input[type=text], input[type=url], textarea, select { width: 100%; padding: 9px 11px; background: var(--bg); color: var(--fg); border: 1px solid var(--border); border-radius: 8px; font: inherit; }
    textarea { min-height: 84px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.85rem; }
    .row { display: flex; gap: 10px; align-items: center; }
    .row > * { flex: 1; }
    .actions { display: flex; gap: 10px; margin-top: 22px; }
    .btn { appearance: none; border: 1px solid var(--border); background: var(--bg); color: var(--fg); padding: 10px 16px; border-radius: 8px; font: inherit; font-weight: 600; cursor: pointer; text-align: center; text-decoration: none; }
    .btn:hover { border-color: var(--accent); }
    .btn-primary { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }
    .btn-primary:hover { filter: brightness(0.95); }
    .btn-danger { background: var(--danger); color: #fff; border-color: var(--danger); }
    .btn-danger:hover { filter: brightness(0.95); }
    code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.85rem; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 2px 6px; word-break: break-all; }
    .kv { display: grid; grid-template-columns: max-content 1fr; gap: 6px 14px; margin: 12px 0; font-size: 0.9rem; }
    .kv dt { color: var(--muted); }
    .kv dd { margin: 0; word-break: break-all; }
    .scope { padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); margin: 6px 0; }
    .scope-name { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.85rem; color: var(--muted); }
    .scope-desc { font-size: 0.95rem; }
    .alert { padding: 10px 12px; border-radius: 8px; margin: 12px 0; font-size: 0.9rem; }
    .alert-warn { background: rgba(180, 83, 9, 0.1); border: 1px solid var(--warn); color: var(--warn); }
    .alert-ok { background: rgba(22, 101, 52, 0.1); border: 1px solid var(--ok); color: var(--ok); }
    .alert-err { background: rgba(185, 28, 28, 0.1); border: 1px solid var(--danger); color: var(--danger); }
    .copy { float: right; font-size: 0.75rem; padding: 2px 8px; }
    .muted { color: var(--muted); font-size: 0.85rem; }
    .hidden { display: none; }
    .copyable { position: relative; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      {$body}
    </div>
  </div>
  <script>
    document.querySelectorAll('[data-copy]').forEach(function (el) {
      el.addEventListener('click', function () {
        var text = el.getAttribute('data-copy');
        navigator.clipboard.writeText(text).then(function () {
          var orig = el.textContent;
          el.textContent = 'Copied!';
          setTimeout(function () { el.textContent = orig; }, 1200);
        });
      });
    });
  </script>
</body>
</html>
HTML;
    }

    /**
     * Hidden input helper for the consent form. All OAuth params must travel
     * via the form's action query string because league's
     * AuthCodeGrant::validateAuthorizationRequest reads response_type and
     * client_id from $request->getQueryParams() (not the body).
     */
    public static function hidden(string $name, ?string $value): string
    {
        if ($value === null || $value === '') {
            return '';
        }
        return '<input type="hidden" name="' . self::e($name) . '" value="' . self::e($value) . '">';
    }

    public static function scopeDescription(string $scope): string
    {
        return match ($scope) {
            'mcp:user' => 'Search and read AI tools in the directory, list categories, and review submissions.',
            'mcp:admin' => 'Approve, reject, or revert tool submissions on behalf of the directory.',
            default => 'Access the MCP resource server.',
        };
    }

    public static function isLocalhostUri(?string $uri): bool
    {
        if ($uri === null) {
            return false;
        }
        $host = parse_url($uri, PHP_URL_HOST);
        return $host === 'localhost' || $host === '127.0.0.1' || $host === '::1' || $host === '[::1]';
    }
}
