<?php
/**
 * login.php — ログイン画面
 * @version v20260715 | webstudio-ledger
 */
require_once __DIR__ . '/auth.php';
checkIP();

session_start();

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';
    $validPassword = getenv('APP_PASSWORD') ?: 'linkup2024';
    if ($password === $validPassword) {
        $_SESSION['authenticated'] = true;
        $_SESSION['last_active']   = time();
        header('Location: /');
        exit;
    }
    $error = 'パスワードが違います';
}
?><!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ログイン — 案件台帳</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Hiragino Kaku Gothic ProN',sans-serif;background:#1a1a1a;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .card{background:#fff;border-radius:12px;padding:48px 40px;width:340px;box-shadow:0 20px 60px rgba(0,0,0,0.4)}
  h1{font-size:20px;font-weight:700;text-align:center;margin-bottom:8px;color:#1a1a1a}
  .sub{text-align:center;font-size:12px;color:#888;margin-bottom:32px}
  label{font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:6px}
  input[type=password]{width:100%;padding:12px 14px;border:1.5px solid #ddd;border-radius:6px;font-size:15px;outline:none;transition:border .2s}
  input[type=password]:focus{border-color:#c0392b}
  .err{color:#c0392b;font-size:12px;margin-top:8px;text-align:center}
  button{width:100%;padding:13px;background:#c0392b;color:#fff;border:none;border-radius:6px;font-size:15px;font-weight:700;cursor:pointer;margin-top:20px;transition:background .2s}
  button:hover{background:#a93226}
  .lock{text-align:center;font-size:36px;margin-bottom:20px}
</style>
</head>
<body>
<div class="card">
  <div class="lock">🔒</div>
  <h1>案件台帳</h1>
  <p class="sub">LINK-UP Management</p>
  <form method="POST">
    <label>パスワード</label>
    <input type="password" name="password" autofocus placeholder="パスワードを入力">
    <?php if ($error): ?><p class="err"><?= htmlspecialchars($error) ?></p><?php endif; ?>
    <?php if (isset($_GET['timeout'])): ?><p class="err">⏱ 操作がなかったため自動ログアウトしました</p><?php endif; ?>
    <button type="submit">ログイン</button>
  </form>
</div>
</body>
</html>
