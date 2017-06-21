var issueTrackingTypes = ["jira"];


function loadOptions() {
  chrome.storage.sync.get({
    issueTracking : '',
    taskTracking : {
      jira : {
        baseUrl : ''
      }
    },
    prFileCollapse : false
  }, function(items) {

    // push store data into form elements
    document.getElementById('issueTracking').value = items.issueTracking;
    document.getElementById('prFileCollapse').checked = items.prFileCollapse;
    document.getElementById('jiraBaseUrl').value = items.taskTracking.jira.baseUrl;

    // update issue tracking view
    changeIssueTracking();
  });
}

function changeIssueTracking() {
  var issueTrackingType = document.getElementById('issueTracking').value;

  if (issueTrackingType == "") {
    document.getElementById('sectionIssueTracking').classList.add('hidden');
    return;
  }

  // hide all types first
  for (var t in issueTrackingTypes) {
    document.getElementById(issueTrackingTypes[t] + 'Options').classList.add('hidden');
  }

  // show overall div
  document.getElementById('sectionIssueTracking').classList.remove('hidden');

  document.getElementById(issueTrackingType + 'Options').classList.remove('hidden');
}

function saveOptions() {
  chrome.storage.sync.set({
    issueTracking: document.getElementById("issueTracking").value,
    taskTracking : {
      jira : {
        baseUrl : document.getElementById('jiraBaseUrl').value
      }
    },
    prFileCollapse : document.getElementById('prFileCollapse').checked
  }, function() {
    var notificationElement = document.getElementById('notification');
    notificationElement.textContent = 'Options saved.';
    window.scrollTo(0, 0);
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function clearOptions() {
  chrome.storage.sync.remove(['issueTracking', 'taskTracking', 'prFileCollapse']);
  loadOptions();
  saveOptions();
}

document.addEventListener('DOMContentLoaded', loadOptions);
document.getElementById("save").addEventListener("click", saveOptions);
document.getElementById("clear").addEventListener("click", clearOptions);
document.getElementById("issueTracking").addEventListener("change", changeIssueTracking);
