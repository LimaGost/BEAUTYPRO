<?php
/**
 * EntityController — CRUD genérico para todas as entidades do sistema.
 *
 * Rotas:
 *   GET    /api/entities/:entidade         → listar
 *   POST   /api/entities/:entidade         → criar
 *   PUT    /api/entities/:entidade/:id     → atualizar
 *   DELETE /api/entities/:entidade/:id     → excluir
 *
 * Regra especial: ao marcar appointment.status = 'completed', cria transaction
 * de receita automaticamente. Ao desfazer, remove a transaction gerada.
 */
class EntityController
{
    private EntityModel $model;
    private array       $authUser;
    private string      $entityName;

    public function __construct(string $entityName)
    {
        $authUser = JWT::fromRequest();
        if (!$authUser) {
            http_response_code(401);
            echo json_encode(['error' => 'Não autenticado.']);
            exit;
        }

        $isAdmin   = ($authUser['role'] ?? '') === 'admin';
        $companyId = (int) ($authUser['company_id'] ?? 0);

        // Admin pode direcionar para qualquer empresa via ?_company_id=X
        if ($isAdmin && !empty($_GET['_company_id'])) {
            $companyId = (int) $_GET['_company_id'];
        }

        if (!$companyId) {
            http_response_code(403);
            echo json_encode(['error' => 'Empresa não configurada. Selecione uma empresa.']);
            exit;
        }

        try {
            $this->model      = new EntityModel($entityName, $companyId);
            $this->authUser   = $authUser;
            $this->entityName = strtolower($entityName);
        } catch (InvalidArgumentException) {
            http_response_code(404);
            echo json_encode(['error' => 'Entidade não encontrada.']);
            exit;
        }
    }

    // ── GET /api/entities/:entidade ───────────────────────────────────────────

    public function index(): void
    {
        $filters = array_diff_key($_GET, array_flip(['_sort', '_token', '_company_id']));
        $sort    = $_GET['_sort'] ?? null;
        echo json_encode($this->model->findAll($filters, $sort));
    }

    // ── POST /api/entities/:entidade ──────────────────────────────────────────

    public function store(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($data)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nenhum campo válido enviado.']);
            return;
        }

        try {
            http_response_code(201);
            echo json_encode($this->model->create($data));
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    // ── PUT /api/entities/:entidade/:id ───────────────────────────────────────

    public function update(string $id): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($data)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nenhum campo válido enviado.']);
            return;
        }

        // Para appointments, lê o estado anterior antes de atualizar
        $oldStatus = null;
        if ($this->entityName === 'appointment') {
            $old = $this->model->findById($id);
            $oldStatus = $old['status'] ?? null;
        }

        $row = $this->model->update($id, $data);

        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'Registro não encontrado.']);
            return;
        }

        // Auto-gerencia transação financeira ao concluir/desconcluir agendamento
        if ($this->entityName === 'appointment') {
            $newStatus = $row['status'] ?? null;
            if ($oldStatus !== 'completed' && $newStatus === 'completed') {
                $this->createTransactionForAppointment($row);
            } elseif ($oldStatus === 'completed' && $newStatus !== 'completed') {
                $this->removeTransactionForAppointment($id);
            }
        }

        echo json_encode($row);
    }

    // ── DELETE /api/entities/:entidade/:id ────────────────────────────────────

    public function destroy(string $id): void
    {
        $deleted = $this->model->delete($id);
        echo json_encode(['success' => $deleted]);
    }

    // ── Helpers de transação financeira ───────────────────────────────────────

    private function createTransactionForAppointment(array $appt): void
    {
        $companyId = (int) ($appt['company_id'] ?? $this->authUser['company_id'] ?? 0);
        if (!$companyId) return;
        try {
            $txModel = new EntityModel('transaction', $companyId);

            // Evita duplicidade: verifica se já existe transação para este agendamento
            $existing = $txModel->findAll(['appointment_id' => $appt['id']]);
            if (!empty($existing)) return;

            $services = $appt['services'] ?? [];
            if (is_string($services)) $services = json_decode($services, true) ?? [];

            $txModel->create([
                'type'              => 'income',
                'amount'            => $appt['total_amount'] ?? 0,
                'date'              => $appt['date'],
                'description'       => 'Atendimento concluído',
                'payment_method'    => 'cash',
                'appointment_id'    => $appt['id'],
                'client_id'         => $appt['client_id']         ?? null,
                'client_name'       => $appt['client_name']       ?? null,
                'professional_id'   => $appt['professional_id']   ?? null,
                'professional_name' => $appt['professional_name'] ?? null,
                'services'          => $services,
                'category'          => 'Serviço',
                'paid'              => true,
            ]);
        } catch (\Throwable) {}
    }

    private function removeTransactionForAppointment(string $appointmentId): void
    {
        $companyId = (int) ($this->authUser['company_id'] ?? 0);
        // Admin override: pega company_id da query string
        if (($this->authUser['role'] ?? '') === 'admin' && !empty($_GET['_company_id'])) {
            $companyId = (int) $_GET['_company_id'];
        }
        if (!$companyId) return;
        try {
            $txModel  = new EntityModel('transaction', $companyId);
            $existing = $txModel->findAll(['appointment_id' => $appointmentId]);
            foreach ($existing as $tx) {
                $txModel->delete($tx['id']);
            }
        } catch (\Throwable) {}
    }
}
