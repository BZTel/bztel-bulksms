type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

const globalForTelemetry = globalThis as unknown as {
  clients: Set<SSEClient> | undefined;
};

export const clients = globalForTelemetry.clients ?? new Set<SSEClient>();

if (process.env.NODE_ENV !== 'production') {
  globalForTelemetry.clients = clients;
}

export function registerClient(id: string, controller: ReadableStreamDefaultController) {
  clients.add({ id, controller });
}

export function unregisterClient(id: string) {
  for (const client of clients) {
    if (client.id === id) {
      clients.delete(client);
      break;
    }
  }
}

export function broadcastMessage(data: any) {
  const encoder = new TextEncoder();
  const rawMessage = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = encoder.encode(rawMessage);

  for (const client of clients) {
    try {
      client.controller.enqueue(encoded);
    } catch (e) {
      // Client connection closed, clean up
      clients.delete(client);
    }
  }
}
