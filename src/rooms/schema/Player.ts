import { Schema, Context, type } from "@colyseus/schema";

export class Player extends Schema
{
    @type("number") score: number = 0;
    @type("String") username: String;
}