<?php
/**
 * Database — Conexão PDO com PostgreSQL via padrão Singleton.
 *
 * Uma única instância é criada por requisição, evitando múltiplas
 * conexões desnecessárias ao banco de dados.
 */
class Database
{
    /** Instância única compartilhada durante a requisição */
    private static ?PDO $pdo = null;

    /** Cache de conexões por nome de banco (suporta múltiplas empresas por requisição) */
    private static array $companyPdos = [];

    private function __construct() {}

    /** Conexão com banco global (usuários, empresas) */
    public static function get(): PDO
    {
        if (self::$pdo !== null) {
            return self::$pdo;
        }
        try {
            self::$pdo = new PDO(
                'pgsql:host=pgsql.mustech.com.br;port=5432;dbname=mustech2',
                'mustech2',
                'Ryandudu123',
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Falha na conexão com o banco: ' . $e->getMessage()]);
            exit;
        }
        return self::$pdo;
    }

    /**
     * Retorna a conexão com o banco global.
     * Arquitetura single-DB: todos os dados de empresas ficam em mustech2,
     * isolados pela coluna company_id em cada tabela.
     */
    public static function getCompanyDb(string $dbName): PDO
    {
        return self::get();
    }

    /** @deprecated Não utilizado na arquitetura single-DB */
    public static function createCompanyDatabase(string $dbName): void
    {
        // No-op: banco único para todas as empresas
    }
}
