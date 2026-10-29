import express from 'express';
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { Server } from 'socket.io';
import type { ClientToServer, ServerToClient } from '../shared/types';
import { createRoom, endRoom, getRoom, sweepRooms } from './game';
import { activeLook, buyItem, classRecord, cleanName, getProfile, resetTerm, saveLoadouts, upsertProfile } from './store';
import { sanitizeLook } from '../shared/catalog';

// API_PORT, not PORT: dev tooling often sets PORT for the Vite client.
const PORT = Number(process.env.API_PORT ?? 3001);

const app = express();
app.use(express.json({ limit: '32kb' }));

const server = http.createServer(app);
const io = new Server<ClientToServer, ServerToClient>(server, { cors: { origin: true } });

// ---- REST: profiles, shop, class record ----

const wrap =
  (fn: (req: express.Request, res: express.Response) => unknown) =>
  (req: express.Request, res: express.Response) => {
    try {
      const out = fn(req, res);
      if (out !== undefined) res.json(out);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  };

app.get('/api/profile/:id', wrap((req, res) => {
  const p = getProfile(req.params.id);
  if (!p) return void res.status(404).json({ error: 'Profile not found' });
  return p;
}));

app.post('/api/profile', wrap((req) => {
  const name = cleanName(req.body?.name);
  if (!name) throw new Error('Pick a name with 2 to 16 characters');
  return upsertProfile(String(req.body?.id ?? ''), name);
}));

app.post('/api/shop/buy', wrap((req) => buyItem(String(req.body?.profileId), String(req.body?.itemId))));

app.put('/api/profile/:id/loadouts', wrap((req) => saveLoadouts(req.params.id, req.body?.loadouts, req.body?.activeLoadout)));

app.get('/api/record', wrap(() => classRecord()));

app.post('/api/record/reset', wrap(() => {
  resetTerm();
  return { ok: true };
}));

/** LAN addresses so the host screen can show students where to join. The client adds its own port. */
app.get('/api/info', wrap(() => {
  const lanIps = Object.values(os.networkInterfaces())
    .flat()
    .filter((a): a is os.NetworkInterfaceInfo => !!a && a.family === 'IPv4' && !a.internal)
    .map((a) => a.address);
  return { lanIps };
}));

// Serve the built client in production.
const dist = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api|\/socket\.io).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// ---- Socket.IO: the live game ----

io.on('connection', (socket) => {
  const room = () => (socket.data.code ? getRoom(socket.data.code) : undefined);
  const asHost = () => {
    const r = room();
    return r && socket.data.role === 'host' && r.hostSocketId === socket.id ? r : undefined;
  };
  const asPlayer = () => {
    const r = room();
    return r && socket.data.role === 'player' ? r : undefined;
  };

  socket.on('host:create', (ack) => {
    const r = createRoom(io);
    r.hostSocketId = socket.id;
    socket.data = { code: r.code, role: 'host' };
    socket.join(r.channel);
    ack({ ok: true, data: { code: r.code, hostKey: r.hostKey } });
    r.broadcast();
  });

  socket.on('host:resume', ({ code, hostKey }, ack) => {
    const r = getRoom(code);
    if (!r || r.hostKey !== hostKey) return ack({ ok: false, error: 'That room has ended.' });
    r.hostSocketId = socket.id;
    socket.data = { code: r.code, role: 'host' };
    socket.join(r.channel);
    r.touch();
    ack({ ok: true, data: { code: r.code } });
    r.broadcast();
  });

  socket.on('host:addBots', (n) => asHost()?.addBots(Number(n) || 0));
  socket.on('host:start', () => asHost()?.start());
  socket.on('host:reveal', () => asHost()?.endQuestion());
  socket.on('host:next', () => asHost()?.next());
  socket.on('host:restart', () => asHost()?.restart());
  socket.on('host:end', () => {
    const r = asHost();
    if (!r) return;
    endRoom(r);
    io.in(r.channel).socketsLeave(r.channel);
    socket.data = {};
  });
  socket.on('host:kick', (playerId) => {
    const r = asHost();
    const p = r?.players.get(playerId);
    if (!r || !p) return;
    if (p.socketId) {
      io.to(p.socketId).emit('player:kicked');
      io.sockets.sockets.get(p.socketId)?.leave(r.channel);
    }
    r.removePlayer(playerId);
    r.broadcast();
  });

  socket.on('player:join', ({ code, profileId }, ack) => {
    const r = getRoom(code);
    if (!r) return ack({ ok: false, error: 'No game with that code. Check the projector.' });
    const profile = getProfile(String(profileId));
    if (!profile) return ack({ ok: false, error: 'Set up your player first.' });
    try {
      r.addPlayer({ id: profile.id, name: profile.name, look: activeLook(profile), socketId: socket.id });
    } catch (e) {
      return ack({ ok: false, error: (e as Error).message });
    }
    socket.data = { code: r.code, role: 'player', playerId: profile.id };
    socket.join(r.channel);
    r.touch();
    ack({ ok: true, data: { code: r.code, playerId: profile.id } });
    r.broadcast();
    r.resync(profile.id);
  });

  socket.on('player:answer', (choice) => asPlayer()?.answer(socket.data.playerId, Number(choice)));

  socket.on('player:look', (look) => {
    const r = asPlayer();
    const profile = getProfile(socket.data.playerId);
    if (!r || !profile || r.phase !== 'lobby') return;
    r.setLook(profile.id, sanitizeLook(look, profile.owned, profile.bestStreak));
    r.broadcast();
  });

  socket.on('player:emote', () => asPlayer()?.emote(socket.data.playerId));

  socket.on('player:leave', () => {
    const r = asPlayer();
    if (!r) return;
    socket.leave(r.channel);
    if (r.phase === 'lobby') r.removePlayer(socket.data.playerId);
    else r.disconnect(socket.id);
    socket.data = {};
    r.broadcast();
  });

  socket.on('disconnect', () => {
    const r = room();
    if (!r) return;
    r.disconnect(socket.id);
    r.broadcast();
  });
});

setInterval(sweepRooms, 10 * 60 * 1000).unref();

server.listen(PORT, () => {
  console.log(`XP Arena server on http://localhost:${PORT}`);
});
