<?php
// デバッグ用：自社情報取得テスト（確認後は削除してください）
header('Content-Type: application/json; charset=utf-8');

$sbUrl = getenv('SUPABASE_URL');
$sbKey = getenv('SUPABASE_ANON_KEY');

$result = [
    'SUPABASE_URL_set'      => !empty($sbUrl),
    'SUPABASE_ANON_KEY_set' => !empty($sbKey),
    'SUPABASE_URL'          => $sbUrl ? substr($sbUrl, 0, 40) . '...' : '(未設定)',
];

if ($sbUrl && $sbKey) {
    $apiUrl = rtrim($sbUrl, '/') . '/rest/v1/company_settings?id=eq.1&limit=1';
    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 5,
        CURLOPT_HTTPHEADER     => [
            'apikey: ' . $sbKey,
            'Authorization: Bearer ' . $sbKey,
            'Accept: application/json',
        ],
    ]);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    $result['http_status'] = $code;
    $result['curl_error']  = $err ?: null;
    $result['raw_response'] = $res ?: null;

    if ($res) {
        $rows = json_decode($res, true);
        $result['rows_count'] = count($rows ?? []);
        $result['first_row']  = !empty($rows[0]) ? array_map(fn($v) => is_string($v) && strlen($v) > 50 ? substr($v,0,50).'...(truncated)' : $v, $rows[0]) : null;
    }
} else {
    $result['error'] = 'SUPABASE_URL または SUPABASE_ANON_KEY が未設定';
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
