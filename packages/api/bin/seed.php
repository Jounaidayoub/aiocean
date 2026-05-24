<?php

declare(strict_types=1);

/**
 * Seed the database with real providers and models from models.dev/api.json.
 *
 * Usage:  php bin/seed.php [--refresh]
 *
 * Fetches data from the API, caches locally in seeds/api.json.
 * Pass --refresh to force re-download.
 */

require dirname(__DIR__) . '/vendor/autoload.php';
$config = require dirname(__DIR__) . '/config/app.php';

$refresh = in_array('--refresh', $argv ?? [], true);

// ---------------------------------------------------------------------------
// 1. Fetch data
// ---------------------------------------------------------------------------
$cachePath = dirname(__DIR__) . '/seeds/api.json';

if ($refresh || !file_exists($cachePath)) {
    echo "Fetching data from models.dev/api.json...\n";
    $json = file_get_contents('https://models.dev/api.json');
    if ($json === false) {
        echo "API unreachable, falling back to cache...\n";
        if (!file_exists($cachePath)) {
            die("No cached data available. Aborting.\n");
        }
        $json = file_get_contents($cachePath);
    } else {
        file_put_contents($cachePath, $json);
        echo "Cached to seeds/api.json\n";
    }
} else {
    echo "Using cached data from seeds/api.json\n";
    $json = file_get_contents($cachePath);
}

$data = json_decode($json, true);
if ($data === null) {
    die("Failed to parse JSON.\n");
}

$dbPath = $config['db']['path'];
$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// ---------------------------------------------------------------------------
// 2. Helpers
// ---------------------------------------------------------------------------

function bool2int(mixed $v): int
{
    return $v ? 1 : 0;
}

function slugify(string $s): string
{
    return strtolower(trim(preg_replace('/[^a-z0-9-]+/', '-', strtolower($s)), '-'));
}

function roundCost(float $v): float
{
    return round($v, 4);
}

// Known model creators (providers whose models are the canonical source).
// These are processed first so their model data becomes the canonical row.
$knownCreators = [
    'openai', 'anthropic', 'google', 'mistral', 'cohere', 'deepseek', 'xai',
    'alibaba', 'zhipuai', 'moonshotai', 'stepfun', 'perplexity', 'upstage',
    'sarvam', 'cerebras', 'llama',
];

// Collect all provider IDs so we know what's in the data
$allProviderIds = array_keys($data);

// ---------------------------------------------------------------------------
// 3. Insert providers
// ---------------------------------------------------------------------------
$stmtProv = $pdo->prepare(
    "INSERT OR IGNORE INTO providers (id, name, slug, npm, doc, env, website, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
);

$countProv = 0;
foreach ($data as $pid => $provider) {
    $env = isset($provider['env']) ? json_encode($provider['env']) : null;
    $stmtProv->execute([
        $pid,
        $provider['name'] ?? $pid,
        slugify($pid),
        $provider['npm'] ?? null,
        $provider['doc'] ?? null,
        $env,
        null,  // website – not available in API data
        null,  // description – not available in API data
    ]);
    $countProv++;
}
echo "Providers: $countProv inserted\n";

