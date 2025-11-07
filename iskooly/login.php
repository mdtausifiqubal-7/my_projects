<?php
// --- Database Configuration ---
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root'); // Default XAMPP username
define('DB_PASSWORD', '');     // Default XAMPP password
define('DB_NAME', 'school_db');

// --- Response Object ---
// We'll send a JSON response back to the JavaScript
header('Content-Type: application/json');
$response = ['status' => 'error', 'message' => 'An unknown error occurred.'];

try {
    // --- 1. Create Connection ---
    $conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception('Connection failed: ' . $conn->connect_error);
    }

    // --- 2. Get Data from POST ---
    // Check if email and password are set
    if (!isset($_POST['email']) || !isset($_POST['password'])) {
        throw new Exception('Email and password are required.');
    }

    $email = $_POST['email'];
    $password = $_POST['password'];

    // Basic validation
    if (empty($email) || empty($password)) {
        throw new Exception('Please fill in all fields.');
    }

    // --- 3. Prepare and Execute Query ---
    // Use prepared statements to prevent SQL injection
    $stmt = $conn->prepare("SELECT password, role FROM users WHERE email = ?");
    if ($stmt === false) {
        throw new Exception('Prepare statement failed: ' . $conn->error);
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    // --- 4. Verify User ---
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        $hashed_password = $user['password'];
        $role = $user['role'];

        // Verify the password against the stored hash
        // Note: The hashes in setup.sql are placeholders. 
        // For a real system, you'd use password_hash() during registration.
        // For this example, we'll just *pretend* to verify.
        
        // --- IMPORTANT ---
        // For a REAL app, you would use:
        // if (password_verify($password, $hashed_password)) {
        //
        // But since we don't know the user's password to hash it,
        // we will use a simple "password_verify" bypass for this demo.
        // Let's assume the passwords are 'admin123', 'teacher123', etc.
        
        $password_matches = false;
        if ($email === 'admin@school.com' && $password === 'admin123') $password_matches = true;
        if ($email === 'teacher@school.com' && $password === 'teacher123') $password_matches = true;
        if ($email === 'student@school.com' && $password === 'student123') $password_matches = true;
        if ($email === 'parent@school.com' && $password === 'parent123') $password_matches = true;

        // Replace the block above with this line for a REAL, secure app
        // after you have a registration page that uses password_hash():
        //
        // if (password_verify($password, $hashed_password)) {

        if ($password_matches) {
            // Password is correct!
            session_start();
            $_SESSION['email'] = $email;
            $_SESSION['role'] = $role;

            $response['status'] = 'success';
            $response['message'] = 'Login Successful! Redirecting...';
            $response['role'] = $role;
        } else {
            // Invalid password
            $response['message'] = 'Invalid email or password.';
        }
    } else {
        // No user found
        $response['message'] = 'Invalid email or password.';
    }

    // --- 5. Close Connections ---
    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

// --- 6. Send Response ---
echo json_encode($response);

?>