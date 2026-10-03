// Validate exactly the JSON Schema keywords used by the committed research schema.
// Unknown keywords fail closed, so an unsupported schema cannot silently pass.
export function validateSchema(value, schema, path = "$") {
  const supported = new Set([
    "$schema",
    "$id",
    "title",
    "description",
    "type",
    "properties",
    "required",
    "additionalProperties",
    "items",
    "enum",
    "minItems",
    "minLength",
    "pattern",
  ]);
  for (const key of Object.keys(schema))
    if (!supported.has(key))
      throw new Error(`Unsupported JSON Schema keyword: ${key}`);
  const fail = (message) => {
    throw new Error(`${path}: ${message}`);
  };
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (
    schema.type &&
    !types.some((t) =>
      t === "null"
        ? value === null
        : t === "array"
          ? Array.isArray(value)
          : t === "object"
            ? value !== null &&
              typeof value === "object" &&
              !Array.isArray(value)
            : t === "integer"
              ? Number.isInteger(value)
              : typeof value === t,
    )
  )
    fail(`expected ${types.join("/")}`);
  if (schema.enum && !schema.enum.includes(value)) fail("not in enum");
  if (typeof value === "string") {
    if (schema.minLength != null && value.length < schema.minLength)
      fail("string too short");
    if (schema.pattern && !new RegExp(schema.pattern).test(value))
      fail("pattern mismatch");
  }
  if (Array.isArray(value)) {
    if (schema.minItems != null && value.length < schema.minItems)
      fail("array too short");
    if (schema.items)
      value.forEach((v, i) => validateSchema(v, schema.items, `${path}[${i}]`));
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const key of schema.required ?? [])
      if (!Object.hasOwn(value, key)) fail(`missing ${key}`);
    for (const [key, v] of Object.entries(value)) {
      if (schema.properties?.[key])
        validateSchema(v, schema.properties[key], `${path}.${key}`);
      else if (schema.additionalProperties === false) fail(`unknown ${key}`);
    }
  }
  return true;
}
