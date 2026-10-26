export const isPostgres = (url: string) => /^postgres(ql)?:\/\//.test(url);
