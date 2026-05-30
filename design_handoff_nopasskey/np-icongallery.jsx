// np-icongallery.jsx — icon exploration board. Shows each mark large, named,
// and previewed at toolbar size (16px) on light + dark chrome.

const ICONS = [
  { name: 'shield-key', label: 'Shield + keyhole', note: 'Used in Direction A', solid: false },
  { name: 'shield-slash', label: 'Shield, struck', note: 'Used in Direction B', solid: false },
  { name: 'key-slash', label: 'Key, struck', note: 'Literal & direct', solid: false },
  { name: 'lock-slash', label: 'Lock, struck', note: 'Familiar security cue', solid: false },
  { name: 'print-slash', label: 'Biometric, struck', note: 'Passkey = biometric', solid: false },
];

const IconTile = ({ name, label, note, solid }) => (
  <div className="ig__tile">
    <div className="ig__big"><NPIcon name={name} size={40} stroke={1.7} solid={solid} /></div>
    <div className="ig__meta">
      <div className="ig__name">{label}</div>
      <div className="ig__note">{note}</div>
    </div>
    <div className="ig__chips">
      <span className="ig__chip ig__chip--light"><NPIcon name={name} size={16} stroke={1.9} solid={solid} /></span>
      <span className="ig__chip ig__chip--dark"><NPIcon name={name} size={16} stroke={1.9} solid={solid} /></span>
    </div>
  </div>
);

const IconGallery = () => (
  <div className="np ig">
    <div className="ig__grid">
      {ICONS.map((i) => <IconTile key={i.name} {...i} />)}
    </div>
    <p className="ig__foot">
      Toolbar icons are monochrome and inherit the browser’s theme color — shown here at 16&nbsp;px on light and dark chrome.
      The accent purple is reserved for in-popup active states.
    </p>
  </div>
);

window.IconGallery = IconGallery;
