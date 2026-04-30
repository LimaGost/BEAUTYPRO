<?php
/**
 * FinancialController — Resumo financeiro server-side (single-DB)
 *
 * GET /api/financial/summary?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 * GET /api/financial/transactions?start_date=&end_date=&type=income|expense
 *
 * Admin global pode passar ?_company_id=X para ver dados de qualquer empresa.
 */
class FinancialController
{
    private PDO $pdo;
    private int $companyId;

    public function __construct()
    {
        $this->pdo = Database::get();

        $authUser = JWT::fromRequest();
        if (!$authUser) {
            http_response_code(401);
            echo json_encode(['error' => 'Não autenticado.']);
            exit;
        }

        $isAdmin   = ($authUser['role'] ?? '') === 'admin';
        $companyId = (int) ($authUser['company_id'] ?? 0);

        if ($isAdmin && !empty($_GET['_company_id'])) {
            $companyId = (int) $_GET['_company_id'];
        }

        if (!$companyId) {
            http_response_code(403);
            echo json_encode(['error' => 'Empresa não configurada.']);
            exit;
        }

        $this->companyId = $companyId;
    }

    // ── GET /api/financial/summary ────────────────────────────────────────────

    public function summary(): void
    {
        $startDate = $_GET['start_date'] ?? date('Y-m-01');
        $endDate   = $_GET['end_date']   ?? date('Y-m-t');
        $cid       = $this->companyId;

        // Receita bruta (transações income no período)
        $stmt = $this->pdo->prepare(
            "SELECT COALESCE(SUM(amount), 0) AS total
             FROM transactions
             WHERE company_id = ? AND type = 'income' AND date BETWEEN ? AND ?"
        );
        $stmt->execute([$cid, $startDate, $endDate]);
        $grossRevenue = (float) $stmt->fetch()['total'];

        // Despesas pagas no período
        $stmt = $this->pdo->prepare(
            "SELECT COALESCE(SUM(amount), 0) AS total
             FROM transactions
             WHERE company_id = ? AND type = 'expense' AND paid = true AND date BETWEEN ? AND ?"
        );
        $stmt->execute([$cid, $startDate, $endDate]);
        $paidExpenses = (float) $stmt->fetch()['total'];

        // Agendamentos concluídos no período
        $stmt = $this->pdo->prepare(
            "SELECT COUNT(*) AS total
             FROM appointments
             WHERE company_id = ? AND status = 'completed' AND date BETWEEN ? AND ?"
        );
        $stmt->execute([$cid, $startDate, $endDate]);
        $appointmentsCount = (int) $stmt->fetch()['total'];

        $averageTicket = $appointmentsCount > 0
            ? round($grossRevenue / $appointmentsCount, 2)
            : 0.0;

        // Top profissionais por receita
        $stmt = $this->pdo->prepare(
            "SELECT professional_name, COUNT(*) AS appointments, COALESCE(SUM(amount),0) AS revenue
             FROM transactions
             WHERE company_id = ? AND type = 'income' AND date BETWEEN ? AND ?
               AND professional_name IS NOT NULL AND professional_name <> ''
             GROUP BY professional_name
             ORDER BY revenue DESC
             LIMIT 10"
        );
        $stmt->execute([$cid, $startDate, $endDate]);
        $profData = $stmt->fetchAll();

        // Novos clientes no período
        $newClients = 0;
        try {
            $stmt2 = $this->pdo->prepare(
                "SELECT COUNT(*) AS total FROM clients
                 WHERE company_id = ? AND created_date BETWEEN ? AND ?"
            );
            $stmt2->execute([$cid, $startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            $newClients = (int) $stmt2->fetch()['total'];
        } catch (\Throwable) {}

        echo json_encode([
            'gross_revenue'      => $grossRevenue,
            'paid_expenses'      => $paidExpenses,
            'net_profit'         => round($grossRevenue - $paidExpenses, 2),
            'appointments_count' => $appointmentsCount,
            'average_ticket'     => $averageTicket,
            'new_clients'        => $newClients,
            'professionals'      => array_map(fn($r) => [
                'name'         => $r['professional_name'],
                'appointments' => (int)   $r['appointments'],
                'revenue'      => (float) $r['revenue'],
            ], $profData),
            'period' => ['start' => $startDate, 'end' => $endDate],
        ]);
    }

    // ── GET /api/financial/transactions ───────────────────────────────────────

    public function transactions(): void
    {
        $startDate = $_GET['start_date'] ?? date('Y-m-01');
        $endDate   = $_GET['end_date']   ?? date('Y-m-t');
        $type      = $_GET['type']       ?? null;

        $conds  = ['company_id = ?', 'date BETWEEN ? AND ?'];
        $params = [$this->companyId, $startDate, $endDate];

        if ($type && in_array($type, ['income', 'expense'])) {
            $conds[]  = "type = ?";
            $params[] = $type;
        }

        $stmt = $this->pdo->prepare(
            "SELECT * FROM transactions WHERE " . implode(' AND ', $conds) .
            " ORDER BY date DESC, created_at DESC"
        );
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            if (isset($r['services']) && is_string($r['services'])) {
                $r['services'] = json_decode($r['services'], true) ?? [];
            }
            $r['amount'] = (float) ($r['amount'] ?? 0);
            if ($r['paid'] === 't') $r['paid'] = true;
            if ($r['paid'] === 'f') $r['paid'] = false;
        }

        echo json_encode($rows);
    }
}
