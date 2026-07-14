<?php
/**
 * auth.php — IPアドレスアクセス制限
 * @version v20260309-0193-firebase | 2026-03-09 | webstudio-ledger
 */

// 許可IPリスト
define('ALLOWED_IPS', [
    '202.221.29.145',
]);

function getClientIP() {
    // Cloud Run / リバースプロキシ環境では X-Forwarded-For を優先
    $headers = [
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_REAL_IP',
        'HTTP_CLIENT_IP',
        'REMOTE_ADDR',
    ];
    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            // X-Forwarded-For は "client, proxy1, proxy2" の形式なので先頭を取得
            $ip = trim(explode(',', $_SERVER[$header])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
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
        <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5;}
        .box{text-align:center;padding:40px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);}
        h1{color:#c00;font-size:24px;}p{color:#666;}</style></head>
        <body><div class="box"><h1>🚫 アクセス拒否</h1>
        <p>このシステムへのアクセスは許可されていません。</p>
        <p style="font-size:12px;color:#aaa;">IP: ' . htmlspecialchars($clientIP) . '</p>
        </div></body></html>';
        exit;
    }
}
