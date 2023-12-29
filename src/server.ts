import * as http from 'http';
import * as url from 'url';
import { handleUsersRoute } from './userHandler';

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url!, true);

  const pathSegments = parsedUrl.pathname?.split('/').slice(1);

  let pathFound = false;

  if (pathSegments) {
    if(pathSegments[0] == 'users'){
      const userId = pathSegments[1];
      handleUsersRoute(req, res, userId);
      pathFound = true;
    }
  }
  
  if (!pathFound) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
