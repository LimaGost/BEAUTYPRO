<?php
/**
 * EntityModel — CRUD genérico para todas as entidades do sistema.
 *
 * Isolamento multi-tenant: todas as tabelas de entidade ficam no banco global
 * (mustech2) com coluna company_id. Todas as queries filtram por company_id
 * automaticamente, garantindo que cada empresa veja apenas seus próprios dados.
 */
class EntityModel
{
    // ── Mapeamentos ───────────────────────────────────────────────────────────

    private const TABLE_MAP = [
        'appointment'     => 'appointments',
        'client'          => 'clients',
        'professional'    => 'professionals',
        'service'         => 'services',
        'product'         => 'products',
        'transaction'     => 'transactions',
        'messagetemplate' => 'message_templates',
    ];

    private const ALLOWED_COLUMNS = [
        'appointments'      => ['id','date','start_time','end_time','client_id','client_name','customer_phone','professional_id','professional_name','services','status','notes','total_amount','type','source','created_at','updated_at'],
        'clients'           => ['id','first_name','last_name','phone','email','birthdate','notes','tags','visit_count','total_spent','created_date','updated_at','anamnesis'],
        'professionals'     => ['id','name','email','phone','color','commission_percent','document','document_type','has_schedule','permissions','specialties','active','work_schedule','photo_url','created_at','updated_at'],
        'services'          => ['id','name','category','price','duration_minutes','active','description','created_at','updated_at'],
        'products'          => ['id','name','category','price','cost','stock_quantity','min_stock','unit','active','created_at','updated_at'],
        'transactions'      => ['id','type','expense_type','amount','date','description','payment_method','appointment_id','client_id','client_name','professional_id','professional_name','services','category','paid','created_at','updated_at'],
        'message_templates' => ['id','name','type','content','active','created_at','updated_at'],
    ];

    private const JSONB_COLUMNS = [
        'appointments'  => ['services'],
        'professionals' => ['permissions','specialties','work_schedule'],
        'transactions'  => ['services'],
        'clients'       => ['tags','anamnesis'],
    ];

    private const NUMERIC_COLUMNS = [
        'services'      => ['price','duration_minutes'],
        'products'      => ['price','cost','stock_quantity','min_stock'],
        'professionals' => ['commission_percent'],
        'clients'       => ['visit_count','total_spent'],
        'transactions'  => ['amount'],
        'appointments'  => ['total_amount'],
    ];

    // ── Estado da instância ───────────────────────────────────────────────────

    private PDO    $pdo;
    private string $table;
    private array  $allowed;
    private array  $jsonb;
    private array  $numerics;
    private int    $companyId;

    public function __construct(string $entityName, int $companyId)
    {
        $key = strtolower($entityName);

        if (!isset(self::TABLE_MAP[$key])) {
            throw new InvalidArgumentException("Entidade '$entityName' não encontrada.");
        }

        // Single-DB: todos os dados ficam em mustech2
        $this->pdo       = Database::get();
        $this->table     = self::TABLE_MAP[$key];
        $this->allowed   = self::ALLOWED_COLUMNS[$this->table];
        $this->jsonb     = self::JSONB_COLUMNS[$this->table]   ?? [];
        $this->numerics  = self::NUMERIC_COLUMNS[$this->table] ?? [];
        $this->companyId = $companyId;
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    public function findAll(array $filters = [], ?string $sort = null): array
    {
        [$conditions, $params] = $this->buildFilters($filters);

        // Isolamento: sempre filtra pelo company_id da empresa logada
        $conditions[] = '"company_id" = ?';
        $params[]     = $this->companyId;

        $sql = "SELECT * FROM {$this->table} WHERE " . implode(' AND ', $conditions);

        if ($sort) {
            $desc  = str_starts_with($sort, '-');
            $field = $desc ? substr($sort, 1) : $sort;
            if (in_array($field, $this->allowed)) {
                $sql .= " ORDER BY \"$field\" " . ($desc ? 'DESC NULLS LAST' : 'ASC NULLS LAST');
            }
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return array_map(fn($row) => $this->decodeRow($row), $stmt->fetchAll());
    }

    public function findById(string $id): ?array
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM {$this->table} WHERE id = ? AND company_id = ?"
        );
        $stmt->execute([$id, $this->companyId]);
        $row = $stmt->fetch();
        return $row ? $this->decodeRow($row) : null;
    }

