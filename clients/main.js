const SIGNALING_SERVER_URL = process.env.SIGNALING_SERVER_URL;

import {Connection} from "./connection.js";

conn = new Connection(SIGNALING_SERVER_URL);
console.log(conn);