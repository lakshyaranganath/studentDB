// The root URL for the RESTful services
var rootUrl = "http://localhost/gamgam/api";
var studentsUrl = "/students";
var subjectsUrl = "/subjects";

var currentSubject;
var currentStudentId;
var marksList;
// Retrieve subject list when application starts
findAllSubjects();

// Nothing to delete in initial application state
$('#btnDeleteSubject').hide();

// Trigger search when pressing 'Return' on search key input field
$('#searchKey').keypress(function(e){
  if(e.which == 13) {
    search($('#searchKey').val());
    e.preventDefault();
    return false;
  }
});

$('#btnNewSubject').click(function() {
  newSubject();
  return false;
});

$('#btnSaveSubject').click(function() {
  if ($('#inputSubjectId').val() === '')
    addSubject();
  else
    updateSubject();
  return false;
});

$('#btnSaveMarks').live('click', function() {
  $.each(marksList, function(index, subject) {
    updateStudentSubjectMarks(subject.subject_id);
  });
  alert('Updated Student Marks!');
});

$('#btnDeleteSubject').click(function() {
  deleteSubject();
  return false;
});

$('#subjectList a').live('click', function() {
  findById($(this).data('identity'));
  findSubjectStudents($(this).data('identity'));
});

$('#subjectStudentsList a').live('click', function() {
  currentStudentId = $(this).data('identity');
  findStudentSubjects(currentStudentId);
});

function search(searchKey) {
  if (searchKey === '')
    findAllSubjects();
  else
    findByName(searchKey);
}

function newSubject() {
  $('#btnDeleteSubject').hide();
  currentSubject = {};
  renderDetails(currentSubject); // Display empty form
}

function findAllSubjects() {
  console.log('findAllSubjects');
  $.ajax({
    type: 'GET',
    url: rootUrl + '/subjects',
    dataType: "json", // data type of response
    success: renderSubjectList
  });
}

function findByName(searchKey) {
  console.log('findByName: ' + searchKey);
  $.ajax({
    type: 'GET',
    url: rootUrl + '/subjects' + '/search/' + searchKey,
    dataType: "json",
    success: renderSubjectList
  });
}

function findById(id) {
  console.log('findById: ' + id);
  $.ajax({
    type: 'GET',
    url: rootUrl + '/subjects' + '/' + id,
    dataType: "json",
    success: function(data){
      $('#btnDeleteSubject').show();
      console.log('findById success: ' + data.name);
      currentSubject = data;
      renderDetails(currentSubject);
    }
  });
}

function findSubjectStudents(subjectId) {
  console.log('findSubjectStudents: ' + subjectId);
  $.ajax({
    type: 'GET',
    url: rootUrl + '/subjects' + '/' + subjectId + '/students',
    dataType: "json",
    success: renderSubjectStudentsList
  });
}

function findStudentSubjects(studentId) {
  console.log('findStudentSubjects: ' + studentId);
  $.ajax({
    type: 'GET',
    url: rootUrl + '/students' + '/' + studentId + '/subjects',
    dataType: "json",
    success: renderStudentMarksList
  });
}

function addSubject() {
  console.log('addSubject');
  $.ajax({
    type: 'POST',
    contentType: 'application/json',
    url: rootUrl + '/subjects',
    dataType: "json",
    data: formToJSON(),
    success: function(data, textStatus, jqXHR){
      findAllSubjects();
      alert('Subject created successfully');
      $('#btnDeleteSubject').show();
      $('#inputSubjectId').val(data.id);
    },
    error: function(jqXHR, textStatus, errorThrown){
      alert('addSubject error: ' + textStatus);
    }
  });
}

function updateSubject() {
  console.log('updateSubject');
  $.ajax({
    type: 'PUT',
    contentType: 'application/json',
    url: rootUrl + '/subjects' + '/' + $('#inputSubjectId').val(),
    dataType: "json",
    data: formToJSON(),
    success: function(data, textStatus, jqXHR){
      findAllSubjects();
      alert('Subject updated successfully');
    },
    error: function(jqXHR, textStatus, errorThrown){
      alert('updateSubject error: ' + textStatus);
    }
  });
}

function updateStudentSubjectMarks(subjectId) {
  console.log('updateStudentSubjectMarks');
  $.ajax({
    type: 'PUT',
    contentType: 'application/json',
    url: rootUrl + '/students' + '/' + currentStudentId + '/subjects' + '/' + subjectId,
    dataType: "json",
    data: JSON.stringify({
      "marks": $('#inputSubjectMarks'+subjectId).val()
    }),
    success: function(data, textStatus, jqXHR){
    },
    error: function(jqXHR, textStatus, errorThrown){
      alert('updateStudentSubjectMarks error: ' + textStatus);
    }
  });
}


function deleteSubject() {
  console.log('deleteSubject');
  $.ajax({
    type: 'DELETE',
    url: rootUrl + '/subjects' + '/' + $('#inputSubjectId').val(),
    success: function(data, textStatus, jqXHR){
      findAllSubjects();
      newSubject();
      alert('Subject deleted successfully');
    },
    error: function(jqXHR, textStatus, errorThrown){
      alert('deleteSubject error');
    }
  });
}

function renderSubjectList(data) {
  // JAX-RS serializes an empty list as null, and a 'collection of one' as an object (not an 'array of one')
  var list = data === null ? [] : (data.subject instanceof Array ? data.subject : [data.subject]);

  $('#subjectList a').remove();
  $.each(list, function(index, subject) {
    $('#subjectList').append('<a href="#" class="list-group-item" data-identity="' + subject.id + '">'+subject.name+'</a>');
  });
}

function renderSubjectStudentsList(data) {
  // JAX-RS serializes an empty list as null, and a 'collection of one' as an object (not an 'array of one')
  var list = data === null ? [] : (data.student instanceof Array ? data.student : [data.student]);
  $('#studentMarksList div').remove();
  $('#subjectStudentsList a').remove();
  $.each(list, function(index, student) {
    $('#subjectStudentsList').append('<a href="#" class="list-group-item" data-identity="' + student.student_id + '">'+student.name+'</a>');
  });
}

function renderStudentMarksList(data) {
  // JAX-RS serializes an empty list as null, and a 'collection of one' as an object (not an 'array of one')
  var list = data === null ? [] : (data.subject instanceof Array ? data.subject : [data.subject]);
  marksList = list;

  $('#studentMarksList div').remove();
  $.each(list, function(index, subject) {
    $('#studentMarksList').append('' +
      '<div class="form-group">' +
        '<label for="inputSubjectMarks'+subject.subject_id+'" class="col-sm-6 control-label">'+subject.name+'</label>' +
        '<div class="col-sm-2 col-sm-offset-2">' +
          '<input type="text" class="form-control" value="'+subject.marks+'" id="inputSubjectMarks'+subject.subject_id+'">' +
        '</div>' +
      '</div>'
    );
  });

  $('#studentMarksList').append('' +
    '<div class="form-group">' +
      '<div class="col-sm-2 col-sm-offset-8">' +
        '<button id="btnSaveMarks" type="submit" class="btn btn-primary">Save</button>' +
      '</div>' +
    '</div>'
  );

}

function renderDetails(subject) {
  $('#inputSubjectId').val(subject.id);
  $('#inputSubjectName').val(subject.name);
}

// Helper function to serialize all the form fields into a JSON string
function formToJSON() {
  return JSON.stringify({
    "id": $('#inputSubjectId').val(),
    "name": $('#inputSubjectName').val()
  });
}