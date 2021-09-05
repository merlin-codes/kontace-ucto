"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenSchema = void 0;
const mongoose_1 = require("mongoose");
;
exports.TokenSchema = new mongoose_1.Schema({ author: String, token: String });
