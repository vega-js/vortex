const createSemanticConfig = () => {
  const plugs = [
    [
      '@semantic-release/commit-analyzer',
      {
        releaseRules: [
          { type: 'fix', release: 'patch' },
          { type: 'chore', release: 'patch' },
          { type: 'build', release: 'patch' },
          { type: 'feat', release: 'minor' },
          { type: 'refactor', release: 'patch' },
          { type: 'major', release: 'major' },
          { type: 'docs', release: 'patch' },
        ],
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        linkReferences: true,
        presetConfig: {
          types: [
            { type: 'fix', section: '\u{1F41E} Fixes', hidden: false },
            { type: 'feat', section: '✨ Features', hidden: false },
            { type: 'chore', section: '🛠️ Chores', hidden: false },
            { type: 'build', section: '📦 Build', hidden: false },
            { type: 'docs', section: '📝 Docs', hidden: false },
          ],
        },
      },
    ],
    ['@semantic-release/github'],
  ];

  return {
    branches: [
      '+([0-9])?(.{+([0-9]),x}).x',
      'main',
      { name: 'beta', prerelease: true },
      { name: 'next', channel: 'next', prerelease: true },
    ],
    plugins: plugs,
    tagFormat: '${version}',
  };
};

module.exports = createSemanticConfig();
