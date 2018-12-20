import express from 'express';
import http from 'http';
import https from 'https';
import path from 'path';
import server from 'socket.io';
import { spawn } from 'node-pty';
import EventEmitter from 'events';
import favicon from 'serve-favicon';
const fs = require('fs');
const process = require('process');

const app = express();
const workingDir = process.cwd();

app.use(favicon(`${__dirname}/public/favicon.ico`));
// For using wetty at /wetty on a vhost
app.get('/wetty/ssh/:user', (req, res) => {
  res.sendFile(`${__dirname}/public/wetty/index.html`);
});
app.get('/wetty/', (req, res) => {
  res.sendFile(`${__dirname}/public/wetty/index.html`);
});
// For using wetty on a vhost by itself
app.get('/ssh/:user', (req, res) => {
  res.sendFile(`${__dirname}/public/wetty/index.html`);
});
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/public/wetty/index.html`);
});

app.post('/savefile/:fileName', (req, res) => {
  var body = '';
  
  var filePath = workingDir 
    + "/"
    + req.params.fileName.replace('%2f', '/termdata/');

  console.log("Saving contents for file: " + filePath);
  
  req.on('data', function(data) {
      body += data;
  });

  req.on('end', function (){
    fs.writeFile(filePath, body, function() {
      res.end();
    });
  });
});

// For serving css and javascript
app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/options', (req, res) => {
  res.sendFile(`${__dirname}/termdata/options.current`);
});

function createServer(port, sslopts) {
  return sslopts && sslopts.key && sslopts.cert
    ? https.createServer(sslopts, app).listen(port, () => {
      console.log(`https on port ${port}`);
    })
    : http.createServer(app).listen(port, () => {
      console.log(`http on port ${port}`);
    });
}

function getCommand(socket, sshuser, sshhost, sshport, sshauth, sshkey) {
  const { request } = socket;
  const match = request.headers.referer.match('.+/ssh/.+$');
  const sshAddress = sshuser ? `${sshuser}@${sshhost}` : sshhost;
  const sshPath = sshuser || match ? 'ssh' : path.join(__dirname, 'bin/ssh');
  const ssh = match ? `${match[0].split('/ssh/').pop()}@${sshhost}` : sshAddress;
  const sshRemoteOptsBase = [
                            sshPath,
                            ssh,
                            '-p',
                            sshport,
                            '-o',
                            `PreferredAuthentications=${sshauth}`,
                            ]
  const sshRemoteOpts = sshkey ? sshRemoteOptsBase.concat(['-i', sshkey])
                               : sshRemoteOptsBase

  return [
    process.getuid() === 0 && sshhost === 'localhost'
      ? ['login', '-h', socket.client.conn.remoteAddress.split(':')[3]]
      : sshRemoteOpts
      ,
    ssh,
  ];
}

export default function start(port, sshuser, sshhost, sshport, sshauth, sshkey, sslopts) {
  const events = new EventEmitter();
  const io = server(createServer(port, sslopts), { path: '/wetty/socket.io' });
  io.on('connection', socket => {
    console.log(`${new Date()} Connection accepted.`);
    const [args, ssh] = getCommand(socket, sshuser, sshhost, sshport, sshauth, sshkey);
    const term = spawn('/usr/bin/env', args, {
      name: 'xterm-256color',
      cols: 80,
      rows: 30,
    });

    console.log(`${new Date()} PID=${term.pid} STARTED on behalf of user=${ssh}`);
    term.on('data', data => socket.emit('output', data));
    term.on('exit', code => {
      console.log(`${new Date()} PID=${term.pid} ENDED`);
      socket.emit('logout');
      events.emit('exit', code);
    });
    socket.on('resize', ({ col, row }) => term.resize(col, row));
    socket.on('input', input => term.write(input));
    socket.on('disconnect', () => {
      term.end();
      term.destroy();
      events.emit('disconnect');
    });
  });
  return events;
}
