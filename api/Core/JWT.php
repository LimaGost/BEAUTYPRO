<?php
/**
 * JWT — Geração e verificação de tokens com algoritmo HS256.
 *
 * Implementação manual sem dependências externas. Necessário porque o
 * servidor Kinghost é hospedagem compartilhada sem acesso ao Composer.
 */
class JWT
{
    private const SECRET = 'beautypro-secret-mustech-2026';

    /** Validade do token: 7 dias */
    private const TTL = 7 * 24 * 3600;

    // ── Helpers internos ──────────────────────────────────────────────────────

    /** Codifica dados em Base64 URL-safe (sem padding) */
    private static function b64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    // ── API pública ───────────────────────────────────────────────────────────

    /**
     * Gera um token JWT assinado.
     * O campo `exp` é adicionado automaticamente ao payload.
     */
    public static function encode(array $payload): string
    {
        $header         = self::b64url(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload['exp'] = time() + self::TTL;
        $body           = self::b64url(json_encode($payload));
        $sig            = self::b64url(hash_hmac('sha256', "$header.$body", self::SECRET, true));

        return "$header.$body.$sig";
    }

    /**
     * Verifica assinatura e expiração do token.
     *
     * @return array|false  Payload decodificado, ou false se inválido/expirado.
     */
    public static function decode(string $token): array|false
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;

        [$header, $body, $sig] = $parts;

        // hash_equals previne timing attacks ao comparar as assinaturas
        $expected = self::b64url(hash_hmac('sha256', "$header.$body", self::SECRET, true));
        if (!hash_equals($expected, $sig)) return false;

        $payload = json_decode(base64_decode(strtr($body, '-_', '+/')), true);
        if (!$payload || ($payload['exp'] ?? 0) < time()) return false;

        return $payload;
    }

    /**
     * Extrai o usuário autenticado a partir da requisição atual.
     *
     * Ordem de tentativa:
     * 1. Authorization header (padrão)
     * 2. REDIRECT_HTTP_AUTHORIZATION (mod_rewrite do Apache)
     * 3. getallheaders() (alguns setups CGI)
     * 4. Query string ?_token=xxx  ← fallback obrigatório no Kinghost, onde o
     *    Apache bloqueia o header Authorization em certas configurações de CGI.
     */
    public static function fromRequest(): array|false
    {
        $auth = $_SERVER['HTTP_AUTHORIZATION']
             ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
             ?? '';

        if (empty($auth) && function_exists('getallheaders')) {
            $h    = getallheaders();
            $auth = $h['Authorization'] ?? $h['authorization'] ?? '';
        }

        if (empty($auth) && !empty($_GET['_token'])) {
            $auth = 'Bearer ' . $_GET['_token'];
        }

        if (!str_starts_with($auth, 'Bearer ')) return false;

        return self::decode(substr($auth, 7));
    }
}
