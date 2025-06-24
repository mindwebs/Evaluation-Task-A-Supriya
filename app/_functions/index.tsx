import { Field } from "@/constants";

export const updateNestedFields = (fields: Field[], target: Field[], updated: Field[]): Field[] => {
  return fields.map((field) => {
    if (field.nestedFields === target) {
      return { ...field, nestedFields: updated }
    }
    if (field.nestedFields) {
      return { ...field, nestedFields: updateNestedFields(field.nestedFields, target, updated) }
    }
    return field
  })
}

export const findFieldById = (fieldId: string, fields: Field[]): Field | null => {
  for (const field of fields) {
    if (field.id === fieldId) return field
    if (field.nestedFields) {
      const found = findFieldById(fieldId, field.nestedFields)
      if (found) return found
    }
  }
  return null
}

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}

export const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const generateTypeScriptType = (field: Field): string => {
  switch (field.type) {
    case "string":
      return "string"
    case "number":
      return "number"
    case "boolean":
      return "boolean"
    case "Date":
      return "Date"
    case "ObjectId":
      return "Types.ObjectId"
    case "Buffer":
      return "Buffer"
    case "mixed":
      return "any"
    case "Map":
      return "Map<string, any>"
    case "Decimal128":
      return "Types.Decimal128"
    case "array":
      if (field.arrayType === "object" && field.nestedFields) {
        return `{\n${field.nestedFields
          .map((f) => `    ${f.name}${f.required ? "" : "?"}: ${generateTypeScriptType(f)};`)
          .join("\n")}\n  }[]`
      }
      const arrayType =
        field.arrayType === "ObjectId"
          ? "Types.ObjectId"
          : field.arrayType === "Decimal128"
            ? "Types.Decimal128"
            : field.arrayType || "any"
      return `${arrayType}[]`
    case "object":
      if (field.nestedFields) {
        return `{\n${field.nestedFields
          .map((f) => `    ${f.name}${f.required ? "" : "?"}: ${generateTypeScriptType(f)};`)
          .join("\n")}\n  }`
      }
      return "object"
    case "enum":
      return field.name.charAt(0).toUpperCase() + field.name.slice(1) + "Enum"
    default:
      return "any"
  }
}

export const generateMongooseType = (field: Field): string => {
  switch (field.type) {
    case "string":
      return "String"
    case "number":
      return "Number"
    case "boolean":
      return "Boolean"
    case "Date":
      return "Date"
    case "ObjectId":
      return "Schema.Types.ObjectId"
    case "Buffer":
      return "Buffer"
    case "mixed":
      return "Schema.Types.Mixed"
    case "Map":
      return "Map"
    case "Decimal128":
      return "Schema.Types.Decimal128"
    case "array":
      if (field.arrayType === "object" && field.nestedFields) {
        return `[{\n${field.nestedFields
          .map((f) => `    ${f.name}: ${generateMongooseFieldDefinition(f)}`)
          .join(",\n")},\n    _id: false\n  }]`
      }
      const mongooseArrayType =
        field.arrayType === "ObjectId"
          ? "Schema.Types.ObjectId"
          : field.arrayType === "string"
            ? "String"
            : field.arrayType === "number"
              ? "Number"
              : field.arrayType === "boolean"
                ? "Boolean"
                : field.arrayType === "Date"
                  ? "Date"
                  : field.arrayType === "Decimal128"
                    ? "Schema.Types.Decimal128"
                    : "Schema.Types.Mixed"
      return `[${mongooseArrayType}]`
    case "object":
      if (field.nestedFields) {
        return `{\n${field.nestedFields
          .map((f) => `    ${f.name}: ${generateMongooseFieldDefinition(f)}`)
          .join(",\n")}\n  }`
      }
      return "Schema.Types.Mixed"
    case "enum":
      return "String"
    default:
      return "Schema.Types.Mixed"
  }
}

export const generateMongooseFieldDefinition = (field: Field): string => {
  const baseType = generateMongooseType(field)
  const options: string[] = []

  if (field.type === "array" || field.type === "object") {
    return baseType
  }

  options.push(`type: ${baseType}`)

  if (field.required) options.push("required: true")
  if (field.unique) options.push("unique: true")
  if (field.index) options.push("index: true")
  if (field.sparse) options.push("sparse: true")
  if (field.immutable) options.push("immutable: true")
  if (field.default) {
    const defaultValue =
      field.type === "string" ? `"${field.default}"` : field.default === "Date.now" ? "Date.now" : field.default
    options.push(`default: ${defaultValue}`)
  }
  if (field.ref) options.push(`ref: "${field.ref}"`)
  if (field.refPath) options.push(`refPath: "${field.refPath}"`)
  if (field.alias) options.push(`alias: "${field.alias}"`)
  if (field.select === false) options.push("select: false")

  if (field.validation) {
    field.validation.forEach((rule) => {
      switch (rule.type) {
        case "min":
          options.push(`min: ${rule.value}`)
          break
        case "max":
          options.push(`max: ${rule.value}`)
          break
        case "minLength":
          options.push(`minLength: ${rule.value}`)
          break
        case "maxLength":
          options.push(`maxLength: ${rule.value}`)
          break
        case "match":
          options.push(`match: ${rule.value}`)
          break
      }
    })
  }

  if (field.type === "enum" && field.enum) {
    const enumName = field.name.charAt(0).toUpperCase() + field.name.slice(1) + "Enum"
    options.push(`enum: Object.values(${enumName})`)
  }

  return options.length > 1 ? `{\n      ${options.join(",\n      ")}\n    }` : baseType
}
