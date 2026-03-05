<?php
/**
 * デバッグ用：メール送信の状態を確認するエンドポイント
 * 確認後は削除してください
 * アクセス: /api/debug-email.php
 */
header('Content-Type: application/json; charset=utf-8');

$info = [
  'php_version'    => PHP_VERSION,
  'curl_enabled'   => function_exists('curl_init'),
  'resend_api_key' => (getenv('RESEND_API_KEY') ?: 're_2uUwkqYF_QELAZsUopJCY2KC3h2Ngw75J') ? '設定あり（' . substr(getenv('RESEND_API_KEY') ?: 're_2uUwkqYF_QELAZsUopJCY2KC3h2Ngw75J', 0, 8) . '...）' : '未設定',
  'request_method' => $_SERVER['REQUEST_METHOD'],
];

// curlが使えるなら実際にResendへ疎通テスト
if (function_exists('curl_init')) {
  $apiKey = getenv('RESEND_API_KEY') ?: 're_2uUwkqYF_QELAZsUopJCY2KC3h2Ngw75J';
  $ch = curl_init('https://api.resend.com/emails');
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode([
      'from'    => 'Test <estimate@nfz33.com>',
      'to'      => ['delivered@resend.dev'],  // Resend公式テスト用アドレス
      'subject' => 'デバッグテスト',
      'html'    => '<p>疎通確認</p>',
    ]),
    CURLOPT_HTTPHEADER => [
      'Content-Type: application/json',
      'Authorization: Bearer ' . $apiKey,
    ],
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_SSL_VERIFYPEER => true,
  ]);
  $res  = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err  = curl_error($ch);
  curl_close($ch);

  $info['resend_test'] = [
    'http_code'  => $code,
    'curl_error' => $err ?: 'なし',
    'response'   => json_decode($res, true) ?? $res,
  ];
} else {
  $info['resend_test'] = 'curl未インストール（Dockerfile要修正）';
}

echo json_encode($info, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
