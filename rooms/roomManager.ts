export type Room = {
  id: string;
  players: string[];
  owner: string;
  status: "waiting" | "full" | "playing" | "finished";
};

const rooms = new Map<string, Room>();

export function createRoom(player: string): Room {
  let roomID: string;

  do {
    roomID = crypto.randomUUID().slice(0, 8);
  } while (rooms.has(roomID));

  const room: Room = {
    id: roomID,
    players: [player],
    owner: player,
    status: "waiting",
  };

  rooms.set(roomID, room);

  console.log(rooms)

  return room;
}

export function getRoom(roomID: string): Room | undefined {
  return rooms.get(roomID);
}