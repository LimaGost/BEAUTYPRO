<?php
/**
 * BusinessHourController
 *
 * GET  /api/business-hours       → horários da empresa do usuário logado
 * POST /api/business-hours       → salva todos os 7 dias de uma vez
 */
class BusinessHourController
{
    private PDO   $pdo;
    private array $authUser;
    private int   $companyId;

    public function __construct()
    {
        $this->authUser = JWT::fromRequest();
        if (!$this->authUser) $this->abort(401, 'Não autenticado.');

        $isAdmin         = ($this->authUser['role'] ?? '') === 'admin';
        $this->companyId = (int) ($this->authUser['company_id'] ?? 0);

        // Admin pode visualizar horários de qualquer empresa
        if ($isAdmin && !empty($_GET['_company_id'])) {
            $this->companyId = (int) $_GET['_company_id'];
        }

        if (!$this->companyId) $this->abort(403, 'Empresa não configurada.');

        $this->pdo = Database::get();
    }

    // ── GET /api/business-hours ───────────────────────────────────────────────

    public function index(): void
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, day_of_week, is_open, open_time, close_time,
                    has_break, break_start, break_end
             FROM business_hours
             WHERE company_id = ?
             ORDER BY day_of_week'
        );
        $stmt->execute([$this->companyId]);
        $rows = $stmt->fetchAll();

        $map = [];
        foreach ($rows as $r) {
            $map[(int)$r['day_of_week']] = $this->cast($r);
        }

        // Garante retorno de todos os 7 dias mesmo sem configuração
        $result = [];
        for ($d = 0; $d <= 6; $d++) {
            $result[] = $map[$d] ?? $this->defaultDay($d);
        }

        echo json_encode($result);
    }

    // ── POST /api/business-hours ──────────────────────────────────────────────

    public function store(): void
    {
        $hours = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!is_array($hours) || empty($hours)) {
            $this->abort(400, 'Envie um array com os horários.');
        }

        $this->pdo->prepare('DELETE FROM business_hours WHERE company_id = ?')
            ->execute([$this->companyId]);

        $stmt = $this->pdo->prepare(
            'INSERT INTO business_hours
             (company_id, day_of_week, is_open, open_time, close_time,
              has_break, break_start, break_end)
             VALUES (?,?,?,?,?,?,?,?)'
        );

        foreach ($hours as $h) {
            $dayOfWeek  = (int) ($h['day_of_week'] ?? 0);
            $isOpen     = (bool) ($h['is_open']    ?? false);
            $openTime   = $h['open_time']   ?: null;
            $closeTime  = $h['close_time']  ?: null;
            $hasBreak   = (bool) ($h['has_break']  ?? false);
            $breakStart = $hasBreak ? ($h['break_start'] ?: null) : null;
            $breakEnd   = $hasBreak ? ($h['break_end']   ?: null) : null;

            $stmt->execute([
                $this->companyId,
                $dayOfWeek,
                $isOpen     ? 'true' : 'false',
                $openTime,
                $closeTime,
                $hasBreak   ? 'true' : 'false',
                $breakStart,
                $breakEnd,
            ]);
        }

        $this->pdo->prepare('UPDATE companies SET hours_configured = true WHERE id = ?')
            ->execute([$this->companyId]);

        $this->index();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function cast(array $r): array
    {
        $bool = fn($v) => $v === 't' || $v === true || $v === 'true';
        return [
            'id'          => $r['id'],
            'day_of_week' => (int) $r['day_of_week'],
            'is_open'     => $bool($r['is_open']),
            'open_time'   => $r['open_time']   ?? '09:00',
            'close_time'  => $r['close_time']  ?? '18:00',
            'has_break'   => $bool($r['has_break']   ?? false),
            'break_start' => $r['break_start'] ?? null,
            'break_end'   => $r['break_end']   ?? null,
        ];
    }

    private function defaultDay(int $d): array
    {
        return [
            'id'          => null,
            'day_of_week' => $d,
            'is_open'     => $d >= 1 && $d <= 5,
            'open_time'   => '09:00',
            'close_time'  => '18:00',
            'has_break'   => false,
            'break_start' => null,
            'break_end'   => null,
        ];
    }

    private function abort(int $code, string $msg): never
    {
        http_response_code($code);
        echo json_encode(['error' => $msg]);
        exit;
    }
}
