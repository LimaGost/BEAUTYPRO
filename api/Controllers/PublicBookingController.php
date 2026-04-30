<?php
/**
 * PublicBookingController — Endpoints públicos (sem autenticação)
 *
 * GET  /api/public/company/:slug
 * GET  /api/public/company/:slug/services
 * GET  /api/public/company/:slug/professionals
 * GET  /api/public/company/:slug/available-times?date=&service_id=&professional_id=
 * POST /api/public/company/:slug/appointments
 *
 * Todos os dados ficam em mustech2 (single-DB).
 * O isolamento é feito via company_id em cada tabela.
 */
class PublicBookingController
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::get();
    }

    // ── GET /api/public/company/:slug ─────────────────────────────────────────

    public function getCompany(string $slug): void
    {
        $company = $this->findBySlug($slug);
        if (!$company) $this->abort(404, 'Empresa não encontrada ou link inativo.');
        echo json_encode($company);
    }

    // ── GET /api/public/company/:slug/services ────────────────────────────────

    public function getServices(string $slug): void
    {
        $company = $this->findBySlug($slug);
        if (!$company) $this->abort(404, 'Empresa não encontrada.');

        $stmt = $this->pdo->prepare(
            "SELECT id, name, description, duration_minutes, price
             FROM services
             WHERE active = true AND company_id = ?
             ORDER BY name"
        );
        $stmt->execute([$company['id']]);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            $r['duration_minutes'] = (int)   $r['duration_minutes'];
            $r['price']            = (float) $r['price'];
        }

        echo json_encode($rows);
    }

    // ── GET /api/public/company/:slug/professionals ───────────────────────────

    public function getProfessionals(string $slug): void
    {
        $company = $this->findBySlug($slug);
        if (!$company) $this->abort(404, 'Empresa não encontrada.');

        try {
            $stmt = $this->pdo->prepare(
                "SELECT id, name, photo_url, specialties FROM professionals
                 WHERE active = true AND company_id = ?
                 ORDER BY name"
            );
            $stmt->execute([$company['id']]);
            $rows = $stmt->fetchAll();
            foreach ($rows as &$r) {
                if (isset($r['specialties']) && is_string($r['specialties'])) {
                    $decoded = json_decode($r['specialties'], true);
                    $r['specialties'] = (json_last_error() === JSON_ERROR_NONE) ? $decoded : [];
                } else {
                    $r['specialties'] = $r['specialties'] ?? [];
                }
                $r['photo_url'] = $r['photo_url'] ?? null;
            }
        } catch (\Throwable $e) {
            // Fallback: colunas photo_url/specialties ainda não existem na tabela
            $stmt = $this->pdo->prepare(
                "SELECT id, name FROM professionals
                 WHERE active = true AND company_id = ?
                 ORDER BY name"
            );
            $stmt->execute([$company['id']]);
            $rows = $stmt->fetchAll();
            foreach ($rows as &$r) {
                $r['photo_url']  = null;
                $r['specialties'] = [];
            }
        }
        echo json_encode($rows);
    }

    // ── GET /api/public/company/:slug/available-times ─────────────────────────

    public function getAvailableTimes(string $slug): void
    {
        $date           = $_GET['date']            ?? date('Y-m-d');
        $serviceId      = $_GET['service_id']      ?? null;
        $professionalId = $_GET['professional_id'] ?? null;

        $company = $this->findBySlug($slug);
        if (!$company) $this->abort(404, 'Empresa não encontrada.');

        // 1. Duração do serviço
        $duration = 30;
        if ($serviceId) {
            $stmt = $this->pdo->prepare(
                'SELECT duration_minutes FROM services
                 WHERE id = ? AND company_id = ? AND active = true'
            );
            $stmt->execute([$serviceId, $company['id']]);
            $svc = $stmt->fetch();
            if ($svc) $duration = (int) $svc['duration_minutes'];
        }

        // 2. Horário de funcionamento do dia da semana
        $weekday = (int) date('w', strtotime($date)); // 0=Dom … 6=Sáb
        $stmt = $this->pdo->prepare(
            'SELECT * FROM business_hours WHERE company_id = ? AND day_of_week = ?'
        );
        $stmt->execute([$company['id'], $weekday]);
        $bh = $stmt->fetch();

        $bool = fn($v) => $v === 't' || $v === true || $v === 'true';

        if (!$bh || !$bool($bh['is_open'])) {
            echo json_encode([]);
            return;
        }

        // 3. Gera slots
        $open  = $this->toMin($bh['open_time']);
        $close = $this->toMin($bh['close_time']);

        $hasBreak   = $bool($bh['has_break'] ?? false);
        $breakStart = $hasBreak && !empty($bh['break_start']) ? $this->toMin($bh['break_start']) : null;
        $breakEnd   = $hasBreak && !empty($bh['break_end'])   ? $this->toMin($bh['break_end'])   : null;

        $slots = [];
        for ($t = $open; $t + $duration <= $close; $t += $duration) {
            if ($hasBreak && $breakStart !== null && $breakEnd !== null) {
                if ($t < $breakEnd && $t + $duration > $breakStart) continue;
            }
            $slots[] = $this->toTime($t);
        }

        // 4. Remove horários passados (apenas para hoje)
        $isToday = ($date === date('Y-m-d'));
        if ($isToday) {
            $nowMin = (int) date('G') * 60 + (int) date('i');
            $slots  = array_values(array_filter($slots, fn($s) => $this->toMin($s) > $nowMin));
        }

        // 5. Remove horários ocupados (scheduled ou blocked)
        if (!empty($slots)) {
            $conds  = ["date = ?", "status IN ('scheduled','blocked')", "company_id = ?"];
            $params = [$date, $company['id']];

            if ($professionalId) {
                $conds[]  = "professional_id = ?";
                $params[] = $professionalId;
            }

            $stmt = $this->pdo->prepare(
                "SELECT start_time, end_time FROM appointments WHERE " . implode(' AND ', $conds)
            );
            $stmt->execute($params);
            $occupied = $stmt->fetchAll();

            $slots = array_values(array_filter($slots, function ($slot) use ($occupied, $duration) {
                $sStart = $this->toMin($slot);
                $sEnd   = $sStart + $duration;
                foreach ($occupied as $appt) {
                    $aStart = $this->toMin($appt['start_time']);
                    $aEnd   = $this->toMin($appt['end_time']);
                    if ($sStart < $aEnd && $sEnd > $aStart) return false;
                }
                return true;
            }));
        }

        echo json_encode($slots);
    }

    // ── POST /api/public/company/:slug/appointments ───────────────────────────

    public function createAppointment(string $slug): void
    {
        $company = $this->findBySlug($slug);
        if (!$company) $this->abort(404, 'Empresa não encontrada.');

        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $customerName  = trim($body['customer_name']  ?? '');
        $customerPhone = trim($body['customer_phone'] ?? '');
        $date          = $body['date']            ?? '';
        $startTime     = $body['start_time']      ?? '';
        $serviceId     = $body['service_id']      ?? null;
        $profId        = $body['professional_id'] ?? null;
        $notes         = trim($body['notes']      ?? '');

        if (!$customerName || !$customerPhone || !$date || !$startTime) {
            $this->abort(400, 'Nome, telefone, data e horário são obrigatórios.');
        }

        // Valida celular brasileiro: 11 dígitos, DDD válido, começa com 9
        $phoneDigits = preg_replace('/\D/', '', $customerPhone);
        if (strlen($phoneDigits) !== 11) {
            $this->abort(400, 'Telefone inválido. Informe um celular com DDD (11 dígitos).');
        }
        if ((int) substr($phoneDigits, 0, 2) < 11) {
            $this->abort(400, 'DDD inválido no telefone informado.');
        }
        if ($phoneDigits[2] !== '9') {
            $this->abort(400, 'Celular inválido. O número deve começar com 9 após o DDD.');
        }
        if (preg_match('/^(\d)\1+$/', $phoneDigits)) {
            $this->abort(400, 'Telefone inválido.');
        }
        $customerPhone = $phoneDigits;

        // Busca dados do serviço
        $duration     = 30;
        $serviceName  = '';
        $servicePrice = 0;
        if ($serviceId) {
            $stmt = $this->pdo->prepare(
                'SELECT * FROM services WHERE id = ? AND company_id = ?'
            );
            $stmt->execute([$serviceId, $company['id']]);
            $svc = $stmt->fetch();
            if ($svc) {
                $duration     = (int)   $svc['duration_minutes'];
                $serviceName  =         $svc['name'];
                $servicePrice = (float) $svc['price'];
            }
        }

        // Busca nome do profissional
        $profName = '';
        if ($profId) {
            $stmt = $this->pdo->prepare(
                'SELECT name FROM professionals WHERE id = ? AND company_id = ?'
            );
            $stmt->execute([$profId, $company['id']]);
            $prof = $stmt->fetch();
            if ($prof) $profName = $prof['name'];
        }

        // Calcula end_time
        $startMin = $this->toMin($startTime);
        $endTime  = $this->toTime($startMin + $duration);

        $services = $serviceId ? json_encode([[
            'id'    => $serviceId,
            'name'  => $serviceName,
            'price' => $servicePrice,
        ]]) : '[]';

        // Re-verifica disponibilidade com lock de transação (evita race condition)
        $this->pdo->beginTransaction();
        try {
            $conflictStmt = $this->pdo->prepare(
                "SELECT id FROM appointments
                 WHERE company_id = ? AND date = ? AND status NOT IN ('cancelled')
                   AND start_time < ? AND end_time > ?
                 LIMIT 1"
            );
            $conflictStmt->execute([$company['id'], $date, $endTime, $startTime]);
            if ($conflictStmt->fetch()) {
                $this->pdo->rollBack();
                $this->abort(409, 'Este horário acabou de ser reservado. Por favor, escolha outro.');
            }

            $stmt = $this->pdo->prepare(
                "INSERT INTO appointments
                 (company_id, date, start_time, end_time, client_name, customer_phone,
                  professional_id, professional_name, services, status,
                  notes, total_amount, type, source)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'appointment','public_link')
                 RETURNING id, date, start_time, end_time, client_name,
                           customer_phone, status, source"
            );
            $stmt->execute([
                $company['id'],
                $date,
                $startTime,
                $endTime,
                $customerName,
                $customerPhone,
                $profId   ?: null,
                $profName ?: null,
                $services,
                'scheduled',
                $notes ?: null,
                $servicePrice,
            ]);

            $appt = $stmt->fetch();
            $this->pdo->commit();
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            $this->abort(500, 'Erro ao criar agendamento.');
        }

        http_response_code(201);
        echo json_encode($appt);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function findBySlug(string $slug): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, name, slug, phone, whatsapp, address, description,
                    logo_url, hours_configured
             FROM companies WHERE slug = ? AND is_active = true'
        );
        $stmt->execute([$slug]);
        return $stmt->fetch() ?: false;
    }

    private function toMin(string $time): int
    {
        [$h, $m] = array_map('intval', explode(':', $time));
        return $h * 60 + $m;
    }

    private function toTime(int $minutes): string
    {
        return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
    }

    private function abort(int $code, string $msg): never
    {
        http_response_code($code);
        echo json_encode(['error' => $msg]);
        exit;
    }
}
