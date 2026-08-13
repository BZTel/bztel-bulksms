type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
  ownerId: number;
};

const globalForTelemetry = globalThis as unknown as {
  clients: Set<SSEClient> | undefined;
};

export const clients = globalForTelemetry.clients ?? new Set<SSEClient>();

if (process.env.NODE_ENV !== 'production') {
  globalForTelemetry.clients = clients;
}

export function registerClient(id: string, controller: ReadableStreamDefaultController, ownerId: number) {
  clients.add({ id, controller, ownerId });
}

export function unregisterClient(id: string) {
  for (const client of clients) {
    if (client.id === id) {
      clients.delete(client);
      break;
    }
  }
}

// Pass targetOwnerId to scope delivery to one tenant's connected clients (e.g. broadcast
// progress for a specific customer's batch) rather than every connected browser platform-wide.
export function broadcastMessage(data: any, targetOwnerId?: number) {
  const encoder = new TextEncoder();
  const rawMessage = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = encoder.encode(rawMessage);

  for (const client of clients) {
    if (targetOwnerId !== undefined && client.ownerId !== targetOwnerId) continue;
    try {
      client.controller.enqueue(encoded);
    } catch (e) {
      // Client connection closed, clean up
      clients.delete(client);
    }
  }
}
