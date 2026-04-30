<?php
/**
 * CompanyController
 *
 * GET  /api/company        → empresa + business_hours do usuário logado
 * PUT  /api/company        → cria (1ª vez) ou atualiza empresa
 * POST /api/company/user   → cadastra funcionário na empresa
 */
class CompanyController
{
    private PDO   $pdo;
    private array $authUser;

    public function __construct()
    {
        $this->authUser = JWT::fromRequest();
        if (!$this->authUser) $this->abort(401, 'Não autenticado.');
        $this->pdo = Database::get();
    }

    // ── GET /api/company ──────────────────────────────────────────────────────

    public function show(): void
    {
        echo json_encode($this->fetchCompanyFull());
    }

    // ── PUT /api/company ──────────────────────────────────────────────────────

    public function update(): void
    {
        $body      = json_decode(file_get_contents('php://input'), true) ?? [];
        $companyId = (int) ($this->authUser['company_id'] ?? 0);
        $userId    = (int) $this->authUser['id'];
        $newToken  = null;

        if (!$companyId) {
            // Verifica se já existe empresa para este usuário (token desatualizado
            // ou tentativa anterior que falhou após o INSERT)
            $dbName = 'mustech2'; // single-DB: todos os dados ficam no banco global
            $stmt   = $this->pdo->prepare(
                'SELECT id FROM companies WHERE user_id = ? LIMIT 1'
            );
            $stmt->execute([$userId]);
            $existing = $stmt->fetch();

            if ($existing) {
                // Empresa já existe — recupera ID e cai no bloco de UPDATE abaixo
                $companyId = (int) $existing['id'];
                $this->authUser['company_id'] = $companyId;

                // Garante que o usuário está vinculado
                $this->pdo->prepare('UPDATE users SET company_id = ? WHERE id = ?')
                    ->execute([$companyId, $userId]);

                // Emite novo token corrigido
                $newToken = JWT::encode([
                    'id'         => $userId,
                    'email'      => $this->authUser['email'],
                    'role'       => $this->authUser['role'],
                    'company_id' => $companyId,
                ]);
            } else {
                // ── Primeiro setup real: cria empresa ────────────────────────
                $name = trim($body['name'] ?? '');
                if (!$name) $this->abort(400, 'Nome da empresa é obrigatório.');

                $slug = $this->uniqueSlug($name);

                $stmt = $this->pdo->prepare(
                    'INSERT INTO companies
                     (name, slug, cnpj, phone, whatsapp, email, address, city,
                      logo_url, description, db_name, hours_configured, user_id, is_active)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,false,?,true)
                     RETURNING id'
                );
                $stmt->execute([
                    $name,
                    $slug,
                    preg_replace('/\D/', '', $body['cnpj'] ?? '') ?: null,
                    $body['phone']       ?? null,
                    $body['whatsapp']    ?? null,
                    $body['email']       ?? null,
                    $body['address']     ?? null,
                    $body['city']        ?? null,
                    $body['logo_url']    ?? null,
                    $body['description'] ?? null,
                    $dbName,
                    $userId,
                ]);
                $companyId = (int) $stmt->fetch()['id'];

                // Vincula usuário à empresa
                $this->pdo->prepare('UPDATE users SET company_id = ? WHERE id = ?')
                    ->execute([$companyId, $userId]);

                $this->authUser['company_id'] = $companyId;

                // Emite novo token com company_id
                $newToken = JWT::encode([
                    'id'         => $userId,
                    'email'      => $this->authUser['email'],
                    'role'       => $this->authUser['role'],
                    'company_id' => $companyId,
                ]);
            }
        }

        if ($companyId) {
            // ── Atualiza empresa existente ────────────────────────────────────
            $allowed = ['name', 'cnpj', 'phone', 'whatsapp', 'email', 'address', 'city', 'logo_url', 'description'];
            $sets    = [];
            $params  = [];

            $digitsOnly = ['cnpj', 'phone', 'whatsapp'];
            foreach ($allowed as $field) {
                if (!array_key_exists($field, $body)) continue;
                $val = $body[$field];
                if (in_array($field, $digitsOnly, true)) {
                    $val = preg_replace('/\D/', '', $val ?: '') ?: null;
                } else {
                    $val = $val !== '' ? $val : null;
                }
                $sets[]   = "\"$field\" = ?";
                $params[] = $val;
            }

            if ($sets) {
                $params[] = $companyId;
                $this->pdo
                    ->prepare('UPDATE companies SET ' . implode(', ', $sets) . ' WHERE id = ?')
                    ->execute($params);
            }
        }

        if (isset($body['business_hours']) && is_array($body['business_hours'])) {
            $this->saveBusinessHours($companyId, $body['business_hours']);
            $this->pdo->prepare('UPDATE companies SET hours_configured = true WHERE id = ?')
                ->execute([$companyId]);
        }

        $company = $this->fetchCompanyFull();

