<?php

declare(strict_types=1);

namespace App\Features\Tools;

use PDO;

final class ToolRepository implements ToolRepositoryInterface, ToolLookupInterface
{
    public function __construct(private PDO $pdo) {}

    /** @return Tool[] */
    public function findAll(): array
    {
        $stmt = $this->pdo->query("
            SELECT t.*,
                   GROUP_CONCAT(c.name) AS categories,
                   COALESCE(AVG(r.rating), 0) AS avg_rating,
                   COUNT(DISTINCT r.id)        AS review_count,
                   COUNT(DISTINCT v.id)        AS vote_count,
                   COUNT(DISTINCT tcl.user_id) AS click_count
            FROM tools t
            LEFT JOIN tool_category tc ON tc.tool_id = t.id
            LEFT JOIN categories c     ON c.id = tc.category_id
            LEFT JOIN reviews r        ON r.tool_id = t.id
            LEFT JOIN votes v          ON v.tool_id = t.id
            LEFT JOIN tool_clicks tcl  ON tcl.tool_id = t.id
            WHERE t.status = 'active'
            GROUP BY t.id
            ORDER BY t.name
        ");

        return array_map(
            fn(array $row) => $this->hydrate($row),
            $stmt->fetchAll(PDO::FETCH_ASSOC)
        );
    }

    public function findById(string $id): ?Tool
    {
        $stmt = $this->pdo->prepare("
            SELECT t.*,
                   GROUP_CONCAT(c.name) AS categories,
                   COALESCE(AVG(r.rating), 0) AS avg_rating,
                   COUNT(DISTINCT r.id)        AS review_count,
                   COUNT(DISTINCT v.id)        AS vote_count,
                   COUNT(DISTINCT tcl.user_id) AS click_count
            FROM tools t
            LEFT JOIN tool_category tc ON tc.tool_id = t.id
            LEFT JOIN categories c     ON c.id = tc.category_id
            LEFT JOIN reviews r        ON r.tool_id = t.id
            LEFT JOIN votes v          ON v.tool_id = t.id
            LEFT JOIN tool_clicks tcl  ON tcl.tool_id = t.id
            WHERE t.id = ? AND t.status = 'active'
            GROUP BY t.id
        ");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->hydrate($row) : null;
    }

    public function exists(string $id): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM tools WHERE id = ?');
        $stmt->execute([$id]);

        return (bool) $stmt->fetchColumn();
    }

    /** @return Tool[] */
    public function findByCategory(string $category): array
    {
        $stmt = $this->pdo->prepare("
            SELECT t.*,
                   GROUP_CONCAT(c.name) AS categories,
                   COALESCE(AVG(r.rating), 0) AS avg_rating,
                   COUNT(DISTINCT r.id)        AS review_count,
                   COUNT(DISTINCT v.id)        AS vote_count,
                   COUNT(DISTINCT tcl.user_id) AS click_count
            FROM tools t
            LEFT JOIN tool_category tc ON tc.tool_id = t.id
            LEFT JOIN categories c     ON c.id = tc.category_id
            LEFT JOIN reviews r        ON r.tool_id = t.id
            LEFT JOIN votes v          ON v.tool_id = t.id
            LEFT JOIN tool_clicks tcl  ON tcl.tool_id = t.id
            WHERE t.status = 'active'
            GROUP BY t.id
            HAVING categories LIKE ?
            ORDER BY t.name
        ");
        $stmt->execute(['%' . $category . '%']);

        return array_map(
            fn(array $row) => $this->hydrate($row),
            $stmt->fetchAll(PDO::FETCH_ASSOC)
        );
    }

    /** @return Tool[] */
    public function search(string $query): array
    {
        $like = '%' . $query . '%';
        $stmt = $this->pdo->prepare("
            SELECT t.*,
                   GROUP_CONCAT(c.name) AS categories,
                   COALESCE(AVG(r.rating), 0) AS avg_rating,
                   COUNT(DISTINCT r.id)        AS review_count,
                   COUNT(DISTINCT v.id)        AS vote_count,
                   COUNT(DISTINCT tcl.user_id) AS click_count
            FROM tools t
            LEFT JOIN tool_category tc ON tc.tool_id = t.id
            LEFT JOIN categories c     ON c.id = tc.category_id
            LEFT JOIN reviews r        ON r.tool_id = t.id
            LEFT JOIN votes v          ON v.tool_id = t.id
            LEFT JOIN tool_clicks tcl  ON tcl.tool_id = t.id
            WHERE t.status = 'active'
              AND (t.name LIKE ? OR t.short_description LIKE ? OR t.description LIKE ?)
            GROUP BY t.id
            ORDER BY t.name
        ");
        $stmt->execute([$like, $like, $like]);

        return array_map(
            fn(array $row) => $this->hydrate($row),
            $stmt->fetchAll(PDO::FETCH_ASSOC)
        );
    }

    /** @return array<int, array{id: string, name: string}> */
    public function categories(): array
    {
        $stmt = $this->pdo->query("SELECT id, name FROM categories ORDER BY name");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateExternalRating(string $id, float $rating, int $count, string $source, ?string $slug = null): void
    {
        $stmt = $this->pdo->prepare("
            UPDATE tools
            SET external_rating = ?, external_rating_count = ?, external_rating_source = ?,
                producthunt_slug = COALESCE(?, producthunt_slug), updated_at = datetime('now')
            WHERE id = ?
        ");
        $stmt->execute([$rating, $count, $source, $slug, $id]);
    }

    /** @return array<int, array{id: string, name: string, slug: string, producthunt_slug: ?string}> */
    public function allForRatingRefresh(): array
    {
        $stmt = $this->pdo->query("SELECT id, name, slug, producthunt_slug FROM tools WHERE status = 'active'");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function hydrate(array $row): Tool
    {
        $cats = $row['categories'] ?? '';
        $category = $cats ? explode(',', $cats)[0] : '';

        return new Tool(
            id:             $row['id'],
            name:           $row['name'],
            logo:           $row['logo_url'] ?? '',
            tagline:        $row['short_description'] ?? '',
            category:       $category,
            pricing:        $row['pricing_model'] ?? '',
            platform:       'Web',
            usageCount:     (int) ($row['click_count'] ?? $row['usage_count'] ?? 0),
            rating:         round((float) ($row['avg_rating'] ?? 0), 1),
            reviewCount:    (int) ($row['review_count'] ?? 0),
            voteCount:      (int) ($row['vote_count'] ?? 0),
            primaryUseCase: '',
            url:            $row['url'] ?? null,
            description:    $row['description'] ?? null,
            status:         $row['status'] ?? 'inactive',
            externalRating:       isset($row['external_rating']) ? round((float) $row['external_rating'], 1) : null,
            externalRatingCount:  isset($row['external_rating_count']) ? (int) $row['external_rating_count'] : null,
            externalRatingSource: $row['external_rating_source'] ?? null,
        );
    }

    /** @return Tool[] */
    public function findAllAdmin(): array
    {
        $stmt = $this->pdo->query("
            SELECT t.*,
                   GROUP_CONCAT(c.name) AS categories,
                   COALESCE(AVG(r.rating), 0) AS avg_rating,
                   COUNT(DISTINCT r.id)        AS review_count,
                   COUNT(DISTINCT v.id)        AS vote_count,
                   COUNT(DISTINCT tcl.user_id) AS click_count
            FROM tools t
            LEFT JOIN tool_category tc ON tc.tool_id = t.id
            LEFT JOIN categories c     ON c.id = tc.category_id
            LEFT JOIN reviews r        ON r.tool_id = t.id
            LEFT JOIN votes v          ON v.tool_id = t.id
            LEFT JOIN tool_clicks tcl  ON tcl.tool_id = t.id
            GROUP BY t.id
            ORDER BY t.name
        ");

        return array_map(
            fn(array $row) => $this->hydrate($row),
            $stmt->fetchAll(PDO::FETCH_ASSOC)
        );
    }

    private function slugify(string $s): string
    {
        return strtolower(trim((string) preg_replace('/[^a-z0-9-]+/', '-', strtolower($s)), '-'));
    }

    public function create(array $data): string
    {
        $id = bin2hex(random_bytes(16));
        $slug = $this->slugify($data['name']);
        
        $stmt = $this->pdo->prepare("
            INSERT INTO tools (id, name, slug, url, short_description, description, pricing_model, logo_url, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $data['name'],
            $slug,
            $data['url'] ?? null,
            $data['short_description'] ?? '',
            $data['description'] ?? null,
            $data['pricing_model'] ?? 'Free',
            $data['logo_url'] ?? '',
            $data['status'] ?? 'inactive'
        ]);

        if (isset($data['category_id']) && $data['category_id'] !== '') {
            $stmtCat = $this->pdo->prepare("INSERT INTO tool_category (tool_id, category_id) VALUES (?, ?)");
            $stmtCat->execute([$id, $data['category_id']]);
        }

        return $id;
    }

    public function update(string $id, array $data): void
    {
        $fields = [];
        $params = [];
        
        $allowedFields = ['name', 'url', 'short_description', 'description', 'pricing_model', 'logo_url', 'status'];
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (isset($data['name'])) {
            $fields[] = "slug = ?";
            $params[] = $this->slugify($data['name']);
        }
        
        if (!empty($fields)) {
            $fieldsStr = implode(', ', $fields);
            $params[] = $id;
            $stmt = $this->pdo->prepare("UPDATE tools SET $fieldsStr, updated_at = datetime('now') WHERE id = ?");
            $stmt->execute($params);
        }

        if (isset($data['category_id'])) {
            $stmtDel = $this->pdo->prepare("DELETE FROM tool_category WHERE tool_id = ?");
            $stmtDel->execute([$id]);
            
            if ($data['category_id'] !== '') {
                $stmtIns = $this->pdo->prepare("INSERT INTO tool_category (tool_id, category_id) VALUES (?, ?)");
                $stmtIns->execute([$id, $data['category_id']]);
            }
        }
    }

    public function delete(string $id): void
    {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("DELETE FROM tool_category WHERE tool_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM tool_model WHERE tool_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM reviews WHERE tool_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM votes WHERE tool_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM collection_tools WHERE tool_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM reports WHERE tool_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM submissions WHERE tool_id = ?")->execute([$id]);
            $this->pdo->prepare("DELETE FROM tools WHERE id = ?")->execute([$id]);
            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function allModels(): array
    {
        $stmt = $this->pdo->query("SELECT id, name, creator_id FROM models ORDER BY name");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
