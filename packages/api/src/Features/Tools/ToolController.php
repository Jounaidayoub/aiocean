<?php

declare(strict_types=1);

namespace App\Features\Tools;

use App\Core\BaseController;
use App\Core\Request;
use App\Core\Response;

/**
 * Tool endpoints.
 *
 * GET /api/tools           — list all (with ?search= and ?category= filters)
 * GET /api/tools/{id}      — get single tool
 * GET /api/categories      — list categories
 */
final class ToolController extends BaseController
{
    public function __construct(
        private ToolService $service,
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
}
