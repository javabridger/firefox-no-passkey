// np-screens.jsx — the four NoPasskey screens (two directions × popup/settings).
// Pure markup; all styling lives in NoPasskey.html. Exports to window.

const Switch = ({ on = false, ...rest }) => (
  <label className="sw" onClick={(e) => e.stopPropagation()}>
    <input type="checkbox" defaultChecked={on} {...rest} />
    <span className="sw__track"><span className="sw__knob" /></span>
  </label>
);

/* ───────────────────────── Direction A — Native ───────────────────────── */

const PopupA = () => (
  <div className="np popA">
    <div className="popA__head">
      <span className="popA__mark"><NPIcon name="shield-key" size={17} /></span>
      <span className="popA__title">NoPasskey</span>
    </div>

    <div className="popA__status">
      <span className="dot dot--on" />
      <span className="popA__site">github.com</span>
      <span className="popA__statetxt">— new passkeys blocked</span>
    </div>

    <div className="popA__list">
      <label className="rowA">
        <span className="rowA__text">
          <span className="rowA__label">Allow passkeys on this site</span>
        </span>
        <Switch />
      </label>
      <label className="rowA">
        <span className="rowA__text">
          <span className="rowA__label">Block passkey registration</span>
          <span className="rowA__sub">All sites</span>
        </span>
        <Switch on />
      </label>
    </div>

    <a className="popA__foot">Manage allowlist &amp; settings
      <span className="popA__chev">›</span>
    </a>
  </div>
);

const SettingsA = () => (
  <div className="np setA">
    <header className="setA__head">
      <span className="setA__mark"><NPIcon name="shield-key" size={22} /></span>
      <div className="setA__headtext">
        <h1>NoPasskey</h1>
        <p>Block sites from creating new passkeys.</p>
      </div>
    </header>

    <section className="setA__group">
      <h2 className="setA__gtitle">Protection</h2>
      <label className="rowA rowA--lg">
        <span className="rowA__text">
          <span className="rowA__label">Block passkey registration by default</span>
          <span className="rowA__sub">Recommended</span>
        </span>
        <Switch on />
      </label>
      <div className="setA__div" />
      <label className="rowA rowA--lg">
        <span className="rowA__text">
          <span className="rowA__label">Show a toast when a registration is blocked</span>
        </span>
        <Switch on />
      </label>
      <p className="setA__note">
        Logging in with passkeys you already have is never blocked — only <i>creating new</i> passkeys is.
      </p>
    </section>

    <section className="setA__group">
      <h2 className="setA__gtitle">Allowlist</h2>
      <p className="setA__gsub">Passkey registration is permitted on these origins.</p>
      <div className="setA__add">
        <input className="field" placeholder="https://example.com" />
        <button className="btn btn--primary">Add</button>
      </div>
      <ul className="setA__origins">
        <li>
          <span className="origin">https://accounts.work-sso.com</span>
          <button className="remove">Remove</button>
        </li>
        <li>
          <span className="origin">https://id.mybank.example</span>
          <button className="remove">Remove</button>
        </li>
      </ul>
    </section>
  </div>
);

/* ─────────────────────── Direction B — Quiet cards ─────────────────────── */

const PopupB = () => (
  <div className="np popB">
    <div className="popB__head">
      <span className="popB__mark"><NPIcon name="shield-key" size={16} /></span>
      <span className="popB__title">NoPasskey</span>
    </div>

    <div className="popB__status">
      <span className="dot dot--on" />
      <span className="popB__statustext">Protected on <b>github.com</b></span>
    </div>

    <div className="cardB">
      <label className="rowB">
        <span className="rowB__text">
          <span className="rowB__label">Allow passkeys on this site</span>
          <span className="rowB__sub">Override blocking for github.com</span>
        </span>
        <Switch />
      </label>
      <div className="cardB__div" />
      <label className="rowB">
        <span className="rowB__text">
          <span className="rowB__label">Block registration</span>
          <span className="rowB__sub">Creating new passkeys · all sites</span>
        </span>
        <Switch on />
      </label>
      <div className="cardB__div" />
      <label className="rowB">
        <span className="rowB__text">
          <span className="rowB__label">Block login</span>
          <span className="rowB__sub">Signing in with passkeys · all sites</span>
        </span>
        <Switch on />
      </label>
    </div>

    <a className="popB__foot">Manage allowlist &amp; settings →</a>
  </div>
);

const SettingsB = () => (
  <div className="np setB">
    <header className="setB__head">
      <span className="setB__mark"><NPIcon name="shield-key" size={24} /></span>
      <div className="setB__headtext">
        <h1>NoPasskey settings</h1>
        <p>Block sites from registering or signing in with passkeys.</p>
      </div>
    </header>

    <div className="cardB cardB--pad">
      <label className="rowB rowB--lg">
        <span className="rowB__text">
          <span className="rowB__label">Block passkey registration by default</span>
          <span className="rowB__sub">Recommended · stops new passkeys being created</span>
        </span>
        <Switch on />
      </label>
      <div className="cardB__div" />
      <label className="rowB rowB--lg">
        <span className="rowB__text">
          <span className="rowB__label">Block passkey login by default</span>
          <span className="rowB__sub">Stops existing passkeys from signing you in</span>
        </span>
        <Switch on />
      </label>
      <div className="cardB__div" />
      <label className="rowB rowB--lg">
        <span className="rowB__text">
          <span className="rowB__label">Show a toast when something is blocked</span>
        </span>
        <Switch on />
      </label>
    </div>
    <p className="setB__note">
      Registration blocking stops new passkeys from being created. Login blocking also prevents passkeys you already have from signing you in — turn it off if you still log in with passkeys.
    </p>

    <div className="setB__sectionhead">
      <h2>Allowlist</h2>
      <span className="setB__count">2 origins</span>
    </div>
    <p className="setB__sub">Passkeys are fully permitted on these origins.</p>

    <div className="cardB cardB--pad">
      <div className="setB__add">
        <input className="field" placeholder="https://example.com" />
        <button className="btn btn--primary">Add</button>
      </div>
      <ul className="setB__origins">
        <li className="origin-row">
          <span className="origin">https://accounts.work-sso.com</span>
          <button className="remove" aria-label="Remove">✕</button>
        </li>
        <li className="origin-row">
          <span className="origin">https://id.mybank.example</span>
          <button className="remove" aria-label="Remove">✕</button>
        </li>
      </ul>
    </div>
  </div>
);

Object.assign(window, { Switch, PopupA, SettingsA, PopupB, SettingsB });
