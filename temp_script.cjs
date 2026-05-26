const fs = require('fs');

// 1. ServicesPage.jsx
const servicesLines = fs.readFileSync('src/pages/ServicesPage.jsx', 'utf8').split('\n');
const newServicesLines = [
  ...servicesLines.slice(0, 58),
  '<main className="flex-grow">',
  ...servicesLines.slice(217, 407),
  '</main>',
  ...servicesLines.slice(559)
];
const servicesContent = newServicesLines.join('\n').replace(/HomePage/g, 'ServicesPage');
fs.writeFileSync('src/pages/ServicesPage.jsx', servicesContent);

// 2. AboutPage.jsx
const aboutLines = fs.readFileSync('src/pages/legal/AboutPage.jsx', 'utf8').split('\n');
const newAboutLines = [
  ...aboutLines.slice(0, 58),
  '<main className="flex-grow">',
  ...aboutLines.slice(101, 217),
  ...aboutLines.slice(364, 407),
  '</main>',
  ...aboutLines.slice(559)
];
const aboutContent = newAboutLines.join('\n').replace(/HomePage/g, 'AboutPage');
fs.writeFileSync('src/pages/legal/AboutPage.jsx', aboutContent);
