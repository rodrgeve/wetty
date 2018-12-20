var maas_id = "unknown";
var maas_instance_id = "unknown";

updateMenuHandlers();
loadEnvironment();

// Wait for loading of environment variable content from server
setTimeout(function(){ loadCommands(); }, 5000);

var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      try {
        var response = JSON.parse(xhttp.responseText);
        maas_id = response.maas_id;
        maas_instance_id = response.maas_instance_id;
      } catch (e) {
        console.error("Error processing Maas Terminal configuration " + e);
        console.log("Maas configuration response: " + xhttp.responseText);
      }
    }
};
xhttp.open("GET", "/maas", true);
xhttp.send();

var editor = ace.edit("editor");
editor.setShowPrintMargin(false);
editor.setTheme("ace/theme/tomorrow_night_blue");

if (localStorage && localStorage.getItem('MaasTermNotes') != null) {
  //editor.session.setValue(localStorage.getItem('MaasTermNotes'));
}

editor.commands.addCommand({
    name: 'save',
    bindKey: {win: "Ctrl-S", "mac": "Cmd-S"},
    exec: function(editor) {
      /*
      console.log("Saving edits to local storage.", editor.session.getValue())
      localStorage.setItem("MaasTermNotes", editor.getValue())
      */

      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
            // Editor Content Saved
            //
            
          }
      };
      var content = editor.getSession().getValue();
      var requestPath = "/savefile/" + editorFileURL.replace("/", "%2f");
      xhttp.open("POST", requestPath, true);
      xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhttp.send(content);
    }
})
editor.commands.addCommand({
    name: 'openURL',
    bindKey: {win: "Ctrl-G", "mac": "Cmd-G"},
    exec: function(editor) {
      var selectedText = editor.getSession().doc.getTextRange(editor.selection.getRange());
      const isUrl = string => {
        try { 
          return Boolean(new URL(string)); }
        catch(e) {
          return false; 
        }
      }
      var destination = selectedText
      if (! isUrl(selectedText)) {
        // Do Google Search
        destination = "https://google.com/search?q=" + encodeURI(selectedText);
      }
      var win = window.open(destination, '_blank');
      win.focus();
    }
})
editor.commands.addCommand({
    name: 'execInTerm',
    bindKey: {win: "Ctrl-E", "mac": "Cmd-E"},
    exec: function(editor) {
      var selectedText = editor.getSession().doc.getTextRange(editor.selection.getRange());
      toggleTerm();
      term.io.sendString(selectedText + "\n");        
    }
})
editor.commands.addCommand({
    name: 'toggleToTerm',
    bindKey: {win: "Ctrl-T", "mac": "Cmd-T"},
    exec: function(editor) {
      toggleTerm();
    }
})
editor.commands.addCommand({
    name: 'showFileBrowser',
    bindKey: {win: "Ctrl-O", "mac": "Cmd-O"},
    exec: function(editor) {
      hideAll();
    }
})

editor.commands.addCommand({
    name: 'toggleToTerm',
    bindKey: {win: "Ctrl-K", "mac": "Cmd-K"},
    exec: function(editor) {
      var prepSearchQuery = /[{}\,\:\"]/g;
      var selectedText = editor.getSession().doc.getTextRange(editor.selection.getRange());
      search = selectedText.replace(prepSearchQuery, ' ');

      var destination = "http://" 
        + maas_id + "-" 
        + maas_instance_id 
        + "-monitoring.mymaas.net:5601/app/kibana#/discover"
        + "?_g=()&_a=(columns:!(_source),index:'70405550-e1d8-11e8-8898-292d558882d5',interval:auto,query:(language:lucene,"
        + "query:'maas_id:" 
        + maas_id + "-" 
        + maas_instance_id 
        + "%20AND%20log:("
        + encodeURI(search)
        + ")'),sort:!(_score,desc))";

      var win = window.open(destination, '_blank');
      win.focus();
    }
})