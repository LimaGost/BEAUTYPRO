<?php
/**
 * AuthController — Autenticação e registro de usuários/empresas.
 *
 * Rotas:
 *   POST /api/auth/register  → cria empresa + usuário admin → retorna token
 *   POST /api/auth/login     → autentica → retorna token
 *   GET  /api/auth/me        → retorna usuário + empresa
 */
class AuthController
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::get();
    }

    // ── POST /api/auth/register ───────────────────────────────────────────────

    public function register(): void
    {
        $body     = json_decode(file_get_contents('php://input'), true) ?? [];
        $name     = trim($body['name']             ?? '');
        $email    = strtolower(trim($body['email'] ?? ''));
        $password = $body['password']              ?? '';
        $cpf      = preg_replace('/\D/', '', $body['cpf']   ?? '');
        $phone    = preg_replace('/\D/', '', $body['phone'] ?? '');

        if (!$name || !$email || !$password) {
            $this->abort(400, 'Nome, email e senha são obrigatórios.');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->abort(400, 'Formato de email inválido.');
        }

        if (strlen($password) < 6) {
            $this->abort(400, 'A senha deve ter pelo menos 6 caracteres.');
        }

        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $this->abort(409, 'Este email já está cadastrado.');
        }

        // Cria usuário sem empresa — empresa é configurada depois no CompanySetup
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $stmt = $this->pdo->prepare(
            'INSERT INTO users (name, email, password, cpf, phone, role)
             VALUES (?, ?, ?, ?, ?, ?)
             RETURNING id, name, email, cpf, phone, role, company_id'
        );
        $stmt->execute([$name, $email, $hash, $cpf ?: null, $phone ?: null, 'user']);
        $user = $stmt->fetch();

        http_response_code(201);
        echo json_encode([
            'token'   => JWT::encode(['id' => $user['id'], 'email' => $user['email'], 'role' => $user['role'], 'company_id' => null]),
            'user'    => $user,
            'company' => null,
        ]);
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────

    public function login(): void
    {
        $body     = json_decode(file_get_contents('php://input'), true) ?? [];
        $email    = strtolower(trim($body['email'] ?? ''));
        $password = $body['password'] ?? '';

        if (!$email || !$password) {
            $this->abort(400, 'Email e senha são obrigatórios.');
        }

        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            $this->abort(401, 'Email ou senha inválidos.');
        }

        $company = $this->fetchCompany($user['company_id'] ?? null);

        echo json_encode([
            'token'   => JWT::encode([
                'id'         => $user['id'],
                'email'      => $user['email'],
                'role'       => $user['role'],
                'company_id' => $user['company_id'] ?? null,
            ]),
            'user'    => [
                'id'         => $user['id'],
                'name'       => $user['name'],
                'email'      => $user['email'],
                'cpf'        => $user['cpf']   ?? null,
                'phone'      => $user['phone'] ?? null,
                'role'       => $user['role'],
                'company_id' => $user['company_id'] ?? null,
            ],
            'company' => $company,
        ]);
    }

    // ── GET /api/auth/me ──────────────────────────────────────────────────────

    public function me(): void
    {
        $authUser = JWT::fromRequest();
        if (!$authUser) {
            $this->abort(401, 'Não autenticado.');
        }

        $stmt = $this->pdo->prepare(
            'SELECT id, name, email, cpf, phone, role, company_id FROM users WHERE id = ?'
        );
        $stmt->execute([$authUser['id']]);
        $user = $stmt->fetch();

        if (!$user) {
            $this->abort(401, 'Usuário não encontrado.');
        }

        $company = $this->fetchCompany($user['company_id'] ?? null);

        echo json_encode(array_merge($user, ['company' => $company]));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function fetchCompany(?int $companyId): ?array
    {
        if (!$companyId) return null;

        $stmt = $this->pdo->prepare(
            'SELECT id, name, slug, cnpj, phone, whatsapp, email, address, city,
                    logo_url, description, is_active, hours_configured, created_at
             FROM companies WHERE id = ?'
        );
        $stmt->execute([$companyId]);
        $row = $stmt->fetch();
        if (!$row) return null;

        $bool = fn($v) => $v === 't' || $v === true;
        $row['hours_configured'] = $bool($row['hours_configured']);
        $row['is_active']        = $bool($row['is_active'] ?? true);

        return $row;
    }

    private function abort(int $code, string $message): never
    {
        http_response_code($code);
        echo json_encode(['error' => $message]);
        exit;
    }
}
