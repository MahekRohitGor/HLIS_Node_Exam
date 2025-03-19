<?php
    echo "<html>";
    echo "<head>";
    echo "<title>About us - Prep-it</title>";
    echo "<link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'>";
    echo "</head>";

    $mysqli = new mysqli("localhost", "root", "mahek1717", "prepit");

    // Check connection
    if ($mysqli->connect_error) {
        echo "Failed to connect to MYSQL: " . $mysqli->connect_error;
        die("Connection failed: " . $mysqli->connect_error);
    }

    // Fetch "About Us" details
    $qry_plan = "SELECT title, descp FROM tbl_info WHERE title = 'About Us' AND is_deleted = 0";
    $db_result = $mysqli->query($qry_plan);

    echo "<body>";
    echo "<div class='container mt-5'>";
    echo "<div class='row'>";
    echo "<div class='col-md-12'>";

    if ($db_result->num_rows > 0) {
        while ($row = $db_result->fetch_assoc()) {
            echo "<h3>" . "About Us" . "</h3>";
            echo "<p>" . nl2br(htmlspecialchars($row['descp'])) . "</p>";
        }
    } else {
        echo "<p>No information available.</p>";
    }

    echo "</div>";
    echo "</div>";
    echo "</div>";
    echo "</body>";
    echo "</html>";

    // Close connection
    $mysqli->close();
?>