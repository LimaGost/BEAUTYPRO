<?php
/**
 * AdminController — Endpoints exclusivos do administrador global.
 *
 * GET /api/admin/companies → lista todas as empresas do sistema
 *
 * Acesso restrito a usuários com role = 'admin'.
 */
class AdminController
{
    private PDO   $pdo;
    private array $authUser;

    public function __construct()
    {
        $this->pdo      = Database::get();
        $this->authUser = JWT::fromRequest();

        if (!$this->authUser) {
            $this->abort(401, 'Não autenticado.');
        }

        if (($this->authUser['role'] ?? '') !== 'admin') {
            $this->abort(403, 'Acesso restrito a administradores do sistema.');
        }
    }

    // ── GET /api/admin/dashboard ─────────────────────────────────────────────

    public function dashboard(): void
    {
        $stmt = $this->pdo->query(
            "SELECT
                (SELECT COUNT(*) FROM companies)                              AS total_companies,
                (SELECT COUNT(*) FROM users WHERE role != 'admin')            AS total_users,
                (SELECT COUNT(*) FROM appointments)                           AS total_appointments,
                (SELECT COUNT(*) FROM appointments
                 WHERE date::date >= date_trunc('month', CURRENT_DATE)
                   AND date::date <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month') AS appointments_this_month,
                (SELECT COALESCE(SUM(amount::numeric), 0)
                 FROM transactions WHERE type = 'income')                    AS total_revenue,
                (SELECT COALESCE(SUM(amount::numeric), 0)
                 FROM transactions
                 WHERE type = 'income'
                   AND date::date >= date_trunc('month', CURRENT_DATE)
                   AND date::date <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month') AS revenue_this_month"
        );
        $row = $stmt->fetch();

        echo json_encode([
            'total_companies'        => (int)   ($row['total_companies']        ?? 0),
            'total_users'            => (int)   ($row['total_users']            ?? 0),
            'total_appointments'     => (int)   ($row['total_appointments']     ?? 0),
            'appointments_this_month'=> (int)   ($row['appointments_this_month']?? 0),
            'total_revenue'          => (float) ($row['total_revenue']          ?? 0),
            'revenue_this_month'     => (float) ($row['revenue_this_month']     ?? 0),
        ]);
    }

    // ── GET /api/admin/clients ────────────────────────────────────────────────

    public function clients(): void
    {
        $search = trim($_GET['search'] ?? '');
        $limit  = min(100, max(1, (int) ($_GET['limit'] ?? 50)));
        $page   = max(1, (int) ($_GET['page'] ?? 1));
        $offset = ($page - 1) * $limit;

        if ($search) {
            $stmt = $this->pdo->prepare(
                "SELECT cl.id, cl.first_name, cl.last_name, cl.phone, cl.email,
                        cl.created_date, c.id AS company_id, c.name AS company_name
                 FROM clients cl
                 LEFT JOIN companies c ON c.id = cl.company_id
                 WHERE cl.first_name ILIKE :s OR cl.last_name ILIKE :s OR cl.phone ILIKE :s
                 ORDER BY cl.created_date DESC
                 LIMIT {$limit} OFFSET {$offset}"
            );
            $stmt->execute([':s' => "%{$search}%"]);
        } else {
            $stmt = $this->pdo->prepare(
                "SELECT cl.id, cl.first_name, cl.last_name, cl.phone, cl.email,
                        cl.created_date, c.id AS company_id, c.name AS company_name
                 FROM clients cl
                 LEFT JOIN companies c ON c.id = cl.company_id
                 ORDER BY cl.created_date DESC
                 LIMIT {$limit} OFFSET {$offset}"
            );
            $stmt->execute();
        }

        echo json_encode($stmt->fetchAll());
    }

    // ── GET /api/admin/appointments ───────────────────────────────────────────

    public function appointments(): void
    {
        $search = trim($_GET['search'] ?? '');
        $limit  = min(100, max(1, (int) ($_GET['limit'] ?? 50)));
        $page   = max(1, (int) ($_GET['page'] ?? 1));
        $offset = ($page - 1) * $limit;

        if ($search) {
            $stmt = $this->pdo->prepare(
                "SELECT a.id, a.date, a.start_time, a.end_time, a.status,
                        a.total_amount, a.client_name, a.customer_phone,
                        a.professional_name, a.services, a.notes, a.created_at,
                        c.id AS company_id, c.name AS company_name
                 FROM appointments a
                 LEFT JOIN companies c ON c.id = a.company_id
                 WHERE a.client_name ILIKE :s OR c.name ILIKE :s OR a.professional_name ILIKE :s
                 ORDER BY a.date DESC, a.start_time DESC
                 LIMIT {$limit} OFFSET {$offset}"
            );
            $stmt->execute([':s' => "%{$search}%"]);
        } else {
            $stmt = $this->pdo->prepare(
                "SELECT a.id, a.date, a.start_time, a.end_time, a.status,
                        a.total_amount, a.client_name, a.customer_phone,
                        a.professional_name, a.services, a.notes, a.created_at,
                        c.id AS company_id, c.name AS company_name
                 FROM appointments a
                 LEFT JOIN companies c ON c.id = a.company_id
                 ORDER BY a.date DESC, a.start_time DESC
                 LIMIT {$limit} OFFSET {$offset}"
            );
            $stmt->execute();
        }

        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['total_amount'] = $r['total_amount'] !== null ? (float) $r['total_amount'] : null;
            if (is_string($r['services'])) {
                $decoded = json_decode($r['services'], true);
                $r['services'] = is_array($decoded) ? $decoded : [];
            } elseif ($r['services'] === null) {
                $r['services'] = [];
            }
        }

        echo json_encode($rows);
    }

    // ── GET /api/admin/companies ──────────────────────────────────────────────

    public function companies(): void
    {
        $stmt = $this->pdo->prepare(
            "SELECT
                c.id, c.name, c.slug, c.cnpj, c.phone, c.whatsapp,
                c.email, c.address, c.city, c.logo_url, c.description,
                c.is_active, c.hours_configured, c.created_at,
                u.name  AS owner_name,
                u.email AS owner_email,
                (SELECT COUNT(*) FROM appointments a  WHERE a.company_id  = c.id) AS appointment_count,
                (SELECT COUNT(*) FROM clients     cl WHERE cl.company_id = c.id) AS client_count,
                (SELECT COUNT(*) FROM professionals p WHERE p.company_id = c.id AND p.active = true) AS professional_count
             FROM companies c
             LEFT JOIN users u ON u.company_id = c.id
             ORDER BY c.created_at DESC"
        );
        $stmt->execute();
        $rows = $stmt->fetchAll();

        $bool = fn($v) => $v === 't' || $v === true;
        foreach ($rows as &$r) {
            $r['is_active']          = $bool($r['is_active']          ?? true);
            $r['hours_configured']   = $bool($r['hours_configured']   ?? false);
            $r['appointment_count']  = (int) ($r['appointment_count']  ?? 0);
            $r['client_count']       = (int) ($r['client_count']       ?? 0);
            $r['professional_count'] = (int) ($r['professional_count'] ?? 0);
        }

        echo json_encode($rows);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function abort(int $code, string $msg): never
    {
        http_response_code($code);
        echo json_encode(['error' => $msg]);
        exit;
    }
}
