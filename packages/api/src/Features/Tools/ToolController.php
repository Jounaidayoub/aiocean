<?php

declare(strict_types=1);

namespace App\Features\Tools;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;

use App\Shared\CurrentUser;

/**
 * Tool endpoints.
 */
final class ToolController extends BaseController
{
    public function __construct(
        private ToolService $service,
        private CurrentUser $currentUser,
    ) {}

    public function index(Request $request): Response
    {
        $search   = $request->query('search');
        $category = $request->query('category');

        $result = $this->service->list($search, $category);

        return $this->data($result);
    }

    public function show(Request $request): Response
    {
        $id = $request->param('id');

        $tool = $this->service->getById($id);

        if ($tool === null) {
            return $this->notFound("Tool with id '$id' not found");
        }

        return $this->data($tool);
    }

    public function categories(Request $request): Response
    {
        return $this->data(['categories' => $this->service->categories()]);
    }

    public function adminIndex(Request $request): Response
    {
        if (!$this->currentUser->isAdmin()) {
            return $this->forbidden();
        }

        $search = $request->query('search');
        $category = $request->query('category');
        return $this->data($this->service->listAdmin($search, $category));
    }

    public function create(Request $request): Response
    {
        if (!$this->currentUser->isAdmin()) {
            return $this->forbidden();
        }

        $body = $request->body();
        if (empty($body['name'])) {
            return $this->badRequest('Tool name is required');
        }

        $id = $this->service->create($body);
        return $this->created(['id' => $id, 'message' => 'Tool created successfully']);
    }

    public function update(Request $request): Response
    {
        if (!$this->currentUser->isAdmin()) {
            return $this->forbidden();
        }

        $id = $request->param('id');
        $body = $request->body();
        $this->service->update((string) $id, $body);

        return $this->data(['message' => 'Tool updated successfully']);
    }

    public function delete(Request $request): Response
    {
        if (!$this->currentUser->isAdmin()) {
            return $this->forbidden();
        }

        $id = $request->param('id');
        $this->service->delete((string) $id);

        return $this->data(['message' => 'Tool deleted successfully']);
    }

    public function adminModels(Request $request): Response
    {
        if (!$this->currentUser->isAdmin()) {
            return $this->forbidden();
        }

        return $this->data(['models' => $this->service->allModels()]);
    }
}