        // Retorna token novo quando empresa foi criada pela primeira vez
        if ($newToken) {
            echo json_encode(['token' => $newToken, 'company' => $company]);
        } else {
            echo json_encode($company);
        }
    }

    // ── POST /api/company/user ────────────────────────────────────────────────

    public function addUser(): void
    {
        $body     = json_decode(file_get_contents('php://input'), true) ?? [];
        $name     = trim($body['name'] ?? '');
        $email    = strtolower(trim($body['email'] ?? ''));
        $password = $body['password'] ?? '';
        $cpf      = preg_replace('/\D/', '', $body['cpf']   ?? '');
        $phone    = preg_replace('/\D/', '', $body['phone'] ?? '');
        $role     = $body['role'] ?? 'user';

        if (!$name || !$email || !$password) $this->abort(400, 'Nome, email e senha são obrigatórios.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $this->abort(400, 'Email inválido.');
        if (strlen($password) < 6) $this->abort(400, 'Senha mínimo 6 caracteres.');

        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) $this->abort(409, 'Email já cadastrado.');

        $companyId = (int) ($this->authUser['company_id'] ?? 0);
        $hash      = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        $stmt = $this->pdo->prepare(
            'INSERT INTO users (name, email, password, cpf, phone, role, company_id)
             VALUES (?,?,?,?,?,?,?) RETURNING id, name, email, role, company_id'
        );
        $stmt->execute([$name, $email, $hash, $cpf ?: null, $phone ?: null, $role, $companyId]);

        http_response_code(201);
        echo json_encode(['user' => $stmt->fetch()]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function fetchCompanyFull(): ?array
    {
        $companyId = (int) ($this->authUser['company_id'] ?? 0);
        if (!$companyId) return null;

        $stmt = $this->pdo->prepare(
            'SELECT id, name, slug, cnpj, phone, whatsapp, email, address, city,
                    logo_url, description, is_active, hours_configured, created_at
             FROM companies WHERE id = ?'
        );
        $stmt->execute([$companyId]);
        $company = $stmt->fetch();
        if (!$company) $this->abort(404, 'Empresa não encontrada.');

        $bool = fn($v) => $v === 't' || $v === true;
        $company['hours_configured'] = $bool($company['hours_configured']);
        $company['is_active']        = $bool($company['is_active']);

        $stmt = $this->pdo->prepare(
            'SELECT day_of_week, is_open, open_time, close_time,
                    has_break, break_start, break_end
             FROM business_hours WHERE company_id = ? ORDER BY day_of_week'
        );
        $stmt->execute([$companyId]);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            $r['day_of_week'] = (int) $r['day_of_week'];
            $r['is_open']     = $bool($r['is_open']);
            $r['has_break']   = $bool($r['has_break'] ?? false);
        }

        $company['business_hours'] = $rows;
        return $company;
    }

    private function saveBusinessHours(int $companyId, array $hours): void
    {
        $this->pdo->prepare('DELETE FROM business_hours WHERE company_id = ?')->execute([$companyId]);

        $stmt = $this->pdo->prepare(
            'INSERT INTO business_hours
             (company_id, day_of_week, is_open, open_time, close_time, has_break, break_start, break_end)
             VALUES (?,?,?,?,?,?,?,?)'
        );

        foreach ($hours as $h) {
            $isOpen   = (bool) ($h['is_open']   ?? false);
            $hasBreak = (bool) ($h['has_break'] ?? false);
            $stmt->execute([
                $companyId,
                (int) ($h['day_of_week'] ?? 0),
                $isOpen   ? 'true' : 'false',
                $h['open_time']   ?: null,
                $h['close_time']  ?: null,
                $hasBreak ? 'true' : 'false',
                $hasBreak ? ($h['break_start'] ?: null) : null,
                $hasBreak ? ($h['break_end']   ?: null) : null,
            ]);
        }
    }

    private function uniqueSlug(string $name, int $excludeId = 0): string
    {
        $base = strtolower(trim($name));
        $map  = ['á'=>'a','à'=>'a','ã'=>'a','â'=>'a','ä'=>'a',
                  'é'=>'e','è'=>'e','ê'=>'e','ë'=>'e',
                  'í'=>'i','ì'=>'i','î'=>'i','ï'=>'i',
                  'ó'=>'o','ò'=>'o','õ'=>'o','ô'=>'o','ö'=>'o',
                  'ú'=>'u','ù'=>'u','û'=>'u','ü'=>'u','ç'=>'c'];
        $base = strtr($base, $map);
        $base = preg_replace('/[^a-z0-9]+/', '-', $base);
        $base = trim($base, '-');

        $slug = $base;
        $i    = 1;
        while (true) {
            $stmt = $this->pdo->prepare(
                'SELECT id FROM companies WHERE slug = ? AND id != ?'
            );
            $stmt->execute([$slug, $excludeId]);
            if (!$stmt->fetch()) break;
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }

    private function abort(int $code, string $msg): never
    {
        http_response_code($code);
        echo json_encode(['error' => $msg]);
        exit;
    }
}
