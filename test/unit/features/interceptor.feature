Feature: Block passkey registration at the WebAuthn create() boundary
  As someone who prefers passwords + 2FA over passkeys
  I want navigator.credentials.create({publicKey}) to be blocked by default
  So that sites fall back to a normal login and never nag me to enroll a passkey

  Background:
    Given a fake credentials container

  Scenario: A passkey registration is blocked on a non-allowlisted site
    Given the bridge decides to "block"
    When the page calls create with a publicKey option
    Then create rejects with a "NotAllowedError"
    And the original create is never called

  Scenario: A passkey registration on an allowlisted site is passed through
    Given the bridge decides to "allow"
    When the page calls create with a publicKey option
    Then the original create is called once
    And create resolves with the original credential

  Scenario: A non-passkey create call is passed straight through
    When the page calls create without a publicKey option
    Then the bridge is never consulted
    And the original create is called once

  Scenario: Login with an existing passkey is never touched
    When the interceptor is installed
    Then credentials.get is the original function

  Scenario: A hung or broken bridge fails open so logins are never bricked
    Given the bridge never responds
    When the page calls create with a publicKey option
    Then the original create is called once

  Scenario: The wrapper masquerades as the native create
    When the interceptor is installed
    Then credentials.create is named "create"
