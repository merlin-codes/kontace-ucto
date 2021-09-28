import mongoose, { Schema } from 'mongoose';
import { Credentials } from "google-auth-library";

export const OperationSchema = new Schema({
	author_id: String,
	author: {
		refresh_token: String,
		expiry_date: Number,
		access_token: String,
		token_type: String,
		id_token: String,
		scope: String
	}, 
	name: String,
	classroom: String,
	classname: String,
	courseId: String,
	operations: []
})

export interface IOperation extends Document {
	author_id: String,
	author: Credentials,
    name: String,
    classroom: String,
	classname: String,
	courseId: String,
    operations: []
}

export const Operation = mongoose.model<IOperation>("questions", OperationSchema);