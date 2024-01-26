import { Console } from "console";
import { Transform } from "stream";
import { AnyZodObject, output } from "zod";

export function parseOrNullFunctionArguments<T extends AnyZodObject>(
  json: string | null,
  schema: T
): output<T> | null {
  if (json == null) {
    return null;
  }
  try {
    return schema.parse(JSON.parse(json));
  } catch {
    return null;
  }
}

const ts = new Transform({
  transform(chunk, _, cb) {
    cb(null, chunk);
  },
});

const logger = new Console({ stdout: ts });

export function getTable(data: any) {
  logger.table(data);
  const table = (ts.read() || "").toString();
  console.log(table);
}

console.table = getTable;
