export const parseOption = (
  args: string[],
  flag: string,
): string | undefined => {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return undefined;
};

export const hasFlag = (args: string[], flag: string): boolean =>
  args.includes(flag);
