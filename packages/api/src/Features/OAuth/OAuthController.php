<?php

declare(strict_types=1);

namespace App\Features\OAuth;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;
use App\Features\OAuth\Entities\UserEntity;
use League\OAuth2\Server\Exception\OAuthServerException;
use Nyholm\Psr7\Response as Psr7Response;
use Nyholm\Psr7\ServerRequest;

final class OAuthController extends BaseController
{
    public function __construct(
        private OAuthServerFactory $serverFactory,
        private array $config,
    ) {}

    public function discovery(Request $request): Response
    {
        $issuer = rtrim($this->config['issuer'], '/');
        return $this->json([
            'issuer' => $issuer,
            'authorization_endpoint' => $issuer . '/oauth/authorize',
            'token_endpoint' => $issuer . '/oauth/token',
            'grant_types_supported' => ['authorization_code'],
            'response_types_supported' => ['code'],
            'code_challenge_methods_supported' => ['S256'],
            'scopes_supported' => ['mcp:user', 'mcp:admin'],
            'token_endpoint_auth_methods_supported' => ['none', 'client_secret_post'],
        ]);
    }

    public function authorize(Request $request): Response
    {
        $this->ensureSession();

        if (empty($_SESSION['user_id'])) {
            $_SESSION['oauth_redirect_after_login'] = $this->currentPathWithQuery();
            return $this->redirect($this->config['login_url']);
        }

        try {
            $authRequest = $this->serverFactory->make()->validateAuthorizationRequest($this->toPsrRequest($request));
        } catch (OAuthServerException $e) {
            return $this->oauthError($e);
        }

        $role = (string) ($_SESSION['user_role'] ?? 'user');
        $scopes = $role === 'admin' ? 'mcp:user mcp:admin' : 'mcp:user';
        $query = htmlspecialchars(http_build_query($request->allQuery()), ENT_QUOTES, 'UTF-8');
        $clientId = htmlspecialchars((string) $authRequest->getClient()->getIdentifier(), ENT_QUOTES, 'UTF-8');

        return (new Response())
            ->header('Content-Type', 'text/html; charset=UTF-8')
            ->body(<<<HTML
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Authorize AI Ocean MCP</title></head>
<body>
  <main style="font-family: system-ui, sans-serif; max-width: 42rem; margin: 3rem auto;">
    <h1>Authorize AI Ocean MCP</h1>
    <p>Client <strong>{$clientId}</strong> is requesting access to your AI Ocean MCP tools.</p>
    <p>Granted scopes: <code>{$scopes}</code></p>
    <form method="post" action="/oauth/authorize?{$query}">
      <input type="hidden" name="approve" value="1">
      <button type="submit">Approve</button>
    </form>
    <form method="post" action="/oauth/authorize?{$query}" style="margin-top: 1rem;">
      <input type="hidden" name="approve" value="0">
      <button type="submit">Deny</button>
    </form>
  </main>
</body>
</html>
HTML);
    }

    public function approve(Request $request): Response
    {
        $this->ensureSession();

        if (empty($_SESSION['user_id'])) {
            $_SESSION['oauth_redirect_after_login'] = $this->currentPathWithQuery();
            return $this->redirect($this->config['login_url']);
        }

        try {
            $authRequest = $this->serverFactory->make()->validateAuthorizationRequest($this->toPsrRequest($request));
            $authRequest->setUser(new UserEntity((string) $_SESSION['user_id']));
            $authRequest->setAuthorizationApproved((string) ($_POST['approve'] ?? $request->input('approve', '0')) === '1');
            return $this->fromPsrResponse(
                $this->serverFactory->make()->completeAuthorizationRequest($authRequest, new Psr7Response())
            );
        } catch (OAuthServerException $e) {
            return $this->oauthError($e);
        }
    }

    public function token(Request $request): Response
    {
        try {
            return $this->fromPsrResponse(
                $this->serverFactory->make()->respondToAccessTokenRequest($this->toPsrRequest($request), new Psr7Response())
            );
        } catch (OAuthServerException $e) {
            return $this->oauthError($e);
        }
    }

    private function ensureSession(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
    }

    private function currentPathWithQuery(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/oauth/authorize';
        return str_starts_with($uri, '/') ? $uri : '/' . $uri;
    }

    private function redirect(string $url): Response
    {
        return (new Response())->status(302)->header('Location', $url)->body('');
    }

    private function toPsrRequest(Request $request): ServerRequest
    {
        $uri = $this->config['issuer'] . $request->path();
        if ($request->allQuery()) {
            $uri .= '?' . http_build_query($request->allQuery());
        }

        return (new ServerRequest($request->method(), $uri))
            ->withQueryParams($request->allQuery())
            ->withParsedBody($request->body() ?: $_POST);
    }

    private function fromPsrResponse(\Psr\Http\Message\ResponseInterface $psr): Response
    {
        $response = (new Response())->status($psr->getStatusCode())->body((string) $psr->getBody());
        foreach ($psr->getHeaders() as $name => $values) {
            $response->header($name, implode(', ', $values));
        }
        return $response;
    }

    private function oauthError(OAuthServerException $e): Response
    {
        return $this->json([
            'error' => $e->getErrorType(),
            'message' => $e->getMessage(),
        ], $e->getHttpStatusCode());
    }
}
