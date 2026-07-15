<?php
/**
 * auth.php — IPアドレス制限 + セッション認証
 * @version v20260715 | webstudio-ledger
 */

define('ALLOWED_IPS', [
    '202.221.29.145',
]);

define('SESSION_TIMEOUT', 300); // 5分（秒）

function getClientIP() {
    $headers = [
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_REAL_IP',
        'HTTP_CLIENT_IP',
        'REMOTE_ADDR',
    ];
    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            $ip = trim(explode(',', $_SERVER[$header])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return '0.0.0.0';
}

function checkIP() {
    $clientIP = getClientIP();
    if (!in_array($clientIP, ALLOWED_IPS)) {
        http_response_code(403);
        header('Content-Type: text/html; charset=utf-8');
        echo '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>アクセス拒否</title>
        <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a1a}
        .box{text-align:center;padding:40px;background:#fff;border-radius:8px;}
        h1{color:#c00;}p{color:#666;font-size:13px}</style></head>
        <body><div class="box"><h1>🚫 アクセス拒否</h1>
        <p>このシステムへのアクセスは許可されていません。</p>
        <p style="color:#aaa;font-size:11px">IP: ' . htmlspecialchars($clientIP) . '</p>
        </div></body></html>';
        exit;
    }
}

function checkSession() {
    // login.php自体はスキップ
    $script = basename($_SERVER['SCRIPT_NAME'] ?? '');
    if ($script === 'login.php' || $script === 'logout.php') return;

    session_start();

    // 未認証 → ログインへ
    if (empty($_SESSION['authenticated'])) {
        header('Location: /login.php');
        exit;
    }

    // 5分タイムアウトチェック
    if (isset($_SESSION['last_active']) && (time() - $_SESSION['last_active']) > SESSION_TIMEOUT) {
        session_destroy();
        header('Location: /login.php?timeout=1');
        exit;
    }

    // アクティビティ更新
    $_SESSION['last_active'] = time();
}
