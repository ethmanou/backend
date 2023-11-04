"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = exports.State = exports.Player = void 0;
const core_1 = require("@colyseus/core");
const schema_1 = require("@colyseus/schema");
const crypto = require("crypto");
class Player extends schema_1.Schema {
    constructor(username, id, team) {
        super();
        this.chosenCard = -1;
        this.id = id;
        this.username = username;
        this.team = team;
        this.hand = [];
    }
}
exports.Player = Player;
__decorate([
    (0, schema_1.type)("string")
], Player.prototype, "username", void 0);
__decorate([
    (0, schema_1.type)("string")
], Player.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)("number")
], Player.prototype, "team", void 0);
__decorate([
    (0, schema_1.type)("number")
], Player.prototype, "score", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], Player.prototype, "hand", void 0);
__decorate([
    (0, schema_1.type)("number")
], Player.prototype, "chosenCard", void 0);
class State extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.teamBlue = new schema_1.MapSchema();
        this.teamRed = new schema_1.MapSchema();
        this.teamBlueScore = 0;
        this.teamRedScore = 0;
        this.turn = "";
        this.dealer = "";
        this.trump = "";
        this.contract = -1;
    }
    reset() {
        this.deck = this.shuffle();
        this.trump = this.deck.pop();
        this.dealer = this.next(this.dealer);
        this.turn = this.next(this.dealer);
        this.contract = -1;
        this.teamBlue.get("North").hand.length = 0;
        this.teamBlue.get("South").hand.length = 0;
        this.teamRed.get("East").hand.length = 0;
        this.teamRed.get("West").hand.length = 0;
        for (let i = 0; i < 5; i++) {
            this.teamBlue.get("North").hand.push(this.deck.pop());
            this.teamBlue.get("South").hand.push(this.deck.pop());
            this.teamRed.get("East").hand.push(this.deck.pop());
            this.teamRed.get("West").hand.push(this.deck.pop());
        }
    }
    shuffle(array = [
        "10H", "10D", "10C", "10S",
        "7H", "7D", "7C", "7S",
        "8H", "8D", "8C", "8S",
        "9H", "9D", "9C", "9S",
        "JH", "JD", "JC", "JS",
        "QH", "QD", "QC", "QS",
        "KH", "KD", "KC", "KS",
        "AH", "AD", "AC", "AS"
    ]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    next(dir) {
        if (dir === "North")
            return "East";
        else if (dir === "East")
            return "South";
        else if (dir === "South")
            return "West";
        else
            return "North";
    }
    team(dir) {
        if (dir === "North" || dir === "South")
            return 0;
        else
            return 1;
    }
    score(hand) {
    }
    check(card) {
    }
}
exports.State = State;
__decorate([
    (0, schema_1.type)({ map: Player })
], State.prototype, "teamBlue", void 0);
__decorate([
    (0, schema_1.type)({ map: Player })
], State.prototype, "teamRed", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], State.prototype, "deck", void 0);
__decorate([
    (0, schema_1.type)("number")
], State.prototype, "teamBlueScore", void 0);
__decorate([
    (0, schema_1.type)("number")
], State.prototype, "teamRedScore", void 0);
__decorate([
    (0, schema_1.type)("string")
], State.prototype, "turn", void 0);
__decorate([
    (0, schema_1.type)("string")
], State.prototype, "dealer", void 0);
__decorate([
    (0, schema_1.type)("string")
], State.prototype, "trump", void 0);
__decorate([
    (0, schema_1.type)("number")
], State.prototype, "contract", void 0);
class Game extends core_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 4;
    }
    onCreate(options) {
        this.roomId = crypto.createHash("sha256").update(String(Math.random())).digest('hex');
        this.setState(new State());
        this.onMessage("action", (client, message) => this.playerAction(client, message));
        console.log("room " + this.roomId + " created!");
    }
    onJoin(client, options) {
        if (this.state.teamBlue.size === 0)
            this.state.teamBlue.set("North", new Player(options.username, client.sessionId, 0));
        else if (this.state.teamBlue.size === 1)
            this.state.teamBlue.set("South", new Player(options.username, client.sessionId, 0));
        else if (this.state.teamRed.size === 0)
            this.state.teamRed.set("East", new Player(options.username, client.sessionId, 1));
        else
            this.state.teamRed.set("West", new Player(options.username, client.sessionId, 1));
        if (this.locked)
            this.state.reset();
        console.log(options.username + '@' + client.sessionId, "joined!");
    }
    onLeave(client, consented) {
        console.log(client.sessionId, "left!");
        this.disconnect();
    }
    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
    playerAction(client, data) {
        //console.log("ACTION " + client.sessionId);
        let current;
        if (this.state.turn === "North")
            current = this.state.teamBlue.get("North").id;
        else if (this.state.turn === "South")
            current = this.state.teamBlue.get("South").id;
        else if (this.state.turn === "East")
            current = this.state.teamRed.get("East").id;
        else if (this.state.turn === "West")
            current = this.state.teamRed.get("West").id;
        if (current === client.sessionId) {
            if (this.state.contract === -1) {
                if (data.take === true) {
                    this.state.contract = this.state.team(this.state.turn);
                    if (this.state.contract === 0)
                        this.state.teamBlue.get(String(this.state.turn)).hand.push(this.state.trump);
                    else
                        this.state.teamRed.get(String(this.state.turn)).hand.push(this.state.trump);
                    while (this.state.teamBlue.get("North").hand.length !== 8)
                        this.state.teamBlue.get("North").hand.push(this.state.deck.pop());
                    while (this.state.teamBlue.get("South").hand.length !== 8)
                        this.state.teamBlue.get("South").hand.push(this.state.deck.pop());
                    while (this.state.teamRed.get("East").hand.length !== 8)
                        this.state.teamRed.get("East").hand.push(this.state.deck.pop());
                    while (this.state.teamRed.get("West").hand.length !== 8)
                        this.state.teamRed.get("West").hand.push(this.state.deck.pop());
                    this.state.turn = this.state.next(this.state.turn);
                }
                else if (this.state.turn === this.state.dealer)
                    this.state.reset();
                else
                    this.state.turn = this.state.next(this.state.turn);
            }
            else {
            }
        }
    }
}
exports.Game = Game;
