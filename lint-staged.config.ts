export default {
  '*.{ts,html,css,yaml,json,md}': 'oxfmt',
  '*.ts': (files: string[]) => {
    const OXLINT_IGNORED = /(^|\/)[^/]+\.d\.ts$/;
    const lintable = files.filter((file) => !OXLINT_IGNORED.test(file));
    return lintable.length > 0 ? [`oxlint ${lintable.join(' ')}`] : [];
  },
};
