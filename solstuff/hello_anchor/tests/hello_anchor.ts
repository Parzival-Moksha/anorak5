const anchor = require("@project-serum/anchor");

describe('hello_anchor', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.HelloAnchor;

  it("Calls initialize", async () => {
    const tx = await program.methods
      .initialize()
      .rpc();
    console.log("Transaction signature:", tx);
  });
});