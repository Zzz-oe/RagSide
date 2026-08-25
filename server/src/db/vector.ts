export function toVectorLiteral(values: number[]): string {
  if (values.length === 0) {
    throw new Error('Embedding vector cannot be empty');
  }

  return `[${values.map((value) => Number(value).toFixed(8)).join(',')}]`;
}

