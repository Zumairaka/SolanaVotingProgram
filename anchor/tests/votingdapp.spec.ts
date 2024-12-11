import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Voting } from "../target/types/voting";
import { BankrunProvider } from "anchor-bankrun";
import { startAnchor } from "solana-bankrun";
// import { expect } from "chai";

const IDL = require("../target/idl/voting.json");
const votingAddress = new PublicKey(
  "4PvSZDWfzTWD79EH9AG5L4RzcNH8tqxF5YCbksW5LirG"
);

describe("voting-program", () => {
  let context;
  let provider;
  let votingProgram: anchor.Program<Voting>;

  beforeEach(async () => {
    context = await startAnchor(
      "",
      [{ name: "voting", programId: votingAddress }],
      []
    );
    provider = new BankrunProvider(context);

    votingProgram = new Program<Voting>(IDL, provider);

    // intialize poll
    await votingProgram.methods
      .initializePoll(
        Number(1),
        "What is your favourite food?",
        new anchor.BN(1733749258),
        new anchor.BN(1833749258)
      )
      .rpc();
  });

  it("Initialize Poll", async () => {
    // get the poll address
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 4)],
      votingAddress
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);
    // console.log(poll);
    expect(poll.pollId).toEqual(1);
    expect(poll.description).toEqual("What is your favourite food?");
    expect(poll.endTime.toNumber()).toBeGreaterThan(poll.startTime.toNumber());
  });

  it("Initialize Candidate", async () => {
    // intialize candiate biriyani
    await votingProgram.methods
      .initializeCandidate("biriyani", Number(1))
      .rpc();

    // intialize candiate tea
    await votingProgram.methods.initializeCandidate("tea", Number(1)).rpc();

    // get the candidate biriyani address
    const [biriyaniAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 4), Buffer.from("biriyani")],
      votingAddress
    );

    // get the candidate tea address
    const [teaAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 4), Buffer.from("tea")],
      votingAddress
    );

    const candiate1 = await votingProgram.account.candidate.fetch(
      biriyaniAddress
    );
    const candiate2 = await votingProgram.account.candidate.fetch(teaAddress);

    console.log("candiate1: ", candiate1);
    console.log("candiate2: ", candiate2);

    expect(candiate1.candidateName).toEqual("biriyani");
    expect(candiate2.candidateName).toEqual("tea");
    expect(candiate1.votingCount.toNumber()).toEqual(0);
    expect(candiate2.votingCount.toNumber()).toEqual(0);
  });

  it("vote", async () => {
    // intialize candiate biriyani
    await votingProgram.methods
      .initializeCandidate("biriyani", Number(1))
      .rpc();

    // intialize candiate tea
    await votingProgram.methods.initializeCandidate("tea", Number(1)).rpc();

    // vote for biriyani
    await votingProgram.methods.vote("biriyani", Number(1)).rpc();

    // get the candidate biriyani address
    const [biriyaniAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 4), Buffer.from("biriyani")],
      votingAddress
    );
    const candiate1 = await votingProgram.account.candidate.fetch(
      biriyaniAddress
    );
    expect(candiate1.votingCount.toNumber()).toEqual(1);

    // vote for tea
    await votingProgram.methods.vote("tea", Number(1)).rpc();

    // get the candidate tea address
    const [teaAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 4), Buffer.from("tea")],
      votingAddress
    );
    const candiate2 = await votingProgram.account.candidate.fetch(teaAddress);
    expect(candiate2.votingCount.toNumber()).toEqual(1);

    console.log("candiate1: ", candiate1);
    console.log("candiate2: ", candiate2);
  });
});
