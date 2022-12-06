import { Server } from "https://deno.land/std@0.148.0/http/server.ts";
import IORedis from 'npm:ioredis@5.2.4'

// make a connection to the local instance of redis
const client = new IORedis("redis://localhost:6379")

client.on("error", (error) => {
  console.error(error);
});

const server = new Server({
  handler: async (req) => {
    const { pathname } = new URL(req.url);
    // strip the leading slash
    const username = pathname.substring(1);
    const cached_user = await client.get(username);
    if (cached_user) {
      return new Response(cached_user, {
        headers: {
          "content-type": "application/json",
          "is-cached": "true",
        },
      });
    } else {
      const resp = await fetch(`https://api.github.com/users/${username}`);
      const user = await resp.json();
      await client.set(username, JSON.stringify(user));
      return new Response(JSON.stringify(user), {
        headers: {
          "content-type": "application/json",
          "is-cached": "false",
        },
      });
    }
  },

  port: 3000,
});

server.listenAndServe();