    public function create(array $data): array
    {
        // Injeta company_id automaticamente — o chamador não precisa enviar
        $data['company_id'] = $this->companyId;

        [$cols, $phs, $params] = $this->buildInsertParts($data);

        $stmt = $this->pdo->prepare(
            "INSERT INTO {$this->table} (" . implode(',', $cols) . ")
             VALUES (" . implode(',', $phs) . ")
             RETURNING *"
        );
        $stmt->execute($params);

        return $this->decodeRow($stmt->fetch());
    }

    public function update(string $id, array $data): array|false
    {
        [$sets, $params] = $this->buildUpdateParts($data);

        if (in_array('updated_at', $this->allowed)) {
            $sets[] = '"updated_at" = NOW()';
        }

        $params[] = $id;
        $params[] = $this->companyId;

        $stmt = $this->pdo->prepare(
            "UPDATE {$this->table}
             SET " . implode(',', $sets) . "
             WHERE id = ? AND company_id = ?
             RETURNING *"
        );
        $stmt->execute($params);

        $row = $stmt->fetch();
        return $row ? $this->decodeRow($row) : false;
    }

    public function delete(string $id): bool
    {
        $stmt = $this->pdo->prepare(
            "DELETE FROM {$this->table} WHERE id = ? AND company_id = ?"
        );
        $stmt->execute([$id, $this->companyId]);
        return $stmt->rowCount() > 0;
    }

    // ── Helpers de conversão ──────────────────────────────────────────────────

    private function decodeRow(array $row): array
    {
        foreach ($row as $col => &$val) {
            if (in_array($col, $this->jsonb) && is_string($val)) {
                $decoded = json_decode($val, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $val = $decoded;
                }
            } elseif (in_array($col, $this->numerics) && $val !== null) {
                $val = str_contains((string)$val, '.') ? (float)$val : (int)$val;
            }

            if ($val === 't') $val = true;
            if ($val === 'f') $val = false;
        }

        return $row;
    }

    private function pgVal(mixed $val): mixed
    {
        return is_bool($val) ? ($val ? 'true' : 'false') : $val;
    }

    private function buildFilters(array $filters): array
    {
        $conditions = [];
        $params     = [];

        foreach ($filters as $col => $val) {
            if (!in_array($col, $this->allowed)) continue;

            if ($val === 'true')  $val = true;
            if ($val === 'false') $val = false;

            $conditions[] = "\"$col\" = ?";
            $params[]     = $val;
        }

        return [$conditions, $params];
    }

    private function buildInsertParts(array $data): array
    {
        $cols   = [];
        $phs    = [];
        $params = [];

        foreach ($data as $col => $val) {
            // company_id é injetado internamente — aceita mesmo não estando na whitelist
            if ($col === 'company_id') {
                $cols[]   = '"company_id"';
                $phs[]    = '?';
                $params[] = (int) $val;
                continue;
            }

            if (!in_array($col, $this->allowed) || $col === 'id') continue;

            $cols[]   = "\"$col\"";
            $phs[]    = '?';
            $params[] = in_array($col, $this->jsonb) ? json_encode($val) : $this->pgVal($val);
        }

        return [$cols, $phs, $params];
    }

    private function buildUpdateParts(array $data): array
    {
        $sets   = [];
        $params = [];

        foreach ($data as $col => $val) {
            if (!in_array($col, $this->allowed) || $col === 'id' || $col === 'updated_at') continue;

            $sets[]   = "\"$col\" = ?";
            $params[] = in_array($col, $this->jsonb) ? json_encode($val) : $this->pgVal($val);
        }

        return [$sets, $params];
    }
}
