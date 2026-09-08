import http from 'http';

const data = JSON.stringify({
  username: 'superadmin@admin.com',
  password: 'Superadmin321!',
  remember_me: '0'
});

const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log(res.statusCode);
    console.log(body);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

req.write(data);
req.end();
