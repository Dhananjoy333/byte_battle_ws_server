export type Room = {
  id: string;
  players: string[];
  owner: string;
  status: "waiting" | "full" | "playing" | "finished";
  selectedCharacters: Record<string, string>;
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
    selectedCharacters: {},
  };

  rooms.set(roomID, room);

  console.log(rooms);

  return room;
}

export function getRoom(roomID: string): Room | undefined {
  return rooms.get(roomID);
}

export function characterAddition(data: {
  roomID: string;
  player: string;
  selectedCharacterId: string;
}): { success: boolean; error?: string } {
  const room = getRoom(data.roomID);
  if (!room) {
    return { success: false, error: "Room does not exist." };
  }

  if (!room.selectedCharacters) {
    room.selectedCharacters = {};
  }

  room.selectedCharacters[data.player] = data.selectedCharacterId;
  return { success: true };
}