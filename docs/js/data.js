/* data.js: sample product data for the prototype.
   The angle sensor rows (part numbers, descriptions, supply, resolution,
   response time, axis, temperature, market) come from the live Motor Position
   Sensors (2D) table on allegromicro.com. Technology, interfaces, safety
   ratings, orderable part numbers, prices and stock are ILLUSTRATIVE ONLY. */
window.ALLEGRO = (function () {
  'use strict';

  var parts = [
    { id: 'A1335', name: 'Precision Hall-effect angle sensor IC with I²C, SPI and SENT interfaces', tech: 'Hall (CVH)', supply: [4.5, 5.5], res: 12, resp: 60, axis: 'XY', tmax: 150, market: ['Automotive', 'Industrial'], iface: ['I²C', 'SPI', 'SENT'], safety: 'ASIL B', aec: true, status: 'Active', apps: ['eps', 'sbw', 'robotics', 'emotor2w'], mount: ['On-axis', 'Off-axis'] },
    { id: 'A33020', name: 'Stray field immune, precision Hall-effect angle sensor IC', tech: 'Hall', supply: [3.7, 18], res: 12, resp: 25, axis: 'XZ', tmax: 150, market: ['Automotive'], iface: ['SPI', 'SENT'], safety: 'ASIL D', aec: true, status: 'New', apps: ['eps', 'sbw'], mount: ['On-axis', 'Off-axis'] },
    { id: 'A33022', name: 'Stray field immune, precision Hall-effect angle sensor IC with SPI, PWM and SENT interfaces', tech: 'Hall', supply: [3.7, 18], res: 12, resp: 25, axis: 'XZ', tmax: 150, market: ['Automotive'], iface: ['SPI', 'PWM', 'SENT'], safety: 'ASIL D', aec: true, status: 'New', apps: ['eps', 'sbw'], mount: ['On-axis', 'Off-axis'] },
    { id: 'A33023', name: 'Stray field immune, high-speed Hall-effect angle sensor IC', tech: 'Hall', supply: [3.7, 18], res: 12, resp: 25, axis: 'XZ', tmax: 150, market: ['Automotive'], iface: ['SPI', 'ABI/UVW'], safety: 'ASIL D', aec: true, status: 'New', apps: ['sbw', 'traction'], mount: ['On-axis', 'Off-axis'] },
    { id: 'A33110', name: 'Precision TMR angle sensor IC with integrated diagnostics', tech: 'TMR', supply: [3.7, 18], res: 14, resp: 18, axis: 'XY', tmax: 125, market: ['Automotive'], iface: ['SPI', 'SENT'], safety: 'ASIL D', aec: true, status: 'New', apps: ['eps', 'sbw'], mount: ['On-axis'] },
    { id: 'A33115', name: 'Precision TMR angle sensor IC with integrated diagnostics and low power mode', tech: 'TMR', supply: [3.7, 18], res: 14, resp: 18, axis: 'XY', tmax: 125, market: ['Automotive'], iface: ['SPI', 'SENT'], safety: 'ASIL D', aec: true, status: 'New', apps: ['eps', 'sbw'], mount: ['On-axis'] },
    { id: 'A33203', name: '2D TMR angle sensor with sine/cosine outputs', tech: 'TMR', supply: [1.0, 5.5], res: 14, resp: 1, axis: 'XY', tmax: 150, market: ['Automotive'], iface: ['Analog sin/cos'], safety: 'ASIL B', aec: true, status: 'Active', apps: ['traction', 'robotics'], mount: ['On-axis'] },
    { id: 'A33204', name: '2D TMR angle sensor with sine/cosine outputs', tech: 'TMR', supply: [1.0, 5.5], res: 14, resp: 1, axis: 'XY', tmax: 150, market: ['Automotive'], iface: ['Analog sin/cos'], safety: 'ASIL B', aec: true, status: 'Active', apps: ['traction'], mount: ['On-axis'] },
    { id: 'A33230', name: '3D Hall-effect sensor with sine/cosine outputs', tech: 'Hall', supply: [4.5, 5.5], res: 11, resp: 7, axis: 'XY, XZ, YZ', tmax: 150, market: ['Automotive'], iface: ['Analog sin/cos'], safety: 'ASIL B', aec: true, status: 'Active', apps: ['traction', 'robotics'], mount: ['On-axis', 'Off-axis'] },
    { id: 'CT310', name: '2D TMR angle sensor with sine/cosine outputs', tech: 'TMR', supply: [1.0, 5.5], res: 14, resp: 1, axis: 'XY', tmax: 150, market: ['Automotive', 'Industrial'], iface: ['Analog sin/cos'], safety: 'QM', aec: false, status: 'Active', apps: ['robotics', 'emotor2w'], mount: ['On-axis'] },
    { id: 'A1330', name: 'Programmable angle sensor with analogue and PWM output', tech: 'Hall (CVH)', supply: [4.5, 5.5], res: 12, resp: 120, axis: 'XY', tmax: 150, market: ['Automotive'], iface: ['Analog', 'PWM'], safety: 'QM', aec: true, status: 'Active', apps: ['throttle'], mount: ['On-axis', 'Off-axis'] },
    { id: 'A1333', name: 'Precision Hall-effect angle sensor IC with integrated diagnostics', tech: 'Hall (CVH)', supply: [4.0, 16.5], res: 12, resp: 10, axis: 'XY', tmax: 150, market: ['Automotive'], iface: ['SPI', 'ABI/UVW'], safety: 'ASIL C', aec: true, status: 'Active', apps: ['eps', 'traction'], mount: ['On-axis'] },
    { id: 'A1337', name: 'Precision Hall-effect angle sensor IC with SPI and SENT or PWM outputs', tech: 'Hall (CVH)', supply: [3.7, 16], res: 12, resp: 60, axis: 'XY', tmax: 150, market: ['Automotive'], iface: ['SPI', 'SENT', 'PWM'], safety: 'ASIL D', aec: true, status: 'Active', apps: ['eps', 'sbw'], mount: ['On-axis'] },
    { id: 'A1338', name: 'Precision Hall-effect angle sensor IC with SPI and SENT or PWM outputs', tech: 'Hall (CVH)', supply: [3.7, 16], res: 12, resp: 60, axis: 'XY', tmax: 150, market: ['Automotive'], iface: ['SPI', 'SENT', 'PWM'], safety: 'ASIL D', aec: true, status: 'Active', apps: ['eps'], mount: ['On-axis'] },
    { id: 'A1339', name: 'Precision Hall-effect angle sensor IC with low-power mode, turns counter and integrated diagnostics', tech: 'Hall (CVH)', supply: [4.0, 16.5], res: 12, resp: 7, axis: 'XY', tmax: 150, market: ['Automotive'], iface: ['SPI', 'ABI/UVW', 'PWM'], safety: 'ASIL C', aec: true, status: 'Active', apps: ['eps', 'traction'], mount: ['On-axis', 'Off-axis'] },
    { id: 'A33002', name: 'Precision angle sensor IC with on-chip linearisation, SENT, SPI and PWM output', tech: 'Hall', supply: [3.7, 5.5], res: 12, resp: 17, axis: 'XY', tmax: 150, market: ['Automotive'], iface: ['SPI', 'SENT', 'PWM'], safety: 'ASIL B', aec: true, status: 'Active', apps: ['throttle', 'eps'], mount: ['On-axis', 'Off-axis'] },
    { id: 'A33003', name: 'Precision angle sensor IC with on-chip linearisation', tech: 'Hall', supply: [3.7, 5.5], res: 12, resp: 17, axis: 'XY', tmax: 150, market: ['Automotive'], iface: ['SPI', 'SENT'], safety: 'ASIL B', aec: true, status: 'Active', apps: ['throttle'], mount: ['On-axis', 'Off-axis'] },
    { id: 'AAS33001', name: 'Precision Hall-effect angle sensor IC with linearisation and integrated diagnostics', tech: 'Hall', supply: [3.7, 18], res: 12, resp: 10, axis: 'XY', tmax: 150, market: ['Automotive'], iface: ['SPI', 'ABI/UVW'], safety: 'ASIL B', aec: true, status: 'Active', apps: ['traction', 'robotics'], mount: ['On-axis', 'Off-axis'] },
    { id: 'AAS33051', name: 'Precision Hall-effect angle sensor IC with low-power mode, turns counter, linearisation and integrated diagnostics', tech: 'Hall', supply: [3.7, 18], res: 12, resp: 10, axis: 'XY', tmax: 150, market: ['Automotive'], iface: ['SPI', 'ABI/UVW'], safety: 'ASIL B', aec: true, status: 'Active', apps: ['eps', 'robotics'], mount: ['On-axis', 'Off-axis'] }
  ];

  /* Orderable part numbers (OPNs): the level commerce attaches to.
     A1335 OPNs are real; price shown for A1335LLETR-DD-T matches the live
     Buy panel; everything else is sample. */
  var opns = {
    A1335: [
      { opn: 'A1335LLETR-T', pkg: 'TSSOP-14, tape and reel', temp: '-40°C to 150°C', market: 'Automotive', moq: 4000, price: 5.54, stock: 0, lead: '14 weeks', sample: true, dist: { DigiKey: 364, Mouser: 120, Arrow: 0 } },
      { opn: 'A1335LLETR-DD-T', pkg: 'TSSOP-24, dual die, tape and reel', temp: '-40°C to 150°C', market: 'Automotive', moq: 12000, price: 5.54, stock: 0, lead: '16 weeks', sample: true, dist: { DigiKey: 364, 'Future Electronics': 0, Arrow: 0 } },
      { opn: 'A1335KLEATR-N', pkg: 'TSSOP-14, tape and reel', temp: '-40°C to 125°C', market: 'Industrial', moq: 4000, price: 3.98, stock: 8200, lead: 'In stock', sample: false, dist: { DigiKey: 2100, Mouser: 640 } }
    ]
  };

  /* Competitor cross-reference (sample, not a real equivalence table). */
  var xref = {
    'MLX90316': { match: 'A1335', type: 'Functional equivalent', note: 'Similar 360° on/off-axis capability; check interface and package.' },
    'MLX90365': { match: 'A1330', type: 'Functional equivalent', note: 'Analogue/PWM output. Pin-out differs.' },
    'TLE5012B': { match: 'A1339', type: 'Similar function', note: 'Compare interface (SSC vs SPI) before switching.' },
    'AS5047P': { match: 'AAS33001', type: 'Similar function', note: 'Both offer incremental ABI/UVW outputs.' }
  };

  var types = [
    { id: 'angle', family: 'Sensors', group: 'Position & Angle Sensors', name: 'Magnetic Rotary Angle Sensors', count: parts.length },
    { id: 'linear', family: 'Sensors', group: 'Position & Angle Sensors', name: 'Linear Hall Sensors (1D)', count: 14 },
    { id: '3d', family: 'Sensors', group: 'Position & Angle Sensors', name: '3D Multi-Axis Sensors', count: 9 },
    { id: 'inductive', family: 'Sensors', group: 'Position & Angle Sensors', name: 'Inductive Position Sensors', count: 6 },
    { id: 'current', family: 'Sensors', group: 'Current Sensors', name: 'Isolated Current Sensors', count: 48 },
    { id: 'speed', family: 'Sensors', group: 'Speed Sensors', name: 'Wheel and Transmission Speed Sensors', count: 22 },
    { id: 'switch', family: 'Sensors', group: 'Switches & Latches', name: 'Hall and TMR Switches & Latches', count: 61 },
    { id: 'gate', family: 'Drivers', group: 'Motor Drivers', name: 'BLDC Gate Drivers', count: 31 },
    { id: 'pmic', family: 'Regulators', group: 'Power Management', name: 'Safety PMICs', count: 12 }
  ];

  var applications = {
    sbw: 'Steer-by-Wire', eps: 'Electric Power Steering', traction: 'Traction Inverter',
    robotics: 'Robotics & Factory Automation', emotor2w: 'Two-Wheeler e-Motor', throttle: 'Pedal & Throttle Position'
  };

  function part(id) {
    id = (id || '').toUpperCase();
    for (var i = 0; i < parts.length; i++) if (parts[i].id === id) return parts[i];
    return null;
  }

  return { parts: parts, opns: opns, xref: xref, types: types, applications: applications, part: part };
})();
