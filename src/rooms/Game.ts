import { Room, Client } from "@colyseus/core";
import { Schema, Context, type, MapSchema } from "@colyseus/schema";

export enum TEAM
{
  BLUE,
  RED
}
export class Player extends Schema
{
  @type("string") username: string;
  @type("string") id: string;

  @type(TEAM) team: TEAM;

  @type(["number"]) hand: number[] = [];
  @type("number") chosenCard: number = -1;
}
export class State extends Schema
{
  @type({ map: Player }) teamBlue = new MapSchema<Player>();
  @type({ map: Player }) teamRed = new MapSchema<Player>();

  @type(["number"]) deck: number[] = [];

  @type("number") teamBlueScore: number = 0;
  @type("number") teamRedScore: number = 0;
}

export class Game extends Room<State>
{
  maxClients = 4;

  onCreate (options: any) {
    this.setState(new State());

    this.onMessage("type", (client, message) => {
      //
      // handle "type" message
      //
    });
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
