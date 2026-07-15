<?php
/**
 * ping.php — セッション延長用エンドポイント
 */
require_once dirname(__DIR__) . '/auth.php';
checkIP();
checkSession();
header('Content-Type: application/json');
echo json_encode(['ok' => true, 'time' => time()]);
