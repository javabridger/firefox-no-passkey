Feature: NoPasskey blocks passkey registration in a real Firefox
  Loaded as a temporary add-on in headless Firefox, the extension must intercept a
  genuine navigator.credentials.create() call end-to-end.

  Scenario: Registration is blocked and surfaced on a fresh site
    Given a fresh Firefox with NoPasskey installed
    When I open the passkey test page
    And I click "Create passkey"
    Then the create call is rejected as "NotAllowedError"
    And a NoPasskey block notification appears

  Scenario: Allowing a site through the notification lets registration proceed
    Given a fresh Firefox with NoPasskey installed
    When I open the passkey test page
    And I click "Create passkey"
    And I click "Allow this site" in the notification
    And I click "Create passkey"
    Then no NoPasskey block notification appears

  Scenario: Logging in with an existing passkey is never blocked
    Given a fresh Firefox with NoPasskey installed
    When I open the passkey test page
    And I click "Login with passkey"
    Then no NoPasskey block notification appears
