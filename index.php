<?php
/**
 * index.php — IPアドレス認証ゲートウェイ
 * @version v20260309-0193-firebase | 2026-03-09 | webstudio-ledger
 */
require_once __DIR__ . '/auth.php';
checkIP();

// IP確認OK → index.htmlを返す
readfile(__DIR__ . '/index.html');
