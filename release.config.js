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
          { type: 'doc', release: 'patch' },
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
            {
              type: 'fix',
              section: '\u{1F41E} Fixes',
              hidden: false,
            },
            {
              type: 'feat',
              section: '\u2728 Features',
              hidden: false,
            },
            {
              type: 'chore',
              section: '\u{1F6E0}\uFE0F Chores',
              hidden: false,
            },
            {
              type: 'build',
              section: '\u{1F4E6} Build',
              hidden: false,
            },
            {
              type: 'doc',
              section: '\u{1F4DD}  Docs',
              hidden: false,
            },
          ],
        },
      },
    ],
    ['@semantic-release/github'],

    // [
    //   '@semantic-release/changelog',
    //   {
    //     changelogFile: 'CHANGELOG.md',
    //   },
    // ],
    // [
    //   '@semantic-release/git',
    //   {
    //     assets: ['package.json', 'CHANGELOG.md'],
    //     message:
    //       'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
    //   },
    // ],
  ];

  return {
    branches: [
      '+([0-9])?(.{+([0-9]),x}).x',
      'main',
      'next',
      { name: 'beta', prerelease: true },
    ],
    plugins: plugs,
    // eslint-disable-next-line no-template-curly-in-string
    tagFormat: '${version}',
  };
};

module.exports = createSemanticConfig();