// ---------------------------------------------------------------------------
// 4. Insert models (pass 1 — only from known creators)
// ---------------------------------------------------------------------------
$stmtModel = $pdo->prepare(
    "INSERT OR IGNORE INTO models
        (id, name, family, creator_id, description, is_open_source,
         release_date, cutoff_date, context_window, max_output)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

$stmtModality = $pdo->prepare(
    "INSERT OR IGNORE INTO model_modality (model_id, modality, direction)
     VALUES (?, ?, ?)"
);

function insertModelData(
    PDO $pdo,
    PDOStatement $stmtModel,
    PDOStatement $stmtModality,
    string $modelId,
    array $m,
    string $creatorId,
): void {
    $limit = $m['limit'] ?? [];
    $cost = $m['cost'] ?? [];

    $stmtModel->execute([
        $modelId,
        $m['name'] ?? $modelId,
        $m['family'] ?? null,
        $creatorId,
        null, // description
        bool2int($m['open_weights'] ?? false),
        $m['release_date'] ?? null,
        $m['knowledge'] ?? null,
        $limit['context'] ?? null,
        $limit['output'] ?? null,
    ]);

    // Modalities
    $modalities = $m['modalities'] ?? [];
    foreach (['input', 'output'] as $direction) {
        foreach ($modalities[$direction] ?? [] as $modality) {
            $stmtModality->execute([$modelId, $modality, $direction]);
        }
    }
}

$countModel = 0;
$modelIdsSeen = [];

// Sort creators alphabetically for deterministic processing
$creators = array_intersect($knownCreators, $allProviderIds);
sort($creators);

foreach ($creators as $pid) {
    $provider = $data[$pid];
    foreach ($provider['models'] ?? [] as $jsonKey => $m) {
        // Extract model ID — use the inner 'id' field
        $modelId = $m['id'] ?? $jsonKey;
        if (isset($modelIdsSeen[$modelId])) {
            continue;
        }
        $modelIdsSeen[$modelId] = true;

        // Determine creator: if JSON key has '/' prefix, use the prefix
        if (str_contains($jsonKey, '/')) {
            $creatorId = explode('/', $jsonKey)[0];
        } else {
            $creatorId = $pid;
        }

        insertModelData($pdo, $stmtModel, $stmtModality, $modelId, $m, $creatorId);
        $countModel++;
    }
}
echo "Models from creators: $countModel inserted\n";

// ---------------------------------------------------------------------------
// 5. Insert model_provider rows (pass 2 — all providers)
// ---------------------------------------------------------------------------
$stmtMp = $pdo->prepare(
    "INSERT OR IGNORE INTO model_provider
        (model_id, provider_id, api_endpoint,
         cost_per_1m_tokens_in, cost_per_1m_tokens_out,
         cost_per_1m_tokens_cache_read, cost_per_1m_tokens_cache_write,
         reasoning, tool_call, attachment, structured_output,
         temperature, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

// Fallback: insert a model row if it wasn't created by a known creator
$stmtModelFallback = $pdo->prepare(
    "INSERT OR IGNORE INTO models
        (id, name, family, creator_id, description, is_open_source,
         release_date, cutoff_date, context_window, max_output)
     VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)"
);

$stmtModalityFallback = $pdo->prepare(
    "INSERT OR IGNORE INTO model_modality (model_id, modality, direction)
     VALUES (?, ?, ?)"
);

$countMp = 0;
$countModelFallback = 0;

foreach ($allProviderIds as $pid) {
    $provider = $data[$pid];
    $apiEndpoint = $provider['api'] ?? null;

    foreach ($provider['models'] ?? [] as $jsonKey => $m) {
        $modelId = $m['id'] ?? $jsonKey;

        // If model wasn't inserted by a creator, insert it now with creator_id=null
        if (!isset($modelIdsSeen[$modelId])) {
            $modelIdsSeen[$modelId] = true;
            $limit = $m['limit'] ?? [];

            $stmtModelFallback->execute([
                $modelId,
                $m['name'] ?? $modelId,
                $m['family'] ?? null,
                null, // description
                bool2int($m['open_weights'] ?? false),
                $m['release_date'] ?? null,
                $m['knowledge'] ?? null,
                $limit['context'] ?? null,
                $limit['output'] ?? null,
            ]);

            // Also insert modalities for fallback models
            $modalities = $m['modalities'] ?? [];
            foreach (['input', 'output'] as $direction) {
                foreach ($modalities[$direction] ?? [] as $modality) {
                    $stmtModalityFallback->execute([$modelId, $modality, $direction]);
                }
            }

            $countModelFallback++;
        }

        // Insert model_provider row
        $cost = $m['cost'] ?? [];
        $stmtMp->execute([
            $modelId,
            $pid,
            $apiEndpoint,
            isset($cost['input']) ? roundCost($cost['input']) : null,
            isset($cost['output']) ? roundCost($cost['output']) : null,
            isset($cost['cache_read']) ? roundCost($cost['cache_read']) : null,
            isset($cost['cache_write']) ? roundCost($cost['cache_write']) : null,
            bool2int($m['reasoning'] ?? false),
            bool2int($m['tool_call'] ?? false),
            bool2int($m['attachment'] ?? false),
            bool2int($m['structured_output'] ?? false),
            bool2int($m['temperature'] ?? false),
            $m['status'] ?? null,
        ]);
        $countMp++;
    }
}

echo "model_provider rows: $countMp inserted\n";
echo "Models from fallback: $countModelFallback inserted\n";

// ---------------------------------------------------------------------------
// 6. Summary
// ---------------------------------------------------------------------------
$totalModels = $pdo->query("SELECT COUNT(*) FROM models")->fetchColumn();
$totalMp = $pdo->query("SELECT COUNT(*) FROM model_provider")->fetchColumn();
$totalModalities = $pdo->query("SELECT COUNT(*) FROM model_modality")->fetchColumn();

echo "\n--- Summary ---\n";
echo "Providers:  $countProv\n";
echo "Models:     $totalModels\n";
echo "Modalities: $totalModalities\n";
echo "Hostings:   $totalMp\n";
echo "Done.\n";
