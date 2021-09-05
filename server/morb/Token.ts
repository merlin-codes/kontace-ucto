import mongoose, { Schema } from "mongoose";

export interface IToken extends Document{author: String, token: String};

export const TokenSchema = new Schema({ author: String, token: String });

export const tModel = mongoose.model<IToken>("token", TokenSchema);
