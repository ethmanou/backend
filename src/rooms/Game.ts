import { Room, Client } from "@colyseus/core";
import { Schema, Context, type, MapSchema } from "@colyseus/schema";

const crypto = require("crypto")
export class Player extends Schema
{

  constructor(username: any, id: any, team: number)
  {
    super();
    this.id = id;
    this.username= username
    this.team = team;
  }

  @type("string") username: string;
  @type("string") id: string;

  @type("number") team: number;

  @type(["number"]) hand: number[] = [];
  @type("number") chosenCard: number = -1;
}
export class State extends Schema
{
  @type({ map: Player }) teamBlue = new MapSchema<Player>();
  @type({ map: Player }) teamRed = new MapSchema<Player>();

  @type(["string"]) deck: String[] = [
    "10H", "10D", "10C", "10S",
    "7H", "7D", "7C", "7S",
    "8H", "8D", "8C", "8S",
    "9H", "9D", "9C", "9S",
    "JH", "JD", "JC", "JS",
    "QH", "QD", "QC", "QS",
    "KH", "KD", "KC", "KS",
    "AH", "AD", "AC", "AS"];

  @type("number") teamBlueScore: number = 0;
  @type("number") teamRedScore: number = 0;

}

export class Game extends Room<State>
{
  maxClients = 4;

  onCreate (options: any)
  {
    this.roomId = crypto.createHash("sha256").update(String(Math.random())).digest('hex');
    this.setState(new State());
    this.onMessage("action", (client, message) => this.playerAction(client, message));
  }

  onJoin (client: Client, options: any)
  {
    if (this.state.teamBlue.size !== 2)
      this.state.teamBlue.set(client.sessionId, new Player(options.username, client.sessionId, 0));
    else
      this.state.teamRed.set(client.sessionId, new Player(options.username, client.sessionId, 1));
    console.log(options.username + '@' + client.sessionId, "joined!");
  }

  onLeave (client: Client, consented: boolean)
  {
    console.log(client.sessionId, "left!");
  }

  onDispose()
  {
    console.log("room", this.roomId, "disposing...");
  }

  playerAction(client: Client, data: any)
  {

  }

  shuffle(array: Array<String>)
  {
    for (let i = array.length - 1; i > 0; i--)
    {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
