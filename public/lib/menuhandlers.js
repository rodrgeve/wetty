var termVisibility = true;
var editorFileURL = "";
var environment = "";

function updateMenuHandlers() {
  $('.dropdown-submenu a.test').on("click", function(e){
      $('ul.dropdown-menu #sub').hide();
      $(this).next('ul').toggle();

      e.stopPropagation();
      e.preventDefault();
    });
}

function htmlDecode(value){ 
  return $('<div/>').html(value).text(); 
}

function htmlEncode(value) {
  return $('<div/>').text(value).html(); 
}

function handleEnvContentResponse(prop) {
  var myProp = prop;
  return function (e) {
    if (this.readyState == 4 && this.status == 200) {
      // Replace environment variable contents with those from file
      //
      var template = Handlebars.compile(htmlEncode(this.responseText));
      //environment[myProp] = decodeURIComponent(template(environment));
      environment[myProp] = template(environment);
      console.log("Content: " + environment[myProp]);
      }
   }
}

function loadEnvironment() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      // Load command environment definitions
      //
        try {
          var response = JSON.parse(xhttp.responseText);

          // Prepare environment substitutions
          environment = response.environment;
    
          for (var prop in environment) {
            if (environment.hasOwnProperty(prop)) {
              if (environment[prop].includes("file://")) {
                // Handle 'file://' environment spec
                //
                var fileRef = environment[prop].split("//")[1];
                
                var xhttp2 = new XMLHttpRequest();
                xhttp2.onreadystatechange = handleEnvContentResponse(prop, xhttp2);
                xhttp2.open("GET", "https://localhost:8089/b?f=" + fileRef.replace("/", "%2f"), true);
                xhttp2.send();
              } else if (environment[prop].includes("basicauth://")) {
                // Handle 'basicauth://' environment spec
                var template = Handlebars.compile(environment[prop].split('//')[1]);
                environment[prop] = decodeURIComponent(btoa(template(environment)));
              }
            }
          }

        } catch (e) {
          console.error("Error processing commands.json specification! " + e);
          console.log("Error in content: " + xhttp.responseText);
        }
      }
    };
    xhttp.open("GET", "https://localhost:8089/b?f=commands.json", true);
    xhttp.send();
}

function loadCommands() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      // Load commands menu
      //
      if (this.readyState == 4 && this.status == 200) {
        try {
          var response = JSON.parse(xhttp.responseText);
          var html = "";
      
          for (const submenu of response.menus) {
            html = '<li class="dropdown-submenu"><a class="test" href="#">'
              + submenu.submenu
              + '<span class="caret"></span></a><ul id="sub" class="dropdown-menu">';
            for (const cmd of submenu.commands) {
              var template = Handlebars.compile(htmlDecode(cmd.shell));
           debugger; 
              html += '<li><a tabindex="-1" href=\'#\' onclick=\"window.execCommand(\'' 
                + btoa(htmlDecode(htmlDecode(template(environment))))
                + '\');" >' 
                + cmd.description 
                + '</a></li>';
            }
            html += '</ul></li>';
            $('#Commands').append(html);
          }

          updateMenuHandlers();

          maas_id = response.maas_id;
          maas_instance_id = response.maas_instance_id;
        } catch (e) {
          console.error("Error processing commands.json specification! " + e);
          console.log("Error in content: " + xhttp.responseText);
        }
      }
    }
  };
  xhttp.open("GET", "https://localhost:8089/b?f=commands.json", true);
  xhttp.send();
}

function loadEditorContent(fileUrl) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        // Load Editor Content
        //
        var url = new URL(fileUrl);
        var filePath = url.searchParams.get("f");
        editorFileURL = filePath;
        editor.session.setValue(xhttp.responseText);
        showEditor();
      }
  };
  xhttp.open("GET", fileUrl, true);
  xhttp.send();
}

function editClipboard() {
  var clipboardContents = navigator.clipboard.readText()
  .then(text => {
     editor.session.setValue(text);
     editorFileURL = "";
     showEditor();
  })
  .catch(err => {
     console.log('Could not access browser clipboard, error: ', err);
  });
}

function showEditor() {
  document.getElementById("terminal").style.visibility= 'hidden';
  document.getElementById("editor").style.visibility= 'visible';
  document.getElementById("editor").focus();
  editor.focus();
}

function showTerm() {
  document.getElementById("terminal").style.visibility= 'visible';
  document.getElementById("editor").style.visibility= 'hidden';
  document.getElementById("terminal").focus();
}

function hideAll() {
  document.getElementById("editor").style.visibility= 'hidden';
  document.getElementById("terminal").style.visibility= 'hidden';
}

function sshToTarget() {
  let url = new URL(window.location.href);
  let searchParams = new URLSearchParams(url.search);
  term.io.sendString('ssh -i .ec2.pem ubuntu@' + searchParams.get('targetNode') + "\n");        
  document.getElementById("terminal").focus();
}
function launchCLI() {
  term.io.sendString('sudo docker exec -it solace bash -c "cd /usr/sw/loads/currentload/bin; cli -A" \n');
  document.getElementById("terminal").focus();
}

function execCommand(cmd) {
  $('ul.dropdown-menu #sub').hide();
              
  showTerm();
  term.io.sendString(atob(cmd));  
}