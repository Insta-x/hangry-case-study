import * as http from 'http';
import { isValidDate, isValidEmail } from './util';

interface UserRequest {
  name: string;
  email: string;
  dateOfBirth: string;
}

class User {
  id: number;
  name: string;
  email: string;
  dateOfBirth: Date;

  constructor(id: number, name: string, email: string, dateOfBirth: Date) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.dateOfBirth = dateOfBirth;
  }

  updateData(userReq: UserRequest): void {
    this.name = userReq.name;
    this.email = userReq.email;
    this.dateOfBirth = new Date(userReq.dateOfBirth);
  }

  static users: User[] = [];

  static nextUserId: number = 1;

  static getUsers(): User[] {
    return User.users;
  }

  static getUser(userId: number): User | undefined {
    return User.users.find((u) => u.id === userId);
  }

  static registerUser(userReq: UserRequest): User {
    const newUser = new User(User.nextUserId++, userReq.name, userReq.email, new Date(userReq.dateOfBirth));
    User.users.push(newUser);
    return newUser;
  }

  static deleteUser(userId: number): User | undefined {
    const deleteIndex = User.users.findIndex((u) => u.id === userId);

    if (deleteIndex === -1) {
      return undefined;
    }

    return User.users.splice(deleteIndex, 1)[0];
  }
}

export function handleUsersRoute(req: http.IncomingMessage, res: http.ServerResponse, userId: string | undefined): void {
  switch (req.method) {
    case 'GET':
      usersGet(req, res, userId);
      break;
    case 'POST':
      usersPost(req, res, userId);
      break;
    case 'PUT':
      usersPut(req, res, userId);
      break;
    case 'DELETE':
      usersDelete(req, res, userId);
      break;
    default:
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }
}

function usersGet(req: http.IncomingMessage, res: http.ServerResponse, userId: string | undefined): void {
  if (!userId) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(User.getUsers()));
    return;
  }

  const user = User.getUser(parseInt(userId, 10));

  if (!user) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'User not found' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(user));
}

function usersPost(req: http.IncomingMessage, res: http.ServerResponse, userId: string | undefined): void {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  req.on('end', () => {
    const userReq: UserRequest | undefined = tryParseUserRequest(body);

    if (!userReq) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid data format' }));
      return;
    }

    if (!isUserRequestValid(userReq)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid user data' }));
      return;
    }

    const newUser: User = User.registerUser(userReq);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(newUser));
  });
}

function usersPut(req: http.IncomingMessage, res: http.ServerResponse, userId: string | undefined): void {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  req.on('end', () => {
    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing user ID' }));
      return;
    }

    const updatedUser = User.getUser(parseInt(userId, 10));
    if (!updatedUser) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'User not found' }));
      return;
    }

    const userReq: UserRequest | undefined = tryParseUserRequest(body);

    if (!userReq) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid data format' }));
      return;
    }

    if (!isUserRequestValid(userReq)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid user data' }));
      return;
    }

    updatedUser.updateData(userReq);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(updatedUser));
  });
}

function usersDelete(req: http.IncomingMessage, res: http.ServerResponse, userId: string | undefined): void {
  if (!userId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing user ID' }));
    return;
  }

  const deletedUser = User.deleteUser(parseInt(userId, 10));

  if (!deletedUser) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'User not found' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(deletedUser));
}

function tryParseUserRequest(jsonString: string): UserRequest | undefined {
  try {
      const userReq: UserRequest = JSON.parse(jsonString);
      return userReq;
  }
  catch (e) { }

  return undefined;
};

function isUserRequestValid(userReq: UserRequest): boolean {
  if (typeof userReq.name !== 'string') {
    return false;
  }

  if (typeof userReq.email !== 'string' || !isValidEmail(userReq.email)) {
    return false;
  }

  if (typeof userReq.dateOfBirth !== 'string' || !isValidDate(userReq.dateOfBirth)) {
    return false;
  }

  return true;
}