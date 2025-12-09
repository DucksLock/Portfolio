<?php
// contact.php - simple form handler for local XAMPP/PHP setups
// Recipient is kept server-side only so it's not exposed to the browser/devtools.
$recipient = 'duckslock@gmail.com';

// Helper: safe header injection prevention
function clean_header($str) {
    return trim(preg_replace('/[\r\n]+/', ' ', $str));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    // Redirect back to referring page when available, otherwise to index.html
    $ref = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'index.html';
    header('Location: ' . $ref);
    exit;
}

// Collect and sanitize input
$name = isset($_POST['name']) ? strip_tags(trim($_POST['name'])) : '';
$email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
$phone = isset($_POST['phone']) ? strip_tags(trim($_POST['phone'])) : '';
$subject = isset($_POST['subject']) ? strip_tags(trim($_POST['subject'])) : 'Website Contact';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

// Basic validation
$errors = [];
if ($name === '') { $errors[] = 'Name is required.'; }
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) { $errors[] = 'A valid email is required.'; }
if ($message === '') { $errors[] = 'Message is required.'; }

// Enforce length limits
if (mb_strlen($name) > 50) { $errors[] = 'Name must be 50 characters or fewer.'; }
if (mb_strlen($subject) > 50) { $errors[] = 'Subject must be 50 characters or fewer.'; }
if (mb_strlen($message) > 1000) { $errors[] = 'Message must be 1000 characters or fewer.'; }

// Phone validation (optional). Allow digits, spaces, +, -, parentheses and dots. Length 7-25
if ($phone !== '') {
    $cleanPhone = preg_replace('/[\s\-\.\(\)\+]/', '', $phone);
    if (!ctype_digit($cleanPhone) || strlen($cleanPhone) < 7 || strlen($cleanPhone) > 25) {
        $errors[] = 'Phone number looks invalid.';
    }
}

if (!empty($errors)) {
    // Redirect back with an error code to the referring page if possible
    $err = rawurlencode(implode(' ', $errors));
    $ref = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'index.html';
    $sep = (strpos($ref, '?') === false) ? '?' : '&';
    header('Location: ' . $ref . $sep . 'status=error&msg=' . $err . '#contact');
    exit;
}

// Build email
$clean_subject = clean_header($subject);
$email_subject = "Contact form: {$clean_subject}";

$body = "You have received a new message from your website contact form:\n\n";
$body .= "Name: " . $name . "\n";
$body .= "Email: " . $email . "\n";
$body .= "Phone: " . $phone . "\n\n";
$body .= "Message:\n" . $message . "\n";

$headers = [];
$headers[] = 'From: ' . clean_header($name) . " <" . clean_header($email) . ">";
$headers[] = 'Reply-To: ' . clean_header($email);
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/plain; charset=utf-8';

// Try to send mail
$sent = false;
try {
    // On many local XAMPP installs mail() is not configured. If your server supports mail(), this will work.
    $sent = mail($recipient, $email_subject, $body, implode("\r\n", $headers));
} catch (Exception $e) {
    $sent = false;
}

if ($sent) {
    $ref = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'index.html';
    $sep = (strpos($ref, '?') === false) ? '?' : '&';
    header('Location: ' . $ref . $sep . 'status=success#contact');
    exit;
} else {
    // Optionally write to a log for local debugging
    $logLine = date('Y-m-d H:i:s') . " - Mail failed. From: {$email} | Subject: {$clean_subject}\n";
    @file_put_contents(__DIR__ . '/contact_errors.log', $logLine, FILE_APPEND);

    $ref = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'index.html';
    $sep = (strpos($ref, '?') === false) ? '?' : '&';
    header('Location: ' . $ref . $sep . 'status=error&msg=' . rawurlencode('Unable to send email from server. Check mail configuration.') . '#contact');
    exit;
}

?>