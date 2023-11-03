import { Room, Client } from "@colyseus/core";
import { Schema, Context, type, MapSchema, filter } from "@colyseus/schema";

const crypto = require("crypto")
export class Player extends Schema
{
  constructor(username: any, id: any, team: number, side: any)
  {
    super();
    this.id = id;
    this.username= username
    this.team = team;
    this.hand = [];
    this.side = side;
  }

  toString()
  {
    return this.side;
  }

  @type("string") username: string;
  @type("string") id: string;
  @type("string") side: string;

  @type("number") team: number;
  @type("number") score: number;

  @type(["string"]) hand: String[];
  @type("string") chosenCard: String = "";
}
export class State extends Schema
{
  @filter(function(client: any, value: Player, root): boolean
  {
    if (value == undefined)
      return false
    return value.id == client.sessionId;
  })
  @type(Player) North: Player;
  @filter(function(client: any, value: Player, root): boolean
  {
    if (value == undefined)
      return false
    return value.id == client.sessionId;
  })
  @type(Player) South: Player;
  @filter(function(client: any, value: Player, root): boolean
  {
    if (value == undefined)
      return false
    return value.id == client.sessionId;
  })
  @type(Player) East: Player;
  @filter(function(client: any, value: Player, root): boolean
  {
    if (value == undefined)
      return false
    return value.id == client.sessionId;
  })
  @type(Player) West: Player;
  @filter(function(client: any, value, root): boolean
  {
    return false;
  })
  @type(["string"]) deck: String[];

  @type("number") teamBlueScore: number = 0;
  @type("number") teamRedScore: number = 0;

  @type("string") turn: String = "";
  @type("string") dealer: String = "";
  @type("string") trump: String = "";
  @type("number") contract: number = -1;
  @type("number") fold: number = 0;
  @type("number") lock: number = 0;
  chosen: any[] = [];

  onChange(callback: () => void): () => void {
    return super.onChange(callback);
  }

  reset()
  {
    this.deck = this.shuffle();
    this.trump = this.deck.pop();
    this.dealer = this.next(this.dealer);
    this.turn = this.next(this.dealer);
    this.contract = -1;
    this.fold = 0;
    this.chosen.length = 0;

    this.North.hand.length = 0;
    this.South.hand.length = 0;
    this.East.hand.length = 0;
    this.West.hand.length = 0;

    this.North.chosenCard = "";
    this.South.chosenCard = "";
    this.East.chosenCard = "";
    this.West.chosenCard = "";

    for (let i = 0; i < 5; i++)
    {
      this.North.hand.push(this.deck.pop());
      this.South.hand.push(this.deck.pop());
      this.East.hand.push(this.deck.pop());
      this.West.hand.push(this.deck.pop());
    }
  }

