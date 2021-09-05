"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationSchema = void 0;
const mongoose_1 = require("mongoose");
exports.OperationSchema = new mongoose_1.Schema({
    author: { type: mongoose_1.Schema.Types.ObjectId, ref: '_id' },
    name: String,
    operations: []
});
