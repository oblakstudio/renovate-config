export const publicPresets = [
  "default.json",
  "presets/base.json",
  "presets/php-application.json",
  "presets/php-library.json",
  "presets/php-constraint.json",
  "presets/javascript-application.json",
  "presets/javascript-package.json",
  "presets/wordpress-plugin.json",
  "presets/private-packagist.json",
  "rules/core.json",
  "rules/security.json",
  "rules/automerge.json",
  "rules/composer.json",
  "rules/javascript.json",
  "rules/github-actions.json",
  "rules/docker.json",
  "common/base.json",
  "common/base.json5",
  "npm.json",
  "wp-plugin.json",
  "typescript/base.json5",
  "php/php.json",
  "composer/bump.json",
  "composer/do-not-update-php.json",
  "composer/in-range.json",
  "composer/phpstan.json",
  "github/github-actions.json",
];

export const presetArguments = {
  "presets/php-constraint.json": ["^8.2"],
};

export const repositoryConfigs = [".github/renovate.json"];