  shuffle(array: Array<String> = [
    "10H", "10D", "10C", "10S",
    "7H", "7D", "7C", "7S",
    "8H", "8D", "8C", "8S",
    "9H", "9D", "9C", "9S",
    "JH", "JD", "JC", "JS",
    "QH", "QD", "QC", "QS",
    "KH", "KD", "KC", "KS",
    "AH", "AD", "AC", "AS"])
  {
    for (let i = array.length - 1; i > 0; i--)
    {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  next(dir: String)
  {
    if (dir === "North")
      return "East";
    else if (dir === "East")
      return "South";
    else if (dir === "South")
      return "West";
    else
      return "North";
  }

  team(dir: String)
  {
    if (dir === "North" || dir === "South")
      return 0;
    else
      return 1;
  }

  score(hand: String[])
  {
    let score = 0;
    for (let i in hand)
    {
      if (i[1] === this.trump[1])
        score += {'A': 11, '10': 10, 'K': 4, 'Q': 3, 'J': 20, '7': 0, '8': 0, '9': 14}[i[0]];
      else
        score += {'A': 11, '10': 10, 'K': 4, 'Q': 3, 'J': 2, '7': 0, '8': 0, '9': 0}[i[0]];
    }

    return score;
  }

  check(card: String, player: String)
  {
    let p = this[player];

    if (card[1] !== this.chosen[1])
    {
      if (p.hand.some((x) => x[1] === this.chosen[1]))
        return false;
    }
    else if (card[1] !== this.trump[1])
    {
      if (p.hand.some((x) => x[1] === this.trump[1]))
        return false;
    }

    return true;
  }

  winner()
  {
    let potential = [];
    if (this.North.chosenCard["North"][1] == this.trump[1])
      potential.push("North");
    if (this.South.chosenCard["South"][1] == this.trump[1])
      potential.push("South");
    if (this.East.chosenCard["East"][1] == this.trump[1])
      potential.push("East");
    if (this.West.chosenCard["West"][1] == this.trump[1])
      potential.push("West");

    if (potential.length == 0)
    {
      for (let i = 0; i < 4; i++)
        if (Object.values(this.chosen[i])[0][1] == Object.values(this.chosen[0])[0][1])
          potential.push(Object.keys(this.chosen[i]));
    }
    let max = potential[0];
    for (let i in potential)
      if (this.score([this[i].chosenCard]) > this.score([this[max].chosenCard]))
        max = i;

    return max;
  }
}

export class Game extends Room<State>
{
  maxClients = 4;

  onCreate (options: any)
  {
    this.roomId = crypto.createHash("sha256").update(String(Math.random())).digest('hex');
    this.setState(new State());
    this.onMessage("action", (client, message) => this.playerAction(client, message));
    console.log("room " + this.roomId + " created!");
  }

  onJoin (client: Client, options: any)
  {
    if (this.state.North == undefined)
      this.state.North =  new Player(options.username, client.sessionId, 0, "North");
    else if (this.state.South == undefined)
      this.state.South =  new Player(options.username, client.sessionId, 0, "South");
    else if (this.state.East == undefined)
      this.state.East =  new Player(options.username, client.sessionId, 1, "East");
    else if (this.state.West == undefined)
      this.state.West =  new Player(options.username, client.sessionId, 1, "West");

    if (this.locked)
    {
      this.state.reset();
      this.state.lock = 1;
    }

    console.log(options.username + '@' + client.sessionId, "joined!");
  }

  onLeave (client: Client, consented: boolean)
  {
    console.log(client.sessionId, "left!");
    this.disconnect();
  }

  onDispose()
  {
    if (this.state.teamBlueScore >= 500 || this.state.teamRedScore >= 500)
    {
      if (this.state.teamBlueScore > this.state.teamRedScore)
        this.broadcast("winner", {winner: "Blue"});
      else
        this.broadcast("winner", {winner: "Red"})
    }
    else
    {
      this.broadcast("draw");
    }
    console.log("room", this.roomId, "disposing...");
  }

  playerAction(client: Client, data: any)
  {
    console.log("ACTION " + client.sessionId);

    let current;
    if (this.state.turn === "North")
      current = this.state.North;
    else if (this.state.turn === "South")
      current = this.state.South;
    else if (this.state.turn === "East")
      current = this.state.East;
    else if (this.state.turn === "West")
      current = this.state.West;

    if (current.id === client.sessionId)
    {
      if (this.state.contract === -1)
      {
        if (data.take === true)
        {
          this.state.contract = this.state.team(this.state.turn);
          this.state[this.state.turn].hand.push(this.state.trump);

          while (this.state["North"].hand.length !== 8)
            this.state["North"].hand.push(this.state.deck.pop());
          while (this.state["South"].hand.length !== 8)
            this.state["South"].hand.push(this.state.deck.pop());
          while (this.state["East"].hand.length !== 8)
            this.state["East"].hand.push(this.state.deck.pop());
          while (this.state["West"].hand.length !== 8)
            this.state["West"].hand.push(this.state.deck.pop());
          this.state.turn = this.state.next(this.state.turn);

          this.state.fold = 8;
        }
        else if (this.state.turn === this.state.dealer)
          this.state.reset();
        else
          this.state.turn = this.state.next(this.state.turn);
      }
      else
      {
        if (this.state.check(data.chosen, this.state.turn)) {
          let tmp = {};
          tmp[this.state.turn] = data.chosen;
          this.state.chosen.push(tmp);
          current.chosenCard = data.chosen;
          current.hand = current.hand.filter(item => item !== data.chosen);
          this.state.turn = this.state.next(this.state.turn);

          if (this.state.chosen.length == 4)
          {
            let winner = this.state.winner();
            this.state[winner].score += this.state.score(Object.values(this.state.chosen));

            this.state["North"].chosenCard = "";
            this.state["South"].chosenCard = "";
            this.state["East"].chosenCard = "";
            this.state["West"].chosenCard = "";

            this.state.turn = winner;
            this.state.fold -= 1;
            this.state.chosen.length = 0;
          }
        }
        if (this.state.fold == 0)
        {
          if (this.state.contract === 0)
          {
            if (this.state.North.score + this.state.South.score >= 82)
            {
              this.state.teamBlueScore += this.state.North.score + this.state.South.score;
              this.state.teamRedScore += this.state.East.score + this.state.West.score;
            }
            else
            {
              this.state.teamRedScore += 162;
            }
          }
          else
          {
            if (this.state.East.score + this.state.West.score >= 82)
            {
              this.state.teamBlueScore += this.state.North.score + this.state.South.score;
              this.state.teamRedScore += this.state.East.score + this.state.West.score;
            }
            else
            {
              this.state.teamBlueScore += 162;
            }
          }
          if (this.state.teamBlueScore >= 500 || this.state.teamRedScore >= 500)
            this.disconnect();
          this.state.reset();
        }
      }
    }
  }

}
