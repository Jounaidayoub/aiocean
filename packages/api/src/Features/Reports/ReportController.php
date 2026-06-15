<?php

declare(strict_types=1);

namespace App\Features\Reports;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;
use App\Shared\CurrentUser;

final class ReportController extends BaseController
{
    public function __construct(
        private ReportService $reports,
        private CurrentUser $currentUser,
    ) {}

    public function create(Request $request): Response
    {
        $userId = $this->currentUser->id();
        if ($userId === null) {
            return $this->unauthorized();
        }

        $body = $request->body();
        $result = $this->reports->create(
            (string) $request->param('toolId'),
            $userId,
            $body['reason'] ?? null,
            $body['note'] ?? null,
        );

        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], $result['status'] ?? 400);
        }

        return $this->data(['report' => $result['report']], 201);
    }

    public function adminIndex(Request $request): Response
    {
        if (!$this->currentUser->isAdmin()) {
            return $this->forbidden();
        }

        return $this->data(['reports' => $this->reports->listAll()]);
    }

    public function adminDelete(Request $request): Response
    {
        if (!$this->currentUser->isAdmin()) {
            return $this->forbidden();
        }

        $id = $request->param('id');
        $this->reports->dismiss((string) $id);
        return $this->data(['message' => 'Report dismissed successfully']);
    }
}
