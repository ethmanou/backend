import { Room, Client } from "@colyseus/core";
import { State } from "./schema/State";
import {Player} from "./schema/Player";

export class Game extends Room<State> {
  maxClients = 4;

  onCreate (options: any) {
    this.setState(new State());

    this.onMessage("type", (client, message) => {
      //
      // handle "type" message
      //
    });
  }
  onJoin (client: Client, options: any)
  {
    this.state.players.set(client.sessionId, new Player());
    console.log(client.sessionId, "joined!");
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
