<?php
/**
 * BeautyPro API — Ponto de entrada (Bootstrap + Router)
 *
 * Responsabilidades deste arquivo:
 *   1. Configurar headers HTTP globais (CORS, Content-Type)
 *   2. Carregar as classes Core, Models e Controllers
 *   3. Rotear a requisição para o Controller correto
 *
 * Estrutura MVC:
 *   Core/Database.php                → Conexão PDO singleton
 *   Core/JWT.php                     → Geração e verificação de tokens
 *   Models/EntityModel.php           → CRUD genérico com whitelist de colunas
 *   Controllers/AuthController.php   → /api/auth/*
 *   Controllers/EntityController.php → /api/entities/*
 */

// ── Captura global de erros PHP → retorna JSON em vez de HTML ────────────────

ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

set_error_handler(function (int $errno, string $errstr, string $errfile, int $errline): bool {
    http_response_code(500);
    echo json_encode([
        'error' => 'PHP Error',
        'message' => $errstr,
        'file' => basename($errfile),
        'line' => $errline,
    ]);
    exit;
});

set_exception_handler(function (Throwable $e): void {
    http_response_code(500);
    echo json_encode([
        'error' => get_class($e),
        'message' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine(),
    ]);
    exit;
});

// ── Headers globais ───────────────────────────────────────────────────────────

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Responde ao preflight do CORS sem passar pela lógica de negócio
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Carregamento das classes ──────────────────────────────────────────────────

require_once __DIR__ . '/Core/Database.php';
require_once __DIR__ . '/Core/JWT.php';
require_once __DIR__ . '/Models/EntityModel.php';
require_once __DIR__ . '/Controllers/AuthController.php';
require_once __DIR__ . '/Controllers/CompanyController.php';
require_once __DIR__ . '/Controllers/BusinessHourController.php';
require_once __DIR__ . '/Controllers/PublicBookingController.php';
require_once __DIR__ . '/Controllers/EntityController.php';
require_once __DIR__ . '/Controllers/FinancialController.php';
require_once __DIR__ . '/Controllers/AdminController.php';

// ── Extração dos segmentos da URI ─────────────────────────────────────────────

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts  = array_values(array_filter(explode('/', trim($uri, '/'))));
$method = $_SERVER['REQUEST_METHOD'];

// Remove o prefixo /api para que as rotas partam de índice 0
if (($parts[0] ?? '') === 'api') array_shift($parts);

$section  = $parts[0] ?? '';   // 'auth' | 'company' | 'business-hours' | 'public' | 'entities'
$resource = $parts[1] ?? '';   // 'login' | 'client' | slug da empresa | ...
$extra    = $parts[2] ?? null; // sub-recurso ou ID
$extra2   = $parts[3] ?? null; // sub-sub-recurso

// ── /api/health ───────────────────────────────────────────────────────────────

if ($section === 'health') {
    echo json_encode(['status' => 'ok', 'timestamp' => date('c')]);
    exit;
}

// ── /api/debug — diagnóstico de headers (útil em homologação) ────────────────

if ($section === 'debug') {
    $h = function_exists('getallheaders') ? getallheaders() : [];
    echo json_encode([
        'HTTP_AUTHORIZATION'          => $_SERVER['HTTP_AUTHORIZATION'] ?? null,
        'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null,
        'getallheaders_auth'          => $h['Authorization'] ?? $h['authorization'] ?? null,
        '_token_get'                  => $_GET['_token'] ?? null,
    ]);
    exit;
}

// ── /api/auth/* ───────────────────────────────────────────────────────────────

if ($section === 'auth') {
    $auth = new AuthController();

    match (true) {
        $method === 'POST' && $resource === 'register' => $auth->register(),
        $method === 'POST' && $resource === 'login'    => $auth->login(),
        $method === 'GET'  && $resource === 'me'       => $auth->me(),
        default => (static function () {
            http_response_code(404);
            echo json_encode(['error' => 'Rota de auth não encontrada.']);
        })(),
    };

    exit;
}

// ── /api/company ─────────────────────────────────────────────────────────────

if ($section === 'company') {
    $ctrl = new CompanyController();

    match (true) {
        $method === 'GET'  && $resource === ''     => $ctrl->show(),
        $method === 'PUT'  && $resource === ''     => $ctrl->update(),
        $method === 'POST' && $resource === 'user' => $ctrl->addUser(),
        default => (static function () {
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido.']);
        })(),
    };

    exit;
}

// ── /api/business-hours ───────────────────────────────────────────────────────

if ($section === 'business-hours') {
    $ctrl = new BusinessHourController();

    match (true) {
        $method === 'GET'  => $ctrl->index(),
        $method === 'POST' => $ctrl->store(),
        default => (static function () {
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido.']);
        })(),
    };

    exit;
}

// ── /api/public/company/:slug[/:action] ───────────────────────────────────────
// resource = 'company', extra = slug, extra2 = action

if ($section === 'public' && $resource === 'company' && $extra) {
    $slug   = $extra;
    $action = $extra2 ?? '';
    $ctrl   = new PublicBookingController();

    match (true) {
        $method === 'GET'  && $action === ''                   => $ctrl->getCompany($slug),
        $method === 'GET'  && $action === 'services'           => $ctrl->getServices($slug),
        $method === 'GET'  && $action === 'professionals'      => $ctrl->getProfessionals($slug),
        $method === 'GET'  && $action === 'available-times'    => $ctrl->getAvailableTimes($slug),
        $method === 'POST' && $action === 'appointments'       => $ctrl->createAppointment($slug),
        default => (static function () {
            http_response_code(404);
            echo json_encode(['error' => 'Rota pública não encontrada.']);
        })(),
    };

    exit;
}

// ── /api/admin/* ─────────────────────────────────────────────────────────

if ($section === 'admin') {
    $ctrl = new AdminController();

    match (true) {
        $method === 'GET' && $resource === 'companies'     => $ctrl->companies(),
        $method === 'GET' && $resource === 'dashboard'     => $ctrl->dashboard(),
        $method === 'GET' && $resource === 'clients'       => $ctrl->clients(),
        $method === 'GET' && $resource === 'appointments'  => $ctrl->appointments(),
        default => (static function () {
            http_response_code(404);
            echo json_encode(['error' => 'Rota admin não encontrada.']);
        })(),
    };

    exit;
}

// ── /api/financial/* ─────────────────────────────────────────────────────────

if ($section === 'financial') {
    $ctrl = new FinancialController();

    match (true) {
        $method === 'GET' && $resource === 'summary'      => $ctrl->summary(),
        $method === 'GET' && $resource === 'transactions' => $ctrl->transactions(),
        default => (static function () {
            http_response_code(404);
            echo json_encode(['error' => 'Rota financeira não encontrada.']);
        })(),
    };

    exit;
}

// ── /api/entities/:entidade[/:id] ─────────────────────────────────────────────

if ($section === 'entities') {
    $entity   = new EntityController($resource);
    $recordId = $extra;

    match (true) {
        $method === 'GET'    && $recordId === null => $entity->index(),
        $method === 'POST'   && $recordId === null => $entity->store(),
        $method === 'PUT'    && $recordId !== null => $entity->update($recordId),
        $method === 'DELETE' && $recordId !== null => $entity->destroy($recordId),
        default => (static function () {
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido.']);
        })(),
    };

    exit;
}

// ── 404 ───────────────────────────────────────────────────────────────────────

http_response_code(404);
echo json_encode(['error' => 'Rota não encontrada.']);
