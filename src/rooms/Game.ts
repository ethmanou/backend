import { Room, Client } from "@colyseus/core";
import { Schema, type, filter, filterChildren} from "@colyseus/schema";

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
    this.score = 0;
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

  @type(["string"]) hand: string[];
  @type("string") chosenCard: string = "";
}
export class State extends Schema
{
  @filter(function(client: any, value: Player): boolean
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
  @type(["string"]) deck: string[];
  @type("number") teamBlueScore: number = 0;
  @type("number") teamRedScore: number = 0;

  @type("string") turn: string = "";
  @type("string") dealer: string = "";
  @type("string") trump: string = "";
  @type("number") contract: number = -1;
  @type("number") fold: number = 0;
  @type("number") lock: number = 0;
  // @ts-ignore
  @type(["string"]) table: string[] = [];
  @type("string") chosen: string = "";

  reset()
  {
    this.deck = this.shuffle();
    this.trump = this.deck.pop();
    this.dealer = this.next(this.dealer);
    this.turn = this.next(this.dealer);
    this.contract = -1;
    this.fold = 0;
    this.table.length = 0;
    this.chosen = "";

    this.North.hand.length = 0;
    this.South.hand.length = 0;
    this.East.hand.length = 0;
    this.West.hand.length = 0;

    this.North.score = 0;
    this.South.score = 0;
    this.East.score = 0;
    this.West.score = 0;

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

  shuffle(array: Array<string> = [
    "1H", "1T", "1C", "1P",
    "7H", "7T", "7C", "7P",
    "8H", "8T", "8C", "8P",
    "9H", "9T", "9C", "9P",
    "JH", "JT", "JC", "JP",
    "QH", "QT", "QC", "QP",
    "KH", "KT", "KC", "KP",
    "AH", "AT", "AC", "AP"])
  {
    for (let i = array.length - 1; i > 0; i--)
    {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  next(dir: string)
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

  team(dir: string)
  {
    if (dir === "North" || dir === "South")
      return 0;
    else
      return 1;
  }

  score(hand: string[])
  {
    let score = 0;
    for (let i = 0; i < hand.length; i++)
    {
      if (hand[i][1] === this.trump[1])
        score += {'A': 11, '1': 10, 'K': 4, 'Q': 3, 'J': 20, '7': 0, '8': 0, '9': 14}[hand[i][0]];
      else
        score += {'A': 11, '1': 10, 'K': 4, 'Q': 3, 'J': 2, '7': 0, '8': 0, '9': 0}[hand[i][0]];
    }

    return score;
  }

  check(card: string, player: string)
  {
    // @ts-ignore
    const p = this[player];
    // @ts-ignore
    if (!p.hand.some((x) => x == card))
      return false;
    // @ts-ignore
    if (this.table.length == 0)
      return true;

    if (card[1] != this.table[0][1])
    {
      // @ts-ignore
      if (p.hand.some((x) => x[1] == this.table[0][1]))
        return false;
    }
    else
      return true;
    // @ts-ignore
    if (card[1] != this.trump[1])
    {
      // @ts-ignore
      if (p.hand.some((x) => x[1] == this.trump[1]))
        return false;
    }
    return true;
  }

  winner()
  {
    let potential: String[] = [];
    // @ts-ignore
    if (this.North.chosenCard[1] == this.trump[1])
      potential.push("North");
    // @ts-ignore
    if (this.South.chosenCard[1] == this.trump[1])
      potential.push("South");
    // @ts-ignore
    if (this.East.chosenCard[1] == this.trump[1])
      potential.push("East");
    // @ts-ignore
    if (this.West.chosenCard[1] == this.trump[1])
      potential.push("West");

    if (potential.length == 0)
    {
      for (let i = 0; i < 4; i++)
        { // @ts-ignore
          if (this.table[i][1] == this.table[0][1])
          {
            if (this.North.chosenCard == this.table[i])
              potential.push("North");
            // @ts-ignore
            if (this.South.chosenCard == this.table[i])
              potential.push("South");
            // @ts-ignore
            if (this.East.chosenCard == this.table[i])
              potential.push("East");
            // @ts-ignore
            if (this.West.chosenCard == this.table[i])
              potential.push("West");
          }
        }
    }
    let max = potential[0];
    console.log(potential);
    for (let i = 0; i < potential.length; i++)
    { // @ts-ignore
      if (this.score([this[potential[i]].chosenCard]) > this.score([this[max].chosenCard]))
                max = potential[i];
    }

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
    //console.log("ACTION " + client.sessionId);
    // @ts-ignore
    let current = this.state[this.state.turn];

    if (current.id === client.sessionId)
    {
      if (this.state.contract === -1)
      {
        if (data.take === true)
        {
          this.state.contract = this.state.team(this.state.turn);
          // @ts-ignore
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
        else if (data.take === false)
          this.state.turn = this.state.next(this.state.turn);
        else if (this.state.turn === this.state.dealer)
          this.state.reset();
      }
      else if (data.chosen != undefined)
      {
        if (this.state.check(data.chosen, this.state.turn))
        {
          this.state.table.push(data.chosen);
          current.chosenCard = data.chosen;
          current.hand = current.hand.filter((item: String) => item !== data.chosen);
          this.state.turn = this.state.next(this.state.turn);
          if (this.state.table.length == 4)
          {
            const winner = this.state.winner();
            // @ts-ignore
            this.state[winner].score += this.state.score(this.state.table);

            this.state["North"].chosenCard = "";
            this.state["South"].chosenCard = "";
            this.state["East"].chosenCard = "";
            this.state["West"].chosenCard = "";

            // @ts-ignore
            this.state.turn = winner;
            this.state.fold -= 1;
            this.state.table.length = 0;
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
