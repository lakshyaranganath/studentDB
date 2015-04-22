// The root URL for the RESTful services
var rootUrl = "http://localhost/gamgam/api";

var currentStudent;

// Retrieve student and subject list when application starts
findAllStudents();
findAllSubjects();

// Nothing to delete in initial application state
$('#btnDeleteStudent').hide();


// Trigger search when pressing 'Return' on search key input field
$('#searchKey').keypress(function(e){
	if(e.which == 13) {
		search($('#searchKey').val());
		e.preventDefault();
		return false;
    }
});

$('#btnNewStudent').click(function() {
	newStudent();
	return false;
});

$('#btnSaveStudent').click(function() {
	if ($('#inputStudentId').val() === '')
		addStudent();
	else
		updateStudent();
	return false;
});

$('#btnDeleteStudent').click(function() {
	deleteStudent();
	return false;
});

$('#studentList a').live('click', function() {
	findById($(this).data('identity'));
  findStudentSubjects($(this).data('identity'));
});

function search(searchKey) {
	if (searchKey === '')
		findAllStudents();
	else
		findByName(searchKey);
}

function newStudent() {
	$('#btnDeleteStudent').hide();
	currentStudent = {};
	renderDetails(currentStudent); // Display empty form
}

function findAllStudents() {
	console.log('findAllStudents');
	$.ajax({
		type: 'GET',
		url: rootUrl + '/students',
		dataType: "json", // data type of response
		success: renderStudentList
	});
}

function findAllSubjects() {
  console.log('findAllSubjects');
  $.ajax({
    type: 'GET',
    url: rootUrl + '/subjects',
    dataType: "json", // data type of response
    success: renderSubjectSelect
  });
}

function findByName(searchKey) {
	console.log('findByName: ' + searchKey);
	$.ajax({
		type: 'GET',
		url: rootUrl + '/students' + '/search/' + searchKey,
		dataType: "json",
		success: renderStudentList
	});
}

function findById(id) {
	console.log('findById: ' + id);
	$.ajax({
		type: 'GET',
		url: rootUrl + '/students' + '/' + id,
		dataType: "json",
		success: function(data){
			$('#btnDeleteStudent').show();
			console.log('findById success: ' + data.name);
			currentStudent = data;
			renderDetails(currentStudent);
		}
	});
}

function findStudentSubjects(studentId) {
  console.log('findStudentSubjects: ' + studentId);
  $.ajax({
    type: 'GET',
    url: rootUrl + '/students' + '/' + studentId + '/subjects',
    dataType: "json",
    success: function(data) {
      renderStudentMarksList(data);
      populateSubjectSelect(data);
    }
  });
}

function addStudent() {
	console.log('addStudent');
	$.ajax({
		type: 'POST',
		contentType: 'application/json',
		url: rootUrl + '/students',
		dataType: "json",
		data: formToJSON(),
		success: function(data, textStatus, jqXHR){
			findAllStudents();
			alert('Student created successfully');
			$('#btnDeleteStudent').show();
			$('#inputStudentId').val(data.id);
		},
		error: function(jqXHR, textStatus, errorThrown){
			alert('addStudent error: ' + textStatus);
		}
	});
}

function updateStudent() {
	console.log('updateStudent');
	$.ajax({
		type: 'PUT',
		contentType: 'application/json',
		url: rootUrl + '/students' + '/' + $('#inputStudentId').val(),
		dataType: "json",
		data: formToJSON(),
		success: function(data, textStatus, jqXHR){
			findAllStudents();
      findStudentSubjects(currentStudent.id);
			alert('Student updated successfully');
		},
		error: function(jqXHR, textStatus, errorThrown){
			alert('updateStudent error: ' + textStatus);
		}
	});
}

function deleteStudent() {
	console.log('deleteStudent');
	$.ajax({
		type: 'DELETE',
		url: rootUrl + '/students' + '/' + $('#inputStudentId').val(),
		success: function(data, textStatus, jqXHR){
			findAllStudents();
			alert('Student deleted successfully');
		},
		error: function(jqXHR, textStatus, errorThrown){
			alert('deleteStudent error');
		}
	});
}

function renderStudentList(data) {
	// JAX-RS serializes an empty list as null, and a 'collection of one' as an object (not an 'array of one')
	var list = data === null ? [] : (data.student instanceof Array ? data.student : [data.student]);

	$('#studentList a').remove();
	$.each(list, function(index, student) {
		$('#studentList').append('<a href="#" class="list-group-item" data-identity="' + student.id + '">'+student.name+'</a>');
	});
}

function renderStudentMarksList(data) {
  // JAX-RS serializes an empty list as null, and a 'collection of one' as an object (not an 'array of one')
  var list = data === null ? [] : (data.subject instanceof Array ? data.subject : [data.subject]);
  var total = 0;
  $('#studentMarksList p').remove();
  $.each(list, function(index, subject) {
    total+=parseInt(subject.marks);
    $('#studentMarksList').append('<p class="list-group-item clearfix">'+subject.name+'<span class="pull-right">'+subject.marks+'</span></p>');
  });
  $('#studentMarksList').append('<p class="list-group-item clearfix">Total<span class="pull-right">'+total+'</span></p>');
}

function renderDetails(student) {
	$('#inputStudentId').val(student.id);
	$('#inputStudentName').val(student.name);
	$('#inputStudentDob').val(student.dob);
	$('#inputStudentAddress').val(student.address);
}

function renderSubjectSelect(data) {
  var list = data === null ? [] : (data.subject instanceof Array ? data.subject : [data.subject]);
  $.each(list, function(index, subject) {
    $('#inputSubjectsSelect').append('<option value="'+subject.id+'">'+subject.name+'</option>');
  });
}

function populateSubjectSelect(data) {
  var list = data === null ? [] : (data.subject instanceof Array ? data.subject : [data.subject]);
  var studentsSubjects = [];
  $.each(list, function(index, subject) {
    studentsSubjects.push(subject.subject_id);
  });
  $('#inputSubjectsSelect').val(studentsSubjects);
}

// Helper function to serialize all the form fields into a JSON string
function formToJSON() {
	return JSON.stringify({
		"id": $('#inputStudentId').val(),
		"name": $('#inputStudentName').val(),
		"dob": $('#inputStudentDob').val(),
		"address": $('#inputStudentAddress').val(),
    "subjectIds": $('#inputSubjectsSelect').val()
	});
}
