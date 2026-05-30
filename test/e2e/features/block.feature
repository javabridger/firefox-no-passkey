Feature: NoPasskey blocks passkey requests in a real Firefox
  Loaded as a temporary add-on in headless Firefox, the extension must intercept
  genuine navigator.credentials.create() and get() calls end-to-end.

  Scenario: Registration is blocked and surfaced on a fresh site
    Given a fresh Firefox with NoPasskey installed
    When I open the passkey test page
    And I click "Create passkey"
    Then the "create" call is rejected as "NotAllowedError"
    And a NoPasskey block notification appears

  Scenario: Login is blocked by default
    Given a fresh Firefox with NoPasskey installed
    When I open the passkey test page
    And I click "Login with passkey"
    Then the "login" call is rejected as "NotAllowedError"
    And a NoPasskey block notification appears

  Scenario: Allowing a site lets both registration and login through
    Given a fresh Firefox with NoPasskey installed
    When I open the passkey test page
    And I click "Create passkey"
    And I click "Allow this site" in the notification
    And I click "Create passkey"
    Then no NoPasskey block notification appears
    When I click "Login with passkey"
    Then no NoPasskey block notification appears
