<?php
/**
 * send-email.php — Brevo (Sendinblue) SMTP API プロキシ
 * @version v20260309-0186-firebase | 2026-03-09 | webstudio-ledger
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$apiKey = getenv('BREVO_API_KEY') ?: '';

$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON body']);
    exit;
}

if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'BREVO_API_KEY が未設定です']);
    exit;
}

// Resend形式 → Brevo形式に変換
// Resend: { from, to: [...], cc: [...], subject, html, text }
// Brevo:  { sender:{name,email}, to:[{email,name}], cc:[{email}], subject, htmlContent, textContent }

function parseAddress($addr) {
    // "Name <email>" または "email" を { name, email } に変換
    if (preg_match('/^(.+?)\s*<(.+?)>$/', trim($addr), $m)) {
        return ['name' => trim($m[1]), 'email' => trim($m[2])];
    }
    return ['email' => trim($addr)];
}

$from = parseAddress($data['from'] ?? '');
$toList = array_map('parseAddress', (array)($data['to'] ?? []));
$ccList = array_map('parseAddress', (array)($data['cc'] ?? []));

$brevoPayload = [
    'sender'      => $from,
    'to'          => $toList,
    'subject'     => $data['subject'] ?? '',
    'htmlContent' => $data['html']    ?? '',
    'textContent' => $data['text']    ?? strip_tags($data['html'] ?? ''),
];
if (!empty($ccList)) $brevoPayload['cc'] = $ccList;

$ch = curl_init('https://api.brevo.com/v3/smtp/email');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($brevoPayload),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Accept: application/json',
        'api-key: ' . $apiKey,
    ],
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$response  = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL error: ' . $curlError]);
    exit;
}

// Brevo成功レスポンス: {"messageId":"..."} → Resend互換: {"id":"..."}
$result = json_decode($response, true);
if ($httpCode >= 200 && $httpCode < 300) {
    echo json_encode(['id' => $result['messageId'] ?? 'sent', 'success' => true]);
} else {
    http_response_code($httpCode);
    echo json_encode(['error' => $result['message'] ?? 'Brevo API error', 'detail' => $result]);
}
