<?php
/**
 * index.php — IPアドレス認証 + セッション認証ゲートウェイ
 * @version v20260715 | webstudio-ledger
 */
require_once __DIR__ . '/auth.php';
checkIP();
checkSession();

// キャッシュ無効化
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');

// 認証OK → index.htmlを返す
readfile(__DIR__ . '/index.html');
