import mongoose, { Schema } from 'mongoose';
import { Credentials } from "google-auth-library";

export const AuthorSchema = new Schema({
	author_id: String,
	refresh_token: String,
})

export interface IAuthor extends Document {
	author_id: String,
	refresh_token: String,
}

export const Author = mongoose.model<IAuthor>("author", AuthorSchema);
