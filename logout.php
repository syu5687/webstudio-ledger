<?php
/**
 * logout.php — ログアウト処理
 */
session_start();
session_destroy();
header('Location: /login.php');
exit;
