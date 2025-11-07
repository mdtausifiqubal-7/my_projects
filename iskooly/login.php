<?php
// --- Response Object ---
header('Content-Type: application/json');
$response = ['status' => 'error', 'message' => 'An unknown error occurred.'];

try {
    // --- Database Configuration (Neon) ---
    // Get this from your Neon dashboard's "Connection Details" panel.
    // It will be a single URL string.
    $DATABASE_URL = "postgresql://neondb_owner:npg_VdTI0ouB4Jzm@ep-misty-tree-a19o2te8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"; 

    if (empty($DATABASE_URL) || $DATABASE_URL === "YOUR_NEON_DATABASE_URL_HERE") {
        throw new Exception('Please configure your $DATABASE_URL in login.php');
    }

    // Parse the Neon URL (e.g., postgres://user:password@host.neon.tech/dbname?sslmode=require)
    $db_parts = parse_url($DATABASE_URL);

    if (!$db_parts) {
        throw new Exception('Invalid Database URL');
    }

    $host = $db_parts['host'];
    $port = $db_parts['port'] ?? 5432;
    $username = $db_parts['user'];
    $password = $db_parts['pass'];
    $dbname = ltrim($db_parts['path'], '/');

    // Create the DSN (Data Source Name) for PDO
    // We force sslmode=require as Neon needs it.
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;user=$username;password=$password;sslmode=require";

    // --- 1. Create Connection (PDO) ---
    // We use PDO (PHP Data Objects) as it supports PostgreSQL (and many other dbs)
    $conn = new PDO($dsn);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);


    // --- 2. Get Data from POST ---
    if (!isset($_POST['email']) || !isset($_POST['password'])) {
        throw new Exception('Email and password are required.');
    }

    $email = $_POST['email'];
    $password = $_POST['password'];

    if (empty($email) || empty($password)) {
        throw new Exception('Please fill in all fields.');
    }

    // --- 3. Prepare and Execute Query ---
    // PDO uses prepare/execute similar to mysqli
    $stmt = $conn->prepare("SELECT password, role FROM users WHERE email = ?");
    $stmt->execute([$email]); // Pass parameters in an array

    // --- 4. Verify User ---
    // Fetch the user
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // User was found
        $hashed_password = $user['password'];
        $role = $user['role'];

        // --- IMPORTANT (Same as before) ---
        // This is the same demo bypass logic.
        // For a REAL app, use: password_verify($password, $hashed_password)
        
        $password_matches = false;
        if ($email === 'admin@school.com' && $password === 'admin123') $password_matches = true;
        if ($email === 'teacher@school.com' && $password === 'teacher123') $password_matches = true;
        if ($email === 'student@school.com' && $password === 'student123') $password_matches = true;
        if ($email === 'parent@school.com' && $password === 'parent123') $password_matches = true;

        if ($password_matches) {
            // Password is correct!
            session_start();
            $_SESSION['email'] = $email;
            $_SESSION['role'] = $role;

            $response['status'] = 'success';
            $response['message'] = 'Login Successful! Redirecting...';
            $response['role'] = $role; // Send the role back to the JavaScript
        } else {
            // Invalid password
            $response['message'] = 'Invalid email or password.';
        }
    } else {
        // No user found
        $response['message'] = 'Invalid email or password.';
    }

    // --- 5. Close Connections ---
    // Set to null to close
    $stmt = null;
    $conn = null;

} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

// --- 6. Send Response ---
echo json_encode($response);

?>
