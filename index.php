<?php
/**
 * index.php — IPアドレス認証 + セッション認証ゲートウェイ
 * @version v20260715 | webstudio-ledger
 */
require_once __DIR__ . '/auth.php';
checkIP();
checkSession();

// 認証OK → index.htmlを返す
readfile(__DIR__ . '/index.html');
