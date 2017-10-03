var port;

document.getElementById('path').blur();

chrome.tabs.getSelected(null, function(tab) {
  port = chrome.tabs.connect(tab.id, {
    name: 'pullrequest'
  });


  // check to see if we're in a diff view
  if (tab.url.match(/pull\/[0-9]+\/files/)) {
    document.getElementById('blocker').classList.add('enabled');
    document.getElementById('focusholder').tabIndex = '-1';
    document.getElementById('path').tabIndex = '0';
    document.getElementById('path').focus();
  }

});


function collapse() {
  var path = document.getElementById('path').value;
  port.postMessage({
    collapse: path
  });
}

function expand() {
  var path = document.getElementById('path').value;
  port.postMessage({
    expand: path
  });
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('#collapse').addEventListener('click', collapse);
  document.querySelector('#expand').addEventListener('click', expand);
});
