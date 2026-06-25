import { Keypair } from "@stellar/stellar-sdk";

const pair = Keypair.random();
console.log("SECRET:", pair.secret());
console.log("PUBLIC:", pair.publicKey());