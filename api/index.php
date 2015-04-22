<?php
require 'Slim/Slim.php';
\Slim\Slim::registerAutoloader();
$app = new \Slim\Slim(array(
    'debug' => true
));

$res = $app->response();
$res->header('Access-Control-Allow-Origin', '*');
$res->header("Access-Control-Allow-Methods: PUT, GET, POST, DELETE, OPTIONS");

$app->get('/students', 'getStudents');
$app->get('/students/:id', 'getStudent');
$app->get('/students/:id/subjects', 'getStudentSubjects');
$app->put('/students/:studentId/subjects/:subjectId', 'updateStudentSubjectMarks');
$app->get('/students/search/:query', 'findStudentByName');
$app->post('/students', 'addStudent');
$app->put('/students/:id', 'updateStudent');
$app->delete('/students/:id', 'deleteStudent');

$app->get('/subjects', 'getSubjects');
$app->get('/subjects/:id', 'getSubject');
$app->get('/subjects/:id/students', 'getSubjectStudents');
$app->get('/subjects/search/:query', 'findSubjectByName');
$app->post('/subjects', 'addSubject');
$app->put('/subjects/:id', 'updateSubject');
$app->delete('/subjects/:id', 'deleteSubject');


function getStudents() {
    $sql = "select * FROM students ORDER BY name";
    try {
        $db = getConnection();
        $stmt = $db->query($sql);
        $students = $stmt->fetchAll(PDO::FETCH_OBJ);
        $db = null;
        echo '{"student": ' . json_encode($students) . '}';
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}

function getStudent($id) {
    $sql = "SELECT * FROM students WHERE id=:id";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("id", $id);
        $stmt->execute();
        $student = $stmt->fetchObject();
        $db = null;
        echo json_encode($student);
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}


function getStudentSubjects($id) {
    $sql = "SELECT * FROM marks WHERE student_id=:id";
    $sql2 = "SELECT * FROM subjects WHERE id=:subject_id";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("id", $id);
        $stmt->execute();
        $subjects = $stmt->fetchAll(PDO::FETCH_OBJ);

        foreach($subjects as $subject) {
            $stmt = $db->prepare($sql2);
            $stmt->bindParam("subject_id", $subject->subject_id);
            $stmt->execute();
            $subject->name = $stmt->fetchObject()->name;
        }

        $db = null;
        echo '{"subject": ' . json_encode($subjects) . '}';
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}

function addStudent() {
    $app = new \Slim\Slim();
    $request = $app->request;
    $student = json_decode($request->getBody());
    $sql = "INSERT INTO students (name, dob, address) VALUES (:name, :dob, :address)";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("name", $student->name);
        $stmt->bindParam("dob", $student->dob);
        $stmt->bindParam("address", $student->address);
        $stmt->execute();
        $student->id = $db->lastInsertId();
        $db = null;
        echo json_encode($student);
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}

function updateStudent($id) {
    $app = new \Slim\Slim();
    $request = $app->request;
    $body = $request->getBody();
    $student = json_decode($body);

    function manageStudentSubjects($studentId, $subjectIds) {
        $sql = "DELETE FROM marks WHERE student_id=:studentId";
        $sql2 = "INSERT INTO marks (student_id, subject_id, marks) VALUES (:studentId, :subjectId, 0)";
        $db = getConnection();

//      delete non-selected subjects
        $stmt = $db->prepare($sql);
        $stmt->bindParam("studentId", $studentId);
        $stmt->execute();

//      add new relations
        foreach($subjectIds as $subjectId) {
            $stmt = $db->prepare($sql2);
            $stmt->bindParam("studentId", $studentId);
            $stmt->bindParam("subjectId", $subjectId);
            $stmt->execute();
        }

        $db = null;
    }

    manageStudentSubjects($id, $student->subjectIds);

    $sql = "UPDATE students SET name=:name, dob=:dob, address=:address WHERE id=:id";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("name", $student->name);
        $stmt->bindParam("dob", $student->dob);
        $stmt->bindParam("address", $student->address);
        $stmt->bindParam("id", $id);
        $stmt->execute();
        $db = null;
        echo json_encode($student);
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }

}

