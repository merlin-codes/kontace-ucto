import { Schema } from "mongoose";

export const OperationSchema = new Schema({
    author: {type: Schema.Types.ObjectId, ref: '_id'},
    name: String,
    operations: []
});
export interface IOperation extends Document {
    author: {type: Schema.Types.ObjectId, ref: '_id'},
    user: String,
    name: String,
    operations: []
}
