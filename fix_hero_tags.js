const fs = require('fs');
const files = [
  { path: 'apps/mobile/lib/widgets/dashboard_overview.dart', prefix: 'dash_' },
  { path: 'apps/mobile/lib/widgets/dashboard_overview_v2.dart', prefix: 'dash2_' },
  { path: 'apps/mobile/lib/screens/profile_screen.dart', prefix: 'prof_' },
  { path: 'apps/mobile/lib/screens/room_detail_screen.dart', prefix: 'room_' },
  { path: 'apps/mobile/lib/screens/public_profile_screen.dart', prefix: 'pubprof_' },
];

files.forEach(f => {
  let content = fs.readFileSync(f.path, 'utf8');
  content = content.replace(/FeedUpdateCard\(/g, 'FeedUpdateCard(heroTagPrefix: "' + f.prefix + '", ');
  fs.writeFileSync(f.path, content);
  console.log('Updated ' + f.path);
});
