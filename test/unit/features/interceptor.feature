Feature: Block passkey requests at the WebAuthn boundary
  As someone who prefers passwords + 2FA over passkeys
  I want navigator.credentials.create and get with a publicKey to be blockable
  So that sites neither nag me to enrol a passkey nor force a passkey login

  Background:
    Given a fake credentials container

  Scenario: A passkey registration is blocked
    Given the bridge blocks "create"
    When the page calls "create" with a publicKey option
    Then the call rejects with a "NotAllowedError"
    And the original "create" is never called

  Scenario: A passkey login is blocked
    Given the bridge blocks "get"
    When the page calls "get" with a publicKey option
    Then the call rejects with a "NotAllowedError"
    And the original "get" is never called

  Scenario Outline: An allowed passkey request is passed through
    Given the bridge allows everything
    When the page calls "<op>" with a publicKey option
    Then the original "<op>" is called once
    And the call resolves with the original credential

    Examples:
      | op     |
      | create |
      | get    |

  Scenario Outline: Non-passkey calls are passed straight through
    When the page calls "<op>" without a publicKey option
    Then the bridge is never consulted
    And the original "<op>" is called once

    Examples:
      | op     |
      | create |
      | get    |

  Scenario: The bridge is told which operation is happening
    Given the bridge allows everything
    When the page calls "get" with a publicKey option
    Then the bridge was asked about "get"

  Scenario Outline: A hung bridge fails open so the user is never locked out
    Given the bridge never responds
    When the page calls "<op>" with a publicKey option
    Then the original "<op>" is called once

    Examples:
      | op     |
      | create |
      | get    |

  Scenario Outline: The wrapper masquerades as the native method
    When the interceptor is installed
    Then "<op>" is named "<op>"

    Examples:
      | op     |
      | create |
      | get    |
