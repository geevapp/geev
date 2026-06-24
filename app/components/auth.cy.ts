/// <reference types="cypress" />

/**
 * Mocks the Freighter API on the window object for Cypress tests.
 * This allows us to simulate wallet interactions without needing the actual extension.
 */
const mockFreighterAPI = (isInstalled = true, publicKey = "G...TEST_PUBLIC_KEY") => {
  const freighterMocks = {
    isConnected: () => Promise.resolve({ isConnected: isInstalled }),
    requestAccess: () => Promise.resolve(),
    getAddress: () => Promise.resolve({ address: publicKey }),
    signTransaction: (xdr: string) => {
      // In a real test, you might want to validate the XDR.
      // For this simulation, we just "sign" it by returning a mock value.
      if (!xdr || typeof xdr !== "string") {
        return Promise.resolve({ error: "Invalid XDR provided." });
      }
      return Promise.resolve({ signedTxXdr: `mock_signed_${xdr}` });
    },
  };

  return {
    onBeforeLoad(win: any) {
      win.freighter = freighterMocks;
      // Support for older Freighter versions that used `stellar-freighter-api`
      win["stellar-freighter-api"] = freighterMocks;
    },
  };
};

describe("Wallet Authentication Flow", () => {
  const testPublicKey = "GBDIT5GUJ3565K532Q2TS4EPW23B7A2424CNYV42L5J6W7EYMOC43624";

  beforeEach(() => {
    // Mock the API endpoints that the login form will call
    cy.intercept("GET", `/api/auth/challenge?publicKey=${testPublicKey}`, {
      statusCode: 200,
      body: {
        transaction: "mock_challenge_xdr",
        network_passphrase: "Testnet",
      },
    }).as("getChallenge");

    cy.intercept("POST", "/api/auth/callback/credentials", (req) => {
      // Verify that the frontend is sending the correct signed data
      expect(req.body.walletAddress).to.equal(testPublicKey);
      expect(req.body.transaction).to.contain("mock_signed_mock_challenge_xdr");
      req.reply({
        statusCode: 200,
        body: { url: "/feed" },
      });
    }).as("signIn");
  });

  it("should allow a user to connect, sign, and log in", () => {
    // Visit the login page with the mocked Freighter API
    cy.visit("/login", mockFreighterAPI(true, testPublicKey));

    // 1. Connect Wallet
    cy.contains("button", "Connect Freighter Wallet").should("be.visible").click();

    // Verify wallet address is displayed
    cy.contains(testPublicKey).should("be.visible");
    cy.contains("Wallet connected successfully!").should("be.visible");

    // 2. Click Login
    cy.contains("button", "Login with Wallet").should("be.visible").click();

    // Verify API calls were made
    cy.wait("@getChallenge");
    cy.wait("@signIn");

    // 3. Verify redirection to the feed
    cy.url().should("include", "/feed");
    cy.contains("Successfully logged in!").should("be.visible");
  });
});