function updateStudentSubjectMarks($studentId, $subjectId) {
    $app = new \Slim\Slim();
    $request = $app->request;
    $body = $request->getBody();
    $subject = json_decode($body);
    $sql = "UPDATE marks SET marks=:marks WHERE student_id=:studentId AND subject_id=:subjectId";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("studentId", $studentId);
        $stmt->bindParam("subjectId", $subjectId);
        $stmt->bindParam("marks", $subject->marks);
        $stmt->execute();
        $db = null;
        echo json_encode($subject);
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}

function deleteStudent($id) {
    $sql = "DELETE FROM students WHERE id=:id";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("id", $id);
        $stmt->execute();
        $db = null;
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}

function findStudentByName($query) {
    $sql = "SELECT * FROM students WHERE UPPER(name) LIKE :query ORDER BY name";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $query = "%".$query."%";
        $stmt->bindParam("query", $query);
        $stmt->execute();
        $students = $stmt->fetchAll(PDO::FETCH_OBJ);
        $db = null;
        echo '{"student": ' . json_encode($students) . '}';
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}





// SUBJECT FUNCTIONS



function getSubjects() {
    $sql = "select * FROM subjects ORDER BY name";
    try {
        $db = getConnection();
        $stmt = $db->query($sql);
        $subjects = $stmt->fetchAll(PDO::FETCH_OBJ);
        $db = null;
        echo '{"subject": ' . json_encode($subjects) . '}';
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}

function getSubject($id) {
    $sql = "SELECT * FROM subjects WHERE id=:id";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("id", $id);
        $stmt->execute();
        $subject = $stmt->fetchObject();
        $db = null;
        echo json_encode($subject);
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}

function getSubjectStudents($id) {
    $sql = "SELECT * FROM marks WHERE subject_id=:id";
    $sql2 = "SELECT * FROM students WHERE id=:student_id";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("id", $id);
        $stmt->execute();
        $students = $stmt->fetchAll(PDO::FETCH_OBJ);

        foreach($students as $student) {
            $stmt = $db->prepare($sql2);
            $stmt->bindParam("student_id", $student->student_id);
            $stmt->execute();
            $student->name = $stmt->fetchObject()->name;
        }

        $db = null;
        echo '{"student": ' . json_encode($students) . '}';
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}

function addSubject() {
    $app = new \Slim\Slim();
    $request = $app->request;
    $subject = json_decode($request->getBody());
    $sql = "INSERT INTO subjects (name) VALUES (:name)";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("name", $subject->name);
        $stmt->execute();
        $subject->id = $db->lastInsertId();
        $db = null;
        echo json_encode($subject);
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}

function updateSubject($id) {
    $app = new \Slim\Slim();
    $request = $app->request;
    $body = $request->getBody();
    $subject = json_decode($body);
    $sql = "UPDATE subjects SET name=:name WHERE id=:id";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("name", $subject->name);
        $stmt->bindParam("id", $id);
        $stmt->execute();
        $db = null;
        echo json_encode($subject);
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}

function deleteSubject($id) {
    $sql = "DELETE FROM subjects WHERE id=:id";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("id", $id);
        $stmt->execute();
        $db = null;
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}

function findSubjectByName($query) {
    $sql = "SELECT * FROM subjects WHERE UPPER(name) LIKE :query ORDER BY name";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $query = "%".$query."%";
        $stmt->bindParam("query", $query);
        $stmt->execute();
        $subjects = $stmt->fetchAll(PDO::FETCH_OBJ);
        $db = null;
        echo '{"subject": ' . json_encode($subjects) . '}';
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}



function getConnection() {
    $dbhost="localhost";
    $dbuser="root";
    $dbpass="root";
    $dbname="gamgam";
    $dbh = new PDO("mysql:host=$dbhost;dbname=$dbname", $dbuser, $dbpass);
    $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $dbh;
}

$app->run();